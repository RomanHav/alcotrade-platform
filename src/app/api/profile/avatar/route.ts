// app/api/profile/avatar/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

cloudinary.config({ secure: true });

const DEFAULT_AVATAR = process.env.NEXT_PUBLIC_DEFAULT_USER_IMAGE ?? '/avatar.jpg';
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Файл не передано' }, { status: 400 });
    }

    const mime: string = file.type;
    if (mime && !mime.startsWith('image/')) {
      return NextResponse.json({ ok: false, error: 'Потрібне зображення' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: 'Файл завеликий (макс 5MB)' }, { status: 413 });
    }

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploaded = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `Alcotrade/avatars/${userId}`,
          resource_type: 'image',
          overwrite: true,
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Upload failed'));
            return;
          }
          resolve({
            secure_url: result.secure_url!,
            public_id: result.public_id!,
            width: result.width!,
            height: result.height!,
          });
        },
      );
      stream.end(buffer);
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        image: uploaded.secure_url,
        avatarPublicId: uploaded.public_id,
      },
      select: { id: true },
    });

    if (current?.avatarPublicId && current.avatarPublicId !== uploaded.public_id) {
      try {
        await cloudinary.uploader.destroy(current.avatarPublicId, { resource_type: 'image' });
      } catch {}
    }

    return NextResponse.json({ ok: true, url: uploaded.secure_url }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Помилка завантаження';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });

    if (current?.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(current.avatarPublicId, { resource_type: 'image' });
      } catch {}
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        image: DEFAULT_AVATAR,
        avatarPublicId: null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, url: DEFAULT_AVATAR }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Помилка видалення';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
