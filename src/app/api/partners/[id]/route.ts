import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { extractCloudinaryPublicId } from '@/lib/cloudinary-publicid';

cloudinary.config({ secure: true });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = (await req.json()) as {
      name?: string;
      link?: string | null;
      image?: string | null;
    };

    const prev = await prisma.partner.findUnique({
      where: { id },
      include: { logo: true },
    });

    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string') updates.name = body.name;
    if (typeof body.link !== 'undefined') updates.link = body.link;

    const nextImage =
      typeof body.image === 'string' && body.image.trim().length > 0
        ? body.image.trim()
        : (body.image ?? undefined);

    if (typeof nextImage !== 'undefined') {
      if (nextImage) {
        const asset = await prisma.mediaAsset.create({ data: { url: nextImage } });
        updates.logoId = asset.id;
      } else {
        updates.logoId = null;
      }
    }

    const updated = await prisma.partner.update({
      where: { id },
      data: updates,
      include: { logo: true },
    });

    if (typeof nextImage !== 'undefined') {
      const oldUrl = prev?.logo?.url ?? null;
      const newUrl = updated.logo?.url ?? null;

      const oldPublicId = extractCloudinaryPublicId(oldUrl);
      const newPublicId = extractCloudinaryPublicId(newUrl);

      if (oldPublicId && oldPublicId !== newPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
        } catch (e) {
          console.warn('Cloudinary destroy failed (old logo):', e);
        }
      }

      if (prev?.logoId && prev.logoId !== updated.logoId) {
        try {
          await prisma.mediaAsset.delete({ where: { id: prev.logoId } });
        } catch {
          /* ignore */
        }
      }
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      link: updated.link,
      image: updated.logo?.url ?? null,
    });
  } catch (e) {
    console.error('Update partner error:', e);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const partner = await prisma.partner.findUnique({
      where: { id },
      include: { logo: true },
    });

    await prisma.partner.delete({ where: { id } });

    const publicId = extractCloudinaryPublicId(partner?.logo?.url ?? null);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
      } catch (e) {
        console.warn('Cloudinary destroy failed:', e);
      }
    }

    if (partner?.logoId) {
      await prisma.mediaAsset.delete({ where: { id: partner.logoId } }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Delete partner error:', e);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
