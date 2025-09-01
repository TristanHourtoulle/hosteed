import { ErrorDetails } from '@/components/ui/ErrorAlert'

export function parseCreateProductError(error: unknown): ErrorDetails {
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : String(error) || 'Erreur inconnue'
  
  // Erreurs de validation de champs
  if (errorMessage.includes('Champs obligatoires manquants')) {
    const missingFields = errorMessage.split(':')[1]?.trim() || ''
    return {
      type: 'validation',
      title: 'Informations manquantes',
      message: 'Certains champs obligatoires ne sont pas renseignés.',
      details: [
        `Champs manquants: ${missingFields}`,
        'Tous les champs marqués d\'un astérisque (*) sont obligatoires'
      ],
      suggestions: [
        'Vérifiez que tous les champs obligatoires sont remplis',
        'Assurez-vous que le nom, la description, l\'adresse et le type d\'hébergement sont renseignés'
      ]
    }
  }

  // Erreurs de prix
  if (errorMessage.includes('Prix obligatoires manquants')) {
    return {
      type: 'validation',
      title: 'Prix manquants ou invalides',
      message: 'Les prix en EUR et MGA doivent être renseignés.',
      details: [
        'Le prix de base est obligatoire',
        'La conversion automatique en Ariary (MGA) a échoué'
      ],
      suggestions: [
        'Vérifiez que le prix est un nombre valide',
        'Assurez-vous que le prix est supérieur à 0',
        'Vérifiez votre connexion internet pour la conversion de devise'
      ]
    }
  }

  // Erreurs d'heures
  if (errorMessage.includes('Heures d\'arrivée et de départ invalides')) {
    return {
      type: 'validation',
      title: 'Heures d\'arrivée/départ invalides',
      message: 'Les heures d\'arrivée et de départ doivent être des nombres valides.',
      details: [
        'Les heures doivent être comprises entre 0 et 23',
        'Utilisez le format 24h (ex: 14 pour 14h00)'
      ],
      suggestions: [
        'Vérifiez que les heures sont des nombres entiers',
        'L\'heure d\'arrivée doit être différente de l\'heure de départ',
        'Utilisez des heures logiques (ex: arrivée 15h, départ 11h)'
      ]
    }
  }

  // Erreurs d'authentification
  if (errorMessage.includes('Vous devez être connecté') || errorMessage.includes('Aucun utilisateur assigné')) {
    return {
      type: 'auth',
      title: 'Problème d\'authentification',
      message: 'Vous devez être connecté pour créer une annonce.',
      details: [
        'Votre session a peut-être expiré',
        'Aucun utilisateur n\'est associé à cette annonce'
      ],
      suggestions: [
        'Reconnectez-vous à votre compte',
        'Actualisez la page et essayez à nouveau',
        'Vérifiez que votre compte est bien activé'
      ]
    }
  }

  // Erreurs d'images
  if (errorMessage.includes('image') || errorMessage.includes('photo') || errorMessage.includes('compression')) {
    return {
      type: 'file',
      title: 'Problème avec les images',
      message: 'Une erreur s\'est produite lors du traitement de vos images.',
      details: [
        errorMessage.includes('format') ? 'Format d\'image non supporté' : '',
        errorMessage.includes('taille') || errorMessage.includes('size') ? 'Image trop volumineuse' : '',
        errorMessage.includes('compression') ? 'Échec de la compression des images' : '',
        errorMessage.includes('35') ? 'Trop d\'images sélectionnées (maximum 35)' : ''
      ].filter(Boolean),
      suggestions: [
        'Utilisez des formats d\'image standards (JPEG, PNG, WebP)',
        'Réduisez la taille de vos images (maximum 50MB par image)',
        'Vérifiez que vous avez sélectionné maximum 35 photos',
        'Essayez avec moins d\'images à la fois'
      ],
      retryable: true
    }
  }

  // Erreurs de réseau
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connexion')) {
    return {
      type: 'network',
      title: 'Problème de connexion',
      message: 'Impossible de communiquer avec le serveur.',
      details: [
        'Vérifiez votre connexion internet',
        'Le serveur est peut-être temporairement indisponible'
      ],
      suggestions: [
        'Vérifiez votre connexion internet',
        'Essayez de recharger la page',
        'Réessayez dans quelques minutes',
        'Si le problème persiste, contactez le support'
      ],
      retryable: true
    }
  }

  // Erreurs de base de données
  if (errorMessage.includes('database') || errorMessage.includes('constraint') || errorMessage.includes('unique') || errorMessage.includes('foreign')) {
    return {
      type: 'database',
      title: 'Erreur de base de données',
      message: 'Une erreur technique s\'est produite lors de la sauvegarde.',
      details: [
        'Conflit avec des données existantes',
        'Violation de contrainte de base de données',
        'Problème de cohérence des données'
      ],
      suggestions: [
        'Vérifiez que le nom de votre hébergement est unique',
        'Assurez-vous que tous les éléments sélectionnés existent encore',
        'Essayez avec des données légèrement différentes',
        'Contactez le support si le problème persiste'
      ],
      retryable: true
    }
  }

  // Erreurs spécifiques aux hôtels
  if (errorMessage.includes('hôtel') || errorMessage.includes('hotel') || errorMessage.includes('chambres')) {
    return {
      type: 'validation',
      title: 'Configuration hôtel incorrecte',
      message: 'Les informations spécifiques à votre hôtel sont incomplètes.',
      details: [
        errorMessage.includes('nom') ? 'Le nom de l\'hôtel est requis' : '',
        errorMessage.includes('chambres') ? 'Le nombre de chambres disponibles doit être supérieur à 0' : ''
      ].filter(Boolean),
      suggestions: [
        'Renseignez le nom complet de votre hôtel',
        'Indiquez le nombre total de chambres disponibles à la réservation',
        'Vérifiez que tous les champs spécifiques aux hôtels sont remplis'
      ]
    }
  }

  // Erreur générale - fallback
  return {
    type: 'general',
    title: 'Erreur lors de la création',
    message: 'Une erreur inattendue s\'est produite lors de la création de votre annonce.',
    details: [
      `Message d'erreur technique: ${errorMessage}`,
      'Cette erreur a été enregistrée pour analyse'
    ],
    suggestions: [
      'Vérifiez que tous les champs sont correctement remplis',
      'Essayez de recharger la page et recommencer',
      'Si le problème persiste, contactez notre support technique',
      'Vous pouvez également essayer depuis un autre navigateur'
    ],
    retryable: true
  }
}

// Fonction utilitaire pour les erreurs de validation côté client
export function createValidationError(field: string, message: string): ErrorDetails {
  const fieldNames: Record<string, string> = {
    'name': 'nom de l\'hébergement',
    'description': 'description',
    'address': 'adresse',
    'typeId': 'type d\'hébergement',
    'phone': 'téléphone',
    'basePrice': 'prix de base',
    'images': 'photos',
    'hotelName': 'nom de l\'hôtel',
    'availableRooms': 'nombre de chambres disponibles'
  }

  const fieldLabel = fieldNames[field] || field

  return {
    type: 'validation',
    title: `${fieldLabel} requis`,
    message: message || `Le champ "${fieldLabel}" est obligatoire.`,
    suggestions: [
      `Veuillez renseigner ${fieldLabel}`,
      'Vérifiez que toutes les informations obligatoires sont complètes'
    ]
  }
}