import Link from 'next/link';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TranslateNewsEditor from './translate-news-editor';

export default async function TranslateNewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Get the UK article
  const ukArticle = await prisma.article.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      date: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      cover: { select: { id: true, url: true, alt: true } },
      locale: true,
    },
  });

  if (!ukArticle || ukArticle.locale !== 'uk') {
    notFound();
  }

  // Find corresponding EN article by slug
  const enArticle = await prisma.article.findFirst({
    where: {
      slug: ukArticle.slug,
      locale: 'en',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      seoTitle: true,
      seoDescription: true,
    },
  });

  const initial = {
    uk: {
      ...ukArticle,
      date: ukArticle.date?.toISOString() || null,
    },
    en: enArticle,
  };

  return (
    <div className="flex flex-col px-8 pt-7">
      <div className="mb-9 flex flex-col gap-5">
        <div className="flex items-center gap-2.5 text-xl font-extralight">
          <Link href="/translate" className="underline underline-offset-4">
            Переклад
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <Link href="/translate/news" className="underline underline-offset-4">
            Новини
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <span className="opacity-80">{ukArticle.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-semibold">{ukArticle.title}</h1>
          <Link
            href={`/news/${ukArticle.id}`}
            target="_blank"
            className="text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
            title="Відкрити в редакторі"
          >
            <ExternalLink className="h-5 w-5" />
          </Link>
        </div>
      </div>
      <TranslateNewsEditor initial={initial} />
    </div>
  );
}
