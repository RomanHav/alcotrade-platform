// src/app/api/translate/main-page/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sections = await prisma.mainPageSection.findMany({
  orderBy: { position: 'asc' },
  select: {
    id: true,
    key: true,
    position: true,
    videoUrl: true,
    videoPublicId: true,
    items: {
      orderBy: { position: 'asc' },
      select: {
        id: true,
        key: true,
        position: true,
      },
    },
  },
});

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching main page sections:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}
