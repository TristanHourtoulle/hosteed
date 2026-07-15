import { z } from 'zod'
import { ROOM_TYPE_NAMES } from '../types/roomType'

export const BED_TYPES = ['SIMPLE', 'DOUBLE', 'KING', 'GRAND_KING'] as const
export const bedTypeSchema = z.enum(BED_TYPES)

export const roomTypeBedSchema = z.object({
  bedType: bedTypeSchema,
  count: z.number().int().min(0),
})

export const roomTypeSpecialPriceSchema = z.object({
  id: z.string(),
  pricesEuro: z.string(),
  pricesMga: z.string(),
  day: z.array(z.string()),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  activate: z.boolean(),
})

export const roomTypeSchema = z.object({
  id: z.string(),
  name: z.enum(ROOM_TYPE_NAMES, {
    errorMap: () => ({ message: 'Sélectionnez un type de chambre' }),
  }),
  quantity: z.string().refine(v => Number(v) >= 1, 'La quantité doit être au moins 1'),
  capacity: z.string().refine(v => Number(v) >= 1, 'La capacité doit être au moins 1'),
  surface: z.string().optional().default(''),
  smoking: z.boolean(),
  basePrice: z.string().min(1, 'Le prix EUR est requis'),
  priceMGA: z.string().min(1, 'Le prix MGA est requis'),
  beds: z
    .array(roomTypeBedSchema)
    .refine(beds => beds.some(b => b.count > 0), 'Ajoutez au moins un lit'),
  specialPrices: z.array(roomTypeSpecialPriceSchema),
  mealIds: z.array(z.string()),
  includedServiceIds: z.array(z.string()),
  extraIds: z.array(z.string()),
  // Photos are optional and deliberately have no `.min(1)`: the 20-photo cap is
  // shared with the establishment, so requiring at least one photo per room
  // type would be unsatisfiable past 20 types (and hostile well before that).
  // `z.any()` because an ImageFile wraps a browser `File`, which Zod cannot
  // meaningfully introspect here; shape is enforced by the TS type. Defaulted
  // rather than required so an absent list can never block the wizard with an
  // error the host has no way to act on.
  images: z.array(z.any()).default([]),
})

export const roomTypesStepSchema = z.object({
  roomTypes: z.array(roomTypeSchema).min(1, 'Ajoutez au moins un type de chambre'),
})

export type RoomTypeSchemaValues = z.infer<typeof roomTypeSchema>
