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

  // Get all UK articles
  const whereUk: Prisma.ArticleWhereInput = {
    locale: 'uk',
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
  };

  const [total, ukArticles] = await Promise.all([
    prisma.article.count({ where: whereUk }),
    prisma.article.findMany({
      where: whereUk,
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
      },
    }),
  ]);

  // Find corresponding EN articles by slug
  const slugs = ukArticles.map((a) => a.slug);
  const enArticles = await prisma.article.findMany({
    where: {
      locale: 'en',
      slug: { in: slugs },
    },
    select: {
      slug: true,
      id: true,
    },
  });
  const enSlugsSet = new Set(enArticles.map((a) => a.slug));

  let items = ukArticles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    status: a.status,
    date: a.date?.toISOString() || null,
    updatedAt: a.updatedAt.toISOString(),
    coverUrl: a.cover?.url || null,
    hasEn: enSlugsSet.has(a.slug),
  }));

  // Filter by missing EN if needed
  if (missingOnly) {
    items = items.filter((a) => !a.hasEn);
  }

  return NextResponse.json({
    items,
    total: missingOnly ? items.length : total,
    page,
    limit,
  });
}
