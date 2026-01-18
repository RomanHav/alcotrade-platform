// src/store/operations/translateNavigation.ts
import { createAsyncThunk } from '@reduxjs/toolkit';

export type NavigationItem = {
  id: string;
  key: string;
  valueUk: string;
  valueEn: string | null;
  position: number;
};

export type NavigationSection = {
  id: string;
  key: string;
  position: number;
  isVisible: boolean;
  items: NavigationItem[];
  updatedAt: string;
};

export const fetchNavigation = createAsyncThunk<
  { section: NavigationSection }
>('translateNavigation/fetch', async () => {
  const res = await fetch('/api/translate/navigation');
  if (!res.ok) throw new Error('failed_fetch');
  return res.json();
});

export type SaveNavigationPayload = {
  items: { key: string; valueUk: string; valueEn: string | null }[];
};

export const saveNavigation = createAsyncThunk<
  { section: NavigationSection; ok: true },
  SaveNavigationPayload,
  { rejectValue: { code: number; message: string } }
>('translateNavigation/save', async ({ items }, { rejectWithValue }) => {
  const res = await fetch('/api/translate/navigation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) return rejectWithValue({ code: res.status, message: 'save_failed' });
  return res.json();
});
