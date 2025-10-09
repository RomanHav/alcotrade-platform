import { createAsyncThunk } from '@reduxjs/toolkit';
import type { BrandStatus } from '@prisma/client';

export type SaveBrandInput = {
  id?: string;
  name: string;
  status: BrandStatus;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  coverId?: string | null;
  slug?: string | null;
};

export const saveBrand = createAsyncThunk<
  { ok: true },
  SaveBrandInput,
  { rejectValue: { code: number; message: string } }
>('brands/save', async (payload, { rejectWithValue }) => {
  const res = await fetch('/api/brands/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) return rejectWithValue({ code: 409, message: 'slug_taken' }); // 👈
  if (!res.ok) return rejectWithValue({ code: res.status, message: 'save_failed' });
  return { ok: true };
});

export const deleteBrand = createAsyncThunk<
  { ok: true },
  { ids: string[]; mode?: 'restrict' | 'cascade' | 'reassign' | 'archive'; reassignToId?: string },
  {
    rejectValue: {
      code?: string;
      conflicts?: Array<{ id: string; count: number }>;
      message?: string;
    };
  }
>('brands/delete', async (payload, { rejectWithValue }) => {
  const res = await fetch('/api/brands', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    return rejectWithValue(j);
  }
  return { ok: true };
});
