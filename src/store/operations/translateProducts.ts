import { createAsyncThunk } from '@reduxjs/toolkit';

interface ProductRowItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: string;
  hasEn: boolean;
  brandName?: string;
}

export const fetchTranslateProducts = createAsyncThunk(
  'translateProductList/fetch',
  async (params: { q?: string; missingOnly?: boolean; status?: string; brandId?: string }) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.missingOnly) query.set('missingOnly', 'true');
    if (params.status) query.set('status', params.status);
    if (params.brandId) query.set('brandId', params.brandId);

    const res = await fetch(`/api/translate/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    
    const data = await res.json();
    return { items: data.items as ProductRowItem[] };
  }
);
