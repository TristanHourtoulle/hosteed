// TODO: refactor this file because it's larger than 200 lines
'use server'
import { hash, compare } from 'bcryptjs'
import prisma from '@/lib/prisma'
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
    console.log('User updated with token')

    // Fix potential double slash in URL
    const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3000'
    const verificationUrl = baseUrl + '/checkEmail/' + token
    console.log('Verification URL:', verificationUrl)
    console.log('About to send templated mail...')

    await sendTemplatedMail(
      user.email,
      'Confirmez votre inscription sur Hosteed',
      'checkEmail.html',
      {
        verificationUrl: verificationUrl,
      }
    )

    console.log('=== EMAIL VERIFICATION SENT SUCCESSFULLY ===')
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
      }
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
