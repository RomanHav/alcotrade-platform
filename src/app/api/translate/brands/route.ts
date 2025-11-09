// src/app/api/translate/brands/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, BrandStatus } from '@prisma/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
  const status = (searchParams.get('status') as BrandStatus | null) || undefined;
  const missingOnly = (searchParams.get('missingOnly') || 'false') === 'true';

  const where: Prisma.BrandWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(missingOnly ? { NOT: { translations: { some: { locale: 'en' } } } } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.brand.count({ where }),
    prisma.brand.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
        translations: { where: { locale: 'en' }, select: { id: true } },
        _count: { select: { products: true } },
      },
    }),
  ]);

  return NextResponse.json({
    items: items.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      status: b.status,
      updatedAt: b.updatedAt,
      hasEn: b.translations.length > 0,
      productsCount: b._count.products,
    })),
    page,
    limit,
    total,
  });
}
