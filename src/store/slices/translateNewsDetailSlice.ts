// src/store/slices/translateNewsDetailSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTranslateNewsDetail, saveTranslateNews, TranslateNewsDetail } from '../operations/translateNews';

export type NewsTranslateDraft = {
  title: string;
  slug: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
};

export type TranslateNewsDetailState = {
  data?: TranslateNewsDetail;
  draft?: NewsTranslateDraft;
  loading: boolean;
  saving: boolean;
};

const initialState: TranslateNewsDetailState = {
  loading: false,
  saving: false,
};

const slice = createSlice({
  name: 'translateNewsDetail',
  initialState,
  reducers: {
    hydrateFromServer: (s, a: PayloadAction<TranslateNewsDetail>) => {
      s.data = a.payload;
      const en = a.payload.en;
      s.draft = {
        title: en?.title ?? '',
        slug: en?.slug ?? '',
        content: en?.content ?? '',
        seoTitle: en?.seoTitle ?? '',
        seoDescription: en?.seoDescription ?? '',
      };
    },
    setField: (s, a: PayloadAction<{ key: keyof NewsTranslateDraft; value: string }>) => {
      if (!s.draft) return;
      (s.draft as any)[a.payload.key] = a.payload.value;
    },
    resetDraftToServer: (s) => {
      if (!s.data) return;
      const en = s.data.en;
      s.draft = {
        title: en?.title ?? '',
        slug: en?.slug ?? '',
        content: en?.content ?? '',
        seoTitle: en?.seoTitle ?? '',
        seoDescription: en?.seoDescription ?? '',
      };
    },
    resetDraft: (s) => {
      s.draft = {
        title: '',
        slug: '',
        content: '',
        seoTitle: '',
        seoDescription: '',
      };
    },
    clear: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTranslateNewsDetail.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchTranslateNewsDetail.fulfilled, (s, a) => {
        s.loading = false;
        s.data = a.payload;
        const en = a.payload.en;
        s.draft = {
          title: en?.title ?? '',
          slug: en?.slug ?? '',
          content: en?.content ?? '',
          seoTitle: en?.seoTitle ?? '',
          seoDescription: en?.seoDescription ?? '',
        };
      })
      .addCase(fetchTranslateNewsDetail.rejected, (s) => {
        s.loading = false;
      })
      .addCase(saveTranslateNews.pending, (s) => {
        s.saving = true;
      })
      .addCase(saveTranslateNews.fulfilled, (s) => {
        s.saving = false;
      })
      .addCase(saveTranslateNews.rejected, (s) => {
        s.saving = false;
      });
  },
});

export const { hydrateFromServer, setField, resetDraftToServer, resetDraft, clear } = slice.actions;
export default slice.reducer;
