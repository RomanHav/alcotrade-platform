import type { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';

export const selectRowSelection = (s: RootState) => s.partners.rowSelection;
export const selectPartnersState = (s: RootState) => s.partners;
export const selectPartners = (s: RootState) => s.partners.items;
export const selectEditingId = (s: RootState) => s.partners.editingId;
export const selectDrafts = (s: RootState) => s.partners.drafts;
export const selectSearch = (s: RootState) => s.partners.search;
export const selectDeleting = (s: RootState) => s.partners.deleting;
export const selectSelectedIds = createSelector(selectRowSelection, (sel) => Object.keys(sel));
