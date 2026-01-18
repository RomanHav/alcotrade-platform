// src/app/api/translate/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const missingOnly = searchParams.get('missingOnly') === 'true';
    const status = searchParams.get('status');
    const brandId = searchParams.get('brandId');

    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (missingOnly) {
      where.translations = {
        none: { locale: 'en' },
      };
    }

    if (status) {
      where.status = status;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
        translations: { where: { locale: 'en' }, select: { id: true } },
        brand: { select: { name: true } },
      },
      take: 100,
    });

    const items = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      updatedAt: p.updatedAt.toISOString(),
      hasEn: p.translations.length > 0,
      brandName: p.brand?.name,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
