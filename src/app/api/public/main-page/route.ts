// src/app/api/public/main-page/route.ts
// Public API endpoint to get main page sections with translations
// This endpoint is used by the main website to fetch section data

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'uk';

    const sections = await prisma.mainPageSection.findMany({
      where: {
        isVisible: true,
        // Exclude navigation and footer - they have separate endpoints
        key: { notIn: ['navigation', 'footer'] },
      },
      orderBy: { position: 'asc' },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    // Transform data based on locale
    const result = sections.map((section) => {
      const items: Record<string, string> = {};
      
      section.items.forEach((item) => {
        // Use English value if locale is 'en' and English value exists, otherwise use Ukrainian
        const value = locale === 'en' && item.valueEn ? item.valueEn : item.valueUk;
        items[item.key] = value;
      });

      return {
        key: section.key,
        position: section.position,
        items,
      };
    });

    return NextResponse.json({
      sections: result,
      locale,
    });
  } catch (error) {
    console.error('Error fetching main page sections:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}
