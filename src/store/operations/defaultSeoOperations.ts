import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/store';


type SiteSettingsDto = {
  defaultSeoTitle?: string | null;
  defaultSeoDescription?: string | null;
  ogImageUrl?: string | null;
  titleSuffix?: string | null;
  updatedAt?: string;
};


type SeoCurrent = {
  title: string;
  description: string;
  imageUrl: string | null;
  titleSuffix: string;
};

const mapDtoToCurrent = (s?: SiteSettingsDto | null): SeoCurrent => ({
  title: s?.defaultSeoTitle ?? '',
  description: s?.defaultSeoDescription ?? '',
  imageUrl: s?.ogImageUrl ?? null,
  titleSuffix: s?.titleSuffix ?? '',
});

export const loadSeoSettings = createAsyncThunk<SeoCurrent>('seo/load', async () => {
  const r = await fetch('/api/site-settings', { cache: 'no-store' });
  if (!r.ok) throw new Error('Не вдалося завантажити налаштування SEO');
  const { settings } = (await r.json()) as { settings?: SiteSettingsDto | null };
  return mapDtoToCurrent(settings ?? null);
});

export const saveSeoSettings = createAsyncThunk<SeoCurrent, void, { state: RootState }>(
  'seo/save',
  async (_arg, { getState }) => {
    const s = getState().seo;

    const fd = new FormData();
    if (s.touchedTitle) fd.append('defaultSeoTitle', s.draftTitle || '');
    if (s.touchedDescription) fd.append('defaultSeoDescription', s.draftDescription || '');
    if (s.file) fd.append('ogImage', s.file);
    else if (s.removeOg) fd.append('removeOg', '1');

    if ([...fd.keys()].length === 0) return s.current;

    const r = await fetch('/api/site-settings', { method: 'PATCH', body: fd });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}) as any);
      throw new Error(j?.error ?? 'Не вдалося зберегти налаштування SEO');
    }

    const { settings } = (await r.json()) as { settings: SiteSettingsDto };
    return mapDtoToCurrent(settings);
  },
);
