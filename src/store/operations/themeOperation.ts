import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '@/store';
import { setDraft, setPreviewing, endPreviewOnly, type ThemeMode } from '../slices/themeSlice';

const readLocal = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  const t = localStorage.getItem('theme');
  return t === 'light' || t === 'dark' ? (t as ThemeMode) : 'system';
};

const writeLocal = (mode: ThemeMode) => {
  if (typeof window === 'undefined') return;
  if (mode === 'light' || mode === 'dark') localStorage.setItem('theme', mode);
  else localStorage.removeItem('theme'); // system
};

const getThemeGetUrl = (userId?: string) =>
  userId ? `/api/users/${userId}/theme` : `/api/me/settings/theme`;

const getThemePatchUrl = (userId?: string) =>
  userId ? `/api/users/${userId}/theme` : `/api/me/settings/theme`;

export const hydrateTheme = createAsyncThunk<ThemeMode, void, { state: RootState }>(
  'theme/hydrate',
  async () => {
    const initial = readLocal();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme:preview:end'));
    }
    return initial;
  },
);

export const saveTheme = createAsyncThunk<
  ThemeMode,
  { userId?: string } | void,
  { state: RootState }
>('theme/save', async (arg, { getState }) => {
  const { draft } = (getState() as RootState).theme;
  const userId = (arg as { userId?: string } | undefined)?.userId;

  try {
    await fetch(getThemePatchUrl(userId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: draft }),
    });
  } catch {}

  writeLocal(draft);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('theme:apply', { detail: { mode: draft } }));
    window.dispatchEvent(new CustomEvent('theme:preview:end'));
  }

  return draft;
});

export const syncThemeFromDB = createAsyncThunk<
  ThemeMode | null,
  { userId?: string } | void,
  { state: RootState }
>('theme/syncFromDB', async (arg) => {
  const userId = (arg as { userId?: string } | undefined)?.userId;

  try {
    const r = await fetch(getThemeGetUrl(userId), { cache: 'no-store' });
    if (!r.ok) return null;

    const data = await r.json();
    const dbTheme = (data?.theme ?? null) as ThemeMode | null;
    if (dbTheme) {
      writeLocal(dbTheme);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('theme:apply', { detail: { mode: dbTheme } }));
      }
    }
    return dbTheme;
  } catch {
    return null;
  }
});

export const previewTheme = (mode: ThemeMode) => (dispatch: AppDispatch) => {
  dispatch(setDraft(mode));
  dispatch(setPreviewing(true));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('theme:preview', { detail: { mode } }));
  }
};

export const cancelPreview = () => (dispatch: AppDispatch, getState: () => RootState) => {
  const { initial } = getState().theme;
  dispatch(setDraft(initial));
  dispatch(setPreviewing(false));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('theme:preview:end'));
  }
};

export const endPreview = () => (dispatch: AppDispatch) => {
  dispatch(endPreviewOnly());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('theme:preview:end'));
  }
};
