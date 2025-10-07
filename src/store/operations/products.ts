import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ProductStatus } from '@prisma/client';

type VariantInput = {
  id?: string;
  label?: string | null;
  volumeMl?: number | null;
  position: number;
  imageId: string | null;
};
export type SaveProductInput = {
  id?: string;
  name: string;
  status: ProductStatus;
  brandId: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  variants?: VariantInput[];
  coverId?: string | null;
  imageIds?: string[];
  slug?: string | null;
};

export const saveProduct = createAsyncThunk<
  { ok: true }, // return type
  SaveProductInput, // arg type
  { rejectValue: { code: number; message: string } }
>('products/save', async (payload, { rejectWithValue }) => {
  const res = await fetch('/api/products/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) return rejectWithValue({ code: 409, message: 'slug_taken' });
  if (!res.ok) return rejectWithValue({ code: res.status, message: 'save_failed' });
  return { ok: true };
});

export const deleteProduct = createAsyncThunk<
  { ok: true },
  { id: string },
  { rejectValue: { code: number; message: string } }
>('products/delete', async ({ id }, { rejectWithValue }) => {
  const res = await fetch('/api/products', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: [id] }),
  });
  if (!res.ok) return rejectWithValue({ code: res.status, message: 'delete_failed' });
  return { ok: true };
});
