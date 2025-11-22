import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.enum(['HOST', 'HOST_VERIFIED'], {
    errorMap: () => ({ message: 'Rôle invalide. Seuls HOST et HOST_VERIFIED sont autorisés.' }),
  }),
})

const updateUserSchema = z.object({
  userId: z.string(),
  role: z.enum(['HOST', 'HOST_VERIFIED'], {
    errorMap: () => ({ message: 'Rôle invalide. Seuls HOST et HOST_VERIFIED sont autorisés.' }),
  }),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50) // Max 50 per page
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || ''

    // Build where clause for search and filtering
    const whereClause: Record<string, unknown> = {}

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { lastname: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    if (roleFilter) {
      whereClause.roles = roleFilter
    }

    const offset = (page - 1) * limit

    // Execute optimized single query with Promise.all for better performance
    const [users, totalItems] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          lastname: true,
          email: true,
          roles: true,
          createdAt: true,
          emailVerified: true,
        },
        orderBy: [{ createdAt: 'desc' }, { email: 'asc' }],
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    const response = {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        itemsPerPage: limit,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

    // Set optimized cache headers for admin data
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=15, s-maxage=15') // 15 seconds cache for fresh admin data
    headers.set('X-Response-Time', Date.now().toString())

    return NextResponse.json(response, { headers })
  } catch (error) {
    console.error('Error in admin users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Vérifier l'authentification
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est ADMIN ou HOST_MANAGER
    if (!session.user.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json(
        { error: 'Accès non autorisé - Admin/Host Manager uniquement' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Valider les données
    const validationResult = createUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, name, password, role } = validationResult.data

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà' }, { status: 400 })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        roles: role,
        emailVerified: new Date(), // Auto-vérifier l'email pour les comptes créés par admin
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      message: 'Utilisateur créé avec succès',
      user: newUser,
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}

// PUT - Update user role
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    // Vérifier l'authentification
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est ADMIN ou HOST_MANAGER
    if (!session.user.roles || !['ADMIN', 'HOST_MANAGER'].includes(session.user.roles)) {
      return NextResponse.json(
        { error: 'Accès non autorisé - Admin/Host Manager uniquement' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Valider les données
    const validationResult = updateUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { userId, role } = validationResult.data

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Empêcher de modifier son propre rôle
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas modifier votre propre rôle' }, { status: 400 })
    }

    // Mettre à jour le rôle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roles: role },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      message: 'Rôle mis à jour avec succès',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du rôle' },
      { status: 500 }
    )
  }
}
