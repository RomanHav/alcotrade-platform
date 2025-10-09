'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Row } from '@tanstack/react-table';
import type { Partner } from '../core/types';

export function RowCheckbox({ row }: { row: Row<Partner> }) {
  if (!row.getCanSelect()) return <div className="h-5" />;

  const some = row.getIsSomeSelected();
  const selected = row.getIsSelected();

  return (
    <div className="flex justify-center">
      <Checkbox
        className="cursor-pointer"
        aria-label="Вибрати рядок"
        checked={selected ? true : some ? 'indeterminate' : false}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
      />
    </div>
  );
}
