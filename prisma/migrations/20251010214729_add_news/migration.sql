-- CreateEnum
CREATE TYPE "public"."NewsStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVE');

-- CreateTable
CREATE TABLE "public"."Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" VARCHAR(300),
    "content" TEXT,
    "date" TIMESTAMP(3),
    "status" "public"."NewsStatus" NOT NULL DEFAULT 'DRAFT',
    "slug" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL DEFAULT 'uk',
    "seoTitle" VARCHAR(60),
    "seoDescription" VARCHAR(160),
    "coverId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArticleImage" (
    "articleId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArticleImage_pkey" PRIMARY KEY ("articleId","mediaId")
);

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "public"."Article"("status");

-- CreateIndex
CREATE INDEX "Article_date_idx" ON "public"."Article"("date");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "public"."Article"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_locale_key" ON "public"."Article"("slug", "locale");

-- CreateIndex
CREATE INDEX "ArticleImage_position_idx" ON "public"."ArticleImage"("position");

-- AddForeignKey
ALTER TABLE "public"."Article" ADD CONSTRAINT "Article_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "public"."MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArticleImage" ADD CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArticleImage" ADD CONSTRAINT "ArticleImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
