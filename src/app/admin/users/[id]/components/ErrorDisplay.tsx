'use client'

import { Alert, AlertDescription } from '@/components/ui/shadcnui/alert'
import { Button } from '@/components/ui/shadcnui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ErrorDisplayProps {
  message: string
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8'>
      <div className='max-w-4xl mx-auto'>
        <Alert variant='destructive'>
          <AlertDescription className='font-medium'>{message}</AlertDescription>
        </Alert>
        <Button variant='outline' className='mt-4' asChild>
          <Link href='/admin/users' className='flex items-center gap-2'>
            <ArrowLeft className='h-4 w-4' />
            <span>Retour à la liste</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
