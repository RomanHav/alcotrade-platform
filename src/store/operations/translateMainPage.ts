// src/store/operations/translateMainPage.ts
import { createAsyncThunk } from '@reduxjs/toolkit';

export type MainPageSectionItem = {
  id: string;
  key: string;
  valueUk: string;
  valueEn: string | null;
  position: number;
};

export type MainPageSection = {
  id: string;
  key: string;
  position: number;
  isVisible: boolean;
  items: MainPageSectionItem[];
  updatedAt: string;
};

export const fetchMainPageSections = createAsyncThunk<
  { sections: MainPageSection[] }
>('translateMainPage/fetchSections', async () => {
  const res = await fetch('/api/translate/main-page');
  if (!res.ok) throw new Error('failed_list');
  return res.json();
});

export const fetchMainPageSection = createAsyncThunk<
  { section: MainPageSection },
  { sectionKey: string }
>('translateMainPage/fetchSection', async ({ sectionKey }) => {
  const res = await fetch(`/api/translate/main-page/${sectionKey}`);
  if (!res.ok) throw new Error('failed_detail');
  return res.json();
});

export type SaveMainPageSectionPayload = {
  sectionKey: string;
  items: { key: string; valueUk: string; valueEn: string | null }[];
};

export const saveMainPageSection = createAsyncThunk<
  { section: MainPageSection; ok: true },
  SaveMainPageSectionPayload,
  { rejectValue: { code: number; message: string } }
>('translateMainPage/saveSection', async ({ sectionKey, items }, { rejectWithValue }) => {
  const res = await fetch(`/api/translate/main-page/${sectionKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) return rejectWithValue({ code: res.status, message: 'save_failed' });
  return res.json();
});
