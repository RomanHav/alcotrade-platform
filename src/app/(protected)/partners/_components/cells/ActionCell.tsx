'use client';

import { Button } from '@/components/ui/button';
import { Pencil, X, Check } from 'lucide-react';
import type { Partner } from '../core/types';

export function ActionCell({
  partner,
  editing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  saveDisabled,
}: {
  partner: Partner;
  editing: boolean;
  onStartEdit: (p: Partner) => void;
  onCancelEdit: (id: string) => void;
  onSaveEdit: (id: string) => void;
  saveDisabled?: boolean;
}) {
  if (editing) {
    return (
      <div className="flex items-center justify-start gap-2">
        <Button
          size="sm"
          onClick={() => onSaveEdit(partner.id)}
          disabled={Boolean(saveDisabled)}
          className="h-8 cursor-pointer px-2"
        >
          <Check className="h-4 w-4" />
          <span className="sr-only">Зберегти</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCancelEdit(partner.id)}
          className="h-8 cursor-pointer px-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Скасувати</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-start">
      <Button
        variant="ghost"
        className="h-8 w-8 cursor-pointer p-0"
        onClick={() => onStartEdit(partner)}
        aria-label="Редагувати партнера"
        title="Редагувати партнера"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}
