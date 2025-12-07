// src/app/api/translate/main-page/visibility/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sectionId, isVisible } = body as { sectionId: string; isVisible: boolean };

    if (!sectionId || typeof isVisible !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const updatedSection = await prisma.mainPageSection.update({
      where: { id: sectionId },
      data: { isVisible },
    });

    return NextResponse.json({ section: updatedSection, ok: true });
  } catch (error) {
    console.error('Error updating section visibility:', error);
    return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
  }
}
