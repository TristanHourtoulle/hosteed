/*
  Warnings:

  - The values [BLOGWRITTER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Post` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `certificatedBy` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExtraPriceType" AS ENUM ('PER_DAY', 'PER_PERSON', 'PER_DAY_PERSON', 'PER_BOOKING');

-- CreateEnum
CREATE TYPE "DayEnum" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- AlterEnum
ALTER TYPE "ProductValidation" ADD VALUE 'ModificationPending';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'BLOGWRITER', 'HOST', 'HOST_VERIFIED', 'HOST_MANAGER', 'USER');
ALTER TABLE "User" ALTER COLUMN "roles" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "roles" TYPE "UserRole_new" USING ("roles"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "roles" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "authorId" TEXT NOT NULL DEFAULT 'cmdqcrvp20003jp04si03b7sr',
ADD COLUMN     "keywords" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availableRooms" INTEGER,
ADD COLUMN     "certificatedBy" TEXT NOT NULL,
ADD COLUMN     "certificationDate" TIMESTAMP(3),
ADD COLUMN     "isCertificated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalProductId" TEXT,
ADD COLUMN     "phoneCountry" TEXT NOT NULL DEFAULT 'MG';

-- AlterTable
ALTER TABLE "TypeRent" ADD COLUMN     "isHotelType" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "IncludedService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncludedService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductExtra" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceEUR" DOUBLE PRECISION NOT NULL,
    "priceMGA" DOUBLE PRECISION NOT NULL,
    "type" "ExtraPriceType" NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductExtra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyHighlight" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentExtra" (
    "id" TEXT NOT NULL,
    "rentId" TEXT NOT NULL,
    "extraId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentExtra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialPrices" (
    "id" TEXT NOT NULL,
    "pricesMga" TEXT NOT NULL,
    "pricesEuro" TEXT NOT NULL,
    "day" "DayEnum"[],
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "activate" BOOLEAN NOT NULL DEFAULT true,
    "productId" TEXT NOT NULL,

    CONSTRAINT "SpecialPrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_settings" (
    "id" TEXT NOT NULL,
    "hostCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "hostCommissionFixed" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "clientCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "clientCommissionFixed" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "commission_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductToIncludedService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToIncludedService_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductToProductExtra" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToProductExtra_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductToPropertyHighlight" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToPropertyHighlight_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "RentExtra_rentId_extraId_key" ON "RentExtra"("rentId", "extraId");

-- CreateIndex
CREATE INDEX "_ProductToIncludedService_B_index" ON "_ProductToIncludedService"("B");

-- CreateIndex
CREATE INDEX "_ProductToProductExtra_B_index" ON "_ProductToProductExtra"("B");

-- CreateIndex
CREATE INDEX "_ProductToPropertyHighlight_B_index" ON "_ProductToPropertyHighlight"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- AddForeignKey
ALTER TABLE "IncludedService" ADD CONSTRAINT "IncludedService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductExtra" ADD CONSTRAINT "ProductExtra_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyHighlight" ADD CONSTRAINT "PropertyHighlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentExtra" ADD CONSTRAINT "RentExtra_rentId_fkey" FOREIGN KEY ("rentId") REFERENCES "Rent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentExtra" ADD CONSTRAINT "RentExtra_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "ProductExtra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_certificatedBy_fkey" FOREIGN KEY ("certificatedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_originalProductId_fkey" FOREIGN KEY ("originalProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialPrices" ADD CONSTRAINT "SpecialPrices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToIncludedService" ADD CONSTRAINT "_ProductToIncludedService_A_fkey" FOREIGN KEY ("A") REFERENCES "IncludedService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToIncludedService" ADD CONSTRAINT "_ProductToIncludedService_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProductExtra" ADD CONSTRAINT "_ProductToProductExtra_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToProductExtra" ADD CONSTRAINT "_ProductToProductExtra_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductExtra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToPropertyHighlight" ADD CONSTRAINT "_ProductToPropertyHighlight_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToPropertyHighlight" ADD CONSTRAINT "_ProductToPropertyHighlight_B_fkey" FOREIGN KEY ("B") REFERENCES "PropertyHighlight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
