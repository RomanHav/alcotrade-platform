import { configureStore } from '@reduxjs/toolkit';
import productFormReducer from './slices/productFormSlice';
import brandFormReducer from './slices/brandFormSlice';
import partnersReducer from './slices/partnersSlice';
import productsUi from './slices/productsUiSlice';
import themeReducer from './slices/themeSlice';
import seoReducer from './slices/defaultSeoSlice';

export const store = configureStore({
  reducer: {
    productForm: productFormReducer,
    brandForm: brandFormReducer,
    partners: partnersReducer,
    productsUi,
    theme: themeReducer,
    seo: seoReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
