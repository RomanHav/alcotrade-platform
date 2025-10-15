// src/app/api/products/[slug]/route.ts
import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireReadToken } from '@/lib/requireReadToken';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const guard = requireReadToken(_req);
  if (guard) return guard;
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
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
      variants: {
        select: {
          id: true,
          label: true,
          volumeMl: true,
          position: true,
          image: { select: { url: true, width: true, height: true, alt: true } },
        },
        orderBy: { position: 'asc' },
      },
      status: true,
    },
  });

  if (!product || product.status !== 'ACTIVE') return notFound();
  return NextResponse.json(product);
}
