// src/app/api/public/footer/route.ts
// Public API endpoint to get footer items with translations
// This endpoint is used by the main website to fetch footer data

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'uk';

    const section = await prisma.mainPageSection.findUnique({
      where: { key: 'footer' },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Footer not found' }, { status: 404 });
    }

    // Transform data to key-value object based on locale
    const items: Record<string, string> = {};
    section.items.forEach((item) => {
      items[item.key] = locale === 'en' && item.valueEn ? item.valueEn : item.valueUk;
    });

    return NextResponse.json({
      items,
      locale,
    });
  } catch (error) {
    console.error('Error fetching footer:', error);
    return NextResponse.json({ error: 'Failed to fetch footer' }, { status: 500 });
  }
}
