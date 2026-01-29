// src/app/api/translate/main-page/video/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ secure: true });

interface SaveVideoRequest {
  sectionId: string;
  videoUrl: string;
  videoPublicId: string;
}

interface DeleteVideoRequest {
  sectionId: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SaveVideoRequest;
    const { sectionId, videoUrl, videoPublicId } = body;

    if (!sectionId || !videoUrl || !videoPublicId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get existing section to delete old video if present
    const existing = await prisma.mainPageSection.findUnique({
      where: { id: sectionId },
      select: { videoPublicId: true },
    });

    // Delete old video from Cloudinary if it exists
    if (existing?.videoPublicId) {
      try {
        await cloudinary.uploader.destroy(existing.videoPublicId, {
          resource_type: 'video',
          invalidate: true,
        });
      } catch (err) {
        console.warn('Failed to delete old video from Cloudinary:', err);
      }
    }

    // Update section with new video
    const updated = await prisma.mainPageSection.update({
      where: { id: sectionId },
      data: {
        videoUrl,
        videoPublicId,
      },
      select: {
        id: true,
        key: true,
        videoUrl: true,
        videoPublicId: true,
      },
    });

    return NextResponse.json({ ok: true, section: updated }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to save video';
    console.error('Save video error:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as DeleteVideoRequest;
    const { sectionId } = body;

    if (!sectionId) {
      return NextResponse.json(
        { error: 'sectionId is required' },
        { status: 400 }
      );
    }

    // Get section to find public_id
    const section = await prisma.mainPageSection.findUnique({
      where: { id: sectionId },
      select: { videoPublicId: true, videoUrl: true },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Delete from Cloudinary
    if (section.videoPublicId) {
      try {
        await cloudinary.uploader.destroy(section.videoPublicId, {
          resource_type: 'video',
          invalidate: true,
        });
      } catch (err) {
        console.warn('Failed to delete video from Cloudinary:', err);
      }
    }

    // Update section to remove video reference
    await prisma.mainPageSection.update({
      where: { id: sectionId },
      data: {
        videoUrl: null,
        videoPublicId: null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to delete video';
    console.error('Delete video error:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
