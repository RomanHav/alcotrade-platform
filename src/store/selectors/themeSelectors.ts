import type { RootState } from '@/store';

export const selectThemeInitial = (s: RootState) => s.theme.initial;
export const selectThemeDraft = (s: RootState) => s.theme.draft;
export const selectThemeDirty = (s: RootState) => s.theme.draft !== s.theme.initial;
export const selectThemePreviewing = (s: RootState) => s.theme.previewing;
export const selectThemeLoading = (s: RootState) => s.theme.loading;
export const selectThemeError = (s: RootState) => s.theme.error;
