// src/app/api/translate/main-page/reorder/route.ts
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sections = await prisma.mainPageSection.findMany({
      orderBy: { position: 'asc' },
      select: {
        id: true,
        key: true,
        position: true,
        isVisible: true,
        videoUrl: true,
        videoPublicId: true,
      },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sections } = body as { sections: { id: string; position: number }[] };

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Update positions in a transaction
    await prisma.$transaction(
      sections.map((section) =>
        prisma.mainPageSection.update({
          where: { id: section.id },
          data: { position: section.position },
        })
      )
    );

    revalidateTag('sections');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error reordering sections:', error);
    return NextResponse.json({ error: 'Failed to reorder sections' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isVisible } = body as { id: string; isVisible?: boolean };

    if (!id) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    await prisma.mainPageSection.update({
      where: { id },
      data: { isVisible },
    });

    revalidateTag('sections');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
