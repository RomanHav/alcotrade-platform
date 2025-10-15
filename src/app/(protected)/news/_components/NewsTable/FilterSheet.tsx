'use client';

import * as React from 'react';
import { uk } from 'date-fns/locale';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Filter, Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

export type FilterDraft = {
  query: string;
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVE';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
};

const fmtUA = new Intl.DateTimeFormat('uk-UA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const fromYMD = (s?: string) => (s ? new Date(`${s}T00:00:00`) : undefined);

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
  // локальний стейт для календаря (DateRange)
  const [range, setRange] = React.useState<DateRange | undefined>(() => {
    const from = fromYMD(draft.dateFrom);
    const to = fromYMD(draft.dateTo);
    return from || to ? { from, to } : undefined;
  });

  // синхронізуємо з draft при відкритті
  React.useEffect(() => {
    if (!open) return;
    const from = fromYMD(draft.dateFrom);
    const to = fromYMD(draft.dateTo);
    setRange(from || to ? { from, to } : undefined);
  }, [open, draft.dateFrom, draft.dateTo]);

  // при виборі нових дат оновлюємо draft
  const handleRangeChange = (r?: DateRange) => {
    setRange(r);
    setDraft((d) => ({
      ...d,
      dateFrom: r?.from ? toYMD(r.from) : undefined,
      dateTo: r?.to ? toYMD(r.to) : undefined,
    }));
  };

  const dateLabel =
    draft.dateFrom && draft.dateTo
      ? `${fmtUA.format(fromYMD(draft.dateFrom)!)} — ${fmtUA.format(fromYMD(draft.dateTo)!)}`
      : draft.dateFrom
        ? `від ${fmtUA.format(fromYMD(draft.dateFrom)!)}`
        : draft.dateTo
          ? `до ${fmtUA.format(fromYMD(draft.dateTo)!)}`
          : 'Оберіть діапазон';

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
          {/* Пошук за назвою */}
          <div>
            <div className="mb-2 text-sm font-medium">Назва новини</div>
            <Input
              placeholder="містить…"
              value={draft.query}
              onChange={(e) => setDraft((d) => ({ ...d, query: e.target.value }))}
            />
          </div>

          {/* Статус */}
          <div>
            <div className="mb-2 text-sm font-medium">Статус</div>
            <Select
              value={draft.status ?? ''}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, status: (v as FilterDraft['status']) || undefined }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Оберіть статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Активна</SelectItem>
                <SelectItem value="DRAFT">Чорновик</SelectItem>
                <SelectItem value="ARCHIVE">Архів</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Дата — календар (range) */}
          <div>
            <div className="mb-2 text-sm font-medium">Дата</div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 size-4" />
                  {dateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-0">
                <Calendar
                  mode="range"
                  numberOfMonths={1}
                  selected={range}
                  onSelect={handleRangeChange}
                  locale={uk}
                  weekStartsOn={1}
                  className="p-2"
                  classNames={{
                    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                    day_selected:
                      'bg-neutral-800 text-neutral-50 hover:bg-neutral-800 hover:text-neutral-50 focus:bg-neutral-800',
                    day_range_start: 'bg-neutral-800 text-neutral-50',
                    day_range_end: 'bg-neutral-800 text-neutral-50',
                    // ⬅️ було neutral-500, тепер neutral-400
                    day_range_middle: 'bg-neutral-400 text-neutral-900 hover:bg-neutral-400',
                    day_today: 'border border-neutral-300',
                    nav_button: 'h-8 w-8',
                    caption: 'flex justify-center pt-1 pb-3 relative items-center',
                    head_cell: 'text-neutral-500 font-medium capitalize',
                  }}
                />
              </PopoverContent>
            </Popover>

            <div className="text-muted-foreground mt-1 text-xs">
              На бекенді фільтрується за <code>date</code> (fallback <code>publishedAt</code>).
            </div>
          </div>

          <Button onClick={onApply} className="w-full">
            Застосувати
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setDraft((d) => ({
                ...d,
                query: '',
                status: undefined,
                dateFrom: undefined,
                dateTo: undefined,
              }));
              setRange(undefined);
              onClear();
            }}
            className="w-full"
          >
            Очистити
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
