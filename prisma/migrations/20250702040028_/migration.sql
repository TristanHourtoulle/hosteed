-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Post" ADD CONSTRAINT "Post_title_key" UNIQUE ("title");
