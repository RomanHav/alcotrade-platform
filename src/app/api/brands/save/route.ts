import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { BrandStatus, Prisma } from '@prisma/client';
import { slug as makeSlug } from '@/lib/slug';

type SaveBrandInput = {
  id?: string;
  name: string;
  status: BrandStatus;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  coverId?: string | null;
  slug?: string | null;
};

async function ensureUniqueBrandSlug(
  tx: Prisma.TransactionClient,
  base: string,
  excludeId?: string,
): Promise<string> {
  const clean = makeSlug(base || 'brand');
  let candidate = clean || 'brand';
  let i = 2;
  while (
    await tx.brand.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${clean}-${i++}`;
  }
  return candidate;
}

export async function POST(req: Request) {
  const data: SaveBrandInput = await req.json();

  try {
    if (data.id) {
      const { id, slug, ...rest } = data;

      await prisma.$transaction(async (tx) => {
        let nextSlug: string | undefined;
        const raw = (slug ?? '').trim();
        if (raw) {
          const cleaned = makeSlug(raw);
          const taken = await tx.brand.findFirst({
            where: { slug: cleaned, id: { not: id } },
            select: { id: true },
          });
          if (taken) throw new Error('SLUG_TAKEN');
          nextSlug = cleaned;
        }

        await tx.brand.update({
          where: { id },
          data: {
            ...rest,
            ...(typeof nextSlug === 'string' ? { slug: nextSlug } : {}),
          },
        });
      });
    } else {
      const { slug, ...rest } = data;

      await prisma.$transaction(async (tx) => {
        const raw = (slug ?? '').trim();
        let nextSlug: string;
        if (raw) {
          const cleaned = makeSlug(raw);
          const taken = await tx.brand.findFirst({
            where: { slug: cleaned },
            select: { id: true },
          });
          if (taken) throw new Error('SLUG_TAKEN');
          nextSlug = cleaned;
        } else {
          nextSlug = await ensureUniqueBrandSlug(tx, rest.name);
        }

        await tx.brand.create({
          data: { ...rest, slug: nextSlug },
        });
      });
    }

    // Invalidate cache
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': process.env.API_SECRET!
      },
      body: JSON.stringify({ tags: ['brands'] })
    }).catch(() => {}); // Ignore errors

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'SLUG_TAKEN') {
      return NextResponse.json({ ok: false, code: 'SLUG_TAKEN' }, { status: 409 });
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
