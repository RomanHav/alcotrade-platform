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

  // Get the article with its English translation
  const article = await prisma.article.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      date: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      cover: { select: { id: true, url: true, alt: true } },
      translations: {
        where: { locale: 'en' },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          seoTitle: true,
          seoDescription: true,
        },
      },
    },
  });

  if (!article) {
    notFound();
  }

  const enTranslation = article.translations[0] || null;

  const initial = {
    uk: {
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      date: article.date?.toISOString() || null,
      status: article.status,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      cover: article.cover,
    },
    en: enTranslation,
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
          <span className="opacity-80">{article.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-semibold">{article.title}</h1>
          <Link
            href={`/news/${article.id}`}
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
