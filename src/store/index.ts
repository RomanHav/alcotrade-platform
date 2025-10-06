// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import productFormReducer from './slices/productFormSlice';
import brandFormReducer from './slices/brandFormSlice';
import partnersReducer from './slices/partnersSlice';

export const store = configureStore({
  reducer: {
    productForm: productFormReducer,
    brandForm: brandFormReducer,
    partners: partnersReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
