-- CreateTable
CREATE TABLE "public"."BrandTranslation" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "locale" "public"."TranslationLocale" NOT NULL DEFAULT 'en',
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200),
    "description" TEXT,
    "seoTitle" VARCHAR(60),
    "seoDescription" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandTranslation_locale_idx" ON "public"."BrandTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "BrandTranslation_brandId_locale_key" ON "public"."BrandTranslation"("brandId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "BrandTranslation_slug_locale_key" ON "public"."BrandTranslation"("slug", "locale");

-- AddForeignKey
ALTER TABLE "public"."BrandTranslation" ADD CONSTRAINT "BrandTranslation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
