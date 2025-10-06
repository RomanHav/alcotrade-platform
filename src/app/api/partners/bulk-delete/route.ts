import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { extractCloudinaryPublicId } from '@/lib/cloudinary-publicid';

cloudinary.config({ secure: true });

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

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids = (body?.ids as string[]) ?? [];

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids is required (non-empty array)' }, { status: 400 });
    }

    const partners = await prisma.partner.findMany({
      where: { id: { in: ids } },
      include: { logo: true },
    });

    if (partners.length === 0) {
      return NextResponse.json({ ok: true, requested: ids.length, deleted: 0 });
    }

    const mediaIdsToDelete = partners.map((p) => p.logoId).filter((v): v is string => Boolean(v));

    const publicIds = partners
      .map((p) => extractCloudinaryPublicId(p.logo?.url ?? null))
      .filter((v): v is string => Boolean(v));

    await prisma.$transaction(async (tx) => {
      await tx.partner.deleteMany({ where: { id: { in: ids } } });
      if (mediaIdsToDelete.length) {
        await tx.mediaAsset.deleteMany({ where: { id: { in: mediaIdsToDelete } } });
      }
    });

    if (publicIds.length) {
      await Promise.allSettled(
        publicIds.map((pid) => cloudinary.uploader.destroy(pid, { invalidate: true })),
      );
    }

    return NextResponse.json({
      ok: true,
      requested: ids.length,
      deleted: partners.length,
    });
  } catch (e) {
    console.error('Bulk delete error:', e);
    return NextResponse.json({ error: 'Bulk delete failed' }, { status: 500 });
  }
}
