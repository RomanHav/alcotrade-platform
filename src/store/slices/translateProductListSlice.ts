import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchTranslateProducts } from '../operations/translateProducts';

interface ProductRowItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: string;
  hasEn: boolean;
  brandName?: string;
}

interface TranslateProductListState {
  items: ProductRowItem[];
  q: string;
  missingOnly: boolean;
  loading: boolean;
  status?: string;
  brandId?: string;
}

const initialState: TranslateProductListState = {
  items: [],
  q: '',
  missingOnly: false,
  loading: false,
  status: undefined,
  brandId: undefined,
};

const translateProductListSlice = createSlice({
  name: 'translateProductList',
  initialState,
  reducers: {
    hydrateInitial(state, action: PayloadAction<{ items: ProductRowItem[] }>) {
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
    setBrandId(state, action: PayloadAction<string | undefined>) {
      state.brandId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTranslateProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTranslateProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
      })
      .addCase(fetchTranslateProducts.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { hydrateInitial, setQuery, setMissingOnly, setStatus, setBrandId } = translateProductListSlice.actions;
export default translateProductListSlice.reducer;