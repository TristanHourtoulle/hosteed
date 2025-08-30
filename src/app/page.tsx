import Link from 'next/link'
import GooglePlacesDebug from '@/components/ui/GooglePlacesDebug'

export default function HomePage() {
  // Cette page ne devrait normalement pas être vue car la redirection
  // se fait côté serveur via next.config.ts

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
      <div className='text-center max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-800 mb-4'>Bienvenue sur Hosteed</h1>
        <p className='text-gray-600 mb-8'>Redirection vers les hébergements...</p>
        <Link
          href='/host'
          className='bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors'
        >
          Voir les hébergements
        </Link>
        
        {/* Composant de debug temporaire */}
        <div className='mt-8'>
          <GooglePlacesDebug />
        </div>
      </div>
    </div>
  )
}
