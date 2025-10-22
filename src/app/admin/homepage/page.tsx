'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/hooks/useAdminAuth'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/shadcnui/card'
import { Button } from '@/components/ui/shadcnui/button'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import { ArrowLeft, Home, Image as ImageIcon, CheckCircle, Loader2 } from 'lucide-react'
import ImageUpload from '@/app/admin/typeRent/components/ImageUpload'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween' as const,
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

export default function HomepageSettingsPage() {
  const {
    session,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth({ required: true, redirectTo: '/auth' })
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [howItWorksImage, setHowItWorksImage] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && (!session?.user?.roles || !isAdmin(session.user.roles))) {
      router.push('/')
    }
  }, [isAuthenticated, session, router])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/homepage-settings')
        if (response.ok) {
          const data = await response.json()
          setHeroImage(data.heroBackgroundImage || null)
          setHowItWorksImage(data.howItWorksImage || null)
        }
      } catch (err) {
        setError('Erreur lors du chargement des paramètres')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/homepage-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroBackgroundImage: heroImage,
          howItWorksImage: howItWorksImage,
        }),
      })

      if (response.ok) {
        setSuccess('Paramètres sauvegardés avec succès !')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError('Erreur lors de la sauvegarde des paramètres')
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError('Erreur lors de la sauvegarde des paramètres')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <p className='text-slate-600 text-lg'>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <motion.div
        className='max-w-5xl mx-auto p-6 space-y-8'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {/* Header with breadcrumb */}
        <motion.div className='flex items-center gap-4' variants={itemVariants}>
          <Button variant='ghost' size='sm' asChild className='text-slate-600 hover:text-slate-800'>
            <Link href='/admin' className='flex items-center gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Retour au panel admin
            </Link>
          </Button>
        </motion.div>

        {/* Page Header */}
        <motion.div className='text-center space-y-4' variants={itemVariants}>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium'>
            <Home className='h-4 w-4' />
            Paramètres de la Homepage
          </div>
          <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700'>
            Images de la page d&apos;accueil
          </h1>
          <p className='text-slate-600 max-w-2xl mx-auto text-lg'>
            Gérez les images affichées sur la page d&apos;accueil de votre plateforme
          </p>
        </motion.div>

        {/* Alerts */}
        {error && (
          <motion.div variants={itemVariants}>
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {success && (
          <motion.div variants={itemVariants}>
            <Alert className='border-green-500 bg-green-50 text-green-800'>
              <AlertDescription className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4' />
                {success}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Settings Cards */}
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Hero Section Image */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm h-full'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ImageIcon className='h-5 w-5 text-blue-600' />
                  Hero Section
                </CardTitle>
                <CardDescription>
                  Image de fond affichée dans la section principale de la homepage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  currentImage={heroImage}
                  onImageChange={setHeroImage}
                  entityType='homepage'
                  entityId='hero'
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* How It Works Section Image */}
          <motion.div variants={itemVariants}>
            <Card className='border-0 shadow-lg bg-white/70 backdrop-blur-sm h-full'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ImageIcon className='h-5 w-5 text-purple-600' />
                  Comment ça marche
                </CardTitle>
                <CardDescription>
                  Image affichée dans la section &quot;Comment ça marche&quot;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  currentImage={howItWorksImage}
                  onImageChange={setHowItWorksImage}
                  entityType='homepage'
                  entityId='how-it-works'
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div variants={itemVariants} className='flex justify-center pt-4'>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            size='lg'
            className='bg-blue-600 hover:bg-blue-700 text-white shadow-lg min-w-[200px]'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='h-5 w-5 mr-2 animate-spin' />
                Sauvegarde...
              </>
            ) : (
              <>
                <CheckCircle className='h-5 w-5 mr-2' />
                Sauvegarder les modifications
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
