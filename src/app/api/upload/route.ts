import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const alt = form.get('alt')?.toString() || null;
    const folder =
      form.get('folder')?.toString() || process.env.CLOUDINARY_UPLOAD_FOLDER || 'Alcotrade';

    if (!(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: 'Файл не передано' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploaded = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
      format?: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', overwrite: true },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({
            secure_url: result.secure_url!,
            public_id: result.public_id!,
            width: result.width!,
            height: result.height!,
            format: result.format,
          });
        },
      );
      stream.end(buffer);
    });

    const media = await prisma.mediaAsset.create({
      data: {
        url: uploaded.secure_url,
        alt,
        width: uploaded.width,
        height: uploaded.height,
        mimeType: uploaded.format ? `image/${uploaded.format}` : null,
      },
      select: { id: true, url: true, alt: true, width: true, height: true, mimeType: true },
    });

    return NextResponse.json(
      { ok: true, media, cloudinary: { publicId: uploaded.public_id } },
      { status: 201 },
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Помилка завантаження';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('public_id') || undefined;
    const mediaId = searchParams.get('mediaId') || undefined;

    if (!publicId && !mediaId) {
      return NextResponse.json(
        { ok: false, error: 'public_id або mediaId обовʼязковий' },
        { status: 400 },
      );
    }

    let cloud: unknown = null;
    if (publicId) {
      try {
        cloud = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch {}
    }

    if (mediaId) {
      await prisma.$transaction([
        prisma.product.updateMany({ where: { coverId: mediaId }, data: { coverId: null } }),
        prisma.brand.updateMany({ where: { coverId: mediaId }, data: { coverId: null } }),
        prisma.productVariant.updateMany({ where: { imageId: mediaId }, data: { imageId: null } }),
        prisma.productImage.deleteMany({ where: { mediaId } }),
        prisma.mediaAsset.deleteMany({ where: { id: mediaId } }),
      ]);
    }

    return NextResponse.json({ ok: true, cloud }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Помилка видалення';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
