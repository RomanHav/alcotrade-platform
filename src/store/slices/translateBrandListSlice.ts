// store/slices/translateBrandListSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTranslateBrands, TranslateBrandListItem } from '../operations/translateBrands';

export type TranslateBrandListState = {
  items: TranslateBrandListItem[];
  loading: boolean;
  q: string;
  missingOnly: boolean;
  status?: string;
  page: number;
  limit: number;
  total: number;
};

const initialState: TranslateBrandListState = {
  items: [],
  loading: false,
  q: '',
  missingOnly: false,
  status: undefined,
  page: 1,
  limit: 20,
  total: 0,
};

const translateBrandListSlice = createSlice({
  name: 'translateBrandList',
  initialState,
  reducers: {
    hydrateInitial(state, action: PayloadAction<{ items: TranslateBrandListItem[] }>) {
      state.items = action.payload.items;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.q = action.payload;
    },
    setMissingOnly(state, action: PayloadAction<boolean>) {
      state.missingOnly = action.payload;
    },
    setStatus(state, action: PayloadAction<string | undefined>) {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTranslateBrands.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchTranslateBrands.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.items;
        s.total = a.payload.total;
        s.page = a.payload.page;
        s.limit = a.payload.limit;
      })
      .addCase(fetchTranslateBrands.rejected, (s) => {
        s.loading = false;
      });
  },
});

export const { hydrateInitial, setQuery, setMissingOnly, setStatus } = translateBrandListSlice.actions;
export default translateBrandListSlice.reducer;
