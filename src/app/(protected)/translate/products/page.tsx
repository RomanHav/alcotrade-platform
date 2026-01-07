import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import ProductList from '@/app/(protected)/translate/products/_components/ProductList';

export default async function TranslateProductsPage() {
  const [products, brands] = await Promise.all([
    prisma.product.findMany({
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
    }),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status,
    updatedAt: p.updatedAt.toISOString(),
    hasEn: p.translations.length > 0,
    brandName: p.brand?.name,
  }));

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
        <h1 className="text-4xl font-semibold">Переклад продуктів</h1>
      </div>
      <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-2xl font-medium">Продукти</h2>
        <ProductList initial={rows} brands={brands} />
      </div>
    </div>
  );
}
