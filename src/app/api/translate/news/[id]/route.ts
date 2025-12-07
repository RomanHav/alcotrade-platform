// src/app/api/translate/news/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (!ukArticle) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
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

  return NextResponse.json({
    uk: ukArticle,
    en: enArticle,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, slug, content, seoTitle, seoDescription } = body;

  // Get the UK article to get its slug and other metadata
  const ukArticle = await prisma.article.findUnique({
    where: { id },
    select: {
      slug: true,
      date: true,
      status: true,
      coverId: true,
    },
  });

  if (!ukArticle) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const enSlug = slug?.trim() || ukArticle.slug;

  // Check if slug is taken by another EN article
  const existingEn = await prisma.article.findFirst({
    where: {
      slug: enSlug,
      locale: 'en',
      NOT: {
        slug: ukArticle.slug, // Allow same slug as UK
      },
    },
  });

  if (existingEn && existingEn.slug !== ukArticle.slug) {
    return NextResponse.json({ error: 'slug_taken' }, { status: 409 });
  }

  // Find or create EN article
  const existingEnArticle = await prisma.article.findFirst({
    where: {
      slug: ukArticle.slug,
      locale: 'en',
    },
  });

  if (existingEnArticle) {
    // Update existing EN article
    await prisma.article.update({
      where: { id: existingEnArticle.id },
      data: {
        title: title?.trim() || existingEnArticle.title,
        slug: enSlug,
        content: content?.trim() || null,
        seoTitle: seoTitle?.trim() || null,
        seoDescription: seoDescription?.trim() || null,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new EN article
    await prisma.article.create({
      data: {
        title: title?.trim() || '',
        slug: enSlug,
        content: content?.trim() || null,
        date: ukArticle.date,
        status: ukArticle.status,
        seoTitle: seoTitle?.trim() || null,
        seoDescription: seoDescription?.trim() || null,
        locale: 'en',
        coverId: ukArticle.coverId,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
