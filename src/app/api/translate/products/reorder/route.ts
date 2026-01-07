import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const updates = orderedIds.map((id: string, index: number) =>
      prisma.product.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder products:', error);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}
