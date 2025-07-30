'use client'

import { useState } from 'react'
import { sendResetEmail } from '@/lib/services/user.service'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/shadcnui/card'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Label } from '@/components/ui/shadcnui/label'
import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    try {
      await sendResetEmail(email)
      setMessage({
        type: 'success',
        text: 'Un email de réinitialisation a été envoyé à votre adresse email',
      })
      setEmail('')
    } catch (error) {
      console.error(error)
      setMessage({
        type: 'error',
        text: "Une erreur est survenue lors de l'envoi de l'email",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <motion.div
        className='w-full max-w-md'
        initial='hidden'
        animate='visible'
        variants={containerVariants}
      >
        <Card className='backdrop-blur-sm bg-white/90 shadow-xl border-0'>
          <CardHeader className='space-y-4 text-center'>
            <motion.div
              className='mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'
              variants={itemVariants}
            >
              <Mail className='w-8 h-8 text-blue-600' />
            </motion.div>
            <div className='space-y-2'>
              <CardTitle className='text-3xl font-bold text-gray-900'>
                Réinitialisation du mot de passe
              </CardTitle>
              <CardDescription className='text-gray-500'>
                Entrez votre adresse email pour recevoir un lien de réinitialisation
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <motion.div className='space-y-2' variants={itemVariants}>
                <Label htmlFor='email' className='text-sm font-medium text-gray-700'>
                  Adresse email
                </Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  required
                  placeholder='exemple@email.com'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500'
                />
              </motion.div>

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert
                    variant={message.type === 'success' ? 'default' : 'destructive'}
                    className={
                      message.type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : ''
                    }
                  >
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <Button
                  type='submit'
                  disabled={isLoading}
                  className='w-full h-11 bg-blue-600 hover:bg-blue-700 transition-colors duration-200'
                >
                  {isLoading ? (
                    <div className='flex items-center justify-center'>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                      Envoi en cours...
                    </div>
                  ) : (
                    'Envoyer le lien'
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
