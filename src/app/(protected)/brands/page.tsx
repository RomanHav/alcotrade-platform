// src/app/(protected)/brands/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BrandsTable from './_components/BrandsTable';
import type { Prisma, BrandStatus } from '@prisma/client';

export const revalidate = 0;

const isStatus = (v: unknown): v is BrandStatus =>
  v === 'ACTIVE' || v === 'DRAFT' || v === 'ARCHIVE';

type SP = Record<string, string | string[] | undefined>;

export default async function BrandsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in?callbackUrl=/brands');

  const sp = await searchParams;
  const get = (k: keyof SP) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]);

  const page = Math.max(1, Number(get('page') ?? '1'));
  const pageSize = Math.min(100, Math.max(5, Number(get('pageSize') ?? '12')));
  const q = get('query');
  const status = get('status');
  const sort = get('sort');

  const where: Prisma.BrandWhereInput = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (isStatus(status)) where.status = status;

  let orderBy: Prisma.BrandOrderByWithRelationInput = { name: 'asc' };
  switch (sort) {
    case 'name_desc':
      orderBy = { name: 'desc' };
      break;
    case 'status':
      orderBy = { status: 'asc' };
      break;
    case 'updated':
    case 'updated_desc':
      orderBy = { updatedAt: 'desc' };
      break;
  }

  const [total, items, brandOptions] = await Promise.all([
    prisma.brand.count({ where }),
    prisma.brand.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
        cover: { select: { url: true, alt: true } },
      },
    }),
    prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="px-8 pt-16">
      <div className="mb-9 flex items-center justify-between">
        <h1 className="text-4xl font-semibold">Бренди</h1>
      </div>

      <BrandsTable
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        brandOptions={brandOptions}
      />
    </div>
  );
}
