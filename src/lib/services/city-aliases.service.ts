/**
 * Service de gestion des alias de villes malgaches
 *
 * Ce service gère les correspondances entre les noms de villes en français
 * et en malgache (ex: Tananarive ↔ Antananarivo).
 *
 * IMPORTANT: Utiliser ce service dans les recherches pour garantir que
 * les utilisateurs trouvent les annonces quelle que soit la variante du nom utilisée.
 */

// ============================================
// TYPES
// ============================================

export interface CityAliasGroup {
  /** Nom canonique (nom officiel malgache) */
  canonical: string
  /** Tous les alias possibles (incluant le nom français, abréviations, etc.) */
  aliases: string[]
}

// ============================================
// DONNÉES D'ALIAS
// ============================================

/**
 * Liste des villes malgaches avec leurs alias français/alternatifs
 *
 * Structure:
 * - canonical: Nom officiel malgache (utilisé dans Google Maps généralement)
 * - aliases: Variantes du nom (français colonial, abréviations courantes, orthographes alternatives)
 *
 * Sources:
 * - Noms coloniaux français vs noms malgaches officiels
 * - Variantes orthographiques courantes
 * - Abréviations utilisées localement
 *
 * Le client peut enrichir cette liste via l'admin ou en contactant le support.
 */
const CITY_ALIASES: CityAliasGroup[] = [
  // ============================================
  // CAPITALE ET RÉGION ANALAMANGA
  // ============================================
  {
    canonical: 'Antananarivo',
    aliases: ['Tananarive', 'Tana', 'Antananarivo Renivohitra', 'Analamanga'],
  },
  {
    canonical: 'Ivato',
    aliases: ['Aéroport Ivato', 'Ivato Airport', 'Ivato Aéroport'],
  },
  {
    canonical: 'Ambohidratrimo',
    aliases: ['Ambohidratrimo'],
  },
  {
    canonical: 'Andramasina',
    aliases: [],
  },
  {
    canonical: 'Anjozorobe',
    aliases: [],
  },
  {
    canonical: 'Ankazobe',
    aliases: [],
  },
  {
    canonical: 'Manjakandriana',
    aliases: [],
  },

  // ============================================
  // RÉGION VAKINANKARATRA (Hautes Terres)
  // ============================================
  {
    canonical: 'Antsirabe',
    aliases: ['Antsirabe I', 'Antsirabe II', 'Vichy Malgache'],
  },
  {
    canonical: 'Ambatolampy',
    aliases: [],
  },
  {
    canonical: 'Betafo',
    aliases: [],
  },
  {
    canonical: 'Faratsiho',
    aliases: [],
  },

  // ============================================
  // RÉGION ITASY
  // ============================================
  {
    canonical: 'Miarinarivo',
    aliases: [],
  },
  {
    canonical: 'Arivonimamo',
    aliases: [],
  },
  {
    canonical: 'Soavinandriana',
    aliases: [],
  },

  // ============================================
  // CÔTE NORD - RÉGION DIANA
  // ============================================
  {
    canonical: 'Antsiranana',
    aliases: ['Diégo-Suarez', 'Diego Suarez', 'Diego', 'Diégo', 'Diego-Suarez'],
  },
  {
    canonical: 'Nosy Be',
    aliases: ['Nossi-Bé', 'Nosy-Be', 'Nosybe', 'Nose Be', 'Hell-Ville'],
  },
  {
    canonical: 'Ambanja',
    aliases: [],
  },
  {
    canonical: 'Ambilobe',
    aliases: [],
  },
  {
    canonical: 'Nosy Mitsio',
    aliases: ['Mitsio'],
  },
  {
    canonical: 'Nosy Komba',
    aliases: ['Komba'],
  },
  {
    canonical: 'Nosy Tanikely',
    aliases: ['Tanikely'],
  },
  {
    canonical: 'Nosy Iranja',
    aliases: ['Iranja'],
  },

  // ============================================
  // CÔTE NORD-EST - RÉGION SAVA
  // ============================================
  {
    canonical: 'Sambava',
    aliases: [],
  },
  {
    canonical: 'Antalaha',
    aliases: [],
  },
  {
    canonical: 'Vohemar',
    aliases: ['Vohémar', 'Iharana'],
  },
  {
    canonical: 'Andapa',
    aliases: [],
  },

  // ============================================
  // CÔTE NORD-OUEST - RÉGION BOENY
  // ============================================
  {
    canonical: 'Mahajanga',
    aliases: ['Majunga', 'Mahajunga'],
  },
  {
    canonical: 'Marovoay',
    aliases: [],
  },
  {
    canonical: 'Mitsinjo',
    aliases: [],
  },
  {
    canonical: 'Soalala',
    aliases: [],
  },
  {
    canonical: 'Katsepy',
    aliases: [],
  },

  // ============================================
  // CÔTE NORD-OUEST - RÉGION SOFIA
  // ============================================
  {
    canonical: 'Antsohihy',
    aliases: [],
  },
  {
    canonical: 'Port-Bergé',
    aliases: ['Port Bergé', 'Boriziny'],
  },
  {
    canonical: 'Befandriana-Nord',
    aliases: ['Befandriana Nord', 'Befandriana'],
  },
  {
    canonical: 'Mandritsara',
    aliases: [],
  },

  // ============================================
  // CÔTE NORD-OUEST - RÉGION BETSIBOKA
  // ============================================
  {
    canonical: 'Maevatanana',
    aliases: ['Maevatanàna'],
  },
  {
    canonical: 'Kandreho',
    aliases: [],
  },
  {
    canonical: 'Tsaratanana',
    aliases: [],
  },

  // ============================================
  // CÔTE OUEST - RÉGION MELAKY
  // ============================================
  {
    canonical: 'Maintirano',
    aliases: [],
  },
  {
    canonical: 'Antsalova',
    aliases: [],
  },
  {
    canonical: 'Besalampy',
    aliases: [],
  },
  {
    canonical: 'Morafenobe',
    aliases: [],
  },

  // ============================================
  // CÔTE OUEST - RÉGION MENABE
  // ============================================
  {
    canonical: 'Morondava',
    aliases: [],
  },
  {
    canonical: 'Belo sur Tsiribihina',
    aliases: ['Belo-sur-Tsiribihina', 'Belo Tsiribihina'],
  },
  {
    canonical: 'Miandrivazo',
    aliases: [],
  },
  {
    canonical: 'Kirindy',
    aliases: ['Forêt de Kirindy'],
  },
  {
    canonical: 'Allée des Baobabs',
    aliases: ['Avenue des Baobabs', 'Baobab Avenue'],
  },

  // ============================================
  // CÔTE EST - RÉGION ATSINANANA
  // ============================================
  {
    canonical: 'Toamasina',
    aliases: ['Tamatave', 'Toamasina I', 'Toamasina II'],
  },
  {
    canonical: 'Brickaville',
    aliases: ['Ampasimanolotra'],
  },
  {
    canonical: 'Vatomandry',
    aliases: [],
  },
  {
    canonical: 'Mahanoro',
    aliases: [],
  },
  {
    canonical: 'Foulpointe',
    aliases: ['Mahavelona'],
  },

  // ============================================
  // CÔTE EST - RÉGION ANALANJIROFO
  // ============================================
  {
    canonical: 'Fenoarivo Atsinanana',
    aliases: ['Fénérive-Est', 'Fenerive Est', 'Fenoarivo', 'Fénérive Est'],
  },
  {
    canonical: 'Maroantsetra',
    aliases: ['Maroantsétra'],
  },
  {
    canonical: 'Mananara Nord',
    aliases: ['Mananara-Nord', 'Mananara Avaratra'],
  },
  {
    canonical: 'Sainte-Marie',
    aliases: ['Île Sainte-Marie', 'Nosy Boraha', 'Ile Sainte Marie', 'Sainte Marie'],
  },

  // ============================================
  // CÔTE EST - RÉGION ALAOTRA-MANGORO
  // ============================================
  {
    canonical: 'Ambatondrazaka',
    aliases: [],
  },
  {
    canonical: 'Moramanga',
    aliases: [],
  },
  {
    canonical: 'Andilamena',
    aliases: [],
  },
  {
    canonical: 'Anosibe An\'ala',
    aliases: ['Anosibe Anala'],
  },
  {
    canonical: 'Andasibe',
    aliases: ['Périnet', 'Perinet'],
  },

  // ============================================
  // HAUTES TERRES - RÉGION AMORON'I MANIA
  // ============================================
  {
    canonical: 'Ambositra',
    aliases: [],
  },
  {
    canonical: 'Fandriana',
    aliases: [],
  },
  {
    canonical: 'Manandriana',
    aliases: [],
  },

  // ============================================
  // HAUTES TERRES - RÉGION HAUTE MATSIATRA
  // ============================================
  {
    canonical: 'Fianarantsoa',
    aliases: ['Fianar', 'Fianarantsoa I', 'Fianarantsoa II'],
  },
  {
    canonical: 'Ambalavao',
    aliases: [],
  },
  {
    canonical: 'Ambohimahasoa',
    aliases: [],
  },
  {
    canonical: 'Ranomafana',
    aliases: ['Parc Ranomafana', 'Ranomafana National Park'],
  },

  // ============================================
  // HAUTES TERRES - RÉGION IHOROMBE
  // ============================================
  {
    canonical: 'Ihosy',
    aliases: [],
  },
  {
    canonical: 'Ivohibe',
    aliases: [],
  },
  {
    canonical: 'Iakora',
    aliases: [],
  },
  {
    canonical: 'Isalo',
    aliases: ['Parc Isalo', 'Isalo National Park', 'Parc National Isalo'],
  },

  // ============================================
  // CÔTE SUD-EST - RÉGION VATOVAVY
  // ============================================
  {
    canonical: 'Mananjary',
    aliases: [],
  },
  {
    canonical: 'Nosy Varika',
    aliases: [],
  },
  {
    canonical: 'Ifanadiana',
    aliases: [],
  },

  // ============================================
  // CÔTE SUD-EST - RÉGION FITOVINANY
  // ============================================
  {
    canonical: 'Manakara',
    aliases: [],
  },
  {
    canonical: 'Vohipeno',
    aliases: [],
  },
  {
    canonical: 'Ikongo',
    aliases: [],
  },

  // ============================================
  // CÔTE SUD-EST - RÉGION ATSIMO-ATSINANANA
  // ============================================
  {
    canonical: 'Farafangana',
    aliases: [],
  },
  {
    canonical: 'Vangaindrano',
    aliases: [],
  },
  {
    canonical: 'Midongy du Sud',
    aliases: ['Midongy-du-Sud', 'Midongy Atsimo'],
  },

  // ============================================
  // CÔTE SUD - RÉGION ANOSY
  // ============================================
  {
    canonical: 'Taolagnaro',
    aliases: ['Fort Dauphin', 'Fort-Dauphin', 'Tolagnaro'],
  },
  {
    canonical: 'Amboasary Sud',
    aliases: ['Amboasary-Sud', 'Amboasary Atsimo'],
  },
  {
    canonical: 'Betroka',
    aliases: [],
  },

  // ============================================
  // CÔTE SUD - RÉGION ANDROY
  // ============================================
  {
    canonical: 'Ambovombe',
    aliases: ['Ambovombe-Androy', 'Ambovombe Androy'],
  },
  {
    canonical: 'Bekily',
    aliases: [],
  },
  {
    canonical: 'Tsihombe',
    aliases: [],
  },

  // ============================================
  // CÔTE SUD-OUEST - RÉGION ATSIMO-ANDREFANA
  // ============================================
  {
    canonical: 'Toliara',
    aliases: ['Tuléar', 'Toliary', 'Toliara I', 'Toliara II'],
  },
  {
    canonical: 'Sakaraha',
    aliases: [],
  },
  {
    canonical: 'Ankazoabo',
    aliases: [],
  },
  {
    canonical: 'Betioky',
    aliases: ['Betioky Sud', 'Betioky-Sud'],
  },
  {
    canonical: 'Ampanihy',
    aliases: ['Ampanihy Ouest', 'Ampanihy-Ouest'],
  },
  {
    canonical: 'Ifaty',
    aliases: [],
  },
  {
    canonical: 'Anakao',
    aliases: [],
  },
  {
    canonical: 'Mangily',
    aliases: [],
  },

  // ============================================
  // ÎLES ET DESTINATIONS TOURISTIQUES
  // ============================================
  {
    canonical: 'Nosy Ankao',
    aliases: ['Ankao'],
  },
  {
    canonical: 'Nosy Mangabe',
    aliases: ['Mangabe'],
  },
  {
    canonical: 'Nosy Hara',
    aliases: ['Hara'],
  },
  {
    canonical: 'Nosy Faly',
    aliases: ['Faly'],
  },
  {
    canonical: 'Nosy Sakatia',
    aliases: ['Sakatia'],
  },
  {
    canonical: 'Tsingy de Bemaraha',
    aliases: ['Bemaraha', 'Tsingy', 'Parc Tsingy'],
  },
  {
    canonical: 'Montagne d\'Ambre',
    aliases: ['Parc Montagne Ambre', 'Amber Mountain', 'Montagne Ambre'],
  },
  {
    canonical: 'Lokobe',
    aliases: ['Réserve Lokobe', 'Parc Lokobe'],
  },
  {
    canonical: 'Masoala',
    aliases: ['Parc Masoala', 'Presqu\'île Masoala'],
  },
  {
    canonical: 'Andringitra',
    aliases: ['Parc Andringitra', 'Massif Andringitra'],
  },
]

