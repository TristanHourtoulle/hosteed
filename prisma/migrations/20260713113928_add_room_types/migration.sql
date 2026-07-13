-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('SIMPLE', 'DOUBLE', 'KING', 'GRAND_KING');

-- AlterTable
ALTER TABLE "ProductPromotion" ADD COLUMN     "roomTypeId" TEXT;

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "surface" INTEGER,
    "smoking" BOOLEAN NOT NULL DEFAULT false,
    "basePrice" TEXT NOT NULL,
    "priceMGA" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomTypeBed" (
    "id" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "bedType" "BedType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RoomTypeBed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomTypeSpecialPrice" (
    "id" TEXT NOT NULL,
    "pricesMga" TEXT NOT NULL,
    "pricesEuro" TEXT NOT NULL,
    "day" "DayEnum"[],
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "activate" BOOLEAN NOT NULL DEFAULT true,
    "roomTypeId" TEXT NOT NULL,

    CONSTRAINT "RoomTypeSpecialPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomTypeBlockedDate" (
    "id" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomTypeBlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentRoomType" (
    "id" TEXT NOT NULL,
    "rentId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentRoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IncludedServiceToRoomType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IncludedServiceToRoomType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductExtraToRoomType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductExtraToRoomType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MealsToRoomType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MealsToRoomType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServicesToRoomType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ServicesToRoomType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "RoomType_productId_idx" ON "RoomType"("productId");

-- CreateIndex
CREATE INDEX "RoomType_productId_position_idx" ON "RoomType"("productId", "position");

-- CreateIndex
CREATE INDEX "RoomTypeBed_roomTypeId_idx" ON "RoomTypeBed"("roomTypeId");

-- CreateIndex
CREATE INDEX "RoomTypeSpecialPrice_roomTypeId_idx" ON "RoomTypeSpecialPrice"("roomTypeId");

-- CreateIndex
CREATE INDEX "RoomTypeSpecialPrice_activate_idx" ON "RoomTypeSpecialPrice"("activate");

-- CreateIndex
CREATE INDEX "RoomTypeSpecialPrice_startDate_endDate_idx" ON "RoomTypeSpecialPrice"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "RoomTypeBlockedDate_roomTypeId_idx" ON "RoomTypeBlockedDate"("roomTypeId");

-- CreateIndex
CREATE INDEX "RoomTypeBlockedDate_startDate_endDate_idx" ON "RoomTypeBlockedDate"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "RentRoomType_rentId_idx" ON "RentRoomType"("rentId");

-- CreateIndex
CREATE INDEX "RentRoomType_roomTypeId_idx" ON "RentRoomType"("roomTypeId");

-- CreateIndex
CREATE INDEX "_IncludedServiceToRoomType_B_index" ON "_IncludedServiceToRoomType"("B");

-- CreateIndex
CREATE INDEX "_ProductExtraToRoomType_B_index" ON "_ProductExtraToRoomType"("B");

-- CreateIndex
CREATE INDEX "_MealsToRoomType_B_index" ON "_MealsToRoomType"("B");

-- CreateIndex
CREATE INDEX "_ServicesToRoomType_B_index" ON "_ServicesToRoomType"("B");

-- CreateIndex
CREATE INDEX "ProductPromotion_roomTypeId_idx" ON "ProductPromotion"("roomTypeId");

-- AddForeignKey
ALTER TABLE "ProductPromotion" ADD CONSTRAINT "ProductPromotion_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomTypeBed" ADD CONSTRAINT "RoomTypeBed_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomTypeSpecialPrice" ADD CONSTRAINT "RoomTypeSpecialPrice_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomTypeBlockedDate" ADD CONSTRAINT "RoomTypeBlockedDate_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentRoomType" ADD CONSTRAINT "RentRoomType_rentId_fkey" FOREIGN KEY ("rentId") REFERENCES "Rent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentRoomType" ADD CONSTRAINT "RentRoomType_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncludedServiceToRoomType" ADD CONSTRAINT "_IncludedServiceToRoomType_A_fkey" FOREIGN KEY ("A") REFERENCES "IncludedService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IncludedServiceToRoomType" ADD CONSTRAINT "_IncludedServiceToRoomType_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductExtraToRoomType" ADD CONSTRAINT "_ProductExtraToRoomType_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductExtra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductExtraToRoomType" ADD CONSTRAINT "_ProductExtraToRoomType_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MealsToRoomType" ADD CONSTRAINT "_MealsToRoomType_A_fkey" FOREIGN KEY ("A") REFERENCES "Meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MealsToRoomType" ADD CONSTRAINT "_MealsToRoomType_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicesToRoomType" ADD CONSTRAINT "_ServicesToRoomType_A_fkey" FOREIGN KEY ("A") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicesToRoomType" ADD CONSTRAINT "_ServicesToRoomType_B_fkey" FOREIGN KEY ("B") REFERENCES "Services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

