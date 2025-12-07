// src/app/api/translate/main-page/reorder/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error reordering sections:', error);
    return NextResponse.json({ error: 'Failed to reorder sections' }, { status: 500 });
  }
}
