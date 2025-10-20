export default function MentionsLegalesPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-8'>MENTIONS LÉGALES</h1>

          <div className='space-y-6'>
            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Informations sur l&apos;entreprise
              </h2>
              <div className='space-y-2 text-gray-700'>
                <p>
                  <span className='font-medium'>Société :</span> HOSTEED
                </p>
                <p>
                  <span className='font-medium'>Responsable :</span> Santatra BENJAMINA
                </p>
                <p>
                  <span className='font-medium'>Forme juridique :</span> Entreprise individuelle
                </p>
                <p>
                  <span className='font-medium'>Capital social :</span> 5000 EUR
                </p>
                <p>
                  <span className='font-medium'>Siège social :</span> 36 Avenue de Normandie, 93160
                  Noisy le Grand
                </p>
                <p>
                  <span className='font-medium'>Numéro SIRET :</span> 832 134 571 00021
                </p>
                <p>
                  <span className='font-medium'>TVA :</span> FR85832134571
                </p>
                <p>
                  <span className='font-medium'>Registre du commerce :</span> Bobigny
                </p>
                <p>
                  <span className='font-medium'>Directeur de publication :</span> Santatra BENJAMINA
                </p>
                <p>
                  <span className='font-medium'>Contact :</span>{' '}
                  <a
                    href='mailto:hello@hosteed.com'
                    className='text-[#015993] hover:text-[#0379C7] underline transition-colors'
                  >
                    hello@hosteed.com
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Informations sur l&apos;hébergement
              </h2>
              <div className='space-y-2 text-gray-700'>
                <p>
                  <span className='font-medium'>Hébergé par :</span> OVH SAS
                </p>
                <p>
                  <span className='font-medium'>Numéro RCS :</span> 537 407 926
                </p>
                <p>
                  <span className='font-medium'>Adresse :</span> 2, rue Kellermann, 59100 Roubaix
                </p>
              </div>
            </section>

            <div className='mt-8 pt-6 border-t border-gray-200'>
              <p className='text-sm text-gray-500'>Dernière mise à jour : 30/08/2024</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
