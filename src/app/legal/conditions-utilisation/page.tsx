export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">CONDITIONS GÉNÉRALES D'UTILISATION</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Définitions</h2>
              <div className="space-y-3 text-gray-700">
                <p>Dans le cadre de ces conditions générales :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>"Utilisateur"</strong> désigne toute personne utilisant la plateforme</li>
                  <li><strong>"Client"</strong> désigne l'utilisateur effectuant une réservation</li>
                  <li><strong>"Fournisseur"</strong> désigne l'hébergeur ou prestataire de services</li>
                  <li><strong>"Contenu"</strong> désigne toutes les informations publiées sur la plateforme</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Services Offerts</h2>
              <p className="text-gray-700">
                Hosteed est une plateforme en ligne permettant la réservation d'hébergements, de transport et de services de voyage. 
                Nous agissons en tant qu'intermédiaire entre les clients et les fournisseurs de services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Compte Utilisateur</h2>
              <div className="space-y-3 text-gray-700">
                <p>Les utilisateurs doivent :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Créer un compte avec des informations exactes et à jour</li>
                  <li>Maintenir la confidentialité de leurs identifiants de connexion</li>
                  <li>Être responsables de toutes les activités sous leur compte</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Processus de Réservation</h2>
              <div className="space-y-3 text-gray-700">
                <p>Concernant les réservations :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>La réservation constitue un contrat direct entre l'utilisateur et le fournisseur</li>
                  <li>Hosteed agit uniquement en tant qu'intermédiaire</li>
                  <li>Les conditions spécifiques du fournisseur s'appliquent à chaque réservation</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Obligations des Utilisateurs</h2>
              <div className="space-y-3 text-gray-700">
                <p>Les utilisateurs s'engagent à :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Utiliser le site de manière légale et éthique</li>
                  <li>Respecter les droits d'autrui et le bon fonctionnement du site</li>
                  <li>Fournir des informations exactes lors des réservations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Propriété Intellectuelle</h2>
              <div className="space-y-3 text-gray-700">
                <p>Le contenu du site est protégé par les droits de propriété intellectuelle :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Une licence limitée d'utilisation personnelle et non commerciale est accordée aux utilisateurs</li>
                  <li>Toute reproduction ou utilisation commerciale est interdite sans autorisation</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitations de Responsabilité</h2>
              <div className="space-y-3 text-gray-700">
                <p>Nos limitations de responsabilité :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Le site est fourni "en l'état" sans garanties</li>
                  <li>Hosteed décline toute responsabilité pour les dommages résultant de l'utilisation du site</li>
                  <li>La responsabilité se limite aux services d'intermédiation</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Protection des Données</h2>
              <div className="space-y-3 text-gray-700">
                <p>Concernant vos données personnelles :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Les données personnelles sont traitées conformément à notre politique de confidentialité</li>
                  <li>Les utilisateurs disposent de droits d'accès et de modification de leurs données</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Modification des Conditions</h2>
              <p className="text-gray-700">
                Hosteed se réserve le droit de mettre à jour ces conditions à tout moment. 
                Les modifications prennent effet dès leur publication sur le site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Droit Applicable</h2>
              <p className="text-gray-700">
                Ces conditions générales sont régies par le droit français.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact</h2>
              <p className="text-gray-700">
                Pour toute question concernant ces conditions, contactez notre service client à :{' '}
                <a 
                  href="mailto:admin@hosteed.com" 
                  className="text-[#015993] hover:text-[#0379C7] underline transition-colors"
                >
                  admin@hosteed.com
                </a>
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Dernière mise à jour : 30/08/2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}