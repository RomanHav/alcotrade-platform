'use client';
import * as React from 'react';
import type { Partner } from '../core/types';

export function usePartnersTableState(
  initial: Partner[],
  onSaveRow?: (p: Partner) => Promise<Partner>,
) {
  const [data, setData] = React.useState<Partner[]>(initial);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, Partial<Partner>>>({});

  const onStartEdit = React.useCallback((p: Partner) => {
    setEditingId(p.id);
    setDrafts((d) => ({
      ...d,
      [p.id]: { id: p.id, name: p.name, link: p.link ?? '', image: p.image ?? '' },
    }));
  }, []);

  const onCancelEdit = React.useCallback((id: string) => {
    setEditingId((curr) => (curr === id ? null : curr));
    setDrafts((d) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _remove, ...rest } = d;
      return rest;
    });
  }, []);

  const onDraftChange = React.useCallback((id: string, key: keyof Partner, value: string) => {
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? {}), [key]: value } }));
  }, []);

  const onSaveEdit = React.useCallback(
    async (id: string) => {
      const draft = drafts[id];
      if (!draft) return;
      const name = String(draft.name ?? '').trim();
      if (!name) {
        alert('Назва партнера не може бути порожньою');
        return;
      }

      const nextRow: Partner = {
        id,
        name,
        link: (draft.link ?? '') || null,
        image: (draft.image ?? '') || null,
      };
      setData((prev) => prev.map((p) => (p.id === id ? nextRow : p)));

      try {
        const saved = (await onSaveRow?.(nextRow)) ?? nextRow;

        setData((prev) => prev.map((p) => (p.id === id ? saved : p)));

        setDrafts((d) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _remove, ...rest } = d;
          return rest;
        });
        setEditingId((curr) => (curr === id ? null : curr));
      } catch (e) {
        console.error(e);
        alert('Помилка збереження');
      }
    },
    [drafts, onSaveRow],
  );

  return {
    data,
    setData,
    editingId,
    drafts,
    setDrafts,
    onStartEdit,
    onCancelEdit,
    onDraftChange,
    onSaveEdit,
  };
}
