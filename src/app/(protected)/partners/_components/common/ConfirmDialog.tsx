'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Props = {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;

  open?: boolean;
  onOpenChange?: (v: boolean) => void;
};

export default function ConfirmDialog({
  trigger,
  title,
  description,
  confirmText = 'Підтвердити',
  cancelText = 'Скасувати',
  onConfirm,
  disabled,
  open,                
  onOpenChange,         
}: Props) {
  const isControlled = typeof open === 'boolean';

  const [internalOpen, setInternalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const effectiveOpen = isControlled ? open! : internalOpen;

  const setOpenSafe = (v: boolean) => {
    if (disabled) return;
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      setOpenSafe(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={effectiveOpen} onOpenChange={setOpenSafe}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction className="cursor-pointer" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Видаляю…' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
