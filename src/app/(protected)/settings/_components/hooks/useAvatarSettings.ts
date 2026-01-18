'use client';

import { useEffect, useState } from 'react';
import imageCompression from 'browser-image-compression';

type AvatarDraft = { file: File | null; reset: boolean };

async function compressFile(file: File): Promise<File> {
  if (file.size <= 512 * 1024) return file; // Skip compression for small files (< 512KB)

  try {
    const options = {
      maxSizeMB: 1, // Maximum size in MB - reduced for Vercel
      maxWidthOrHeight: 1600, // Maximum width/height - reduced
      useWebWorker: true,
      quality: 0.7, // JPEG quality - reduced
    };
    const compressedFile = await imageCompression(file, options);
    console.log(`Avatar compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.warn('Avatar compression failed, using original file:', error);
    return file;
  }
}

async function getProfileImage(): Promise<string | null> {
  const r = await fetch('/api/profile', { cache: 'no-store' });
  if (!r.ok) return null;
  const j = (await r.json()) as { imageUrl?: string | null };
  return j.imageUrl ?? null;
}

async function uploadAvatar(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/api/profile/avatar', { method: 'PATCH', body: fd });
  if (!r.ok) throw new Error('Помилка завантаження фото');
  const j = (await r.json()) as { url: string };
  return j.url;
}

async function deleteAvatar(): Promise<string> {
  const r = await fetch('/api/profile/avatar', { method: 'DELETE' });
  if (!r.ok) throw new Error('Помилка видалення фото');
  const j = (await r.json()) as { url: string };
  return j.url;
}

export function useAvatarSettings(defaultAvatar: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [initialUrl, setInitialUrl] = useState<string>(defaultAvatar);
  const [previewUrl, setPreviewUrl] = useState<string>(defaultAvatar);
  const [draft, setDraft] = useState<AvatarDraft>({ file: null, reset: false });

  useEffect(() => {
    (async () => {
      try {
        const url = await getProfileImage();
        const safe = url ?? defaultAvatar;
        setInitialUrl(safe);
        setPreviewUrl(safe);
      } catch {
        setInitialUrl(defaultAvatar);
        setPreviewUrl(defaultAvatar);
      }
    })();
  }, [defaultAvatar]);

  const dirty = draft.file !== null || draft.reset;

  const onSelect = async (file: File, localObjectUrl: string) => {
    // Compress file if needed
    const compressedFile = await compressFile(file);
    setPreviewUrl(localObjectUrl);
    setDraft({ file: compressedFile, reset: false });
  };

  const onReset = () => {
    setPreviewUrl(defaultAvatar);
    setDraft({ file: null, reset: true });
  };

  const save = async () => {
    if (!dirty) return;
    let newUrl = previewUrl;
    if (draft.reset) {
      newUrl = await deleteAvatar();
    } else if (draft.file) {
      newUrl = await uploadAvatar(draft.file);
    }
    setInitialUrl(newUrl);
    setPreviewUrl(newUrl);
    setDraft({ file: null, reset: false });
  };

  return { previewUrl, onSelect, onReset, dirty, save };
}
