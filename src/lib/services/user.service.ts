// TODO: refactor this file because it's larger than 200 lines
'use server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { sendTemplatedMail } from '@/lib/services/sendTemplatedMail'
export async function findAllUser() {
  try {
    return await prisma.user.findMany({
      include: {
        Rent: true,
        Product: true,
      },
      omit: {
        password: true,
        stripeCustomerId: true,
      },
    })
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function findUserById(id: string) {
  try {
    console.log('findUserById', id)
    return await prisma.user.findUnique({
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
        Product: true,
      },
      omit: {
        password: true,
        stripeCustomerId: true,
      },
    })
  } catch (e) {
    console.error(e)
    return null
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

export async function findAllUserByRoles(roles: UserRole) {
  try {
    return await prisma.user.findMany({
      where: {
        roles: roles,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la recherche de l'utilisateur:", error)
    return null
  }
}

export async function verifyPassword(password: string, hashedPassword: string) {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe:', error)
    return false
  }
}

export async function createUser(data: {
  email: string
  password: string
  name?: string
  lastname?: string
}) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10)
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
    await sendEmailVerification(user.id)
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
      updateData.password = await bcrypt.hash(data.password, 10)
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
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })
    if (!user) throw new Error('User not found')
    const token = jwt.sign({ email: user.email }, process.env.EMAIL_VERIF_TOKEN || '', {
      expiresIn: '4h',
    })
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailToken: token,
      },
    })
    await sendTemplatedMail(user.email, 'Verifier votre email !', 'checkEmail.html', {
      verificationUrl: process.env.NEXTAUTH_URL + '/checkEmail/' + token,
    })
  } catch (e) {
    console.error(e)
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
