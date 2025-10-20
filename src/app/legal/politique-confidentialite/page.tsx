export default function PolitiqueConfidentialitePage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-8'>
            POLITIQUE DE CONFIDENTIALITÉ - HOSTEED
          </h1>

          <div className='space-y-8'>
            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                1. Informations Collectées
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>Nous collectons les informations suivantes :</p>
                <ul className='list-disc list-inside space-y-2 ml-4'>
                  <li>
                    <strong>Informations fournies par l&apos;utilisateur :</strong> identité,
                    détails de réservation, informations de compte
                  </li>
                  <li>
                    <strong>Données collectées automatiquement :</strong> utilisation, localisation,
                    informations techniques
                  </li>
                  <li>
                    <strong>Informations de tiers :</strong> partenaires et prestataires de services
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                2. Utilisation des Informations
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>Nous utilisons vos informations pour :</p>
                <ul className='list-disc list-inside space-y-2 ml-4'>
                  <li>Fournir nos services</li>
                  <li>Améliorer nos services</li>
                  <li>Communication</li>
                  <li>Marketing</li>
                  <li>Sécurité et conformité</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                3. Partage des Informations
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>Nous pouvons partager vos informations avec :</p>
                <ul className='list-disc list-inside space-y-2 ml-4'>
                  <li>Prestataires de services</li>
                  <li>Partenaires commerciaux</li>
                  <li>En cas d&apos;exigences légales</li>
                  <li>Lors de transferts d&apos;entreprise</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                4. Conservation des Données
              </h2>
              <p className='text-gray-700'>
                Nous conservons vos données aussi longtemps que nécessaire pour les finalités pour
                lesquelles elles ont été collectées à l&apos;origine.
              </p>
            </section>

            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>5. Sécurité des Données</h2>
              <p className='text-gray-700'>
                Nous mettons en place des mesures techniques et organisationnelles appropriées pour
                protéger vos informations personnelles.
              </p>
            </section>

            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                6. Droits des Utilisateurs
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>Vous disposez des droits suivants :</p>
                <ul className='list-disc list-inside space-y-2 ml-4'>
                  <li>Accès à vos données</li>
                  <li>Rectification</li>
                  <li>Suppression</li>
                  <li>Opposition</li>
                  <li>Portabilité des données</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                7. Cookies et Technologies Similaires
              </h2>
              <p className='text-gray-700'>
                Nous utilisons des cookies et technologies similaires pour collecter des
                informations et personnaliser votre expérience.
              </p>
            </section>

            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                8. Transferts Internationaux de Données
              </h2>
              <p className='text-gray-700'>
                Vos données peuvent être transférées vers des pays tiers, avec les mesures de
                protection appropriées.
              </p>
            </section>

            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                9. Modifications de la Politique
              </h2>
              <p className='text-gray-700'>
                Nous nous réservons le droit de modifier cette politique à tout moment.
              </p>
            </section>

            <section>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>10. Contact</h2>
              <p className='text-gray-700'>
                Pour toute question ou exercice de vos droits, contactez-nous à :{' '}
                <a
                  href='mailto:admin@hosteed.com'
                  className='text-[#015993] hover:text-[#0379C7] underline transition-colors'
                >
                  admin@hosteed.com
                </a>
              </p>
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
