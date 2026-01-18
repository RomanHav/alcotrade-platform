// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';
import { extractCloudinaryPublicId } from '@/lib/cloudinary-publicid';
import sharp from 'sharp';

export const runtime = 'nodejs';

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function splitPublicId(input: string | null, defaultFolder: string) {
  if (!input) return { folder: defaultFolder, name: `unnamed_${Date.now()}` };
  const cleaned = String(input).replace(/^\/+|\/+$/g, '').trim();
  if (!cleaned) return { folder: defaultFolder, name: `unnamed_${Date.now()}` };
  const lastSlash = cleaned.lastIndexOf('/');
  if (lastSlash === -1) return { folder: defaultFolder, name: cleaned };
  const folder = cleaned.slice(0, lastSlash) || defaultFolder;
  const name = cleaned.slice(lastSlash + 1) || `unnamed_${Date.now()}`;
  return { folder, name };
}

function ensureCloudinaryCreds() {
  const hasUrl = !!process.env.CLOUDINARY_URL;
  const hasTriple =
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    !!process.env.CLOUDINARY_API_KEY &&
    !!process.env.CLOUDINARY_API_SECRET;
  if (!hasUrl && !hasTriple) {
    throw new Error(
      'Cloudinary credentials are missing. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET.',
    );
  }
}

const DEFAULT_FOLDERS: Record<string, string> = {
  article: 'Alcotrade/news',
  news: 'Alcotrade/news',
  product: 'Alcotrade/products',
  brand: 'Alcotrade/brands',
  partner: 'Alcotrade/partners',
};
const FALLBACK_FOLDER = 'Alcotrade/uploads';

const norm = (s: string) => s.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');

async function optimizeImage(buffer: Buffer, originalSize: number): Promise<Buffer> {
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const MAX_DIMENSION = 2000; // max width/height

  let sharpInstance = sharp(buffer);

  // Get metadata
  const metadata = await sharpInstance.metadata();

  let needsProcessing = false;
  let newWidth = metadata.width;
  let newHeight = metadata.height;

  // Resize if too large
  if (metadata.width! > MAX_DIMENSION || metadata.height! > MAX_DIMENSION) {
    needsProcessing = true;
    if (metadata.width! > metadata.height!) {
      newWidth = MAX_DIMENSION;
      newHeight = Math.round((metadata.height! * MAX_DIMENSION) / metadata.width!);
    } else {
      newHeight = MAX_DIMENSION;
      newWidth = Math.round((metadata.width! * MAX_DIMENSION) / metadata.height!);
    }
    sharpInstance = sharpInstance.resize(newWidth, newHeight, {
      withoutEnlargement: true,
      fit: 'inside'
    });
  }

  // Compress if too large
  if (originalSize > MAX_SIZE) {
    needsProcessing = true;
    const format = metadata.format?.toLowerCase();

    if (format === 'jpeg' || format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality: 80, progressive: true });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality: 80, compressionLevel: 6 });
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: 80 });
    } else {
      // Convert to JPEG for other formats
      sharpInstance = sharpInstance.jpeg({ quality: 80, progressive: true });
    }
  }

  if (needsProcessing) {
    return await sharpInstance.toBuffer();
  }

  return buffer; // Return original if no processing needed
}

