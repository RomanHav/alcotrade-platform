'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SlidersHorizontal } from 'lucide-react';

export default function SortSheet({
  open,
  setOpen,
  draft,
  setDraft,
  onApply,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: string;
  setDraft: (v: string) => void;
  onApply: () => void;
}) {
  const options: [string, string][] = [
    ['name_asc', 'A-Я'],
    ['name_desc', 'Я-А'],
    ['status', 'Статус'],
    ['updated', 'Останні оновлені'],
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
          <RadioGroup value={draft} onValueChange={setDraft}>
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
