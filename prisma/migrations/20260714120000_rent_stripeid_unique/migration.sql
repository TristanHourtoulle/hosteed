-- CreateIndex
-- Enforce webhook idempotency at the database level: a Stripe payment intent id
-- may map to at most one Rent. stripeId is nullable and Postgres treats NULLs as
-- distinct, so existing rows with a NULL stripeId are unaffected.
CREATE UNIQUE INDEX "Rent_stripeId_key" ON "Rent"("stripeId");
