// src/store/slices/translateNavigationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchNavigation,
  saveNavigation,
  NavigationSection,
} from '../operations/translateNavigation';

export type NavigationItemDraft = {
  key: string;
  valueUk: string;
  valueEn: string;
};

export type TranslateNavigationState = {
  section: NavigationSection | null;
  draft: NavigationItemDraft[];
  loading: boolean;
  saving: boolean;
};

const initialState: TranslateNavigationState = {
  section: null,
  draft: [],
  loading: false,
  saving: false,
};

const slice = createSlice({
  name: 'translateNavigation',
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
    hydrateSection: (state, action: PayloadAction<NavigationSection>) => {
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
      .addCase(fetchNavigation.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNavigation.fulfilled, (state, action) => {
        state.loading = false;
        state.section = action.payload.section;
        state.draft = action.payload.section.items.map((item) => ({
          key: item.key,
          valueUk: item.valueUk,
          valueEn: item.valueEn ?? '',
        }));
      })
      .addCase(fetchNavigation.rejected, (state) => {
        state.loading = false;
      })
      // Save
      .addCase(saveNavigation.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveNavigation.fulfilled, (state, action) => {
        state.saving = false;
        state.section = action.payload.section;
        state.draft = action.payload.section.items.map((item) => ({
          key: item.key,
          valueUk: item.valueUk,
          valueEn: item.valueEn ?? '',
        }));
      })
      .addCase(saveNavigation.rejected, (state) => {
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
