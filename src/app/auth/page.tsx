import React from 'react'
import { AuthForm } from '@/components/auth/AuthForm'

interface AuthPageProps {
  searchParams: Promise<{
    mode?: 'login' | 'register' | 'reset'
  }>
}

async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams
  const mode = params.mode || 'login'
  
  return <AuthForm mode={mode} />
}

export default AuthPage
