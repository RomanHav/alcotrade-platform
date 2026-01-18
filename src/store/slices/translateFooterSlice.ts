// src/store/slices/translateFooterSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchFooter,
  saveFooter,
  FooterSection,
} from '../operations/translateFooter';

export type FooterItemDraft = {
  key: string;
  valueUk: string;
  valueEn: string;
};

export type TranslateFooterState = {
  section: FooterSection | null;
  draft: FooterItemDraft[];
  loading: boolean;
  saving: boolean;
};

const initialState: TranslateFooterState = {
  section: null,
  draft: [],
  loading: false,
  saving: false,
};

const slice = createSlice({
  name: 'translateFooter',
  initialState,
  reducers: {
    setItemValue: (
      state,
      action: PayloadAction<{ key: string; field: 'valueUk' | 'valueEn'; value: string }>
    ) => {
      const item = state.draft.find((i) => i.key === action.payload.key);
      if (item) {
        item[action.payload.field] = action.payload.value;
      }
    },
    resetDraft: (state) => {
      if (state.section) {
        state.draft = state.section.items.map((item) => ({
          key: item.key,
          valueUk: item.valueUk,
          valueEn: item.valueEn ?? '',
        }));
      }
    },
    hydrateSection: (state, action: PayloadAction<FooterSection>) => {
      state.section = action.payload;
      state.draft = action.payload.items.map((item) => ({
        key: item.key,
        valueUk: item.valueUk,
        valueEn: item.valueEn ?? '',
      }));
    },
    clear: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchFooter.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFooter.fulfilled, (state, action) => {
        state.loading = false;
        state.section = action.payload.section;
        state.draft = action.payload.section.items.map((item) => ({
          key: item.key,
          valueUk: item.valueUk,
          valueEn: item.valueEn ?? '',
        }));
      })
      .addCase(fetchFooter.rejected, (state) => {
        state.loading = false;
      })
      // Save
      .addCase(saveFooter.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveFooter.fulfilled, (state, action) => {
        state.saving = false;
        state.section = action.payload.section;
        state.draft = action.payload.section.items.map((item) => ({
          key: item.key,
          valueUk: item.valueUk,
          valueEn: item.valueEn ?? '',
        }));
      })
      .addCase(saveFooter.rejected, (state) => {
        state.saving = false;
      });
  },
});

export const {
  setItemValue,
  resetDraft,
  hydrateSection,
  clear,
} = slice.actions;

export default slice.reducer;
