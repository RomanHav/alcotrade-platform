import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { hydrateTheme, saveTheme, syncThemeFromDB } from '../operations/themeOperation';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeState = {
  initial: ThemeMode;
  draft: ThemeMode;
  previewing: boolean;
  loading: boolean;
  error: string | null;
};

const initialState: ThemeState = {
  initial: 'system',
  draft: 'system',
  previewing: false,
  loading: false,
  error: null,
};

const slice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setInitial(state, action: PayloadAction<ThemeMode>) {
      state.initial = action.payload;
      if (!state.previewing) state.draft = action.payload;
    },
    setDraft(state, action: PayloadAction<ThemeMode>) {
      state.draft = action.payload;
    },
    setPreviewing(state, action: PayloadAction<boolean>) {
      state.previewing = action.payload;
    },
    resetDraft(state) {
      state.draft = state.initial;
    },
    endPreviewOnly(state) {
      state.previewing = false;
    },

    commit(state) {
      state.initial = state.draft;
      state.previewing = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(hydrateTheme.fulfilled, (state, action) => {
      state.error = null;
      state.previewing = false;
      state.initial = action.payload;
      state.draft = action.payload;
    });

    builder
      .addCase(saveTheme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveTheme.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.initial = action.payload;
        state.draft = action.payload;
        state.previewing = false;
      })
      .addCase(saveTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message ?? 'Failed to save theme';
      });

    builder.addCase(syncThemeFromDB.fulfilled, (state, action) => {
      if (action.payload) {
        state.initial = action.payload;
        if (!state.previewing) state.draft = action.payload;
      }
    });
  },
});

export const { setInitial, setDraft, setPreviewing, resetDraft, endPreviewOnly, commit } =
  slice.actions;

export default slice.reducer;
