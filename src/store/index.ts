import { configureStore } from '@reduxjs/toolkit';
import productFormReducer from './slices/productFormSlice';
import brandFormReducer from './slices/brandFormSlice';
import partnersReducer from './slices/partnersSlice';
import productsUi from './slices/productsUiSlice';
import themeReducer from './slices/themeSlice';
import seoReducer from './slices/defaultSeoSlice';
import articleReducer from './slices/articles';
import translateListReducer from './slices/translateListSlice';
import translateDetailReducer from './slices/translateDetailSlice';
import translateBrandListReducer from './slices/translateBrandListSlice';
import translateBrandDetailReducer from './slices/translateBrandDetailSlice';

export const store = configureStore({
  reducer: {
    productForm: productFormReducer,
    brandForm: brandFormReducer,
    articles: articleReducer,

    partners: partnersReducer,
    productsUi,
    theme: themeReducer,
    seo: seoReducer,
    translateList: translateListReducer,
    translateDetail: translateDetailReducer,
  translateBrandList: translateBrandListReducer,
  translateBrandDetail: translateBrandDetailReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
