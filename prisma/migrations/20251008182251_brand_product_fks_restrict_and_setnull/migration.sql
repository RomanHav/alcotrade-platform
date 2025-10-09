-- CreateTable
CREATE TABLE "public"."_VariantImage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_VariantImage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_VariantImage_B_index" ON "public"."_VariantImage"("B");

-- AddForeignKey
ALTER TABLE "public"."_VariantImage" ADD CONSTRAINT "_VariantImage_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_VariantImage" ADD CONSTRAINT "_VariantImage_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
