// store/slices/productsUiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ProductsUiState = {
  selectedIds: string[];
};

const initialState: ProductsUiState = { selectedIds: [] };

const slice = createSlice({
  name: 'productsUi',
  initialState,
  reducers: {
    setSelectedIds: (s, a: PayloadAction<string[]>) => {
      s.selectedIds = a.payload;
    },
    clearSelection: (s) => {
      s.selectedIds = [];
    },
  },
});

export const { setSelectedIds, clearSelection } = slice.actions;
export default slice.reducer;
