// src/store/operations/translateFooter.ts
import { createAsyncThunk } from '@reduxjs/toolkit';

export type FooterItem = {
  id: string;
  key: string;
  valueUk: string;
  valueEn: string | null;
  position: number;
};

export type FooterSection = {
  id: string;
  key: string;
  position: number;
  isVisible: boolean;
  items: FooterItem[];
  updatedAt: string;
};

export const fetchFooter = createAsyncThunk<
  { section: FooterSection }
>('translateFooter/fetch', async () => {
  const res = await fetch('/api/translate/footer');
  if (!res.ok) throw new Error('failed_fetch');
  return res.json();
});

export type SaveFooterPayload = {
  items: { key: string; valueUk: string; valueEn: string | null }[];
};

export const saveFooter = createAsyncThunk<
  { section: FooterSection; ok: true },
  SaveFooterPayload,
  { rejectValue: { code: number; message: string } }
>('translateFooter/save', async ({ items }, { rejectWithValue }) => {
  const res = await fetch('/api/translate/footer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) return rejectWithValue({ code: res.status, message: 'save_failed' });
  return res.json();
});
