'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcnui/form'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/shadcnui/alert'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

const formSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string(),
})

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  // use zod and react hook form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      console.log(data)

      if (!data.email || !data.password) {
        setError('Email et mot de passe sont requis')
        return
      }

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      console.log(result)

      if (result?.error) {
        if (result.error.includes('Email not verified')) {
          setError(
            'Veuillez vérifier votre adresse email avant de vous connecter. Vérifiez votre boîte mail pour le lien de vérification.'
          )
        } else {
          setError("Email ou mot de passe incorrect OU votre email n'est pas vérifié")
        }
        return
      }
      router.push('/host')
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Beautiful dialog for error */}
        {error && (
          <Alert variant='destructive' className='w-full'>
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse email</FormLabel>
              <FormControl>
                <Input {...field} className='py-6' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <div className='relative'>
                  <Input {...field} type={showPassword ? 'text' : 'password'} className='py-6' />
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-2 top-1/2 -translate-y-1/2'
                  >
                    {showPassword ? (
                      <EyeIcon className='w-4 h-4' />
                    ) : (
                      <EyeOffIcon className='w-4 h-4' />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          className='w-full flex items-center justify-center gap-2 py-4 text-base cursor-pointer'
        >
          {isLoading ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
          ) : (
            'Se connecter'
          )}
        </Button>
      </form>
    </Form>
  )
}
