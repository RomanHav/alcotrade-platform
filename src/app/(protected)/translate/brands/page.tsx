import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import BrandList from '@/app/(protected)/translate/brands/_components/BrandList';

export default async function TranslateBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      updatedAt: true,
      translations: { where: { locale: 'en' }, select: { id: true } },
      _count: { select: { products: true } },
    },
  });
  const rows = brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    status: b.status,
    updatedAt: b.updatedAt.toISOString(),
    hasEn: b.translations.length > 0,
    productsCount: b._count.products,
  }));

  return (
    <div className="flex flex-col px-8 pt-7">
      <div className="mb-9 flex flex-col gap-5">
        <div className="flex items-center gap-2.5 text-xl font-extralight">
          <Link href="/translate" className="underline underline-offset-4">
            Переклад
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <span className="opacity-80">Бренди</span>
        </div>
        <h1 className="text-4xl font-semibold">Переклад брендів</h1>
      </div>
      <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-2xl font-medium">Бренди</h2>
        <BrandList initial={rows as any} />
      </div>
    </div>
  );
}
