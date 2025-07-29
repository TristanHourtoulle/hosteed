-- CreateTable
CREATE TABLE "RentRejection" (
    "id" TEXT NOT NULL,
    "rentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RentRejection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RentRejection_rentId_key" ON "RentRejection"("rentId");

-- AddForeignKey
ALTER TABLE "RentRejection" ADD CONSTRAINT "RentRejection_rentId_fkey" FOREIGN KEY ("rentId") REFERENCES "Rent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
