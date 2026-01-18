// src/app/api/public/navigation/route.ts
// Public API endpoint to get navigation items with translations
// This endpoint is used by the main website to fetch navigation data

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'uk';

    const section = await prisma.mainPageSection.findUnique({
      where: { key: 'navigation' },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Navigation not found' }, { status: 404 });
    }

    // Transform data based on locale
    const items = section.items.map((item) => ({
      key: item.key,
      label: locale === 'en' && item.valueEn ? item.valueEn : item.valueUk,
    }));

    return NextResponse.json({
      items,
      locale,
    }, { headers: { 'x-next-cache-tags': 'navigation' } });
  } catch (error) {
    console.error('Error fetching navigation:', error);
    return NextResponse.json({ error: 'Failed to fetch navigation' }, { status: 500 });
  }
}
