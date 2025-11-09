// src/app/api/products/[slug]/route.ts
import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireReadToken } from '@/lib/requireReadToken';

export async function GET(_req: Request, context: any) {
  const { slug } = await context.params;
  const guard = requireReadToken(_req);
  if (guard) return guard;
  const product = await prisma.product.findUnique({
    where: { slug, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      brand: { select: { id: true, name: true, slug: true } },
      cover: { select: { url: true, width: true, height: true, alt: true } },
      images: {
        select: {
          position: true,
          media: { select: { url: true, width: true, height: true, alt: true } },
        },
        orderBy: { position: 'asc' },
      },
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
      variants: {
        select: {
          id: true,
          label: true,
          volumeMl: true,
          position: true,
          image: { select: { url: true, width: true, height: true, alt: true } },
          translations: { where: { locale: 'en' }, select: { id: true, locale: true, label: true } },
        },
        orderBy: { position: 'asc' },
      },
      status: true,
    },
  });

  if (!product || product.status !== 'ACTIVE') return notFound();
  return NextResponse.json(product);
}
