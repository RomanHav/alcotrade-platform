// src/app/api/products/route.ts
import { prisma } from '@/lib/prisma';
import { requireReadToken } from '@/lib/requireReadToken';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const guard = requireReadToken(req);
  if (guard) return guard;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const brandSlug = searchParams.get('brand');
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
  const status = (searchParams.get('status') as 'ACTIVE' | 'DRAFT' | 'ARCHIVE' | null) || 'ACTIVE';

  const where: any = { status };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (brandSlug) {
    const brand = await prisma.brand.findUnique({
      where: { slug: brandSlug },
      select: { id: true },
    });
    where.brandId = brand?.id || '__no__';
  }

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        brand: { select: { id: true, name: true, slug: true } },
        cover: { select: { url: true, width: true, height: true, alt: true } },
        translations: { where: { locale: 'en' }, select: { id: true, locale: true, name: true, slug: true, seoTitle: true, seoDescription: true } },
        variants: { select: { id: true, label: true, volumeMl: true, position: true } },
      },
    }),
  ]);

  return NextResponse.json({ items, page, limit, total });
}

export async function DELETE(req: Request) {
  const { ids } = (await req.json().catch(() => ({ ids: [] as string[] }))) as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ ok: true });
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ ok: true });
}
