'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import PartnersTable from './table/PartnersTable';
import { Input } from '@/components/ui/input';
import type { Partner } from './core/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hydrate, setSearch, triggerAddNew } from '@/store/slices/partnersSlice';

import { selectSearch } from '@/store/selectors/partnersSelector';

export default function PartnersMain({
  initialPartners = [] as Partner[],
}: {
  initialPartners?: Partner[];
}) {
  const dispatch = useAppDispatch();
  const search = useAppSelector(selectSearch);

  React.useEffect(() => {
    dispatch(hydrate(initialPartners));
  }, [dispatch, initialPartners]);

  return (
    <div className="px-8 pt-16">
      <h1 className="mb-9 text-4xl">Партнери</h1>
      <div className="flex flex-col gap-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Всі партнери</h2>
          <div className="flex items-center gap-7">
            <Input
              type="text"
              placeholder="Пошук..."
              className="w-60"
              value={search}
              onChange={(e) => dispatch(setSearch(e.target.value))}
            />
            <Button className="cursor-pointer" onClick={() => dispatch(triggerAddNew())}>
              Додати новий
            </Button>
          </div>
        </div>
        <PartnersTable />
      </div>
    </div>
  );
}
