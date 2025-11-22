// TODO: refactor this file because it's larger than 200 lines
'use server'
import { hash, compare } from 'bcryptjs'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'
// Legacy function - use findAllUserPaginated instead
export async function findAllUser() {
  const result = await findAllUserPaginated({ page: 1, limit: 100 })
  return result?.users || null
}

export async function findAllUserPaginated({
  page = 1,
  limit = 20,
  includeRelations = false,
  role,
}: {
  page?: number
  limit?: number
  includeRelations?: boolean
  role?: UserRole
} = {}) {
  try {
    const skip = (page - 1) * limit

    const whereClause = role ? { roles: role } : {}

    // Lightweight includes for admin user lists
    const lightweightIncludes = {
      _count: {
        select: {
          Rent: true,
          ownedProducts: true, // Changed from Product to ownedProducts
        },
      },
    }

    // Full includes only when needed
    const fullIncludes = {
      Rent: {
        select: {
          id: true,
          status: true,
          arrivingDate: true,
          leavingDate: true,
        },
      },
      ownedProducts: { // Changed from Product to ownedProducts
        select: {
          id: true,
          name: true,
          validate: true,
        },
      },
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: includeRelations ? fullIncludes : lightweightIncludes,
        omit: {
          password: true,
          stripeCustomerId: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({
        where: whereClause,
      }),
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    }
  } catch (e) {
    console.error('Error in findAllUserPaginated:', e)
    return null
  }
}

export async function findUserById(id: string) {
  try {
    console.log('findUserById', id)

    if (!id || typeof id !== 'string') {
      throw new Error('ID utilisateur invalide')
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        Rent: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                validate: true,
              },
            },
          },
        },
        ownedProducts: true,
      },
      omit: {
        password: true,
        stripeCustomerId: true,
      },
    })

    if (!user) {
      console.warn(`User not found with ID: ${id}`)
      return null
    }

    return user
  } catch (e) {
    console.error('Error in findUserById:', e)

    // Re-throw the error with more context for the client to handle
    if (e instanceof Error) {
      throw new Error(`Erreur lors de la récupération des données utilisateur: ${e.message}`)
    }

    throw new Error('Erreur de base de données')
  }
}

export async function findUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
    })
  } catch (error) {
    console.error("Erreur lors de la recherche de l'utilisateur:", error)
    return null
  }
}

export async function findAllUserByRoles(roles: UserRole | UserRole[]) {
  try {
    return await prisma.user.findMany({
      where: {
        roles: Array.isArray(roles) ? { in: roles } : roles,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la recherche de l'utilisateur:", error)
    return null
  }
}

export async function verifyPassword(password: string, hashedPassword: string) {
  try {
    return await compare(password, hashedPassword)
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe:', error)
    return false
  }
}

export async function createUser(
  data: {
    email: string
    password: string
    name?: string
    lastname?: string
  },
  disableEmail?: boolean
) {
  try {
    const hashedPassword = await hash(data.password, 10)
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
      },
    })
    if (!disableEmail) {
      await sendEmailVerification(user.id)
    }
    return user
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return null
  }
}

export async function updateUser(
  id: string,
  data: Partial<{
    email: string
    password: string
    name: string
    lastname: string
    emailVerified: Date
  }>
) {
  try {
    const updateData = { ...data }
    if (data.password) {
      updateData.password = await hash(data.password, 10)
    }

    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        emailVerified: true,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error)
    return null
  }
}

export async function sendEmailVerification(userId: string) {
  try {
    console.log('=== DEBUG EMAIL VERIFICATION START ===')
    console.log('userId:', userId)

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })
    console.log('user found:', user ? 'YES' : 'NO')
    if (!user) throw new Error('User not found')

    console.log('Creating JWT token...')
    const token = jwt.sign({ email: user.email }, process.env.EMAIL_VERIF_TOKEN || '', {
      expiresIn: '4h',
    })
    console.log('Token created:', token ? 'YES' : 'NO')

    console.log('Updating user with emailToken...')
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailToken: token,
      },
    })
    await sendTemplatedMail(
      user.email,
      'Verifier votre email !',
      'checkEmail.html',
      {
        verificationUrl: process.env.NEXTAUTH_URL + '/checkEmail/' + token,
      },
      true
    )
  } catch (e) {
    console.error('=== ERROR IN EMAIL VERIFICATION ===')
    console.error('Error:', e)
    console.error('Error message:', e instanceof Error ? e.message : 'Unknown error')
    console.error('Error stack:', e instanceof Error ? e.stack : 'No stack')
    console.error('=== END ERROR ===')
    return
  }
}

export async function validateEmail(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.EMAIL_VERIF_TOKEN || '') as { email: string }
    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
        emailToken: token,
      },
    })

    if (!user) {
      throw new Error('Token invalide ou utilisateur non trouvé')
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailToken: null,
      },
    })

    return true
  } catch (error) {
    console.error("Erreur lors de la validation de l'email:", error)
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      const decoded = jwt.decode(token) as { email: string }
      const user = await prisma.user.findUnique({
        where: { email: decoded.email },
      })
      if (user) {
        await sendEmailVerification(user.id)
      }
    }
    return false
  }
}

export async function sendResetEmail(userEmail: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    })
    if (!user) throw new Error('User not found')
    const token = jwt.sign({ id: user.id }, process.env.RESET_PASSWORD_SECRET || '', {
      expiresIn: '24h',
    })
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
      },
    })
    await sendTemplatedMail(
      user.email,
      'Reinitialisation du mot de passe !',
      'resetPassword.html',
      {
        resetUrl: process.env.NEXTAUTH_URL + '/forgetPassword/' + token,
      },
      true
    )
  } catch (e) {
    console.error(e)
    return
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    // Vérification du token
    const decoded = jwt.verify(token, process.env.EMAIL_VERIF_TOKEN || '') as { id: string }
    if (!decoded || !decoded.id) {
      throw new Error('Token invalide')
    }

    // Vérification de l'expiration du token
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        resetToken: token,
      },
    })

    if (!user) {
      throw new Error('Token invalide ou utilisateur non trouvé')
    }

    // Hashage du nouveau mot de passe
    const hashedPassword = await hash(newPassword, 10)

    // Mise à jour du mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
      },
    })

    return true
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error)
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Le lien de réinitialisation a expiré')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token invalide')
    }
    throw error
  }
}

export async function updateUserRole(id: string, role: UserRole) {
  try {
    return await prisma.user.update({
      where: { id },
      data: { roles: role },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        roles: true,
        createdAt: true,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rôle de l'utilisateur:", error)
    return null
  }
}
