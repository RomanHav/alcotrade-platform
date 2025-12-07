import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, ctx: any) {
  const { id } = await ctx.params;
  const brand = await prisma.brand.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      translations: {
        where: { locale: 'en' },
        select: {
          id: true,
          locale: true,
          name: true,
          slug: true,
          description: true,
          seoTitle: true,
          seoDescription: true,
        },
      },
      _count: { select: { products: true } },
    },
  });
  if (!brand) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(brand);
}

export async function POST(req: Request, ctx: any) {
  const { id } = await ctx.params;
  const data = (await req.json().catch(() => ({}))) as {
    name?: string | null;
    slug?: string | null;
    description?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };

  const brand = await prisma.brand.findUnique({ where: { id }, select: { id: true, name: true, slug: true } });
  if (!brand) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const description = data.description?.replace(/\r\n/g, '\n') ?? null;

  if (data.slug) {
    const existingSlug = await prisma.brandTranslation.findFirst({
      where: { slug: data.slug, locale: 'en', NOT: { brandId: id } },
      select: { id: true },
    });
    if (existingSlug) return NextResponse.json({ message: 'slug_taken' }, { status: 409 });
  }

  await prisma.brandTranslation.upsert({
    where: { brandId_locale: { brandId: id, locale: 'en' } },
    create: {
      brandId: id,
      locale: 'en',
      name: data.name?.trim() || brand.name,
      slug: data.slug?.trim() || null,
      description,
      seoTitle: data.seoTitle?.trim() || null,
      seoDescription: data.seoDescription?.trim() || null,
    },
    update: {
      name: data.name?.trim() || brand.name,
      slug: data.slug?.trim() || null,
      description,
      seoTitle: data.seoTitle?.trim() || null,
      seoDescription: data.seoDescription?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}
