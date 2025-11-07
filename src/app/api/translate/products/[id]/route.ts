// src/app/api/translate/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { slug as makeSlug } from '@/lib/slug';

function normalizeNewlines(s?: string | null) {
  return s == null ? s ?? null : s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

async function ensureUniqueProductTranslationSlug(base: string, productId: string) {
  const clean = makeSlug(base || 'product');
  let candidate = clean || 'product';
  let i = 2;
  while (
    await prisma.productTranslation.findFirst({
      where: {
        locale: 'en',
        slug: candidate,
        NOT: { productId },
      },
      select: { id: true },
    })
  ) {
    candidate = `${clean}-${i++}`;
  }
  return candidate;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      updatedAt: true,
      brand: { select: { id: true, name: true, slug: true } },
      translations: {
        where: { locale: 'en' },
        select: { id: true, name: true, slug: true, description: true, seoTitle: true, seoDescription: true },
      },
      variants: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          label: true,
          position: true,
          translations: { where: { locale: 'en' }, select: { id: true, label: true } },
        },
      },
    },
  });

  if (!product) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  return NextResponse.json({ product });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    name?: string | null;
    slug?: string | null;
    description?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    variants?: Array<{ variantId: string; label?: string | null }>;
  };

  const exists = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!exists) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  // Build partial data (name required on create). We'll ensure name fallback to original product name.
  const data: Prisma.ProductTranslationUncheckedCreateInput = {
    productId: id,
    locale: 'en',
    name: body.name || exists.name, // fallback to original name to satisfy required field
    description: normalizeNewlines(body.description ?? null),
    seoTitle: body.seoTitle ?? null,
    seoDescription: body.seoDescription ?? null,
  };

  // Handle slug input/generation
  const rawSlug = (body.slug ?? '').trim();
  if (rawSlug) {
    const cleaned = makeSlug(rawSlug);
    const conflict = await prisma.productTranslation.findFirst({
      where: { slug: cleaned, locale: 'en', NOT: { productId: id } },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ ok: false, code: 'SLUG_TAKEN' }, { status: 409 });
    }
    (data as any).slug = cleaned;
  } else if (body.name) {
    (data as any).slug = await ensureUniqueProductTranslationSlug(body.name, id);
  }

  // Upsert product translation
  const writes: Prisma.PrismaPromise<any>[] = [];
  writes.push(
    prisma.productTranslation.upsert({
      where: { productId_locale: { productId: id, locale: 'en' } },
      create: data,
      update: {
        name: data.name,
        description: data.description,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        slug: (data as any).slug,
      },
    }),
  );

  // Upsert variant translations
  const variants = Array.isArray(body.variants) ? body.variants : [];
  for (const v of variants) {
    writes.push(
      prisma.productVariantTranslation.upsert({
        where: { variantId_locale: { variantId: v.variantId, locale: 'en' } },
        create: { variantId: v.variantId, locale: 'en', label: v.label ?? null },
        update: { label: v.label ?? null },
      }),
    );
  }

  try {
    await prisma.$transaction(writes);
    return NextResponse.json({ ok: true });
  } catch (_e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
