-- CreateEnum
CREATE TYPE "public"."TranslationLocale" AS ENUM ('uk', 'en');

-- CreateTable
CREATE TABLE "public"."ProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locale" "public"."TranslationLocale" NOT NULL DEFAULT 'en',
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200),
    "description" TEXT,
    "seoTitle" VARCHAR(60),
    "seoDescription" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariantTranslation" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "locale" "public"."TranslationLocale" NOT NULL DEFAULT 'en',
    "label" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductTranslation_locale_idx" ON "public"."ProductTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_locale_key" ON "public"."ProductTranslation"("productId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_slug_locale_key" ON "public"."ProductTranslation"("slug", "locale");

-- CreateIndex
CREATE INDEX "ProductVariantTranslation_locale_idx" ON "public"."ProductVariantTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantTranslation_variantId_locale_key" ON "public"."ProductVariantTranslation"("variantId", "locale");

-- AddForeignKey
ALTER TABLE "public"."ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariantTranslation" ADD CONSTRAINT "ProductVariantTranslation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
