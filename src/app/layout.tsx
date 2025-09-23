import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/components/providers/ClientProviders'
import Navbar from '@/components/ui/header/Navbar'
import Footer from '@/components/ui/Footer'
import { Toaster } from '@/components/ui/shadcnui/sonner'
import { PerformanceMonitor } from '@/components/PerformanceMonitor'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://hosteed.com'),
  title: 'Hosteed',
  description: 'Le meilleur de Madagascar, rien que pour vous.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='fr'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientProviders>
          <PerformanceMonitor debug={process.env.NODE_ENV === 'development'} />
          <Navbar />
          <main className='min-h-screen'>{children}</main>
          <Footer />
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  )
}
