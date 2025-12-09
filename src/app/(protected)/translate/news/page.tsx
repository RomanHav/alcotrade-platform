import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import NewsList from './_components/NewsList';

export default async function TranslateNewsPage() {
  // Get all articles with their translations
  const articles = await prisma.article.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      date: true,
      updatedAt: true,
      cover: { select: { url: true, alt: true } },
      translations: {
        where: { locale: 'en' },
        select: { id: true },
      },
    },
  });

  const rows = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    status: a.status,
    date: a.date?.toISOString() || null,
    updatedAt: a.updatedAt.toISOString(),
    coverUrl: a.cover?.url || null,
    hasEn: a.translations.length > 0,
  }));

  return (
    <div className="flex flex-col px-8 pt-7">
      <div className="mb-9 flex flex-col gap-5">
        <div className="flex items-center gap-2.5 text-xl font-extralight">
          <Link href="/translate" className="underline underline-offset-4">
            Переклад
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <span className="opacity-80">Новини</span>
        </div>
        <h1 className="text-4xl font-semibold">Переклад новин</h1>
      </div>
      <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-2xl font-medium">Новини</h2>
        <NewsList initial={rows} />
      </div>
    </div>
  );
}
