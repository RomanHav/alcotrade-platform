// src/app/api/translate/navigation/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const section = await prisma.mainPageSection.findUnique({
      where: { key: 'navigation' },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Navigation section not found' }, { status: 404 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Error fetching navigation section:', error);
    return NextResponse.json({ error: 'Failed to fetch navigation' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body as { items: { key: string; valueUk: string; valueEn: string | null }[] };

    const section = await prisma.mainPageSection.findUnique({
      where: { key: 'navigation' },
    });

    if (!section) {
      return NextResponse.json({ error: 'Navigation section not found' }, { status: 404 });
    }

    // Update items in a transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.mainPageSectionItem.upsert({
          where: {
            sectionId_key: {
              sectionId: section.id,
              key: item.key,
            },
          },
          update: {
            valueUk: item.valueUk,
            valueEn: item.valueEn,
          },
          create: {
            sectionId: section.id,
            key: item.key,
            valueUk: item.valueUk,
            valueEn: item.valueEn,
          },
        })
      )
    );

    // Fetch updated section
    const updatedSection = await prisma.mainPageSection.findUnique({
      where: { key: 'navigation' },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json({ section: updatedSection });
  } catch (error) {
    console.error('Error updating navigation:', error);
    return NextResponse.json({ error: 'Failed to update navigation' }, { status: 500 });
  }
}
