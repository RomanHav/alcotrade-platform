// src/app/api/translate/main-page/[sectionKey]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sectionKey: string }> }
) {
  try {
    const { sectionKey } = await params;
    
    const section = await prisma.mainPageSection.findUnique({
      where: { key: sectionKey },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json({ error: 'Failed to fetch section' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sectionKey: string }> }
) {
  try {
    const { sectionKey } = await params;
    const body = await request.json();
    const { items } = body as { items: { key: string; valueUk: string; valueEn: string | null }[] };

    const section = await prisma.mainPageSection.findUnique({
      where: { key: sectionKey },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
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

    // Update section's updatedAt
    await prisma.mainPageSection.update({
      where: { key: sectionKey },
      data: { updatedAt: new Date() },
    });

    // Return updated section
    const updatedSection = await prisma.mainPageSection.findUnique({
      where: { key: sectionKey },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json({ section: updatedSection, ok: true });
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}
