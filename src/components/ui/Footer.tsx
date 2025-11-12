import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='bg-white border-t border-gray-200'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {/* Company Info */}
          <div className='col-span-1 md:col-span-2'>
            <div className='flex items-center space-x-2 mb-4'>
              <Link href='/' className='flex items-center cursor-pointer'>
                <Image
                  src='/logo-web-transparent.svg'
                  alt='Hosteed'
                  width={120}
                  height={120}
                  priority
                  className='h-20 w-auto'
                />
              </Link>
            </div>
            <p className='text-gray-600 mb-4'>
              Plateforme de réservation d&apos;hébergements, de transport et de services de voyage.
            </p>
            <div className='text-gray-600 mb-2'>
              <p className='mb-2'>
                <span className='font-semibold'>Service client:</span>{' '}
                <a
                  href='mailto:hello@hosteed.com'
                  className='text-[#015993] hover:text-[#0379C7] transition-colors'
                >
                  hello@hosteed.com
                </a>
              </p>
              <p className='mb-4'>
                <span className='font-semibold'>Service partenariat:</span>{' '}
                <a
                  href='mailto:welcome-pro@hosteed.com'
                  className='text-[#015993] hover:text-[#0379C7] transition-colors'
                >
                  welcome-pro@hosteed.com
                </a>
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-gray-600 font-semibold'>Suivez-nous:</span>
              <a
                href='https://www.facebook.com/share/1SX5pohiJ8/'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='Facebook'
                className='text-gray-600 hover:text-[#015993] transition-colors'
              >
                <Image
                  className='w-5 h-5'
                  src='/images/Icône Facebook.png'
                  alt='Facebook'
                  width={20}
                  height={20}
                />
              </a>
              <a
                href='https://www.instagram.com/hosteed_com?igsh=cm5ocG41cHVyNDlp'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='Instagram'
                className='text-gray-600 hover:text-[#015993] transition-colors'
              >
                <Image
                  className='w-5 h-5'
                  src='/images/Instagram (2).png'
                  alt='Instagram'
                  width={20}
                  height={20}
                />
              </a>
              <a
                href='https://www.linkedin.com/company/106405207'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='LinkedIn'
                className='text-gray-600 hover:text-[#015993] transition-colors'
              >
                <Image
                  className='w-5 h-5'
                  src='/images/Logo Linkedin.png'
                  alt='LinkedIn'
                  width={20}
                  height={20}
                />
              </a>

              <a
                href='https://www.youtube.com/@Hosteed_com'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='YouTube'
                className='text-gray-600 hover:text-[#015993] transition-colors'
              >
                <Image
                  className='w-5 h-5'
                  src='/images/Youtube (1).png'
                  alt='YouTube'
                  width={20}
                  height={20}
                />
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className='text-lg font-semibold text-gray-900 mb-4'>Légal</h4>
            <nav className='space-y-3'>
              <Link
                href='/legal/mentions-legales'
                className='block text-gray-600 hover:text-[#015993] transition-colors'
              >
                Mentions légales
              </Link>
              <Link
                href='/legal/politique-confidentialite'
                className='block text-gray-600 hover:text-[#015993] transition-colors'
              >
                Politique de confidentialité
              </Link>
              <Link
                href='/legal/conditions-utilisation'
                className='block text-gray-600 hover:text-[#015993] transition-colors'
              >
                Conditions d&apos;utilisation
              </Link>
              <Link
                href='/legal/conditions-hebergeurs'
                className='block text-gray-600 hover:text-[#015993] transition-colors'
              >
                Conditions hébergeurs
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className='mt-12 pt-8 border-t border-gray-200'>
          <div className='flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0'>
            <p className='text-gray-500 text-sm'>© {currentYear} Hosteed. Tous droits réservés.</p>
            <p className='text-gray-500 text-sm'>Développé avec ❤️ pour simplifier vos voyages</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
