// app/(protected)/news/_components/NewsDatePicker.tsx
'use client';

import * as React from 'react';
import { uk } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, X } from 'lucide-react';

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

export default function NewsDatePicker({
  value,
  onChange,
}: {
  value?: string; // YYYY-MM-DD
  onChange: (v?: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = fromYMD(value);

  return (
    <div className="flex w-[260px] items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <CalendarIcon className="mr-2 size-4" />
            {selected ? fmtUA.format(selected) : 'Оберіть дату'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              onChange(d ? toYMD(d) : undefined);
              setOpen(false);
            }}
            locale={uk}
            weekStartsOn={1}
            className="p-2"
            classNames={{
              day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
              day_selected:
                'bg-neutral-800 text-neutral-50 hover:bg-neutral-800 hover:text-neutral-50 focus:bg-neutral-800',
              day_today: 'border border-neutral-300',
              nav_button: 'h-8 w-8',
              caption: 'flex justify-center pt-1 pb-3 relative items-center',
              head_cell: 'text-neutral-500 font-medium capitalize',
            }}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button variant="ghost" size="icon" title="Очистити" onClick={() => onChange(undefined)}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
