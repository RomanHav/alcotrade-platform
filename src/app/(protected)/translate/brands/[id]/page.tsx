import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import TranslateBrandEditor from '@/app/(protected)/translate/brands/[id]/translate-brand-editor';

export default async function TranslateBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await prisma.brand.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      translations: {
        where: { locale: 'en' },
        select: { id: true, name: true, slug: true, description: true, seoTitle: true, seoDescription: true },
      },
      _count: { select: { products: true } },
    },
  });
  if (!brand) return <div className="p-8">Not found</div>;
  return (
    <div className="flex flex-col px-8 pt-7">
      <div className="mb-9 flex flex-col gap-5">
        <div className="flex items-center gap-2.5 text-xl font-extralight">
          <Link href="/translate" className="underline underline-offset-4">
            Переклад
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <Link href="/translate/brands" className="underline underline-offset-4">
            Бренди
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <span className="opacity-80">{brand.name}</span>
        </div>
        <h1 className="text-4xl font-semibold">Переклад бренду: {brand.name}</h1>
      </div>
      <TranslateBrandEditor initial={brand as any} />
    </div>
  );
}
