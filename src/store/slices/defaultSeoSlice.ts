import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadSeoSettings, saveSeoSettings } from '../operations/defaultSeoOperations';

export type SeoCurrent = {
  title: string;
  description: string;
  imageUrl: string | null;
  titleSuffix: string;
};

export type SeoState = {
  current: SeoCurrent;
  draftTitle: string;
  draftDescription: string;
  touchedTitle: boolean;
  touchedDescription: boolean;
  file: File | null;
  previewUrl: string | null;
  removeOg: boolean;
  loading: boolean;
  error: string | null;
};

const initialState: SeoState = {
  current: { title: '', description: '', imageUrl: null, titleSuffix: '' },
  draftTitle: '',
  draftDescription: '',
  touchedTitle: false,
  touchedDescription: false,
  file: null,
  previewUrl: null,
  removeOg: false,
  loading: false,
  error: null,
};

const seoSlice = createSlice({
  name: 'seo',
  initialState,
  reducers: {
    setTitle(state, action: PayloadAction<string>) {
      state.touchedTitle = true;
      state.draftTitle = action.payload;
    },
    setDescription(state, action: PayloadAction<string>) {
      state.touchedDescription = true;
      state.draftDescription = action.payload;
    },
    selectImage(state, action: PayloadAction<{ file: File; previewUrl: string }>) {
      state.file = action.payload.file;
      state.previewUrl = action.payload.previewUrl;
      state.removeOg = false;
    },
    clearImage(state) {
      state.file = null;
      state.previewUrl = null;
      state.removeOg = true;
    },
    resetAll(state) {
      state.draftTitle = '';
      state.draftDescription = '';
      state.touchedTitle = false;
      state.touchedDescription = false;
      state.file = null;
      state.previewUrl = null;
      state.removeOg = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSeoSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSeoSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;

        state.draftTitle = '';
        state.draftDescription = '';
        state.touchedTitle = false;
        state.touchedDescription = false;
        state.file = null;
        state.previewUrl = null;
        state.removeOg = false;
      })
      .addCase(loadSeoSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? 'Не вдалося завантажити SEO';
      });

    builder
      .addCase(saveSeoSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveSeoSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;

        state.draftTitle = '';
        state.draftDescription = '';
        state.touchedTitle = false;
        state.touchedDescription = false;
        state.file = null;
        state.previewUrl = null;
        state.removeOg = false;
      })
      .addCase(saveSeoSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? 'Не вдалося зберегти SEO';
      });
  },
});

export const { setTitle, setDescription, selectImage, clearImage, resetAll } = seoSlice.actions;
export default seoSlice.reducer;
