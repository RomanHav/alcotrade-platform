// store/operations/articles.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export type NewsStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVE';

export type ArticleListItem = {
  id: string;
  title: string;
  status: NewsStatus;
  date?: string | null;
  publishedAt?: string | null;
  slug: string;
  locale: string;
  cover?: { id: string; url: string; alt?: string | null } | null;
};

export type SaveArticleDto = {
  id?: string;
  title: string;
  status: NewsStatus;
  excerpt?: string;
  content?: string;
  date?: string | null; // ISO або null
  seoTitle?: string | null;
  seoDescription?: string | null;
  coverId?: string | null;
  slug: string;
  locale?: string; // опц., дефолт 'uk'
};

export const fetchArticles = createAsyncThunk<
  { items: ArticleListItem[]; total: number },
  void,
  { state: RootState }
>('articles/fetchArticles', async (_, { getState, rejectWithValue }) => {
  const s = getState().articles;
  const usp = new URLSearchParams();
  usp.set('page', String(s.page));
  usp.set('pageSize', String(s.pageSize));
  if (s.query) usp.set('query', s.query);
  if (s.status) usp.set('status', s.status);
  if (s.date) usp.set('date', s.date); // YYYY-MM-DD або ISO
  if (s.sort) usp.set('sort', s.sort);

  const res = await fetch(`/api/articles?${usp.toString()}`, { cache: 'no-store' });
  if (!res.ok) return rejectWithValue(await res.text());
  return (await res.json()) as { items: ArticleListItem[]; total: number };
});

// Нормалізуємо дату: YYYY-MM-DD -> ISO початку дня; інакше повертаємо як є
const normalizeDate = (d?: string | null) => {
  if (!d) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`).toISOString() : d;
};

// ⬇️ ОНОВЛЕНО: відкладений аплоад/видалення обкладинки
export const saveArticle = createAsyncThunk<{ id: string }, SaveArticleDto, { state: RootState }>(
  'articles/saveArticle',
  async (payload, { getState, rejectWithValue }) => {
    const form = getState().articles.form;

    // 1) Якщо позначено видалення чинної обкладинки — скасовуємо зв’язок/видаляємо asset (опц.)
    // Якщо coverId вже очищено у формі — бек, який прийме coverId:null, теж відв’яже.
    if (form.pendingCoverDelete && form.coverId) {
      try {
        const qs = new URLSearchParams();
        qs.set('mediaId', form.coverId);
        await fetch(`/api/uploads?${qs.toString()}`, { method: 'DELETE' });
      } catch {
        /* no-op */
      }
    }

    // 2) Якщо вибрано новий файл — вантажимо його зараз у Cloudinary
    let coverIdToUse: string | null = (payload.coverId ?? form.coverId ?? null) as string | null;

    if (form.pendingCoverFile) {
      const fd = new FormData();
      fd.append('file', form.pendingCoverFile as unknown as Blob);
      fd.append('entity', 'news'); // папка для новин вибереться на бекенді

      // Якщо це редагування існуючої статті — одразу прив’язати як cover
      if (form.id) {
        fd.append('attach', 'cover');
        fd.append('articleId', form.id);
      }

      const upRes = await fetch('/api/uploads', { method: 'POST', body: fd });
      if (!upRes.ok) {
        const t = await upRes.text();
        return rejectWithValue(t || 'Upload failed');
      }
      const up = await upRes.json();
      coverIdToUse = up?.media?.id ?? null;
    }

    // 3) Готуємо payload для збереження
    const body: SaveArticleDto = {
      ...payload,
      date: normalizeDate(payload.date ?? form.date ?? null),
      coverId: coverIdToUse ?? null,
    };

    const res = await fetch('/api/articles/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        return rejectWithValue(j?.message || text);
      } catch {
        return rejectWithValue(text);
      }
    }

    const out = await res.json();
    return { id: out?.id as string };
  },
);

export const deleteArticle = createAsyncThunk<
  { deleted: number; ids: string[] },
  { ids: string[] }
>('articles/deleteArticle', async ({ ids }, { rejectWithValue }) => {
  const res = await fetch('/api/articles', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) return rejectWithValue(await res.text());
  const out = await res.json();
  return { deleted: out?.deleted ?? ids.length, ids };
});
