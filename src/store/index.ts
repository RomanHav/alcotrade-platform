// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import productFormReducer from './slices/productFormSlice';
import brandFormReducer from './slices/brandFormSlice';
import partnersReducer from './slices/partnersSlice';
import productsUi from './slices/productsUiSlice';
export const store = configureStore({
  reducer: {
    productForm: productFormReducer,
    brandForm: brandFormReducer,
    partners: partnersReducer,
    productsUi,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
