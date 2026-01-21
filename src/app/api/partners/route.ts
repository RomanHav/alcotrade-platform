import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateCache } from '@/lib/revalidate';

export async function GET() {
  const rows = await prisma.partner.findMany({
    include: { logo: true },
    orderBy: { createdAt: 'desc' },
  });

  const data = rows.map((p) => ({
    id: p.id,
    name: p.name,
    link: p.link,
    image: p.logo?.url ?? null,
  }));

  return NextResponse.json(data, {
    headers: { 'x-next-cache-tags': 'partners' }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, link, image } = (body ?? {}) as {
      name?: string;
      link?: string | null;
      image?: string | null;
    };

    const safeName = typeof name === 'string' ? name.trim() : '';
    if (!safeName) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const safeLink = typeof link === 'string' && link.trim().length > 0 ? link.trim() : null;
    const safeImage = typeof image === 'string' && image.trim().length > 0 ? image.trim() : null;

    let logoId: string | null = null;
    if (safeImage) {
      const asset = await prisma.mediaAsset.create({
        data: { url: safeImage },
      });
      logoId = asset.id;
    }

    const created = await prisma.partner.create({
      data: {
        name: safeName,
        link: safeLink,
        logoId,
      },
      include: { logo: true },
    });

    return NextResponse.json(
      {
        id: created.id,
        name: created.name,
        link: created.link,
        image: created.logo?.url ?? null,
      },
      { status: 201 },
    );

    // Invalidate cache
    await revalidateCache(['partners'], 'partners');

  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Link must be unique' }, { status: 409 });
    }
    console.error('Create partner error:', e);
    return NextResponse.json({ error: 'Create failed' }, { status: 500 });
  }
}
