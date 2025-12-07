import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import NewsList from './_components/NewsList';

export default async function TranslateNewsPage() {
  // Get all UK articles
  const ukArticles = await prisma.article.findMany({
    where: { locale: 'uk' },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      date: true,
      updatedAt: true,
      cover: { select: { url: true, alt: true } },
    },
  });

  // Find corresponding EN articles by slug
  const slugs = ukArticles.map((a) => a.slug);
  const enArticles = await prisma.article.findMany({
    where: {
      locale: 'en',
      slug: { in: slugs },
    },
    select: {
      slug: true,
    },
  });
  const enSlugsSet = new Set(enArticles.map((a) => a.slug));

  const rows = ukArticles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    status: a.status,
    date: a.date?.toISOString() || null,
    updatedAt: a.updatedAt.toISOString(),
    coverUrl: a.cover?.url || null,
    hasEn: enSlugsSet.has(a.slug),
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
