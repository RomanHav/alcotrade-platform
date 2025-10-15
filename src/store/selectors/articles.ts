// store/selectors/articles.ts
import type { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';

export const selectArticlesState = (s: RootState) => s.articles;

// список
export const selectItems = (s: RootState) => s.articles.items;
export const selectTotal = (s: RootState) => s.articles.total;
export const selectLoading = (s: RootState) => s.articles.loading;
export const selectError = (s: RootState) => s.articles.error;

export const selectPage = (s: RootState) => s.articles.page;
export const selectPageSize = (s: RootState) => s.articles.pageSize;

export const selectQuery = (s: RootState) => s.articles.query;
export const selectStatus = (s: RootState) => s.articles.status;
export const selectDate = (s: RootState) => s.articles.date;
export const selectSort = (s: RootState) => s.articles.sort;

export const selectRowSelection = (s: RootState) => s.articles.rowSelection;
export const selectSelectedIds = createSelector(selectItems, selectRowSelection, (items, sel) =>
  Object.keys(sel)
    .filter((k) => (sel as any)[k])
    .map((rowId) => {
      const idx = Number(rowId);
      return Number.isFinite(idx) && items[idx] ? items[idx].id : '';
    })
    .filter(Boolean),
);

// форма
export const selectArticleForm = (s: RootState) => s.articles.form;
export const selectFormField = <K extends keyof ReturnType<typeof selectArticleForm>>(key: K) =>
  createSelector(selectArticleForm, (f) => f[key]);
