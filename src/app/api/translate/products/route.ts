// src/app/api/translate/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, ProductStatus } from '@prisma/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
  const status = (searchParams.get('status') as ProductStatus | null) || undefined;
  const brandId = searchParams.get('brandId') || undefined;
  const missingOnly = (searchParams.get('missingOnly') || 'false') === 'true';

  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(brandId ? { brandId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(missingOnly
      ? { NOT: { translations: { some: { locale: 'en' } } } }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
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
        brand: { select: { id: true, name: true, slug: true } },
        translations: { where: { locale: 'en' }, select: { id: true } },
        _count: { select: { variants: true } },
      },
    }),
  ]);

  return NextResponse.json({
    items: items.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      updatedAt: p.updatedAt,
      brand: p.brand,
      hasEn: p.translations.length > 0,
      variantsCount: p._count.variants,
    })),
    page,
    limit,
    total,
  });
}
