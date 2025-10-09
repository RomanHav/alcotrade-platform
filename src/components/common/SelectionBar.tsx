// src/components/common/SelectionBar.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function SelectionBar({
  visible,
  count,
  onClear,
  onDelete,
  deleteLabel = 'Видалити',
  className = '',
}: {
  visible: boolean;
  count: number;
  onClear: () => void;
  onDelete: () => void;
  deleteLabel?: string;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="selection-bar"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`bg-muted/40 mb-2 flex items-center justify-between rounded-lg border px-3 py-2 shadow-sm ${className}`}
        >
          <div className="text-sm">
            Обрано: <b>{count}</b>{' '}
            <button
              className="underline opacity-70 transition-opacity hover:opacity-100"
              onClick={onClear}
            >
              Очистити
            </button>
          </div>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="mr-2 size-4" /> {deleteLabel}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
