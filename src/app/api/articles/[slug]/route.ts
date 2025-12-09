// app/api/articles/[slug]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'uk';

    const article = await prisma.article.findFirst({
      where: {
        slug,
        locale,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        locale: true,
        excerpt: true,
        content: true,
        date: true,
        publishedAt: true,
        status: true,
        seoTitle: true,
        seoDescription: true,
        createdAt: true,
        updatedAt: true,
        cover: { 
          select: { 
            id: true, 
            url: true, 
            alt: true,
            width: true,
            height: true,
          } 
        },
        images: {
          select: {
            position: true,
            media: {
              select: {
                url: true,
                alt: true,
                width: true,
                height: true,
              }
            }
          },
          orderBy: { position: 'asc' }
        }
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed' }, { status: 500 });
  }
}