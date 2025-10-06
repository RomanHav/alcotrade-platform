// store/slices/productFormSlice.ts
import { createSlice, type PayloadAction, type Draft } from '@reduxjs/toolkit';

export type MediaItem = {
  id: string;
  url: string;
  alt?: string | null;
  publicId?: string | null;
};

export type VariantForm = {
  id?: string;
  label?: string;
  volumeMl?: number;
  position: number;
  imageId?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
};

export type ProductFormState = {
  id?: string;
  name?: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVE';
  brandId?: string;
  description?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  variants: VariantForm[];
  images: MediaItem[];
  coverId: string | null;
  coverFallbackUrl: string | null;
};

const initialState: ProductFormState = {
  status: 'DRAFT',
  variants: [], // пусто по умолчанию — как в Shopify
  images: [],
  coverId: null,
  coverFallbackUrl: null,
};

function ensureCover(state: ProductFormState) {
  if (state.images.length === 0) {
    state.coverId = null;
    return;
  }
  const exists = state.images.some((m) => m.id === state.coverId);
  if (!exists) state.coverId = state.images[0].id;
}

const productFormSlice = createSlice({
  name: 'productForm',
  initialState,
  reducers: {
    reset: () => initialState,

    // Полная переинициализация (новый объект state)
    hydrateFromServer: (_state, action: PayloadAction<Partial<ProductFormState>>) => {
      const p = action.payload || {};
      const next: ProductFormState = {
        status: p.status ?? 'DRAFT',
        id: p.id,
        name: p.name ?? '',
        brandId: p.brandId,
        description: p.description,
        seoTitle: p.seoTitle ?? null,
        seoDescription: p.seoDescription ?? null,
        variants: Array.isArray(p.variants) ? p.variants : [],
        images: p.images ?? [],
        coverId: p.coverId ?? null,
        coverFallbackUrl: p.coverFallbackUrl ?? null,
      };
      ensureCover(next);
      return next;
    },

    // ✅ Явно типизируем state как Draft<ProductFormState> — уходит TS7006
    setField: <K extends keyof ProductFormState>(
      state: Draft<ProductFormState>,
      action: PayloadAction<{ key: K; value: ProductFormState[K] }>,
    ) => {
      state[action.payload.key] = action.payload.value as ProductFormState[K];
      if (action.payload.key === 'images' || action.payload.key === 'coverId') {
        ensureCover(state as ProductFormState);
      }
    },

    // ===== Варианты (Shopify-подобно) =====
    setVariantsFromValues: (
      state,
      action: PayloadAction<{ optionName: string; values: string[] }>,
    ) => {
      const values = action.payload.values.map((v) => v.trim()).filter(Boolean);
      state.variants = values.map((label, i) => ({
        position: i,
        label,
      }));
    },

    removeVariant: (state, action: PayloadAction<number>) => {
      state.variants = state.variants
        .filter((_, i) => i !== action.payload)
        .map((v, i) => ({ ...v, position: i }));
    },

    setVariantImage: (
      state,
      action: PayloadAction<{
        index: number;
        media: { id: string; url: string; publicId?: string };
      }>,
    ) => {
      const { index, media } = action.payload;
      const v = state.variants[index];
      if (!v) return;
      v.imageId = media.id;
      v.imageUrl = media.url;
      v.imagePublicId = media.publicId ?? null;
    },

    clearVariantImage: (state, action: PayloadAction<number>) => {
      const v = state.variants[action.payload];
      if (!v) return;
      v.imageId = null;
      v.imageUrl = null;
      v.imagePublicId = null;
    },

    // ===== Галерея =====
    addImages: (state, action: PayloadAction<MediaItem[]>) => {
      state.images = [...state.images, ...action.payload];
      if (!state.coverId && action.payload.length > 0) {
        state.coverId = action.payload[0].id;
      }
      ensureCover(state);
    },

    removeImage: (state, action: PayloadAction<string>) => {
      state.images = state.images.filter((m) => m.id !== action.payload);
      if (state.coverId === action.payload) {
        state.coverId = state.images[0]?.id ?? null;
      }
      ensureCover(state);
    },

    // ✅ Вернули экшены, которые ждёт MediaPicker
    reorderImages: (state, action: PayloadAction<{ activeId: string; overId: string }>) => {
      const { activeId, overId } = action.payload;
      if (activeId === overId) return;
      const oldIndex = state.images.findIndex((i) => i.id === activeId);
      const newIndex = state.images.findIndex((i) => i.id === overId);
      if (oldIndex < 0 || newIndex < 0) return;
      const [m] = state.images.splice(oldIndex, 1);
      state.images.splice(newIndex, 0, m);
      ensureCover(state);
    },

    setCover: (state, action: PayloadAction<string | null>) => {
      state.coverId = action.payload;
      ensureCover(state);
    },
  },
});

export const {
  reset,
  hydrateFromServer,
  setField,
  setVariantsFromValues,
  removeVariant,
  setVariantImage,
  clearVariantImage,
  addImages,
  removeImage,
  reorderImages, // 👈 экспортируем
  setCover, // 👈 экспортируем
} = productFormSlice.actions;

export default productFormSlice.reducer;
