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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/shadcnui/alert'

const formSchema = z.object({
  email: z.string().email('Email invalide'),
})

export const ResetForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      // TODO: Implement password reset logic here
      // For now, just show a success message
      setSuccess('Un email de réinitialisation a été envoyé à votre adresse.')
      form.reset()
      console.log(data)
    } catch (error) {
      setError('Une erreur est survenue')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {error && (
          <Alert variant='destructive' className='w-full'>
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className='w-full bg-green-50'>
            <AlertTitle>Succès</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
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
            <>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
              Envoi...
            </>
          ) : (
            'Envoyer le lien'
          )}
        </Button>
      </form>
    </Form>
  )
}
