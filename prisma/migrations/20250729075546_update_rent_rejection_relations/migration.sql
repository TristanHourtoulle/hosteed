/*
  Warnings:

  - Added the required column `guestId` to the `RentRejection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostId` to the `RentRejection` table without a default value. This is not possible if the table is not empty.
  - Made the column `message` on table `RentRejection` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RentRejection" ADD COLUMN     "guestId" TEXT NOT NULL,
ADD COLUMN     "hostId" TEXT NOT NULL,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedBy" TEXT,
ALTER COLUMN "message" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "RentRejection" ADD CONSTRAINT "RentRejection_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentRejection" ADD CONSTRAINT "RentRejection_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentRejection" ADD CONSTRAINT "RentRejection_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
