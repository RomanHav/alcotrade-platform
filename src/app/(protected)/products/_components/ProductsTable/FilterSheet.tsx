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

export default function FilterSheet({
  open,
  setOpen,
  brands,
  sp,
  applyParam,
  onApply,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  brands: { id: string; name: string; slug: string }[];
  sp: URLSearchParams;
  applyParam: (key: string, value?: string) => void;
  onApply: () => void; // скрыть + refresh
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
            <div className="mb-2 text-sm font-medium">Назва продукту</div>
            <Input
              placeholder="містить…"
              defaultValue={sp.get('query') ?? ''}
              onBlur={(e) => applyParam('query', e.target.value || undefined)}
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-medium">Статус</div>
            <Select
              defaultValue={sp.get('status') ?? undefined}
              onValueChange={(v) => applyParam('status', v)}
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

          <div>
            <div className="mb-2 text-sm font-medium">Бренд</div>
            <Select
              defaultValue={sp.get('brand') ?? undefined}
              onValueChange={(v) => applyParam('brand', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Оберіть бренд" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.slug}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={onApply} className="w-full">
            Застосувати
          </Button>
          <Button variant="ghost" onClick={() => onApply()} className="w-full">
            Очистити
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
