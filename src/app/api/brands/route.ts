// src/app/api/brands/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  } catch (e) {
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}
