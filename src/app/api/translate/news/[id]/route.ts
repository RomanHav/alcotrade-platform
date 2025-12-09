// src/app/api/translate/news/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get the article with its translation
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
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const enTranslation = article.translations[0] || null;

  return NextResponse.json({
    uk: {
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      date: article.date,
      status: article.status,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      cover: article.cover,
    },
    en: enTranslation,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, slug, excerpt, content, seoTitle, seoDescription } = body;

  // Get the article
  const article = await prisma.article.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const enSlug = slug?.trim() || null;

  // Check if slug is taken by another translation
  if (enSlug) {
    const existingSlug = await prisma.articleTranslation.findFirst({
      where: {
        slug: enSlug,
        locale: 'en',
        NOT: { articleId: id },
      },
    });

    if (existingSlug) {
      return NextResponse.json({ error: 'slug_taken' }, { status: 409 });
    }
  }

  // Upsert translation
  await prisma.articleTranslation.upsert({
    where: {
      articleId_locale: {
        articleId: id,
        locale: 'en',
      },
    },
    create: {
      articleId: id,
      locale: 'en',
      title: title?.trim() || '',
      slug: enSlug,
      excerpt: excerpt?.trim() || null,
      content: content?.trim() || null,
      seoTitle: seoTitle?.trim() || null,
      seoDescription: seoDescription?.trim() || null,
    },
    update: {
      title: title?.trim() || '',
      slug: enSlug,
      excerpt: excerpt?.trim() || null,
      content: content?.trim() || null,
      seoTitle: seoTitle?.trim() || null,
      seoDescription: seoDescription?.trim() || null,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
