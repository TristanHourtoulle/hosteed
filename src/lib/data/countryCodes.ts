export interface Country {
  code: string // Code ISO 2 lettres (FR, MG, etc.)
  name: string // Nom du pays
  dialCode: string // Code téléphonique (+33, +261, etc.)
  flag: string // Emoji du drapeau
}

export const COUNTRIES: Country[] = [
  // Pays principaux pour Madagascar et France
  { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  
  // Autres pays francophones
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺' },
  { code: 'MC', name: 'Monaco', dialCode: '+377', flag: '🇲🇨' },
  
  // Pays de l'Océan Indien
  { code: 'MU', name: 'Maurice', dialCode: '+230', flag: '🇲🇺' },
  { code: 'SC', name: 'Seychelles', dialCode: '+248', flag: '🇸🇨' },
  { code: 'RE', name: 'Réunion', dialCode: '+262', flag: '🇷🇪' },
  { code: 'YT', name: 'Mayotte', dialCode: '+262', flag: '🇾🇹' },
  { code: 'KM', name: 'Comores', dialCode: '+269', flag: '🇰🇲' },
  
  // Pays africains
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪' },
  { code: 'TD', name: 'Tchad', dialCode: '+235', flag: '🇹🇩' },
  { code: 'CF', name: 'République Centrafricaine', dialCode: '+236', flag: '🇨🇫' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  { code: 'CG', name: 'République du Congo', dialCode: '+242', flag: '🇨🇬' },
  { code: 'CD', name: 'République Démocratique du Congo', dialCode: '+243', flag: '🇨🇩' },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253', flag: '🇩🇯' },
  
  // Autres pays importants
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱' },
  { code: 'AT', name: 'Autriche', dialCode: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'Suède', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norvège', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Danemark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finlande', dialCode: '+358', flag: '🇫🇮' },
  { code: 'PL', name: 'Pologne', dialCode: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'République Tchèque', dialCode: '+420', flag: '🇨🇿' },
  { code: 'HU', name: 'Hongrie', dialCode: '+36', flag: '🇭🇺' },
  { code: 'GR', name: 'Grèce', dialCode: '+30', flag: '🇬🇷' },
  { code: 'TR', name: 'Turquie', dialCode: '+90', flag: '🇹🇷' },
  { code: 'RU', name: 'Russie', dialCode: '+7', flag: '🇷🇺' },
  { code: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'Corée du Sud', dialCode: '+82', flag: '🇰🇷' },
  { code: 'IN', name: 'Inde', dialCode: '+91', flag: '🇮🇳' },
  { code: 'AU', name: 'Australie', dialCode: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'Nouvelle-Zélande', dialCode: '+64', flag: '🇳🇿' },
  { code: 'ZA', name: 'Afrique du Sud', dialCode: '+27', flag: '🇿🇦' },
  { code: 'BR', name: 'Brésil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentine', dialCode: '+54', flag: '🇦🇷' },
  { code: 'MX', name: 'Mexique', dialCode: '+52', flag: '🇲🇽' },
].sort((a, b) => a.name.localeCompare(b.name))

// Fonction pour trouver un pays par son code
export function findCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(country => country.code === code)
}

// Fonction pour trouver un pays par son code téléphonique
export function findCountryByDialCode(dialCode: string): Country | undefined {
  return COUNTRIES.find(country => country.dialCode === dialCode)
}

// Pays par défaut (Madagascar pour cette application)
export const DEFAULT_COUNTRY: Country = COUNTRIES.find(c => c.code === 'MG') || COUNTRIES[0]