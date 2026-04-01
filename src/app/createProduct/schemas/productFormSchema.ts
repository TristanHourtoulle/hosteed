import { z } from 'zod'

// Step 1: Basic Info
export const basicInfoSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200),
  description: z.string().min(1, 'La description est requise'),
  typeId: z.string().min(1, "Le type d'hébergement est requis"),
  isHotel: z.boolean(),
  hotelName: z.string().optional(),
  availableRooms: z.string().optional(),
}).refine(
  (data) => {
    if (data.isHotel) {
      return !!data.hotelName && data.hotelName.trim().length > 0
    }
    return true
  },
  { message: "Le nom de l'hôtel est requis", path: ['hotelName'] }
).refine(
  (data) => {
    if (data.isHotel) {
      return !!data.availableRooms && Number(data.availableRooms) > 0
    }
    return true
  },
  { message: 'Le nombre de chambres doit être supérieur à 0', path: ['availableRooms'] }
)

// Step 2: Location & Characteristics
export const locationSchema = z.object({
  address: z.string().min(1, "L'adresse est requise"),
  completeAddress: z.string().optional(),
  phone: z.string().min(8, 'Le téléphone est requis'),
  phoneCountry: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  room: z.string().optional(),
  bathroom: z.string().optional(),
  surface: z.string().optional(),
  minPeople: z.string().optional(),
  maxPeople: z.string().optional(),
  arriving: z.string().optional(),
  leaving: z.string().optional(),
  autoAccept: z.boolean(),
  accessibility: z.boolean(),
  petFriendly: z.boolean(),
  nearbyPlaces: z.array(z.object({
    name: z.string(),
    distance: z.string(),
    unit: z.enum(['mètres', 'kilomètres', 'minutes à pied']),
  })),
  proximityLandmarks: z.array(z.string()),
  transportation: z.string().optional(),
})

// Step 3: Pricing
export const pricingSchema = z.object({
  basePrice: z.string().min(1, 'Le prix EUR est requis'),
  priceMGA: z.string().min(1, 'Le prix MGA est requis'),
  basePriceMGA: z.string().optional(),
})

// Step 4: Services (all optional arrays)
export const servicesSchema = z.object({
  equipmentIds: z.array(z.string()),
  mealIds: z.array(z.string()),
  securityIds: z.array(z.string()),
  serviceIds: z.array(z.string()),
  includedServiceIds: z.array(z.string()),
  extraIds: z.array(z.string()),
  highlightIds: z.array(z.string()),
})

// Step 5: Rules & Property Info
export const rulesSchema = z.object({
  smokingAllowed: z.boolean(),
  petsAllowed: z.boolean(),
  eventsAllowed: z.boolean(),
  selfCheckIn: z.boolean(),
  selfCheckInType: z.string().optional(),
  hasStairs: z.boolean(),
  hasElevator: z.boolean(),
  hasHandicapAccess: z.boolean(),
  hasPetsOnProperty: z.boolean(),
  additionalNotes: z.string().optional(),
})

// Field names for each step (used for partial validation via trigger())
export const STEP_FIELD_NAMES: Record<number, string[]> = {
  0: ['name', 'description', 'typeId', 'isHotel', 'hotelName', 'availableRooms'],
  1: ['address', 'completeAddress', 'phone', 'phoneCountry', 'latitude', 'longitude', 'room', 'bathroom', 'surface', 'minPeople', 'maxPeople', 'arriving', 'leaving', 'autoAccept', 'accessibility', 'petFriendly', 'nearbyPlaces', 'proximityLandmarks', 'transportation'],
  2: ['basePrice', 'priceMGA', 'basePriceMGA'],
  3: ['equipmentIds', 'mealIds', 'securityIds', 'serviceIds', 'includedServiceIds', 'extraIds', 'highlightIds'],
  4: ['smokingAllowed', 'petsAllowed', 'eventsAllowed', 'selfCheckIn', 'selfCheckInType', 'hasStairs', 'hasElevator', 'hasHandicapAccess', 'hasPetsOnProperty', 'additionalNotes'],
}

export const STEP_LABELS = [
  'Informations',
  'Localisation',
  'Tarification',
  'Services',
  'Règles & Photos',
]

export const TOTAL_STEPS = STEP_LABELS.length
