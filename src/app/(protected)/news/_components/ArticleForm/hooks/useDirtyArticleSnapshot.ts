'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { ArticleForm as ArticleFormState } from '@/store/slices/articles';

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const normalizeDate = (v?: string | null | Date) => {
  if (!v) return null;
  if (v instanceof Date) return toYMD(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : toYMD(d);
};

function snapshot(src: Partial<ArticleFormState> | undefined, slugOverride?: string) {
  return {
    id: src?.id ?? null,
    status: (src?.status as ArticleFormState['status']) ?? 'DRAFT',
    title: src?.title ?? '',
    excerpt: src?.excerpt ?? '',
    content: src?.content ?? '',
    seoTitle: src?.seoTitle ?? null,
    seoDescription: src?.seoDescription ?? null,
    coverId: src?.coverId ?? null,
    date: normalizeDate(src?.date ?? null),
    // для клієнтського стану беремо актуальний slug із контролю вводу
    slug: (slugOverride ?? src?.slug ?? '') || '',
  };
}

export function useDirtyArticleSnapshot(
  server: Partial<ArticleFormState> | undefined,
  data: ArticleFormState,
  slug: string, // актуальне значення інпуту slug
) {
  const initialRef = useRef<string>('');

  // Запам'ятовуємо "серверний" знімок при зміні server
  useEffect(() => {
    initialRef.current = JSON.stringify(snapshot(server));
  }, [server]);

  // Поточний знімок форми (з урахуванням введеного slug)
  const comparable = useMemo(() => JSON.stringify(snapshot(data, slug)), [data, slug]);

  return { isDirty: comparable !== initialRef.current, initialRef, comparable };
}
