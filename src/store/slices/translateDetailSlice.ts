// store/slices/translateDetailSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTranslateProduct, saveTranslateProduct, TranslateDetail } from '../operations/translate';

export type TranslateDraft = {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  variants: Array<{ variantId: string; label: string }>;
};

type DetailState = {
  data: TranslateDetail['product'] | null;
  draft: TranslateDraft | null;
  loading: boolean;
  saving: boolean;
  error?: string | null;
};

const initialState: DetailState = {
  data: null,
  draft: null,
  loading: false,
  saving: false,
  error: null,
};

const slice = createSlice({
  name: 'translateDetail',
  initialState,
  reducers: {
    clear: () => initialState,
    hydrateFromServer: (s, a: PayloadAction<TranslateDetail['product']>) => {
      s.data = a.payload;
      const en = a.payload.translations?.[0] || null;
      s.draft = {
        name: en?.name ?? '',
        slug: en?.slug ?? '',
        description: en?.description ?? '',
        seoTitle: en?.seoTitle ?? '',
        seoDescription: en?.seoDescription ?? '',
        variants: a.payload.variants.map((v) => ({ variantId: v.id, label: v.translations?.[0]?.label ?? '' })),
      };
    },
    resetDraftToServer: (s: DetailState) => {
      if (!s.data) return;
      const en = s.data.translations?.[0] || null;
      s.draft = {
        name: en?.name ?? '',
        slug: en?.slug ?? '',
        description: en?.description ?? '',
        seoTitle: en?.seoTitle ?? '',
        seoDescription: en?.seoDescription ?? '',
        variants: s.data.variants.map((v) => ({ variantId: v.id, label: v.translations?.[0]?.label ?? '' })),
      };
    },
    setField: <K extends keyof TranslateDraft>(s: DetailState, a: PayloadAction<{ key: K; value: TranslateDraft[K] }>) => {
      if (!s.draft) return;
      (s.draft[a.payload.key] as any) = a.payload.value as any;
    },
    setVariantLabel: (s: DetailState, a: PayloadAction<{ variantId: string; label: string }>) => {
      if (!s.draft) return;
      const idx = s.draft.variants.findIndex((v) => v.variantId === a.payload.variantId);
      if (idx >= 0) s.draft.variants[idx].label = a.payload.label;
    },
    resetDraft: (s: DetailState) => {
      if (!s.data) return;
      s.draft = {
        name: '',
        slug: '',
        description: '',
        seoTitle: '',
        seoDescription: '',
        variants: s.data.variants.map((v) => ({ variantId: v.id, label: '' })),
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTranslateProduct.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchTranslateProduct.fulfilled, (s, a) => {
        s.loading = false;
        s.data = a.payload.product;
        const en = a.payload.product.translations?.[0] || null;
        s.draft = {
          name: en?.name ?? '',
          slug: en?.slug ?? '',
          description: en?.description ?? '',
          seoTitle: en?.seoTitle ?? '',
          seoDescription: en?.seoDescription ?? '',
          variants: a.payload.product.variants.map((v) => ({ variantId: v.id, label: v.translations?.[0]?.label ?? '' })),
        };
      })
      .addCase(fetchTranslateProduct.rejected, (s) => {
        s.loading = false;
        s.error = 'failed_detail';
      })
      .addCase(saveTranslateProduct.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(saveTranslateProduct.fulfilled, (s) => {
        s.saving = false;
      })
      .addCase(saveTranslateProduct.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload?.message || 'save_failed';
      });
  },
});

export const { clear, hydrateFromServer, resetDraftToServer, setField, setVariantLabel, resetDraft } = slice.actions;
export default slice.reducer;
