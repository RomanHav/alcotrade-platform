// store/slices/translateListSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTranslateProducts, TranslateListItem } from '../operations/translate';

type TranslateListState = {
  items: TranslateListItem[];
  loading: boolean;
  q: string;
  missingOnly: boolean;
  status?: string;
  brandId?: string;
  page: number;
  limit: number;
  total: number;
};

const initialState: TranslateListState = {
  items: [],
  loading: false,
  q: '',
  missingOnly: false,
  status: undefined,
  brandId: undefined,
  page: 1,
  limit: 20,
  total: 0,
};

const slice = createSlice({
  name: 'translateList',
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
    setBrandId: (s, a: PayloadAction<string | undefined>) => {
      s.brandId = a.payload;
    },
    hydrateInitial: (
      s,
      a: PayloadAction<{ items: TranslateListItem[]; total?: number; page?: number; limit?: number }>,
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
      .addCase(fetchTranslateProducts.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchTranslateProducts.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.items;
        s.total = a.payload.total;
        s.page = a.payload.page;
        s.limit = a.payload.limit;
      })
      .addCase(fetchTranslateProducts.rejected, (s) => {
        s.loading = false;
      });
  },
});

export const { setQuery, setMissingOnly, setStatus, setBrandId, hydrateInitial, clear } = slice.actions;
export default slice.reducer;
