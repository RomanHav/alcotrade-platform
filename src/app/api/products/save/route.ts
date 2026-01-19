import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { ProductStatus, Prisma } from '@prisma/client';
import { slug as makeSlug } from '@/lib/slug';

type VariantInput = {
  id?: string;
  label?: string | null;
  volumeMl?: number | null;
  position: number;
  imageId?: string | null;
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

async function ensureUniqueSlug(
  client: { product: Prisma.ProductDelegate },
  base: string,
  excludeId?: string,
): Promise<string> {
  const clean = makeSlug(base || 'product');
  let candidate = clean || 'product';
  let i = 2;

  while (
    await client.product.findFirst({
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
    const normalizeNewlines = (s?: string | null) => (s == null ? s ?? null : s.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));

    if (data.id) {
      const { id, variants = [], imageIds = [], slug, ...rest } = data;

      const existing = await prisma.mediaAsset.findMany({
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
        const taken = await prisma.product.findFirst({
          where: { slug: cleaned, id: { not: id } },
          select: { id: true },
        });
        if (taken) throw new Error('SLUG_TAKEN');
        nextSlug = cleaned;
      } else {
        nextSlug = await ensureUniqueSlug(prisma as any, rest.name, id);
      }

      const writes: Prisma.PrismaPromise<any>[] = [];
      writes.push(
        prisma.product.update({
          where: { id },
          data: { ...rest, description: normalizeNewlines(rest.description), coverId: safeCoverId, slug: nextSlug },
        }),
      );
      writes.push(prisma.productVariant.deleteMany({ where: { productId: id } }));
      if (variants.length) {
        writes.push(
          prisma.productVariant.createMany({
            data: variants.map((v, i) => ({
              productId: id,
              label: v.label ?? null,
              volumeMl: v.volumeMl ?? null,
              position: v.position ?? i,
              imageId: v.imageId ?? null,
            })),
          }),
        );
      }
      writes.push(prisma.productImage.deleteMany({ where: { productId: id } }));
      if (valid.length) {
        writes.push(
          prisma.productImage.createMany({
            data: valid.map((mediaId, i) => ({ productId: id, mediaId, position: i })),
          }),
        );
      }
      await prisma.$transaction(writes);
    } else {
      const { variants = [], imageIds = [], slug, ...rest } = data;

      const existing = await prisma.mediaAsset.findMany({
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
        const taken = await prisma.product.findFirst({
          where: { slug: cleaned },
          select: { id: true },
        });
        if (taken) throw new Error('SLUG_TAKEN');
        nextSlug = cleaned;
      } else {
        nextSlug = await ensureUniqueSlug(prisma as any, rest.name);
      }

      const created = await prisma.product.create({
        data: { ...rest, description: normalizeNewlines(rest.description), slug: nextSlug, coverId: safeCoverId },
      });

      const writes: Prisma.PrismaPromise<any>[] = [];
      if (variants.length) {
        writes.push(
          prisma.productVariant.createMany({
            data: variants.map((v, i) => ({
              productId: created.id,
              label: v.label ?? null,
              volumeMl: v.volumeMl ?? null,
              position: v.position ?? i,
              imageId: v.imageId ?? null,
            })),
          }),
        );
      }
      if (valid.length) {
        writes.push(
          prisma.productImage.createMany({
            data: valid.map((mediaId, i) => ({ productId: created.id, mediaId, position: i })),
          }),
        );
      }
      if (writes.length) await prisma.$transaction(writes);
    }

    // Invalidate cache
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': process.env.API_SECRET!
      },
      body: JSON.stringify({ tags: ['products'] })
    }).catch(() => {}); // Ignore errors

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'SLUG_TAKEN') {
      return NextResponse.json({ ok: false, code: 'SLUG_TAKEN' }, { status: 409 });
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
