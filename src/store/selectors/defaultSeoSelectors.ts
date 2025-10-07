import type { RootState } from '@/store';

export const selectSeoState = (s: RootState) => s.seo;
export const selectSeoLoading = (s: RootState) => s.seo.loading;
export const selectSeoError = (s: RootState) => s.seo.error;

export const selectSeoVisibleTitle = (s: RootState) =>
  s.seo.touchedTitle ? s.seo.draftTitle : s.seo.current.title;

export const selectSeoVisibleDesc = (s: RootState) =>
  s.seo.touchedDescription ? s.seo.draftDescription : s.seo.current.description;

export const selectSeoImageUrl = (s: RootState) =>
  s.seo.previewUrl ?? (s.seo.removeOg ? null : s.seo.current.imageUrl);

// dirty/valid
export const selectSeoDirty = (s: RootState) => {
  const textDirty =
    (s.seo.touchedTitle && s.seo.draftTitle !== s.seo.current.title) ||
    (s.seo.touchedDescription && s.seo.draftDescription !== s.seo.current.description);
  return textDirty || s.seo.file !== null || s.seo.removeOg;
};

export const selectSeoValid = (s: RootState) => {
  const title = selectSeoVisibleTitle(s).trim();
  const desc = selectSeoVisibleDesc(s).trim();
  const nonEmpty = title.length > 0 && desc.length > 0;
  const ogOk = !(s.seo.removeOg && s.seo.file === null);
  return nonEmpty && ogOk;
};
