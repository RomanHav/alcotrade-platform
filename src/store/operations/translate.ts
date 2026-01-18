// store/operations/translate.ts
import { createAsyncThunk } from '@reduxjs/toolkit';

export type TranslateListParams = {
  q?: string;
  missingOnly?: boolean;
  page?: number;
  limit?: number;
  brandId?: string;
  status?: string;
};

export type TranslateListItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: string;
  brand?: { id: string; name: string; slug: string } | null;
  hasEn: boolean;
  variantsCount: number;
};

export const fetchTranslateProducts = createAsyncThunk<
  { items: TranslateListItem[]; total: number; page: number; limit: number },
  TranslateListParams
>('translate/fetchList', async (params) => {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.missingOnly) sp.set('missingOnly', 'true');
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.brandId) sp.set('brandId', params.brandId);
  if (params.status) sp.set('status', params.status);

  const res = await fetch(`/api/translate/products?${sp.toString()}`);
  if (!res.ok) throw new Error('failed_list');
  return res.json();
});

export type TranslateDetail = {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    updatedAt?: string;
    brand?: { id: string; name: string; slug: string } | null;
    translations: { id: string; name: string; slug: string | null; description: string | null; seoTitle: string | null; seoDescription: string | null }[];
    variants: { id: string; label: string | null; position: number; translations: { id: string; label: string | null }[] }[];
  };
};

export const fetchTranslateProduct = createAsyncThunk<TranslateDetail, { id: string }>(
  'translate/fetchDetail',
  async ({ id }) => {
    const res = await fetch(`/api/translate/products/${id}`);
    if (!res.ok) throw new Error('failed_detail');
    return res.json();
  },
);

export type SaveTranslatePayload = {
  id: string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  variants?: Array<{ variantId: string; label?: string | null }>;
};

export const saveTranslateProduct = createAsyncThunk<
  { ok: true },
  SaveTranslatePayload,
  { rejectValue: { code: number; message: string } }
>('translate/saveDetail', async ({ id, ...payload }, { rejectWithValue }) => {
  const res = await fetch(`/api/translate/products/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) return rejectWithValue({ code: 409, message: 'slug_taken' });
  if (!res.ok) return rejectWithValue({ code: res.status, message: 'save_failed' });
  return { ok: true };
});
