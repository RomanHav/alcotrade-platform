'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter } from 'lucide-react';

export type FilterDraft = { query: string; status?: string };

export default function FilterSheet({
  open,
  setOpen,
  draft,
  setDraft,
  onApply,
  onClear,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  draft: FilterDraft;
  setDraft: React.Dispatch<React.SetStateAction<FilterDraft>>;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 size-4" /> Фільтри
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Фільтрувати за:</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <div className="mb-2 text-sm font-medium">Назва бренду</div>
            <Input
              placeholder="містить…"
              value={draft.query}
              onChange={(e) => setDraft((d) => ({ ...d, query: e.target.value }))}
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-medium">Статус</div>
            <Select
              value={draft.status ?? ''}
              onValueChange={(v) => setDraft((d) => ({ ...d, status: v || undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Оберіть статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Активний</SelectItem>
                <SelectItem value="DRAFT">Чорновик</SelectItem>
                <SelectItem value="ARCHIVE">Архів</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={onApply} className="w-full">
            Застосувати
          </Button>
          <Button variant="ghost" onClick={onClear} className="w-full">
            Очистити
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
