// src/app/api/sort-order/route.ts
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

const getCachedSortOrder = unstable_cache(
  async () => {
    const [products, brands] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          slug: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.brand.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          slug: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    return { products, brands };
  },
  ['sort-order-cache'],
  {
    revalidate: 3600, // 1 hour
    tags: ['sort-order'],
  }
);

export async function GET() {
  try {
    const data = await getCachedSortOrder();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching sort order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sort order' },
      { status: 500 }
    );
  }
}
