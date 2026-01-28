import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function triggerRevalidate() {
  try {
    const revalidateUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/revalidate`;
    
    const response = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': process.env.API_SECRET || '',
      },
      body: JSON.stringify({
        tags: ['sort-order', 'brands'],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Revalidate failed:', response.status, errorText);
    } else {
      console.log('✅ Revalidate successful for brands');
    }
  } catch (error) {
    console.error('Failed to trigger revalidate:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const updates = orderedIds.map((id: string, index: number) =>
      prisma.brand.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);

    // Trigger revalidate after successful update
    console.log('[Brand Reorder] Updated, triggering revalidate...');
    await triggerRevalidate();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder brands:', error);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}
