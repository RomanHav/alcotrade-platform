'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Upload } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCover, setCoverMedia } from '@/store/slices/brandFormSlice';
import imageCompression from 'browser-image-compression';

export default function BrandMediaPicker() {
  const dispatch = useAppDispatch();
  const { coverId, coverUrl, coverPublicId } = useAppSelector((s) => s.brandForm);

  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = () => inputRef.current?.click();

  const compressFile = async (file: File): Promise<File> => {
    if (file.size <= 512 * 1024) return file; // Skip compression for small files (< 512KB)

    try {
      const options = {
        maxSizeMB: 1, // Maximum size in MB - reduced for Vercel
        maxWidthOrHeight: 1600, // Maximum width/height - reduced
        useWebWorker: true,
        quality: 0.7, // JPEG quality - reduced
      };
      const compressedFile = await imageCompression(file, options);
      console.log(`Image compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return compressedFile;
    } catch (error) {
      console.warn('Image compression failed, using original file:', error);
      return file;
    }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const file = files[0];
      // Compress file if needed
      const fileToUpload = await compressFile(file);

      const fd = new FormData();
      fd.append('file', fileToUpload);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();

      if (json?.ok && json?.media?.id && json?.media?.url) {
        dispatch(
          setCoverMedia({
            id: json.media.id,
            url: json.media.url,
            publicId: json.cloudinary?.publicId ?? null,
          }),
        );
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!coverId) return;
    const qs = new URLSearchParams();
    qs.set('mediaId', coverId);
    if (coverPublicId) qs.set('public_id', coverPublicId);
    try {
      await fetch(`/api/upload?${qs.toString()}`, { method: 'DELETE' });
    } catch {}
    dispatch(clearCover());
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">Обкладинка бренду</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
        <Button size="sm" variant="secondary" onClick={pick} disabled={busy}>
          <Upload className="mr-2 h-4 w-4" />
          {busy ? 'Завантаження…' : 'Завантажити'}
        </Button>
      </div>

      <div className="bg-muted aspect-[4/5] overflow-hidden rounded-xl border">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            width={800}
            height={1000}
            className="h-full w-full object-cover"
            unoptimized
            priority
            sizes="(max-width: 768px) 100vw, 320px"
          />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      {coverId && (
        <div className="mt-3 flex justify-end">
          <Button variant="destructive" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" />
            Видалити
          </Button>
        </div>
      )}
    </div>
  );
}
