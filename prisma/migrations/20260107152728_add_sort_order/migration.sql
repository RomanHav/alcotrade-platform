-- AlterTable
ALTER TABLE "public"."Brand" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
