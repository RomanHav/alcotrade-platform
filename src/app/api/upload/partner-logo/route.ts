import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';

cloudinary.config({ secure: true });

function splitPublicId(input: string | null): { folder: string; name: string } {
  const DEFAULT_FOLDER = process.env.CLOUDINARY_UPLOAD_PARTNER_FOLDER as string;
  if (!input) return { folder: DEFAULT_FOLDER, name: `unnamed_${Date.now()}` };

  const cleaned = input.replace(/^\/+|\/+$/g, '').trim();
  if (!cleaned) return { folder: DEFAULT_FOLDER, name: `unnamed_${Date.now()}` };

  const lastSlash = cleaned.lastIndexOf('/');
  if (lastSlash === -1) {
    return { folder: DEFAULT_FOLDER, name: cleaned };
  }
  const folder = cleaned.slice(0, lastSlash) || DEFAULT_FOLDER;
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

export async function POST(req: Request) {
  try {
    ensureCloudinaryCreds();

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const publicIdRaw = (form.get('publicId') as string | null) ?? null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const { folder, name } = splitPublicId(publicIdRaw);

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:${file.type || 'image/png'};base64,${base64}`;

    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder,
      public_id: name,
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    });

    return NextResponse.json({
      url: uploaded.secure_url as string,
      publicId: uploaded.public_id as string,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
      version: uploaded.version,
    });
  } catch (e: any) {
    console.error('Cloudinary upload error:', e);
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      { error: 'Upload failed', detail: isDev ? String(e?.message ?? e) : undefined },
      { status: 500 },
    );
  }
}
