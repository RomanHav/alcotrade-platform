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

    // First try to find article by slug
    const article = await prisma.article.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        slug: true,
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
        },
        translations: {
          where: { locale: 'en' },
          select: {
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

    // If not found by article slug, try to find by translation slug
    if (!article && locale === 'en') {
      const translation = await prisma.articleTranslation.findFirst({
        where: {
          slug,
          locale: 'en',
        },
        select: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
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
              },
            },
          },
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          seoTitle: true,
          seoDescription: true,
        },
      });

      if (translation && translation.article.status === 'ACTIVE') {
        // Return article with EN translation data
        return NextResponse.json({
          ...translation.article,
          locale: 'en',
          title: translation.title,
          slug: translation.slug || translation.article.slug,
          excerpt: translation.excerpt || translation.article.excerpt,
          content: translation.content || translation.article.content,
          seoTitle: translation.seoTitle || translation.article.seoTitle,
          seoDescription: translation.seoDescription || translation.article.seoDescription,
        });
      }
    }

    if (!article) {
      return NextResponse.json({ 
        error: 'Not found',
        debug: { slug, locale }
      }, { status: 404 });
    }

    // Return article with translation if locale is 'en'
    if (locale === 'en' && article.translations.length > 0) {
      const enTranslation = article.translations[0];
      return NextResponse.json({
        ...article,
        locale: 'en',
        title: enTranslation.title,
        slug: enTranslation.slug || article.slug,
        excerpt: enTranslation.excerpt || article.excerpt,
        content: enTranslation.content || article.content,
        seoTitle: enTranslation.seoTitle || article.seoTitle,
        seoDescription: enTranslation.seoDescription || article.seoDescription,
        translations: undefined,
      });
    }

    // Return original article (UK)
    return NextResponse.json({
      ...article,
      locale: 'uk',
      translations: undefined,
    });
  } catch (e: any) {
    console.error('Article API error:', e);
    return NextResponse.json({ error: e?.message ?? 'Failed' }, { status: 500 });
  }
}