// ============================================
// CLASSE PRINCIPALE
// ============================================

class CityAliasesService {
  private aliasMap: Map<string, string[]> = new Map()
  private reverseMap: Map<string, string> = new Map()

  constructor() {
    this.buildMaps()
  }

  /**
   * Construit les maps de recherche pour une performance optimale
   */
  private buildMaps(): void {
    for (const group of CITY_ALIASES) {
      const allNames = [group.canonical, ...group.aliases]
      const allNamesLower = allNames.map(n => n.toLowerCase())

      // Pour chaque nom (canonical + aliases), stocker tous les autres noms associés
      for (const name of allNamesLower) {
        this.aliasMap.set(name, allNamesLower)
        this.reverseMap.set(name, group.canonical.toLowerCase())
      }
    }
  }

  /**
   * Récupère tous les alias pour un terme de recherche donné
   *
   * @param searchTerm - Terme de recherche (ex: "Antananarivo" ou "Tananarive")
   * @returns Liste de tous les noms possibles pour cette ville, ou le terme original si pas d'alias
   *
   * @example
   * getAliases("Antananarivo") // ["antananarivo", "tananarive", "tana", "antananarivo renivohitra"]
   * getAliases("Paris") // ["paris"] - pas d'alias, retourne le terme original
   */
  getAliases(searchTerm: string): string[] {
    const normalized = searchTerm.toLowerCase().trim()

    // Chercher si le terme correspond à une ville connue
    const aliases = this.aliasMap.get(normalized)

    if (aliases) {
      return aliases
    }

    // Pas d'alias trouvé, retourner le terme original
    return [normalized]
  }

