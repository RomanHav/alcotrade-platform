// src/store/operations/translateNews.ts
import { createAsyncThunk } from '@reduxjs/toolkit';

export type TranslateNewsListParams = {
  q?: string;
  missingOnly?: boolean;
  page?: number;
  limit?: number;
  status?: string;
};

export type TranslateNewsListItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  date: string | null;
  updatedAt: string;
  coverUrl: string | null;
  hasEn: boolean;
};

export const fetchTranslateNews = createAsyncThunk<
  { items: TranslateNewsListItem[]; total: number; page: number; limit: number },
  TranslateNewsListParams
>('translateNews/fetchList', async (params) => {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.missingOnly) sp.set('missingOnly', 'true');
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.status) sp.set('status', params.status);

  const res = await fetch(`/api/translate/news?${sp.toString()}`);
  if (!res.ok) throw new Error('failed_list');
  return res.json();
});

export type TranslateNewsDetail = {
  uk: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    date: string | null;
    status: string;
    seoTitle: string | null;
    seoDescription: string | null;
    cover: { id: string; url: string; alt: string | null } | null;
  };
  en: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  } | null;
};

export const fetchTranslateNewsDetail = createAsyncThunk<TranslateNewsDetail, { id: string }>(
  'translateNews/fetchDetail',
  async ({ id }) => {
    const res = await fetch(`/api/translate/news/${id}`);
    if (!res.ok) throw new Error('failed_detail');
    return res.json();
  },
);

export type SaveTranslateNewsPayload = {
  id: string;
  title?: string | null;
  slug?: string | null;
  content?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export const saveTranslateNews = createAsyncThunk<
  { ok: true },
  SaveTranslateNewsPayload,
  { rejectValue: { code: number; message: string } }
>('translateNews/saveDetail', async ({ id, ...payload }, { rejectWithValue }) => {
  const res = await fetch(`/api/translate/news/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) return rejectWithValue({ code: 409, message: 'slug_taken' });
  if (!res.ok) return rejectWithValue({ code: res.status, message: 'save_failed' });
  return { ok: true };
});
