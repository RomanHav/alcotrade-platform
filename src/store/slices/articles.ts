// store/slices/articles.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RowSelectionState } from '@tanstack/react-table';
import {
  deleteArticle,
  fetchArticles,
  saveArticle,
  type ArticleListItem,
  type NewsStatus,
} from '../operations/articles';

export type ArticleForm = {
  id?: string | null;
  status: NewsStatus;
  title?: string;
  excerpt?: string;
  content?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  coverId?: string | null;
  coverUrl?: string | null;
  date?: string | null;
  slug?: string | null;

  pendingCoverFile?: File | null; 
  pendingCoverDelete?: boolean;
};

export type ArticlesState = {
  // список
  items: ArticleListItem[];
  total: number;
  loading: boolean;
  error?: string | null;

  page: number;
  pageSize: number;

  query: string;
  status?: NewsStatus;
  date?: string | null; // одиночна дата-фільтр
  sort: string;

  rowSelection: RowSelectionState;

  // форма
  form: ArticleForm;
};

// ───────────────────────────────────────────────────────────────────────────────
// Initial state
// ───────────────────────────────────────────────────────────────────────────────
const initialForm: ArticleForm = {
  id: null,
  status: 'DRAFT',
  title: '',
  excerpt: '',
  content: '',
  seoTitle: null,
  seoDescription: null,
  coverId: null,
  coverUrl: null,
  date: null,
  slug: null,
  pendingCoverFile: null,
  pendingCoverDelete: false,
};

const initialState: ArticlesState = {
  items: [],
  total: 0,
  loading: false,
  error: null,

  page: 1,
  pageSize: 10,

  query: '',
  status: undefined,
  date: null,
  sort: 'name_asc',

  rowSelection: {},

  form: initialForm,
};

// ───────────────────────────────────────────────────────────────────────────────
// Slice
// ───────────────────────────────────────────────────────────────────────────────
const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    // ------- список: фільтри/пагінація/сорт
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, action.payload || 1);
    },
    setPageSize(state, action: PayloadAction<number>) {
      const v = Math.min(100, Math.max(5, action.payload || 10));
      state.pageSize = v;
      state.page = 1;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload ?? '';
      state.page = 1;
    },
    setStatus(state, action: PayloadAction<NewsStatus | undefined>) {
      state.status = action.payload;
      state.page = 1;
    },
    setDate(state, action: PayloadAction<string | null | undefined>) {
      state.date = action.payload ?? null;
      state.page = 1;
    },
    setSort(state, action: PayloadAction<string>) {
      state.sort = action.payload || 'name_asc';
    },

    // ------- список: вибір
    setRowSelection(state, action: PayloadAction<RowSelectionState>) {
      state.rowSelection = action.payload || {};
    },
    clearSelection(state) {
      state.rowSelection = {};
    },

    // ------- форма
    hydrateFormFromServer(state, action: PayloadAction<Partial<ArticleForm>>) {
      // При гідрації з сервера скидаємо відкладені операції
      state.form = {
        ...initialForm,
        ...action.payload,
        pendingCoverFile: null,
        pendingCoverDelete: false,
      };
    },
    setFormField<K extends keyof ArticleForm>(
      state: any,
      action: PayloadAction<{ key: K; value: ArticleForm[K] }>,
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state.form[action.payload.key] as any) = action.payload.value as any;
    },
    resetForm(state) {
      state.form = initialForm;
    },
    // зручні шорткати
    markCoverForDelete(state) {
      state.form.pendingCoverFile = null;
      state.form.pendingCoverDelete = true;
      state.form.coverId = null;
      state.form.coverUrl = null;
    },
    clearPendingCover(state) {
      state.form.pendingCoverFile = null;
      state.form.pendingCoverDelete = false;
    },
  },
  extraReducers(builder) {
    // список
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.rowSelection = {};
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || (action.error?.message as string) || 'Failed to fetch';
      });

    builder.addCase(saveArticle.fulfilled, (state, action) => {
      state.form = initialForm;
    });

    builder.addCase(deleteArticle.fulfilled, (state, action) => {
      const remove = new Set(action.payload.ids);
      state.items = state.items.filter((i) => !remove.has(i.id));
      state.total = Math.max(0, state.total - action.payload.ids.length);
      state.rowSelection = {};
    });
  },
});

export const {
  setPage,
  setPageSize,
  setQuery,
  setStatus,
  setDate,
  setSort,
  setRowSelection,
  clearSelection,

  hydrateFormFromServer,
  setFormField,
  resetForm,
  markCoverForDelete,
  clearPendingCover,
} = articlesSlice.actions;

export default articlesSlice.reducer;
