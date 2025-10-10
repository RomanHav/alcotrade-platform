import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductList from './_components/ProductList';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export default async function ProductTranslate() {
  const where: Prisma.ProductWhereInput = {};

  const [items, brands] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
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
    <div className="flex flex-col px-8 pt-7">
      <div className="mb-9 flex flex-col gap-5">
        <div className="flex items-center gap-2.5 text-xl font-extralight">
          <Link href="/translate" className="underline underline-offset-4">
            Переклад
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <span className="opacity-80">Продукти</span>
        </div>
        <h1 className="text-4xl font-semibold">Переклад</h1>
      </div>
      <div className="flex flex-col gap-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-2xl font-medium">Продукти</h2>
        <ProductList />
      </div>
    </div>
  );
}
