import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import TranslateEditor from './translate-editor';

export default async function TranslateProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      brand: { select: { id: true, name: true, slug: true } },
      translations: {
        where: { locale: 'en' },
        select: { id: true, name: true, slug: true, description: true, seoTitle: true, seoDescription: true },
      },
      variants: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          label: true,
          position: true,
          translations: { where: { locale: 'en' }, select: { id: true, label: true } },
        },
      },
    },
  });

  if (!product) return <div className="p-8">Not found</div>;

  return (
    <div className="flex flex-col px-8 pt-7">
      <div className="mb-9 flex flex-col gap-5">
        <div className="flex items-center gap-2.5 text-xl font-extralight">
          <Link href="/translate" className="underline underline-offset-4">
            Переклад
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <Link href="/translate/products" className="underline underline-offset-4">
            Продукти
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <span className="opacity-80">{product.name}</span>
        </div>
        <h1 className="text-4xl font-semibold">Переклад: {product.name}</h1>
      </div>
      <TranslateEditor initial={product} />
    </div>
  );
}
