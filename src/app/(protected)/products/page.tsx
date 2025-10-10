// app/(protected)/products/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductsTable from './_components/ProductsTable';
import { Prisma, ProductStatus } from '@prisma/client';

export const revalidate = 0;

const isStatus = (v: unknown): v is ProductStatus =>
  v === 'ACTIVE' || v === 'DRAFT' || v === 'ARCHIVE';

const isSort = (
  v: unknown,
): v is 'name_asc' | 'name_desc' | 'brand' | 'status' | 'updated_desc' | 'created_desc' =>
  v === 'name_asc' ||
  v === 'name_desc' ||
  v === 'brand' ||
  v === 'status' ||
  v === 'updated_desc' ||
  v === 'created_desc';

type SP = Record<string, string | string[] | undefined>;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in?callbackUrl=/products');

  const sp = await searchParams;
  const get = (k: keyof SP) => {
    const v = sp[k as string];
    return Array.isArray(v) ? v[0] : v;
  };

  const page = Math.max(1, Number(get('page') ?? '1'));
  const pageSize = Math.min(100, Math.max(5, Number(get('pageSize') ?? '12')));

  const where: Prisma.ProductWhereInput = {};
  const q = get('query');
  const brand = get('brand');
  const status = get('status');
  const sort = get('sort');

  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (brand) where.brand = { slug: brand };
  if (isStatus(status)) where.status = status;

  let orderBy: Prisma.ProductOrderByWithRelationInput = { name: 'asc' };
  if (isSort(sort)) {
    switch (sort) {
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'brand':
        orderBy = { brand: { name: 'asc' } };
        break;
      case 'status':
        orderBy = { status: 'asc' };
        break;
      case 'updated_desc':
        orderBy = { updatedAt: 'desc' };
        break;
      case 'created_desc':
        orderBy = { createdAt: 'desc' };
        break;
    }
  }

  const [total, items, brands] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
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
        brand: { select: { id: true, name: true, slug: true } },
        cover: { select: { url: true, alt: true } },
      },
    }),
    prisma.brand.findMany({ select: { id: true, name: true, slug: true } }),
  ]);

  return (
    <div className="px-8 pt-16">
      <div className="mb-9 flex items-center justify-between">
        <h1 className="text-4xl font-semibold">Продукти</h1>
      </div>
      <ProductsTable items={items} total={total} page={page} brands={brands} />
    </div>
  );
}
