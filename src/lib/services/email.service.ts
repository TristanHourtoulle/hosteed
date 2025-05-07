'use server'
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export async function SendMail(email: string, name:string, message:string) {
    const transport = nodemailer.createTransport({
        host: "ssl0.ovh.net",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_LOGIN,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions: Mail.Options = {
        from: process.env.EMAIL_LOGIN,
        to: email,
        subject: `${name}`,
        text: message,
    };
    const sendMailPromise = () =>
        new Promise<string>((resolve, reject) => {
            transport.sendMail(mailOptions, function (err) {
                if (!err) {
                    resolve('Email sent');
                } else {
                    reject(err.message);
                }
            });
        });

    try {
        await sendMailPromise();
        console.log("EMAIL ENVOYÉ AVEC SUCCÈS");
        return NextResponse.json({ message: 'Email sent' });
    } catch (err) {
        console.error("ERREUR D'ENVOI D'EMAIL:", err);
        return NextResponse.json({
            error: err instanceof Error ? err.message : 'Erreur inconnue',
            details: err
        }, { status: 500 });
    }
}
