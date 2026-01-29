// app/api/upload/video/route.ts
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video uploads

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// const VIDEO_FOLDER = 'Alcotrade/videos';
// const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 100MB for videos

// export async function POST(req: Request) {
//   try {
//     ensureCloudinaryCreds();

//     const form = await req.formData();
//     const file = form.get('file');
//     const sectionId = form.get('sectionId')?.toString() || null;

//     if (!(file instanceof Blob)) {
//       return NextResponse.json({ ok: false, error: 'Файл не передано' }, { status: 400 });
//     }

//     const mime: string = file.type;
//     if (mime && !mime.startsWith('video/')) {
//       return NextResponse.json({ ok: false, error: 'Потрібне відео' }, { status: 400 });
//     }

//     if (file.size > MAX_VIDEO_SIZE) {
//       return NextResponse.json(
//         {
//           ok: false,
//           error: `Файл завеликий. Максимальний розмір: ${Math.round(MAX_VIDEO_SIZE / 1024 / 1024)}MB`,
//         },
//         { status: 413 }
//       );
//     }

//     const buffer = Buffer.from(await file.arrayBuffer());

//     // Upload video to Cloudinary with streaming
//     const uploaded = await new Promise<{
//       secure_url: string;
//       public_id: string;
//       duration?: number;
//     }>((resolve, reject) => {
//       const opts: any = {
//         folder: VIDEO_FOLDER,
//         resource_type: 'video',
//         overwrite: true,
//         invalidate: true,
//         use_filename: false,
//         unique_filename: true,
//       };

//       if (sectionId) {
//         opts.public_id = `${VIDEO_FOLDER}/${sectionId}_${Date.now()}`;
//       }

//       const stream = cloudinary.uploader.upload_stream(opts, (error, result) => {
//         if (error || !result) {
//           return reject(error ?? new Error('Cloudinary upload failed'));
//         }
//         resolve({
//           secure_url: result.secure_url!,
//           public_id: result.public_id!,
//           duration: result.duration,
//         });
//       });

//       stream.end(buffer);
//     });

//     return NextResponse.json(
//       {
//         ok: true,
//         video: {
//           url: uploaded.secure_url,
//           publicId: uploaded.public_id,
//           duration: uploaded.duration,
//         },
//       },
//       { status: 201 }
//     );
//   } catch (e: unknown) {
//     const msg = e instanceof Error ? e.message : 'Помилка завантаження';
//     console.error('Video upload error:', e);
//     return NextResponse.json({ ok: false, error: msg }, { status: 500 });
//   }
// }

export async function DELETE(req: Request) {
  try {
    ensureCloudinaryCreds();

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('public_id');

    if (!publicId) {
      return NextResponse.json(
        { ok: false, error: 'public_id обов\'язковий' },
        { status: 400 }
      );
    }

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
        invalidate: true,
      });
    } catch (err) {
      console.warn('Cloudinary video destroy failed:', err);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Помилка видалення';
    console.error('Video delete error:', e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
