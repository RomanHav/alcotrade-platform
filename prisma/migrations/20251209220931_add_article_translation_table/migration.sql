-- CreateTable
CREATE TABLE "public"."ArticleTranslation" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "locale" "public"."TranslationLocale" NOT NULL DEFAULT 'en',
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200),
    "excerpt" VARCHAR(300),
    "content" TEXT,
    "seoTitle" VARCHAR(60),
    "seoDescription" VARCHAR(160),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArticleTranslation_locale_idx" ON "public"."ArticleTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTranslation_articleId_locale_key" ON "public"."ArticleTranslation"("articleId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTranslation_slug_locale_key" ON "public"."ArticleTranslation"("slug", "locale");

-- AddForeignKey
ALTER TABLE "public"."ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
