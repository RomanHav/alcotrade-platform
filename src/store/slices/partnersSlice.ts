// store/slices/partnersSlice.ts
import { createSlice, PayloadAction, nanoid } from '@reduxjs/toolkit';
import type { Partner } from '@/app/(protected)/partners/_components/core/types';
import { savePartnerRow, bulkDeletePartners } from '../operations/partnersOperation';
import type { RowSelectionState } from '@tanstack/react-table';

export type Drafts = Record<string, Partial<Partner>>;

type PartnersState = {
  items: Partner[];
  loading: boolean;
  error?: string | null;

  search: string;
  addTrigger?: number;

  editingId: string | null;
  drafts: Drafts;

  deleting: boolean;

  rowSelection: RowSelectionState;
};

const initialState: PartnersState = {
  items: [],
  loading: false,
  error: null,

  search: '',
  addTrigger: undefined,

  editingId: null,
  drafts: {},

  deleting: false,

  rowSelection: {},
};

const partnersSlice = createSlice({
  name: 'partners',
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Partner[]>) {
      state.items = action.payload;

      state.rowSelection = {};
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    triggerAddNew(state) {
      const id = `tmp_${Date.now()}_${nanoid(4)}`;
      const fresh: Partner = { id, name: '', link: null, image: null };
      state.items.unshift(fresh);
      state.editingId = id;
      state.drafts[id] = { ...fresh };
      state.addTrigger = Date.now();
    },
    startEdit(state, action: PayloadAction<Partner>) {
      const p = action.payload;
      state.editingId = p.id;
      state.drafts[p.id] = { id: p.id, name: p.name, link: p.link ?? '', image: p.image ?? '' };
    },
    cancelEdit(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (id.startsWith('tmp_')) {
        state.items = state.items.filter((x) => x.id !== id);
      }
      if (state.editingId === id) state.editingId = null;
      delete state.drafts[id];
    },
    draftChange(state, action: PayloadAction<{ id: string; key: keyof Partner; value: any }>) {
      const { id, key, value } = action.payload;
      state.drafts[id] = { ...(state.drafts[id] ?? {}), [key]: value };
    },

    applyLocalRow(state, action: PayloadAction<Partner>) {
      const row = action.payload;
      state.items = state.items.map((p) => (p.id === row.id ? row : p));
    },
    finishSave(state, action: PayloadAction<Partner>) {
      const saved = action.payload;
      state.items = state.items.map((p) => (p.id === saved.id ? saved : p));
      delete state.drafts[saved.id];
      if (state.editingId === saved.id) state.editingId = null;
    },
    setDeleting(state, action: PayloadAction<boolean>) {
      state.deleting = action.payload;
    },
    removeRowsByIds(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload);

      state.items = state.items.filter((p) => !ids.has(p.id));

      action.payload.forEach((id) => delete state.drafts[id]);

      if (state.editingId && ids.has(state.editingId)) state.editingId = null;

      const nextSel: RowSelectionState = { ...state.rowSelection };
      for (const id of action.payload) {
        if (nextSel[id]) delete nextSel[id];
      }
      state.rowSelection = nextSel;
    },

    setRowSelection(state, action: PayloadAction<RowSelectionState>) {
      state.rowSelection = action.payload;
    },
    clearSelection(state) {
      state.rowSelection = {};
    },
  },
  extraReducers(builder) {
    builder
      .addCase(savePartnerRow.pending, (state, action) => {
        const id = action.meta.arg.id;
        const d = state.drafts[id];
        if (!d) return;
        const name = String(d.name ?? '').trim();
        if (!name) return;
        const optimistic: Partner = {
          id,
          name,
          link: (d.link ?? '') || null,
          image: (d.image ?? '') || null,
        };
        state.items = state.items.map((p) => (p.id === id ? optimistic : p));
      })
      .addCase(savePartnerRow.fulfilled, (state, action) => {
        const saved = action.payload;
        const tmpId = action.meta.arg.id;

        state.items = state.items.map((p) => (p.id === tmpId ? saved : p));

        delete state.drafts[tmpId];
        delete state.drafts[saved.id];

        if (state.editingId === tmpId) state.editingId = null;
      })
      .addCase(savePartnerRow.rejected, (state, action) => {
        state.error = String(action.error?.message ?? 'Save failed');
      })
      .addCase(bulkDeletePartners.pending, (state) => {
        state.deleting = true;
      })
      .addCase(bulkDeletePartners.fulfilled, (state) => {
        state.deleting = false;
      })
      .addCase(bulkDeletePartners.rejected, (state, action) => {
        state.deleting = false;
        state.error = String(action.error?.message ?? 'Bulk delete failed');
      });
  },
});

export const {
  hydrate,
  setSearch,
  triggerAddNew,
  startEdit,
  cancelEdit,
  draftChange,
  applyLocalRow,
  finishSave,
  setDeleting,
  removeRowsByIds,
  setRowSelection,
  clearSelection,
} = partnersSlice.actions;

export default partnersSlice.reducer;
