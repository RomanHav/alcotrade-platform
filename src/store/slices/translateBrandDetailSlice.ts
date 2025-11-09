// store/slices/translateBrandDetailSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTranslateBrand, saveTranslateBrand, TranslateBrandDetail } from '../operations/translateBrands';

export type BrandTranslateDraft = {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

export type TranslateBrandDetailState = {
  data?: TranslateBrandDetail;
  draft?: BrandTranslateDraft;
  loading: boolean;
  saving: boolean;
};

const initialState: TranslateBrandDetailState = {
  loading: false,
  saving: false,
};

const slice = createSlice({
  name: 'translateBrandDetail',
  initialState,
  reducers: {
    hydrateFromServer: (s, a: PayloadAction<TranslateBrandDetail>) => {
      s.data = a.payload;
      const en = a.payload.translations?.[0];
      s.draft = {
        name: en?.name ?? '',
        slug: en?.slug ?? '',
        description: en?.description ?? '',
        seoTitle: en?.seoTitle ?? '',
        seoDescription: en?.seoDescription ?? '',
      };
    },
    setField: (s, a: PayloadAction<{ key: keyof BrandTranslateDraft; value: string }>) => {
      if (!s.draft) return;
      (s.draft as any)[a.payload.key] = a.payload.value;
    },
    resetDraftToServer: (s) => {
      if (!s.data) return;
      const en = s.data.translations?.[0];
      s.draft = {
        name: en?.name ?? '',
        slug: en?.slug ?? '',
        description: en?.description ?? '',
        seoTitle: en?.seoTitle ?? '',
        seoDescription: en?.seoDescription ?? '',
      };
    },
    resetDraft: (s) => {
      s.draft = {
        name: '',
        slug: '',
        description: '',
        seoTitle: '',
        seoDescription: '',
      };
    },
    clear: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTranslateBrand.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchTranslateBrand.fulfilled, (s, a) => {
        s.loading = false;
        s.data = a.payload;
        const en = a.payload.translations?.[0];
        s.draft = {
          name: en?.name ?? '',
            slug: en?.slug ?? '',
            description: en?.description ?? '',
            seoTitle: en?.seoTitle ?? '',
            seoDescription: en?.seoDescription ?? '',
        };
      })
      .addCase(fetchTranslateBrand.rejected, (s) => {
        s.loading = false;
      })
      .addCase(saveTranslateBrand.pending, (s) => {
        s.saving = true;
      })
      .addCase(saveTranslateBrand.fulfilled, (s) => {
        s.saving = false;
      })
      .addCase(saveTranslateBrand.rejected, (s) => {
        s.saving = false;
      });
  },
});

export const { hydrateFromServer, setField, resetDraftToServer, resetDraft, clear } = slice.actions;
export default slice.reducer;
