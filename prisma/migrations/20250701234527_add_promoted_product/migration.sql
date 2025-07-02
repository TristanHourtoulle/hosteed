-- CreateEnum
CREATE TYPE "PaymentReqStatus" AS ENUM ('RECEIVED', 'REFUSED', 'DONE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('SEPA_VIREMENT', 'TAPTAP', 'PAYPAL', 'INTERNATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BLOGWRITTER', 'HOST', 'HOST_VERIFIED', 'USER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_PAID', 'CLIENT_PAID', 'MID_TRANSFER_REQ', 'MID_TRANSFER_DONE', 'REST_TRANSFER_REQ', 'REST_TRANSFER_DONE', 'FULL_TRANSFER_REQ', 'FULL_TRANSFER_DONE', 'REFUNDED', 'DISPUTE');

-- CreateEnum
CREATE TYPE "RentStatus" AS ENUM ('WAITING', 'RESERVED', 'CHECKIN', 'CHECKOUT', 'CANCEL');

-- CreateEnum
CREATE TYPE "ProductValidation" AS ENUM ('NotVerified', 'Approve', 'Refused', 'RecheckRequest');

-- CreateTable
CREATE TABLE "TypeRent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "TypeRent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'CheckCircle',

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "TypeRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Security" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Security_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rules" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "petsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "eventsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TEXT NOT NULL DEFAULT '15:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '11:00',
    "selfCheckIn" BOOLEAN NOT NULL DEFAULT false,
    "selfCheckInType" TEXT,

    CONSTRAINT "Rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "basePrice" TEXT NOT NULL,
    "priceMGA" TEXT NOT NULL,
    "room" BIGINT,
    "bathroom" BIGINT,
    "arriving" INTEGER NOT NULL,
    "leaving" INTEGER NOT NULL,
    "autoAccept" BOOLEAN NOT NULL,
    "equipement" BIGINT,
    "meal" BIGINT,
    "services" BIGINT,
    "security" BIGINT,
    "minRent" BIGINT,
    "maxRent" BIGINT,
    "advanceRent" BIGINT,
    "delayTime" BIGINT,
    "categories" BIGINT NOT NULL,
    "minPeople" BIGINT,
    "maxPeople" BIGINT,
    "commission" INTEGER NOT NULL DEFAULT 0,
    "validate" "ProductValidation" NOT NULL DEFAULT 'NotVerified',
    "userManager" BIGINT NOT NULL,
    "typeId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "certified" BOOLEAN NOT NULL DEFAULT false,
    "contract" BOOLEAN NOT NULL DEFAULT false,
    "sizeRoom" INTEGER,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "startDiscount" TIMESTAMP(3) NOT NULL,
    "endDiscount" TIMESTAMP(3) NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Images" (
    "id" TEXT NOT NULL,
    "img" TEXT NOT NULL,

    CONSTRAINT "Images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificPrices" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "day" BIGINT NOT NULL,
    "price" BIGINT NOT NULL,
    "active" BIGINT NOT NULL,

    CONSTRAINT "SpecificPrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificRequest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "SpecificRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Options" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "type" BIGINT NOT NULL,

    CONSTRAINT "Options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rent" (
    "id" TEXT NOT NULL,
    "stripeId" TEXT,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "numberPeople" BIGINT NOT NULL,
    "notes" BIGINT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "prices" BIGINT NOT NULL,
    "arrivingDate" TIMESTAMP(3) NOT NULL,
    "leavingDate" TIMESTAMP(3) NOT NULL,
    "payment" "PaymentStatus" NOT NULL DEFAULT 'NOT_PAID',
    "status" "RentStatus" NOT NULL DEFAULT 'WAITING',
    "confirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Rent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnAvailableProduct" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "UnAvailableProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisableRent" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentId" TEXT NOT NULL,

    CONSTRAINT "DisableRent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "welcomeGrade" INTEGER NOT NULL DEFAULT 0,
    "staff" INTEGER NOT NULL DEFAULT 0,
    "comfort" INTEGER NOT NULL DEFAULT 0,
    "equipment" INTEGER NOT NULL DEFAULT 0,
    "cleaning" INTEGER NOT NULL DEFAULT 0,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "rentId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "emailToken" TEXT,
    "resetToken" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "info" TEXT,
    "lastname" TEXT,
    "password" TEXT,
    "profilePicture" TEXT,
    "stripeCustomerId" TEXT,
    "roles" "UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId","credentialID")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rentId" TEXT NOT NULL,
    "host" BOOLEAN NOT NULL,
    "dateSended" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PayRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rentId" TEXT NOT NULL,
    "PaymentRequest" "PaymentStatus" NOT NULL,
    "prices" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentReqStatus" NOT NULL
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "adress" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotedProduct" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "PromotedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NearbyPlace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "transport" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "NearbyPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "productId" TEXT NOT NULL,

    CONSTRAINT "TransportOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyInfo" (
    "id" TEXT NOT NULL,
    "hasStairs" BOOLEAN NOT NULL DEFAULT false,
    "hasElevator" BOOLEAN NOT NULL DEFAULT false,
    "hasHandicapAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasPetsOnProperty" BOOLEAN NOT NULL DEFAULT false,
    "additionalNotes" TEXT,
    "productId" TEXT NOT NULL,

    CONSTRAINT "PropertyInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "freeCancellationHours" INTEGER NOT NULL,
    "partialRefundPercent" INTEGER NOT NULL,
    "additionalTerms" TEXT,
    "productId" TEXT NOT NULL,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EquipmentToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EquipmentToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MealsToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MealsToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductToSecurity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToSecurity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductToServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductToTypeRoom" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToTypeRoom_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductTohotel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductTohotel_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ImagesToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ImagesToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OptionsToRent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OptionsToRent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_staff" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_staff_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_id_key" ON "Chat"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PayRequest_id_key" ON "PayRequest"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_productId_key" ON "Favorite"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyInfo_productId_key" ON "PropertyInfo"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CancellationPolicy_productId_key" ON "CancellationPolicy"("productId");

-- CreateIndex
CREATE INDEX "_EquipmentToProduct_B_index" ON "_EquipmentToProduct"("B");

-- CreateIndex
CREATE INDEX "_MealsToProduct_B_index" ON "_MealsToProduct"("B");

-- CreateIndex
CREATE INDEX "_ProductToUser_B_index" ON "_ProductToUser"("B");

-- CreateIndex
CREATE INDEX "_ProductToSecurity_B_index" ON "_ProductToSecurity"("B");

-- CreateIndex
CREATE INDEX "_ProductToServices_B_index" ON "_ProductToServices"("B");

-- CreateIndex
CREATE INDEX "_ProductToTypeRoom_B_index" ON "_ProductToTypeRoom"("B");

-- CreateIndex
CREATE INDEX "_ProductTohotel_B_index" ON "_ProductTohotel"("B");

-- CreateIndex
CREATE INDEX "_ImagesToProduct_B_index" ON "_ImagesToProduct"("B");

-- CreateIndex
CREATE INDEX "_OptionsToRent_B_index" ON "_OptionsToRent"("B");

-- CreateIndex
CREATE INDEX "_staff_B_index" ON "_staff"("B");

-- AddForeignKey
ALTER TABLE "Rules" ADD CONSTRAINT "Rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "TypeRent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificPrices" ADD CONSTRAINT "SpecificPrices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificRequest" ADD CONSTRAINT "SpecificRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Options" ADD CONSTRAINT "Options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rent" ADD CONSTRAINT "Rent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rent" ADD CONSTRAINT "Rent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnAvailableProduct" ADD CONSTRAINT "UnAvailableProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisableRent" ADD CONSTRAINT "DisableRent_rentId_fkey" FOREIGN KEY ("rentId") REFERENCES "Rent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_rentId_fkey" FOREIGN KEY ("rentId") REFERENCES "Rent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_rentId_fkey" FOREIGN KEY ("rentId") REFERENCES "Rent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayRequest" ADD CONSTRAINT "PayRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayRequest" ADD CONSTRAINT "PayRequest_rentId_fkey" FOREIGN KEY ("rentId") REFERENCES "Rent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotedProduct" ADD CONSTRAINT "PromotedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NearbyPlace" ADD CONSTRAINT "NearbyPlace_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportOption" ADD CONSTRAINT "TransportOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyInfo" ADD CONSTRAINT "PropertyInfo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationPolicy" ADD CONSTRAINT "CancellationPolicy_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentToProduct" ADD CONSTRAINT "_EquipmentToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentToProduct" ADD CONSTRAINT "_EquipmentToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MealsToProduct" ADD CONSTRAINT "_MealsToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MealsToProduct" ADD CONSTRAINT "_MealsToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToUser" ADD CONSTRAINT "_ProductToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToUser" ADD CONSTRAINT "_ProductToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToSecurity" ADD CONSTRAINT "_ProductToSecurity_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToSecurity" ADD CONSTRAINT "_ProductToSecurity_B_fkey" FOREIGN KEY ("B") REFERENCES "Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToServices" ADD CONSTRAINT "_ProductToServices_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToServices" ADD CONSTRAINT "_ProductToServices_B_fkey" FOREIGN KEY ("B") REFERENCES "Services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToTypeRoom" ADD CONSTRAINT "_ProductToTypeRoom_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToTypeRoom" ADD CONSTRAINT "_ProductToTypeRoom_B_fkey" FOREIGN KEY ("B") REFERENCES "TypeRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductTohotel" ADD CONSTRAINT "_ProductTohotel_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductTohotel" ADD CONSTRAINT "_ProductTohotel_B_fkey" FOREIGN KEY ("B") REFERENCES "hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImagesToProduct" ADD CONSTRAINT "_ImagesToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ImagesToProduct" ADD CONSTRAINT "_ImagesToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionsToRent" ADD CONSTRAINT "_OptionsToRent_A_fkey" FOREIGN KEY ("A") REFERENCES "Options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionsToRent" ADD CONSTRAINT "_OptionsToRent_B_fkey" FOREIGN KEY ("B") REFERENCES "Rent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_staff" ADD CONSTRAINT "_staff_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_staff" ADD CONSTRAINT "_staff_B_fkey" FOREIGN KEY ("B") REFERENCES "hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
