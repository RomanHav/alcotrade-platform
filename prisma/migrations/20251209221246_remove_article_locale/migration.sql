/*
  Warnings:

  - You are about to drop the column `locale` on the `Article` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Article` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Article_slug_locale_key";

-- AlterTable
ALTER TABLE "public"."Article" DROP COLUMN "locale";

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "public"."Article"("slug");
