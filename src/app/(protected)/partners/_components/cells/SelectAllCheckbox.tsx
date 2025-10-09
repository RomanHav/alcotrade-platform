'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Table } from '@tanstack/react-table';
import type { Partner } from '../core/types';

export function SelectAllCheckbox({ table }: { table: Table<Partner> }) {
  // рахунок selectable рядків на сторінці
  const pageRows = table.getRowModel().rows;
  const selectable = pageRows.filter((r) => r.getCanSelect());

  const some = table.getIsSomePageRowsSelected();
  const all = table.getIsAllPageRowsSelected();

  // якщо немає що обирати — робимо чекбокс неактивним
  const disabled = selectable.length === 0;

  return (
    <div className="flex justify-center">
      <Checkbox
        className="cursor-pointer"
        aria-label="Вибрати всі"
        disabled={disabled}
        checked={all ? true : some ? 'indeterminate' : false}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
      />
    </div>
  );
}
