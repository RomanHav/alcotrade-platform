'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SlidersHorizontal } from 'lucide-react';

export default function SortSheet({
  open,
  setOpen,
  sp,
  applyParam,
  onApply,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  sp: URLSearchParams;
  applyParam: (key: string, value?: string) => void;
  onApply: () => void;
}) {
  const options: [string, string][] = [
    ['name_asc', 'A-Я'],
    ['name_desc', 'Я-А'],
    ['brand', 'Бренд'],
    ['status', 'Статус'],
    ['updated_desc', 'Останні оновлені'],
    ['created_desc', 'Останні додані'],
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal className="mr-2 size-4" /> Сортувати
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Сортувати за:</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <RadioGroup
            defaultValue={sp.get('sort') ?? 'name_asc'}
            onValueChange={(v) => applyParam('sort', v)}
          >
            {options.map(([v, label]) => (
              <div key={v} className="flex items-center space-x-2 py-2">
                <RadioGroupItem value={v} id={v} />
                <label htmlFor={v}>{label}</label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={onApply} className="mt-4 w-full">
            Застосувати
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
