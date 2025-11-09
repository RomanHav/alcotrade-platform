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

const slice = createSlice({
  name: 'translateBrandList',
  initialState,
  reducers: {
    setQuery: (s, a: PayloadAction<string>) => {
      s.q = a.payload;
    },
    setMissingOnly: (s, a: PayloadAction<boolean>) => {
      s.missingOnly = a.payload;
    },
    setStatus: (s, a: PayloadAction<string | undefined>) => {
      s.status = a.payload;
    },
    hydrateInitial: (
      s,
      a: PayloadAction<{ items: TranslateBrandListItem[]; total?: number; page?: number; limit?: number }>,
    ) => {
      s.items = a.payload.items;
      if (a.payload.total != null) s.total = a.payload.total;
      if (a.payload.page != null) s.page = a.payload.page;
      if (a.payload.limit != null) s.limit = a.payload.limit;
    },
    clear: () => initialState,
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

export const { setQuery, setMissingOnly, setStatus, hydrateInitial, clear } = slice.actions;
export default slice.reducer;
