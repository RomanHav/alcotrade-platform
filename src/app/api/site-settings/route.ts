// src/app/api/site-settings/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { revalidateTag } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

cloudinary.config({ secure: true });

function envRequired(key: string): string {
  const v = process.env[key];
  if (!v || v.trim() === '') {
    throw new Error(`Missing required env: ${key}`);
  }
  return v;
}
function envIntRequired(key: string): number {
  const raw = envRequired(key);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) throw new Error(`Env ${key} must be an integer`);
  return n;
}

const DEFAULT_ID = envIntRequired('SITE_SETTINGS_DEFAULT_ID');
const MAX_TITLE = envIntRequired('SEO_MAX_TITLE');
const MAX_DESC = envIntRequired('SEO_MAX_DESC');
const MAX_SUFFIX = envIntRequired('SEO_MAX_SUFFIX');
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const TITLE_SUFFIX_DEFAULT = envRequired('SEO_TITLE_SUFFIX_DEFAULT');

const OG_FOLDER = envRequired('CLOUDINARY_SEO_FOLDER');
const OG_BASENAME = envRequired('CLOUDINARY_SEO_BASENAME');

const OG_PUBLIC_ID = `${OG_FOLDER}/${OG_BASENAME}`;

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: DEFAULT_ID },
      select: {
        defaultSeoTitle: true,
        defaultSeoDescription: true,
        ogImageUrl: true,
        titleSuffix: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ ok: true, settings: settings ?? null }, { status: 200, headers: { 'x-next-cache-tags': 'site-settings' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Помилка';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || '';
    const isMultipart = ct.includes('multipart/form-data');

    if (isMultipart) {
      const form = await req.formData();

      const defaultSeoTitleRaw = form.get('defaultSeoTitle');
      const defaultSeoDescriptionRaw = form.get('defaultSeoDescription');
      const titleSuffixRaw = form.get('titleSuffix');
      const removeOgRaw = form.get('removeOg');
      const file = form.get('ogImage');

      const defaultSeoTitle =
        typeof defaultSeoTitleRaw === 'string' ? defaultSeoTitleRaw.slice(0, MAX_TITLE) : undefined;

      const defaultSeoDescription =
        typeof defaultSeoDescriptionRaw === 'string'
          ? defaultSeoDescriptionRaw.slice(0, MAX_DESC)
          : undefined;

      let titleSuffix: string | undefined;
      if (typeof titleSuffixRaw === 'string') {
        const trimmed = titleSuffixRaw.trim().slice(0, MAX_SUFFIX);
        titleSuffix = trimmed.length === 0 ? TITLE_SUFFIX_DEFAULT : trimmed;
      }

      let ogImageUrl: string | null | undefined;

      if (file instanceof Blob) {
        const mime = (file as unknown as { type?: string }).type ?? '';
        if (!mime.startsWith('image/')) {
          return NextResponse.json({ ok: false, error: 'Потрібне зображення' }, { status: 400 });
        }
        if (typeof file.size === 'number' && file.size > MAX_SIZE_BYTES) {
          return NextResponse.json(
            { ok: false, error: 'Файл завеликий (макс 10MB)' },
            { status: 413 },
          );
        }

        const buffer = Buffer.from(await (file as Blob).arrayBuffer());

        const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: OG_FOLDER,
              public_id: OG_BASENAME,
              resource_type: 'image',
              overwrite: true,
              unique_filename: false,
              use_filename: false,
              invalidate: true,
            },
            (error, result) => {
              if (error || !result) return reject(error ?? new Error('Upload failed'));
              resolve({ secure_url: result.secure_url! });
            },
          );
          stream.end(buffer);
        });

        ogImageUrl = uploaded.secure_url;
      } else if (
        typeof removeOgRaw === 'string' &&
        (removeOgRaw === '1' || removeOgRaw.toLowerCase() === 'true')
      ) {
        try {
          await cloudinary.uploader.destroy(OG_PUBLIC_ID, {
            resource_type: 'image',
            invalidate: true,
          });
        } catch {
          /* ignore */
        }
        ogImageUrl = null;
      } else {
        ogImageUrl = undefined;
      }

      const updateData: Prisma.SiteSettingsUpdateInput = {};
      if (defaultSeoTitle !== undefined) updateData.defaultSeoTitle = defaultSeoTitle;
      if (defaultSeoDescription !== undefined)
        updateData.defaultSeoDescription = defaultSeoDescription;
      if (titleSuffix !== undefined) updateData.titleSuffix = titleSuffix;
      if (ogImageUrl !== undefined) updateData.ogImageUrl = ogImageUrl;

      const createData: Prisma.SiteSettingsCreateInput = {
        id: DEFAULT_ID,
        ...(defaultSeoTitle !== undefined ? { defaultSeoTitle } : {}),
        ...(defaultSeoDescription !== undefined ? { defaultSeoDescription } : {}),
        ...(titleSuffix !== undefined ? { titleSuffix } : {}),
        ...(ogImageUrl !== undefined ? { ogImageUrl } : {}),
      };

      const updated = await prisma.siteSettings.upsert({
        where: { id: DEFAULT_ID },
        update: updateData,
        create: createData,
        select: {
          defaultSeoTitle: true,
          defaultSeoDescription: true,
          ogImageUrl: true,
          titleSuffix: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ ok: true, settings: updated }, { status: 200 });
    }

    const body = (await req.json()) as Partial<{
      defaultSeoTitle: string | null;
      defaultSeoDescription: string | null;
      ogImageUrl: string | null;
      titleSuffix: string | null;
      removeOg: boolean | '1' | 'true';
    }>;

    const updateData: Prisma.SiteSettingsUpdateInput = {};
    const createData: Prisma.SiteSettingsCreateInput = { id: DEFAULT_ID };

    if (body.defaultSeoTitle !== undefined) {
      const v = body.defaultSeoTitle ?? null;
      const sliced = v ? v.slice(0, MAX_TITLE) : null;
      updateData.defaultSeoTitle = sliced;
      createData.defaultSeoTitle = sliced;
    }
    if (body.defaultSeoDescription !== undefined) {
      const v = body.defaultSeoDescription ?? null;
      const sliced = v ? v.slice(0, MAX_DESC) : null;
      updateData.defaultSeoDescription = sliced;
      createData.defaultSeoDescription = sliced;
    }

    if (body.removeOg === true || body.removeOg === '1' || body.removeOg === 'true') {
      try {
        await cloudinary.uploader.destroy(OG_PUBLIC_ID, {
          resource_type: 'image',
          invalidate: true,
        });
      } catch {
        /* ignore */
      }
      updateData.ogImageUrl = null;
      createData.ogImageUrl = null;
    } else if (body.ogImageUrl !== undefined) {
      updateData.ogImageUrl = body.ogImageUrl;
      createData.ogImageUrl = body.ogImageUrl;
    }

    if (body.titleSuffix !== undefined) {
      const raw = body.titleSuffix ?? '';
      const trimmed = raw.trim().slice(0, MAX_SUFFIX);
      const val = trimmed.length === 0 ? TITLE_SUFFIX_DEFAULT : trimmed;
      updateData.titleSuffix = val;
      createData.titleSuffix = val;
    }

    const updated = await prisma.siteSettings.upsert({
      where: { id: DEFAULT_ID },
      update: updateData,
      create: createData,
      select: {
        defaultSeoTitle: true,
        defaultSeoDescription: true,
        ogImageUrl: true,
        titleSuffix: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, settings: updated }, { status: 200 });

    // Invalidate cache
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/site-settings`, {
      method: 'PUT',
      headers: { 'x-api-secret': process.env.API_SECRET! }
    }).catch(() => {}); // Ignore errors

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Помилка оновлення';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const authHeader = req.headers.get('x-api-secret');
  if (authHeader !== process.env.API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  revalidateTag('site-settings');
  return NextResponse.json({ ok: true });
}
