import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/shadcnui/button'

export default function NotFound() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
      <div className='text-center max-w-md mx-auto'>
        <div className='mb-8'>
          <h1 className='text-9xl font-bold text-gray-300 mb-4'>404</h1>
          <h2 className='text-3xl font-bold text-gray-900 mb-4'>Page non trouvée</h2>
          <p className='text-gray-600 text-lg mb-8'>
            Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
        </div>

        <div className='space-y-4'>
          <Button asChild className='w-full'>
            <Link href='/'>
              <Home className='w-4 h-4 mr-2' />
              Retour à l&apos;accueil
            </Link>
          </Button>

          <Button variant='outline' asChild className='w-full'>
            <Link href='/host'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Voir les hébergements
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
