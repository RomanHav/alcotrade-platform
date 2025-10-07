import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { ProductStatus, Prisma } from '@prisma/client'; // 👈 добавили Prisma
import { slug as makeSlug } from '@/lib/slug';

type VariantInput = {
  id?: string;
  label?: string | null;
  volumeMl?: number | null;
  position: number;
  imageId?: string | null; // делаем optional, удобнее при парсинге
};

type SaveInput = {
  id?: string;
  name: string;
  status: ProductStatus;
  brandId: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  variants?: VariantInput[];
  coverId?: string | null;
  imageIds?: string[];
  slug?: string | null;
};

// Генерация уникального slug (для случаев, когда slug не задан явно)
async function ensureUniqueSlug(
  tx: Prisma.TransactionClient, // 👈 правильный тип
  base: string,
  excludeId?: string,
): Promise<string> {
  const clean = makeSlug(base || 'product');
  let candidate = clean || 'product';
  let i = 2;

  while (
    await tx.product.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${clean}-${i++}`;
  }
  return candidate;
}

export async function POST(req: Request) {
  const data: SaveInput = await req.json();

  try {
    if (data.id) {
      const { id, variants = [], imageIds = [], slug, ...rest } = data;

      await prisma.$transaction(async (tx) => {
        // валидные media
        const existing = await tx.mediaAsset.findMany({
          where: { id: { in: imageIds } },
          select: { id: true },
        });
        const valid = existing.map((m) => m.id);

        // coverId
        let safeCoverId: string | null = rest.coverId ?? null;
        if (!safeCoverId || !valid.includes(safeCoverId)) safeCoverId = valid[0] ?? null;

        // slug:
        // - если в запросе пришёл непустой slug -> проверяем конфликт, при конфликте кидаем SLUG_TAKEN
        // - если пустой -> генерим уникальный из name
        const raw = (slug ?? '').trim();
        let nextSlug: string;
        if (raw) {
          const cleaned = makeSlug(raw);
          const taken = await tx.product.findFirst({
            where: { slug: cleaned, id: { not: id } },
            select: { id: true },
          });
          if (taken) throw new Error('SLUG_TAKEN');
          nextSlug = cleaned;
        } else {
          nextSlug = await ensureUniqueSlug(tx, rest.name, id);
        }

        await tx.product.update({
          where: { id },
          data: { ...rest, coverId: safeCoverId, slug: nextSlug },
        });

        // варианты — пересобираем
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (variants.length) {
          await tx.productVariant.createMany({
            data: variants.map((v, i) => ({
              productId: id,
              label: v.label ?? null,
              volumeMl: v.volumeMl ?? null,
              position: v.position ?? i,
              imageId: v.imageId ?? null,
            })),
          });
        }

        // галерея — пересобираем
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (valid.length) {
          await tx.productImage.createMany({
            data: valid.map((mediaId, i) => ({ productId: id, mediaId, position: i })),
          });
        }
      });
    } else {
      const { variants = [], imageIds = [], slug, ...rest } = data;

      await prisma.$transaction(async (tx) => {
        const existing = await tx.mediaAsset.findMany({
          where: { id: { in: imageIds } },
          select: { id: true },
        });
        const valid = existing.map((m) => m.id);

        let safeCoverId: string | null = rest.coverId ?? null;
        if (!safeCoverId || !valid.includes(safeCoverId)) safeCoverId = valid[0] ?? null;

        const raw = (slug ?? '').trim();
        let nextSlug: string;
        if (raw) {
          const cleaned = makeSlug(raw);
          const taken = await tx.product.findFirst({
            where: { slug: cleaned },
            select: { id: true },
          });
          if (taken) throw new Error('SLUG_TAKEN');
          nextSlug = cleaned;
        } else {
          nextSlug = await ensureUniqueSlug(tx, rest.name);
        }

        const created = await tx.product.create({
          data: { ...rest, slug: nextSlug, coverId: safeCoverId },
        });

        if (variants.length) {
          await tx.productVariant.createMany({
            data: variants.map((v, i) => ({
              productId: created.id,
              label: v.label ?? null,
              volumeMl: v.volumeMl ?? null,
              position: v.position ?? i,
              imageId: v.imageId ?? null,
            })),
          });
        }

        if (valid.length) {
          await tx.productImage.createMany({
            data: valid.map((mediaId, i) => ({ productId: created.id, mediaId, position: i })),
          });
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'SLUG_TAKEN') {
      return NextResponse.json({ ok: false, code: 'SLUG_TAKEN' }, { status: 409 });
    }
    // на всякий
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
