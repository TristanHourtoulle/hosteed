import { z } from 'zod'

export const verifyPaymentSchema = z
  .object({
    sessionId: z.string().nullish(),
    paymentIntent: z.string().nullish(),
    paymentIntentClientSecret: z.string().nullish(),
  })
  .refine(data => data.sessionId || data.paymentIntent, {
    message: 'Either sessionId or paymentIntent must be provided',
  })

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>

export const createCheckoutSessionSchema = z.object({
  productName: z.string().min(1),
  metadata: z.object({
    productId: z.string().min(1),
    userId: z.string().min(1),
    userEmail: z.string().email(),
    productName: z.string(),
    arrivingDate: z.string().min(1),
    leavingDate: z.string().min(1),
    peopleNumber: z.string().min(1),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    specialRequests: z.string(),
    selectedExtras: z.string(),
  }),
})

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>
