// src/app/api/brands/[slug]/route.ts
import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireReadToken } from '@/lib/requireReadToken';

export async function GET(_req: Request, context: any) {
  const { params } = context as { params: { slug: string } };
  const guard = requireReadToken(_req);
  if (guard) return guard;
  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      cover: { select: { url: true, width: true, height: true, alt: true } },
      products: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          cover: { select: { url: true, width: true, height: true, alt: true } },
          variants: { select: { id: true, label: true, volumeMl: true, position: true } },
        },
      },
    },
  });

  if (!brand) return notFound();
  return NextResponse.json(brand);
}
