// src/app/(protected)/brands/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BrandsTable from './_components/BrandsTable';

export const revalidate = 0;

type SP = Record<string, string | string[] | undefined>;

export default async function BrandsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in?callbackUrl=/brands');

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 25;

  const query = typeof params.query === 'string' ? params.query.trim() : undefined;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const sort = typeof params.sort === 'string' ? params.sort : undefined;

  const where: any = {};
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { slug: { contains: query, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;

  let orderBy: any = { sortOrder: 'asc' };
  if (sort === 'name_asc') orderBy = { name: 'asc' };
  else if (sort === 'name_desc') orderBy = { name: 'desc' };
  else if (sort === 'status') orderBy = { status: 'asc' };
  else if (sort === 'updated') orderBy = { updatedAt: 'desc' };

  const [brands, total, allBrands] = await Promise.all([
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
        cover: { select: { url: true, alt: true } },
      },
    }),
    prisma.brand.count({ where }),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="px-8 pt-16">
      <div className="mb-9 flex items-center justify-between">
        <h1 className="text-4xl font-semibold">Бренди</h1>
      </div>

      <BrandsTable
        items={brands}
        total={total}
        page={page}
        pageSize={pageSize}
        brandOptions={allBrands}
      />
    </div>
  );
}
