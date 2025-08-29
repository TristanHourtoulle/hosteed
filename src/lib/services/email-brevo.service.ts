'use server'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

// Alternative avec Brevo pour une meilleure délivrabilité internationale
export async function SendMailWithBrevo(
  email: string,
  name: string,
  message: string,
  isHtml: boolean = false
) {
  const transport = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_EMAIL,
      pass: process.env.BREVO_API_KEY,
    },
    tls: {
      ciphers: 'SSLv3'
    }
  })

  const mailOptions: Mail.Options = {
    from: `"Hosteed" <${process.env.BREVO_EMAIL}>`,
    replyTo: process.env.BREVO_EMAIL,
    to: email,
    subject: `${name}`,
    headers: {
      'X-Mailer': 'Hosteed Platform via Brevo',
      'X-Priority': '3',
      'List-Unsubscribe': '<mailto:unsubscribe@hosteed.fr>',
    },
    ...(isHtml ? { html: message } : { text: message }),
  }

  const sendMailPromise = () =>
    new Promise<string>((resolve, reject) => {
      transport.sendMail(mailOptions, function (err) {
        if (!err) {
          resolve('Email sent via Brevo')
        } else {
          reject(err.message)
        }
      })
    })

  try {
    await sendMailPromise()
    console.log('EMAIL BREVO ENVOYÉ AVEC SUCCÈS')
    return NextResponse.json({ message: 'Email sent via Brevo' })
  } catch (err) {
    console.error("ERREUR D'ENVOI EMAIL BREVO:", err)
    // Fallback vers OVH en cas d'échec
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Erreur Brevo',
        details: err,
      },
      { status: 500 }
    )
  }
}