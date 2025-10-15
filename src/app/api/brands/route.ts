// src/app/api/brands/route.ts
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireReadToken } from '@/lib/requireReadToken';

export async function GET(req: Request) {
  const guard = requireReadToken(req);
  if (guard) return guard;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
  const status = (searchParams.get('status') as 'ACTIVE' | 'DRAFT' | 'ARCHIVE' | null) || 'ACTIVE';

  const where: Prisma.BrandWhereInput = {
    status,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.brand.count({ where }),
    prisma.brand.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        seoTitle: true,
        seoDescription: true,
        cover: { select: { url: true, width: true, height: true, alt: true } },
        _count: { select: { products: true } },
      },
    }),
  ]);

  return NextResponse.json({ items, page, limit, total });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    ids,
    mode = 'restrict',
    reassignToId,
  } = body as {
    ids?: string[];
    mode?: 'restrict' | 'reassign' | 'cascade';
    reassignToId?: string;
  };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ message: 'No ids' }, { status: 400 });
  }

  const existing = await prisma.brand.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  if (existing.length !== ids.length) {
    return NextResponse.json({ message: 'Some brands not found' }, { status: 404 });
  }

  const conflicts = await prisma.product.groupBy({
    by: ['brandId'],
    where: { brandId: { in: ids } },
    _count: { _all: true },
  });

  if (conflicts.length && mode === 'restrict') {
    return NextResponse.json(
      {
        code: 'HAS_PRODUCTS',
        conflicts: conflicts.map((c) => ({ id: c.brandId, count: c._count._all })),
      },
      { status: 409 },
    );
  }

  try {
    if (mode === 'reassign') {
      if (!reassignToId || ids.includes(reassignToId)) {
        return NextResponse.json({ message: 'Invalid reassign target' }, { status: 400 });
      }
      const target = await prisma.brand.findUnique({
        where: { id: reassignToId },
        select: { id: true },
      });
      if (!target)
        return NextResponse.json({ message: 'Reassign target not found' }, { status: 404 });

      await prisma.$transaction(async (tx) => {
        await tx.product.updateMany({
          where: { brandId: { in: ids } },
          data: { brandId: reassignToId },
        });
        await tx.brand.deleteMany({ where: { id: { in: ids } } });
      });
    } else if (mode === 'cascade') {
      await prisma.$transaction(async (tx) => {
        await tx.product.deleteMany({ where: { brandId: { in: ids } } });
        await tx.brand.deleteMany({ where: { id: { in: ids } } });
      });
    } else {
      await prisma.brand.deleteMany({ where: { id: { in: ids } } });
    }

    return NextResponse.json({ ok: true });
  } catch (_e) {
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}
