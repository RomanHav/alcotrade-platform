// src/store/slices/translateMainPageSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchMainPageSections,
  fetchMainPageSection,
  saveMainPageSection,
  MainPageSection,
  MainPageSectionItem,
} from '../operations/translateMainPage';

export type MainPageItemDraft = {
  key: string;
  valueUk: string;
  valueEn: string;
};

export type TranslateMainPageState = {
  sections: MainPageSection[];
  selectedSectionKey: string | null;
  currentSection: MainPageSection | null;
  draft: MainPageItemDraft[];
  loading: boolean;
  saving: boolean;
};

const initialState: TranslateMainPageState = {
  sections: [],
  selectedSectionKey: null,
  currentSection: null,
  draft: [],
  loading: false,
  saving: false,
};

const slice = createSlice({
  name: 'translateMainPage',
  initialState,
  reducers: {
    selectSection: (state, action: PayloadAction<string>) => {
      state.selectedSectionKey = action.payload;
    },
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
      if (state.currentSection) {
        state.draft = state.currentSection.items.map((item) => ({
          key: item.key,
          valueUk: item.valueUk,
          valueEn: item.valueEn ?? '',
        }));
      }
    },
    hydrateSections: (state, action: PayloadAction<MainPageSection[]>) => {
      state.sections = action.payload;
    },
    hydrateSection: (state, action: PayloadAction<MainPageSection>) => {
      state.currentSection = action.payload;
      state.selectedSectionKey = action.payload.key;
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
      // Fetch all sections
      .addCase(fetchMainPageSections.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMainPageSections.fulfilled, (state, action) => {
        state.loading = false;
        state.sections = action.payload.sections;
      })
      .addCase(fetchMainPageSections.rejected, (state) => {
        state.loading = false;
      })
      // Fetch single section
      .addCase(fetchMainPageSection.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMainPageSection.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSection = action.payload.section;
        state.draft = action.payload.section.items.map((item) => ({
          key: item.key,
          valueUk: item.valueUk,
          valueEn: item.valueEn ?? '',
        }));
      })
      .addCase(fetchMainPageSection.rejected, (state) => {
        state.loading = false;
      })
      // Save section
      .addCase(saveMainPageSection.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveMainPageSection.fulfilled, (state, action) => {
        state.saving = false;
        state.currentSection = action.payload.section;
        // Update section in list
        const idx = state.sections.findIndex((s) => s.key === action.payload.section.key);
        if (idx !== -1) {
          state.sections[idx] = action.payload.section;
        }
        // Reset draft to saved state
        state.draft = action.payload.section.items.map((item) => ({
          key: item.key,
          valueUk: item.valueUk,
          valueEn: item.valueEn ?? '',
        }));
      })
      .addCase(saveMainPageSection.rejected, (state) => {
        state.saving = false;
      });
  },
});

export const {
  selectSection,
  setItemValue,
  resetDraft,
  hydrateSections,
  hydrateSection,
  clear,
} = slice.actions;

export default slice.reducer;
