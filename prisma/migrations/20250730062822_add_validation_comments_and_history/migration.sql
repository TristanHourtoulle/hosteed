-- CreateEnum
CREATE TYPE "ValidationSection" AS ENUM ('GENERAL_INFO', 'LOCATION', 'CHARACTERISTICS', 'PRICING', 'EQUIPMENT', 'SERVICES', 'MEALS', 'SECURITY', 'PHOTOS', 'ADDITIONAL_INFO');

-- CreateEnum
CREATE TYPE "ValidationCommentStatus" AS ENUM ('PENDING', 'RESOLVED', 'ACKNOWLEDGED');

-- CreateTable
CREATE TABLE "ValidationComment" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "section" "ValidationSection" NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "ValidationCommentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "ValidationComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "previousStatus" "ProductValidation" NOT NULL,
    "newStatus" "ProductValidation" NOT NULL,
    "adminId" TEXT,
    "hostId" TEXT,
    "reason" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ValidationComment" ADD CONSTRAINT "ValidationComment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationComment" ADD CONSTRAINT "ValidationComment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationComment" ADD CONSTRAINT "ValidationComment_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationHistory" ADD CONSTRAINT "ValidationHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationHistory" ADD CONSTRAINT "ValidationHistory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationHistory" ADD CONSTRAINT "ValidationHistory_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
