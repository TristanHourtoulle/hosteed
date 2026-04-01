import { z } from 'zod'

export const reservationFormSchema = z.object({
  peopleNumber: z.number().int().positive(),
  arrivingDate: z.string().min(1, "La date d'arrivée est requise"),
  leavingDate: z.string().min(1, 'La date de départ est requise'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(1, 'Le téléphone est requis'),
  phoneCountry: z.string(),
  specialRequests: z.string(),
})

export type ReservationFormData = z.infer<typeof reservationFormSchema>
