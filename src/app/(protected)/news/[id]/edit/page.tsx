import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ArticleForm from '../../_components/ArticleForm';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      cover: true,
      images: {
        include: { media: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!article) notFound();

  const serverArticle = {
    id: article.id,
    status: article.status, 
    title: article.title,
    excerpt: article.excerpt ?? '',
    content: article.content ?? '',
    seoTitle: article.seoTitle ?? null,
    seoDescription: article.seoDescription ?? null,
    coverId: article.coverId ?? null,
    coverUrl: article.cover?.url ?? null,
    date: article.date ? article.date.toISOString() : null,
    slug: article.slug,
  };

  return <ArticleForm serverArticle={serverArticle} />;
}
