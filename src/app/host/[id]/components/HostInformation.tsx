import { Star, MessageCircle, Shield } from 'lucide-react'

export default function HostInformation() {
  return (
    <div>
      <h3 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>
        À propos de l&apos;hôte
      </h3>
      <div className='flex flex-col sm:flex-row gap-4 sm:gap-6'>
        <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl sm:text-2xl flex-shrink-0'>
          H
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2'>
            <h4 className='font-semibold text-gray-900 text-lg sm:text-xl'>Hosteed</h4>
            <span className='px-3 py-1 bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-medium rounded-full w-fit'>
              Superhôte
            </span>
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm sm:text-base text-gray-600 mb-4'>
            <span>Membre depuis mars 2020</span>
            <span className='hidden sm:inline'>•</span>
            <span>127 avis</span>
            <span className='hidden sm:inline'>•</span>
            <div className='flex items-center gap-1'>
              <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
              <span>4.9</span>
            </div>
          </div>
          <p className='text-gray-700 text-sm sm:text-base leading-relaxed mb-6'>
            Passionné par l&apos;hospitalité et le tourisme durable à Madagascar. Je m&apos;efforce
            de faire découvrir les merveilles de notre île tout en respectant l&apos;environnement
            et les communautés locales.
          </p>
          <div className='flex flex-col sm:flex-row gap-3'>
            <button className='flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium'>
              <MessageCircle className='h-4 w-4 sm:h-5 sm:w-5' />
              Contacter l&apos;hôte
            </button>
            <button className='flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium'>
              <Shield className='h-4 w-4 sm:h-5 sm:w-5' />
              Protection des paiements
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
