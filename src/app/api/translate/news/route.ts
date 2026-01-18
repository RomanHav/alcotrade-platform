// src/app/api/translate/news/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, NewsStatus } from '@prisma/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
  const status = (searchParams.get('status') as NewsStatus | null) || undefined;
  const missingOnly = (searchParams.get('missingOnly') || 'false') === 'true';

  // Get all articles with their translations
  const whereArticle: Prisma.ArticleWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { excerpt: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    // Filter by missing translation if needed
    ...(missingOnly
      ? {
          translations: {
            none: { locale: 'en' },
          },
        }
      : {}),
  };

  const [total, articles] = await Promise.all([
    prisma.article.count({ where: whereArticle }),
    prisma.article.findMany({
      where: whereArticle,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
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
    }),
  ]);

  const items = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    status: a.status,
    date: a.date?.toISOString() || null,
    updatedAt: a.updatedAt.toISOString(),
    coverUrl: a.cover?.url || null,
    hasEn: a.translations.length > 0,
  }));

  return NextResponse.json({
    items,
    total,
    page,
    limit,
  });
}
