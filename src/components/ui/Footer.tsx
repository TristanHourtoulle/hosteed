import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#015993] to-[#0379C7] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Hosteed</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Plateforme de réservation d&apos;hébergements, de transport et de services de voyage.
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Contact:</span>{' '}
              <a 
                href="mailto:hello@hosteed.com" 
                className="text-[#015993] hover:text-[#0379C7] transition-colors"
              >
                hello@hosteed.com
              </a>
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Légal</h4>
            <nav className="space-y-3">
              <Link 
                href="/legal/mentions-legales"
                className="block text-gray-600 hover:text-[#015993] transition-colors"
              >
                Mentions légales
              </Link>
              <Link 
                href="/legal/politique-confidentialite"
                className="block text-gray-600 hover:text-[#015993] transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link 
                href="/legal/conditions-utilisation"
                className="block text-gray-600 hover:text-[#015993] transition-colors"
              >
                Conditions d&apos;utilisation
              </Link>
              <Link 
                href="/legal/conditions-hebergeurs"
                className="block text-gray-600 hover:text-[#015993] transition-colors"
              >
                Conditions hébergeurs
              </Link>
            </nav>
          </div>

          {/* Company Details */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Société</h4>
            <div className="text-gray-600 space-y-2">
              <p className="text-sm">HOSTEED</p>
              <p className="text-sm">SIRET: 832 134 571 00021</p>
              <p className="text-sm">36 Avenue de Normandie</p>
              <p className="text-sm">93160 Noisy le Grand</p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-500 text-sm">
              © {currentYear} Hosteed. Tous droits réservés.
            </p>
            <p className="text-gray-500 text-sm">
              Développé avec ❤️ pour simplifier vos voyages
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}