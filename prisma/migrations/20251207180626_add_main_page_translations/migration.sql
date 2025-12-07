-- CreateTable
CREATE TABLE "public"."MainPageSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainPageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MainPageSectionItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueUk" TEXT NOT NULL,
    "valueEn" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainPageSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MainPageSection_key_key" ON "public"."MainPageSection"("key");

-- CreateIndex
CREATE INDEX "MainPageSectionItem_sectionId_idx" ON "public"."MainPageSectionItem"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "MainPageSectionItem_sectionId_key_key" ON "public"."MainPageSectionItem"("sectionId", "key");

-- AddForeignKey
ALTER TABLE "public"."MainPageSectionItem" ADD CONSTRAINT "MainPageSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."MainPageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