export async function POST(req: Request) {
  try {
    ensureCloudinaryCreds();

    const form = await req.formData();
    const file = form.get('file');
    const alt = form.get('alt')?.toString() || null;

    const rawEntity = form.get('entity')?.toString() || null;
    const entity = rawEntity?.toLowerCase() ?? null;

    const articleId = form.get('articleId')?.toString() || null;
    const productId = form.get('productId')?.toString() || null;
    const brandId = form.get('brandId')?.toString() || null;

    const attach = form.get('attach')?.toString() as 'cover' | 'gallery' | undefined;

    // 1) явная папка из формы
    const explicitFolderRaw = form.get('folder')?.toString() || '';
    const explicitFolder = explicitFolderRaw ? norm(explicitFolderRaw) : '';

    // 2) по entity
    const fromEntity = entity ? DEFAULT_FOLDERS[entity] : undefined;

    // 3) по связанным id (если бы были)
    const fromIds =
      productId ? DEFAULT_FOLDERS.product :
      brandId   ? DEFAULT_FOLDERS.brand   :
      articleId ? DEFAULT_FOLDERS.article : undefined;

    // 4) по Referer (если прилетает из /news — считаем это news)
    let fromReferer: string | undefined;
    if (!explicitFolder && !fromEntity && !fromIds) {
      const ref = req.headers.get('referer');
      if (ref) {
        try {
          const p = new URL(ref).pathname;
          if (/\/news(\/|$)/.test(p)) fromReferer = DEFAULT_FOLDERS.news;
          else if (/\/products?(\/|$)/.test(p)) fromReferer = DEFAULT_FOLDERS.product;
          else if (/\/brands?(\/|$)/.test(p)) fromReferer = DEFAULT_FOLDERS.brand;
          else if (/\/partners?(\/|$)/.test(p)) fromReferer = DEFAULT_FOLDERS.partner;
        } catch {}
      }
    }

    let folder = norm(explicitFolder || fromEntity || fromIds || fromReferer || FALLBACK_FOLDER);

    // publicId: если без слеша — не трогаем папку
    const publicIdRaw = form.get('publicId')?.toString() || null;
    let forcedPublicName: string | undefined;
    if (publicIdRaw) {
      const cleaned = norm(publicIdRaw);
      if (cleaned.includes('/')) {
        const split = splitPublicId(cleaned, folder);
        folder = norm(split.folder);
        forcedPublicName = split.name;
      } else {
        forcedPublicName = cleaned;
      }
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: 'Файл не передано' }, { status: 400 });
    }

    // Check file size (client should compress, but double-check)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (reduced since client compresses)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        ok: false, 
        error: `Файл слишком большой. Максимальный размер: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB` 
      }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Optimize image if needed
    const optimizedBuffer = await optimizeImage(buffer, file.size);

    const uploaded = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
      format?: string;
    }>((resolve, reject) => {
      const opts: any = { folder, resource_type: 'image', overwrite: true, invalidate: true };
      if (forcedPublicName) opts.public_id = forcedPublicName;
      const stream = cloudinary.uploader.upload_stream(opts, (error, result) => {
        if (error || !result) return reject(error || new Error('Cloudinary upload failed'));
        resolve({
          secure_url: result.secure_url!,
          public_id: result.public_id!,
          width: result.width!,
          height: result.height!,
          format: result.format,
        });
      });
      stream.end(optimizedBuffer);
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

    let attached: {
      entity?: 'article' | 'product' | 'brand';
      type?: 'cover' | 'gallery';
      position?: number;
    } | null = null;

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

    if (brandId && attach === 'cover') {
      await prisma.brand.update({ where: { id: brandId }, data: { coverId: media.id } });
      attached = { entity: 'brand', type: 'cover' };
    }

    return NextResponse.json(
      { ok: true, media, cloudinary: { publicId: uploaded.public_id }, attached, folder },
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
    let publicId = searchParams.get('public_id') || undefined;
    const mediaId = searchParams.get('mediaId') || undefined;

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

    if (!publicId && mediaId) {
      const media = await prisma.mediaAsset.findUnique({
        where: { id: mediaId },
        select: { url: true },
      });
      if (media?.url) {
        const extracted = extractCloudinaryPublicId(media.url);
        if (extracted) publicId = extracted;
      }
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
        prisma.productVariant.updateMany({ where: { imageId: mediaId }, data: { imageId: null } }),
        prisma.productImage.deleteMany({ where: { mediaId } }),
        prisma.brand.updateMany({ where: { coverId: mediaId }, data: { coverId: null } }),
        prisma.article.updateMany({ where: { coverId: mediaId }, data: { coverId: null } }),
        prisma.articleImage.deleteMany({ where: { mediaId } }),
        prisma.mediaAsset.deleteMany({ where: { id: mediaId } }),
      ]);
    }

    return NextResponse.json({ ok: true, cloud }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Помилка видалення';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
