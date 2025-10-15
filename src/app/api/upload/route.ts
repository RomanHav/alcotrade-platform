// app/api/uploads/route.ts
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

    // ---- entity & attach params ----
    const rawEntity = form.get('entity')?.toString() || null; // 'news' | 'article' | 'product' | 'brand'
    const entity = rawEntity?.toLowerCase() ?? null;

    const articleId = form.get('articleId')?.toString() || null;
    const productId = form.get('productId')?.toString() || null;
    const brandId = form.get('brandId')?.toString() || null;

    const attach = form.get('attach')?.toString() as 'cover' | 'gallery' | undefined;

    // ---- folder resolution ----
    const explicitFolder = form.get('folder')?.toString();
    const folderByEntity =
      entity === 'news' || entity === 'article'
        ? process.env.CLOUDINARY_UPLOAD_NEWS_FOLDER || 'news'
        : entity === 'product'
          ? process.env.CLOUDINARY_UPLOAD_PRODUCT_FOLDER || 'products'
          : entity === 'brand'
            ? process.env.CLOUDINARY_UPLOAD_BRAND_FOLDER || 'brands'
            : undefined;

    const fallbackFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'Alcotrade';
    const folder = explicitFolder || folderByEntity || fallbackFolder;

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

    // ---- persist MediaAsset ----
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

    // ---- optional attach to entities ----
    let attached: {
      entity?: 'article' | 'product' | 'brand';
      type?: 'cover' | 'gallery';
      position?: number;
    } | null = null;

    // Article cover/gallery
    if (articleId && attach === 'cover') {
      await prisma.article.update({ where: { id: articleId }, data: { coverId: media.id } });
      attached = { entity: 'article', type: 'cover' };
    }
    if (articleId && attach === 'gallery') {
      const last = await prisma.articleImage.findFirst({
        where: { articleId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      const position = (last?.position ?? 0) + 1;
      await prisma.articleImage.create({ data: { articleId, mediaId: media.id, position } });
      attached = { entity: 'article', type: 'gallery', position };
    }

    // Product cover/gallery
    if (productId && attach === 'cover') {
      await prisma.product.update({ where: { id: productId }, data: { coverId: media.id } });
      attached = { entity: 'product', type: 'cover' };
    }
    if (productId && attach === 'gallery') {
      const last = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      const position = (last?.position ?? 0) + 1;
      await prisma.productImage.create({ data: { productId, mediaId: media.id, position } });
      attached = { entity: 'product', type: 'gallery', position };
    }

    // Brand cover (галереї для бренду у схемі немає)
    if (brandId && attach === 'cover') {
      await prisma.brand.update({ where: { id: brandId }, data: { coverId: media.id } });
      attached = { entity: 'brand', type: 'cover' };
    }

    return NextResponse.json(
      {
        ok: true,
        media,
        cloudinary: { publicId: uploaded.public_id },
        attached,
        folder,
      },
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

    // м’яке відв’язування з однієї статті (галерея)
    const detachOnly = searchParams.get('detachOnly') === 'true';
    const articleId = searchParams.get('articleId') || undefined;

    if (detachOnly && articleId && mediaId) {
      await prisma.articleImage.deleteMany({ where: { articleId, mediaId } });
      return NextResponse.json({ ok: true, detached: true }, { status: 200 });
    }

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
        // products / variants / product gallery
        prisma.product.updateMany({ where: { coverId: mediaId }, data: { coverId: null } }),
        prisma.productVariant.updateMany({ where: { imageId: mediaId }, data: { imageId: null } }),
        prisma.productImage.deleteMany({ where: { mediaId } }),
        // brands
        prisma.brand.updateMany({ where: { coverId: mediaId }, data: { coverId: null } }),
        // articles
        prisma.article.updateMany({ where: { coverId: mediaId }, data: { coverId: null } }),
        prisma.articleImage.deleteMany({ where: { mediaId } }),
        // media
        prisma.mediaAsset.deleteMany({ where: { id: mediaId } }),
      ]);
    }

    return NextResponse.json({ ok: true, cloud }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Помилка видалення';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