  /**
   * Récupère le nom canonique (officiel) d'une ville
   *
   * @param cityName - Nom de ville (peut être un alias)
   * @returns Nom canonique ou le nom original si pas trouvé
   *
   * @example
   * getCanonicalName("Tananarive") // "antananarivo"
   * getCanonicalName("Majunga") // "mahajanga"
   */
  getCanonicalName(cityName: string): string {
    const normalized = cityName.toLowerCase().trim()
    return this.reverseMap.get(normalized) || normalized
  }

  /**
   * Vérifie si deux noms de ville sont équivalents (alias l'un de l'autre)
   *
   * @param city1 - Premier nom de ville
   * @param city2 - Deuxième nom de ville
   * @returns true si les deux noms désignent la même ville
   *
   * @example
   * areSameCity("Antananarivo", "Tananarive") // true
   * areSameCity("Antananarivo", "Majunga") // false
   */
  areSameCity(city1: string, city2: string): boolean {
    const canonical1 = this.getCanonicalName(city1)
    const canonical2 = this.getCanonicalName(city2)
    return canonical1 === canonical2
  }

  /**
   * Extrait le nom de ville principal d'une chaîne de localisation
   * Utile pour parser les résultats Google Places
   *
   * @param location - Chaîne de localisation (ex: "Tananarive, Analamanga, Madagascar")
   * @returns Nom de ville extrait (premier élément avant la virgule)
   */
  extractCityFromLocation(location: string): string {
    const parts = location.split(',').map(p => p.trim())
    return parts[0] || location
  }

