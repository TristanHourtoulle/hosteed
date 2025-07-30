'use server'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import fs from 'fs'
import path from 'path'

export async function SendMail(
  email: string,
  name: string,
  message: string,
  isHtml: boolean = false
) {
  const transport = nodemailer.createTransport({
    host: 'ssl0.ovh.net',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_LOGIN,
      pass: process.env.EMAIL_PASSWORD,
    },
  })

  const mailOptions: Mail.Options = {
    from: process.env.EMAIL_LOGIN,
    to: email,
    subject: `${name}`,
    ...(isHtml ? { html: message } : { text: message }),
  }
  const sendMailPromise = () =>
    new Promise<string>((resolve, reject) => {
      transport.sendMail(mailOptions, function (err) {
        if (!err) {
          resolve('Email sent')
        } else {
          reject(err.message)
        }
      })
    })

  try {
    await sendMailPromise()
    console.log('EMAIL ENVOYÉ AVEC SUCCÈS')
    return NextResponse.json({ message: 'Email sent' })
  } catch (err) {
    console.error("ERREUR D'ENVOI D'EMAIL:", err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Erreur inconnue',
        details: err,
      },
      { status: 500 }
    )
  }
}

export async function sendEmailFromTemplate(
  templateName: string,
  email: string,
  subject: string,
  variables: Record<string, string>
) {
  try {
    // Lire le template
    const templatePath = path.join(
      process.cwd(),
      'src/lib/templates/emails',
      `${templateName}.html`
    )
    let htmlContent = fs.readFileSync(templatePath, 'utf8')

    // Remplacer les variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      htmlContent = htmlContent.replace(regex, value || '')
    })

    // Gérer les conditions {{#if variable}}...{{/if}}
    htmlContent = htmlContent.replace(
      /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
      (match, variable, content) => {
        return variables[variable] && variables[variable].trim() !== '' ? content : ''
      }
    )

    // Créer le transport
    const transport = nodemailer.createTransport({
      host: 'ssl0.ovh.net',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_LOGIN,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    const mailOptions: Mail.Options = {
      from: process.env.EMAIL_LOGIN,
      to: email,
      subject: subject,
      html: htmlContent,
    }

    const sendMailPromise = () =>
      new Promise<string>((resolve, reject) => {
        transport.sendMail(mailOptions, function (err) {
          if (!err) {
            resolve('Email sent')
          } else {
            reject(err.message)
          }
        })
      })

    await sendMailPromise()
    console.log(`EMAIL TEMPLATE ${templateName} ENVOYÉ AVEC SUCCÈS À ${email}`)
    return { success: true, message: 'Email sent' }
  } catch (err) {
    console.error(`ERREUR D'ENVOI D'EMAIL TEMPLATE ${templateName}:`, err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}
