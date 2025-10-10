'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import PartnersTable from './table/PartnersTable';
import { Input } from '@/components/ui/input';
import type { Partner } from './core/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  hydrate,
  setSearch,
  triggerAddNew,
  setDeleting,
  removeRowsByIds,
  clearSelection,
} from '@/store/slices/partnersSlice';
import {
  selectSearch,
  selectDeleting,
  selectSelectedIds,
  selectEditingId,
  selectPartners,
} from '@/store/selectors/partnersSelector';
import { bulkDeletePartners } from '@/store/operations/partnersOperation';

import ConfigDialog from './common/ConfirmDialog';

import { AnimatePresence, motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export default function PartnersMain({
  initialPartners = [] as Partner[],
}: {
  initialPartners?: Partner[];
}) {
  const dispatch = useAppDispatch();
  const search = useAppSelector(selectSearch);
  const deleting = useAppSelector(selectDeleting);
  const selectedIds = useAppSelector(selectSelectedIds);

  const editingId = useAppSelector(selectEditingId);
  const items = useAppSelector(selectPartners);
  const hasTmp = React.useMemo(() => items.some((p) => p.id.startsWith('tmp_')), [items]);
  const addLocked = Boolean(editingId) || hasTmp;

  const [showDelete, setShowDelete] = React.useState(false);

  React.useEffect(() => {
    dispatch(hydrate(initialPartners));
  }, [dispatch, initialPartners]);

  const handleBulkDelete = React.useCallback(async () => {
    if (!selectedIds.length) return;
    try {
      dispatch(setDeleting(true));

      dispatch(removeRowsByIds(selectedIds));

      await dispatch(bulkDeletePartners({ ids: selectedIds })).unwrap();
      dispatch(clearSelection());
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      dispatch(setDeleting(false));
      setShowDelete(false);
    }
  }, [dispatch, selectedIds]);

  return (
    <div className="px-8 pt-16">
      <h1 className="mb-9 text-4xl">Партнери</h1>
      <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <Input
            type="text"
            placeholder="Пошук"
            className="w-56"
            value={search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
          />
          <Button
            className="cursor-pointer"
            onClick={() => dispatch(triggerAddNew())}
            disabled={addLocked}
            title={addLocked ? 'Спершу завершіть поточне редагування' : 'Додати нового партнера'}
          >
            Додати новий
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                key="selection-bar"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-muted/40 mb-2 flex items-center justify-between rounded-lg border px-3 py-2 shadow-sm"
              >
                <div className="text-sm">
                  Обрано: <b>{selectedIds.length}</b>{' '}
                  <button
                    className="underline opacity-70 transition-opacity hover:opacity-100"
                    onClick={() => dispatch(clearSelection())}
                  >
                    Очистити
                  </button>
                </div>

                <ConfigDialog
                  title="Видалити обрані?"
                  description={`Буде видалено ${selectedIds.length} ${selectedIds.length === 1 ? 'партнера' : 'партнерів'}. Цю дію не можна скасувати.`}
                  confirmText="Видалити"
                  onConfirm={handleBulkDelete}
                  disabled={deleting}
                  open={showDelete}
                  onOpenChange={setShowDelete}
                  trigger={
                    <Button
                      variant="destructive"
                      disabled={deleting}
                      onClick={() => setShowDelete(true)}
                    >
                      <Trash2 className="mr-2 size-4" /> {deleting ? 'Видаляю…' : 'Видалити'}
                    </Button>
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          <PartnersTable />
        </div>
      </div>
    </div>
  );
}
