// useSeoSettings.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import imageCompression from 'browser-image-compression';

type SeoState = {
  title: string;
  description: string;
  imageUrl: string | null; // збережене (останнє з БД)
};

type SiteSettingsDto = {
  defaultSeoTitle?: string | null;
  defaultSeoDescription?: string | null;
  ogImageUrl?: string | null;
};

async function getSiteSettings(): Promise<SeoState> {
  const r = await fetch('/api/site-settings', { cache: 'no-store' });
  if (!r.ok) return { title: '', description: '', imageUrl: null };
  const j = (await r.json()) as { settings?: SiteSettingsDto | null };
  const s = j.settings ?? null;
  return {
    title: s?.defaultSeoTitle ?? '',
    description: s?.defaultSeoDescription ?? '',
    imageUrl: s?.ogImageUrl ?? null,
  };
}

async function compressFile(file: File): Promise<File> {
  if (file.size <= 1024 * 1024) return file; // Skip compression for small files

  try {
    const options = {
      maxSizeMB: 2, // Maximum size in MB
      maxWidthOrHeight: 1920, // Maximum width/height
      useWebWorker: true,
      quality: 0.8, // JPEG quality
    };
    const compressedFile = await imageCompression(file, options);
    console.log(`SEO image compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.warn('SEO image compression failed, using original file:', error);
    return file;
  }
}

export function useSeoSettings() {
  // Збережений стан (із БД)
  const [current, setCurrent] = useState<SeoState>({
    title: '',
    description: '',
    imageUrl: null,
  });

  // Чернетки тексту
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [touchedTitle, setTouchedTitle] = useState(false);
  const [touchedDescription, setTouchedDescription] = useState(false);

  // Чернетки зображення
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [removeOg, setRemoveOg] = useState(false);

  // Завантажити старт
  useEffect(() => {
    (async () => {
      try {
        const s = await getSiteSettings();
        setCurrent(s);
        // скинути чернетки
        setDraftTitle('');
        setDraftDescription('');
        setTouchedTitle(false);
        setTouchedDescription(false);
        setFile(null);
        setRemoveOg(false);
      } catch {}
    })();
  }, []);

  // Контрольований прев’ю-URL для локального файлу
  useEffect(() => {
    if (!file) {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
        setFilePreviewUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Значення, що бачить інпут (до торкання — поточне збережене)
  const visibleTitle = touchedTitle ? draftTitle : current.title;
  const visibleDescription = touchedDescription ? draftDescription : current.description;

  // Прев’ю зображення: file > removeOg(null) > current.imageUrl
  const previewImageUrl = useMemo(() => {
    if (filePreviewUrl) return filePreviewUrl;
    if (removeOg) return null;
    return current.imageUrl;
  }, [filePreviewUrl, removeOg, current.imageUrl]);

  // Були зміни?
  const dirtyText =
    (touchedTitle && draftTitle !== current.title) ||
    (touchedDescription && draftDescription !== current.description);

  const dirty = dirtyText || file !== null || removeOg;

  // Валідність:
  // 1) обидва поля не порожні (trim)
  // 2) не можна "видалити" зображення без нового файлу
  const nonEmptyInputs = visibleTitle.trim().length > 0 && visibleDescription.trim().length > 0;
  const valid = nonEmptyInputs && !(removeOg && file === null);

  // сеттери
  const setTitle = (v: string) => {
    if (!touchedTitle) setTouchedTitle(true);
    setDraftTitle(v);
  };
  const setDescription = (v: string) => {
    if (!touchedDescription) setTouchedDescription(true);
    setDraftDescription(v);
  };

  const selectImage = async (f: File) => {
    // Compress file if needed
    const compressedFile = await compressFile(f);
    setFile(compressedFile);
    setRemoveOg(false);
  };

  const clearImage = () => {
    setFile(null);
    setRemoveOg(true);
    // НЕ змінюємо current.imageUrl — це збережене значення
  };

  // Скасувати ВСІ незбережені SEO-зміни (тексти + фото)
  const resetAll = () => {
    setDraftTitle('');
    setDraftDescription('');
    setTouchedTitle(false);
    setTouchedDescription(false);
    setFile(null);
    setRemoveOg(false);
  };

  // Зберегти
  const save = async () => {
    if (!dirty || !valid) return;

    const fd = new FormData();
    if (touchedTitle) fd.append('defaultSeoTitle', draftTitle || '');
    if (touchedDescription) fd.append('defaultSeoDescription', draftDescription || '');
    if (file) fd.append('ogImage', file);
    else if (removeOg) fd.append('removeOg', '1');

    const r = await fetch('/api/site-settings', { method: 'PATCH', body: fd });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? 'Не вдалося зберегти налаштування SEO');
    }

    const { settings } = (await r.json()) as { settings: SiteSettingsDto };
    const saved: SeoState = {
      title: settings.defaultSeoTitle ?? '',
      description: settings.defaultSeoDescription ?? '',
      imageUrl: settings.ogImageUrl ?? null,
    };

    // зафіксувати як збережене
    setCurrent(saved);

    // скинути чернетки
    resetAll();
  };

  const resetTextOnly = () => {
    setDraftTitle('');
    setDraftDescription('');
    setTouchedTitle(false);
    setTouchedDescription(false);
  };

  return {
    // збережене
    current,
    // значення, які відображаються у UI
    draft: {
      title: visibleTitle, // ⬅️ показуємо видиме, не "сире" draftTitle
      description: visibleDescription,
      imageUrl: previewImageUrl, // ⬅️ прев’ю для зображення
    },
    // дії
    setTitle,
    setDescription,
    selectImage,
    clearImage,
    resetAll,
    resetTextOnly,
    save,
    // стани
    dirty,
    valid, // враховує і пусті поля, і логіку з OG
    nonEmptyInputs: nonEmptyInputs, // якщо треба використати окремо
  };
}
