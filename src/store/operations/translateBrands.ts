// store/operations/translateBrands.ts
import { createAsyncThunk } from '@reduxjs/toolkit';

export type TranslateBrandListParams = {
  q?: string;
  missingOnly?: boolean;
  page?: number;
  limit?: number;
  status?: string;
};

export type TranslateBrandListItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: string;
  hasEn: boolean;
  productsCount: number;
};

export const fetchTranslateBrands = createAsyncThunk<
  { items: TranslateBrandListItem[]; total: number; page: number; limit: number },
  TranslateBrandListParams
>('translateBrands/fetchList', async (params) => {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.missingOnly) sp.set('missingOnly', 'true');
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.status) sp.set('status', params.status);

  const res = await fetch(`/api/translate/brands?${sp.toString()}`);
  if (!res.ok) throw new Error('failed_list');
  return res.json();
});

export type TranslateBrandDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  translations: { id: string; locale: string; name: string; slug: string | null; description: string | null; seoTitle: string | null; seoDescription: string | null }[];
  _count?: { products: number };
};

export const fetchTranslateBrand = createAsyncThunk<TranslateBrandDetail, { id: string }>(
  'translateBrands/fetchDetail',
  async ({ id }) => {
    const res = await fetch(`/api/translate/brands/${id}`);
    if (!res.ok) throw new Error('failed_detail');
    return res.json();
  },
);

export type SaveTranslateBrandPayload = {
  id: string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export const saveTranslateBrand = createAsyncThunk<
  { ok: true },
  SaveTranslateBrandPayload,
  { rejectValue: { code: number; message: string } }
>('translateBrands/saveDetail', async ({ id, ...payload }, { rejectWithValue }) => {
  const res = await fetch(`/api/translate/brands/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) return rejectWithValue({ code: 409, message: 'slug_taken' });
  if (!res.ok) return rejectWithValue({ code: res.status, message: 'save_failed' });
  return { ok: true };
});
