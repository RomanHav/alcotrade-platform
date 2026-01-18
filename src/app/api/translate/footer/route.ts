// src/app/api/translate/footer/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const section = await prisma.mainPageSection.findUnique({
      where: { key: 'footer' },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Footer section not found' }, { status: 404 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Error fetching footer section:', error);
    return NextResponse.json({ error: 'Failed to fetch footer' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body as { items: { key: string; valueUk: string; valueEn: string | null }[] };

    const section = await prisma.mainPageSection.findUnique({
      where: { key: 'footer' },
    });

    if (!section) {
      return NextResponse.json({ error: 'Footer section not found' }, { status: 404 });
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
      where: { key: 'footer' },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json({ section: updatedSection });
  } catch (error) {
    console.error('Error updating footer:', error);
    return NextResponse.json({ error: 'Failed to update footer' }, { status: 500 });
  }
}