  /**
   * Génère les conditions Prisma OR pour rechercher avec tous les alias
   *
   * @param searchTerm - Terme de recherche original
   * @param fields - Champs de la base de données à rechercher
   * @returns Tableau de conditions Prisma pour une clause OR
   *
   * @example
   * generatePrismaOrConditions("Antananarivo", ["city", "address"])
   * // Retourne des conditions pour chercher "antananarivo", "tananarive", "tana" dans city et address
   */
  generatePrismaOrConditions(
    searchTerm: string,
    fields: string[] = ['city', 'address', 'neighborhood', 'region']
  ): Array<Record<string, { contains: string; mode: 'insensitive' }>> {
    const aliases = this.getAliases(searchTerm)
    const conditions: Array<Record<string, { contains: string; mode: 'insensitive' }>> = []

    // Pour chaque alias, créer une condition de recherche sur chaque champ
    for (const alias of aliases) {
      for (const field of fields) {
        conditions.push({
          [field]: { contains: alias, mode: 'insensitive' },
        })
      }
    }

    return conditions
  }

  /**
   * Retourne la liste complète des alias pour l'administration
   */
  getAllAliases(): CityAliasGroup[] {
    return CITY_ALIASES
  }

  /**
   * Ajoute un nouvel alias (pour usage futur avec interface admin)
   * Note: Les alias ajoutés ne persistent pas après redémarrage
   *
   * @param canonical - Nom canonique de la ville
   * @param newAlias - Nouvel alias à ajouter
   */
  addAlias(canonical: string, newAlias: string): void {
    const normalizedCanonical = canonical.toLowerCase()
    const normalizedAlias = newAlias.toLowerCase()

    // Trouver le groupe existant
    const existingAliases = this.aliasMap.get(normalizedCanonical)

    if (existingAliases && !existingAliases.includes(normalizedAlias)) {
      // Ajouter le nouvel alias à tous les noms du groupe
      const updatedAliases = [...existingAliases, normalizedAlias]

      for (const name of updatedAliases) {
        this.aliasMap.set(name, updatedAliases)
      }

      this.reverseMap.set(normalizedAlias, normalizedCanonical)
    }
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const cityAliasesService = new CityAliasesService()

// ============================================
// EXPORTS UTILITAIRES
// ============================================

/**
 * Récupère tous les alias pour un terme de recherche
 */
export const getCityAliases = (searchTerm: string): string[] => {
  return cityAliasesService.getAliases(searchTerm)
}

/**
 * Génère les conditions Prisma OR pour une recherche avec alias
 */
export const getCitySearchConditions = (
  searchTerm: string,
  fields?: string[]
): Array<Record<string, { contains: string; mode: 'insensitive' }>> => {
  return cityAliasesService.generatePrismaOrConditions(searchTerm, fields)
}

/**
 * Vérifie si deux noms de ville sont équivalents
 */
export const areSameCity = (city1: string, city2: string): boolean => {
  return cityAliasesService.areSameCity(city1, city2)
}

export default cityAliasesService
