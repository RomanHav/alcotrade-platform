'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  SortingState,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Trash2, Pencil, Filter, SlidersHorizontal, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSelection, setSelectedIds } from '@/store/slices/productsUiSlice';

type Item = {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVE';
  brand: { id: string; name: string; slug: string };
  cover?: { url: string | null; alt?: string | null } | null;
};

/* helpers to break feedback loops */
function arraysEqual(a: string[], b: string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  title,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (next: boolean) => void;
  title?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="border-input bg-background ring-offset-background focus-visible:ring-ring h-4 w-4 rounded border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      title={title}
      aria-label={title}
    />
  );
}

export default function ProductsTable({
  items,
  total,
  page,
  pageSize,
  brands,
}: {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  brands: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector((s) => s.productsUi.selectedIds);

  // ids видимых на текущей странице (стабилизируем мемо)
  const pageIds = React.useMemo(() => items.map((i) => i.id), [items]);

  const rowSelection = React.useMemo(() => {
    const o: RowSelectionState = {};
    for (const id of selectedIds) if (pageIds.includes(id)) o[id] = true;
    return o;
  }, [selectedIds, pageIds]);

  const handleRowSelectionChange = React.useCallback(
    (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      const current = rowSelection;
      const next = typeof updater === 'function' ? (updater as any)(current) : updater;

      let newIds = [...selectedIds];

      for (const id of pageIds) {
        const want = !!next[id]; // желаемое состояние для id
        const has = newIds.includes(id); // текущее в Redux
        if (want && !has) newIds.push(id);
        if (!want && has) newIds = newIds.filter((x) => x !== id);
      }

      newIds.sort();
      const prevSorted = [...selectedIds].sort();
      if (!arraysEqual(newIds, prevSorted)) {
        dispatch(setSelectedIds(newIds));
      }
    },
    [rowSelection, selectedIds, pageIds, dispatch],
  );

  const columns = React.useMemo<ColumnDef<Item>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => {
          const all = table.getIsAllPageRowsSelected();
          const some = table.getIsSomePageRowsSelected();
          return (
            <IndeterminateCheckbox
              checked={all}
              indeterminate={some && !all}
              onChange={(v) => table.toggleAllPageRowsSelected(v)}
              title="Вибрати всі"
            />
          );
        },
        cell: ({ row }) => (
          <IndeterminateCheckbox
            checked={row.getIsSelected()}
            onChange={(v) => row.toggleSelected(v)}
            title="Вибрати"
          />
        ),
        size: 32,
      },
      {
        id: 'thumb',
        header: () => null,
        cell: ({ row }) => (
          <div className="size-8 overflow-hidden rounded-md border">
            {row.original.cover?.url ? (
              <Image
                src={row.original.cover.url}
                alt={row.original.cover.alt || row.original.name}
                width={32}
                height={32}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="bg-muted h-full w-full" />
            )}
          </div>
        ),
        size: 40,
      },
      {
        accessorKey: 'name',
        header: 'Назва продукту',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        size: 140,
      },
      {
        accessorKey: 'brand.name',
        header: 'Бренд',
        cell: ({ row }) => row.original.brand.name,
        size: 180,
      },
      {
        id: 'edit',
        header: 'Редагувати',
        cell: ({ row }) => (
          <a href={`/products/${row.original.id}/edit`} className="inline-flex">
            <Pencil className="size-4" />
          </a>
        ),
        size: 80,
      },
    ],
    [],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data: items,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  React.useEffect(() => {
    const ids = Object.entries(rowSelection)
      .filter(([, v]) => !!v)
      .map(([id]) => id)
      .sort();

    if (!arraysEqual(ids, selectedIds)) {
      dispatch(setSelectedIds(ids));
    }
  }, [rowSelection, selectedIds, dispatch]);

  const applyParam = (key: string, value?: string) => {
    const params = new URLSearchParams(sp.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const onBulkDelete = async () => {
    if (!selectedIds.length) return;
    await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    });
    dispatch(clearSelection());
    router.refresh();
  };

  // const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const activeFilters: { label: string; key: string }[] = [];
  if (sp.get('brand')) {
    const b = brands.find((x) => x.slug === sp.get('brand'));
    activeFilters.push({ label: `Бренд: ${b?.name ?? sp.get('brand')}`, key: 'brand' });
  }
  if (sp.get('query'))
    activeFilters.push({ label: `Назва продукту: ${sp.get('query')}`, key: 'query' });
  if (sp.get('status')) activeFilters.push({ label: `Статус: ${sp.get('status')}`, key: 'status' });

  return (
    <div className="bg-card rounded-2xl border p-3 shadow-sm">
      {/* верхняя панель */}
      <div className="mb-3 flex items-center gap-2">
        <Input
          placeholder="Пошук"
          defaultValue={sp.get('query') ?? ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter')
              applyParam('query', (e.target as HTMLInputElement).value || undefined);
          }}
          className="w-56"
        />

        {/* Фільтри */}
        <Sheet>
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
              <Button onClick={() => router.refresh()} className="w-full">
                Застосувати
              </Button>
              <Button variant="ghost" onClick={() => router.push('?')}>
                Очистити
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Сортування */}
        <Sheet>
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
                {[
                  ['name_asc', 'A-Я'],
                  ['name_desc', 'Я-А'],
                  ['brand', 'Бренд'],
                  ['status', 'Статус'],
                  ['updated_desc', 'Останні оновлені'],
                  ['created_desc', 'Останні додані'],
                ].map(([v, label]) => (
                  <div key={v} className="flex items-center space-x-2 py-2">
                    <RadioGroupItem value={v} id={v} />
                    <label htmlFor={v}>{label}</label>
                  </div>
                ))}
              </RadioGroup>
              <Button onClick={() => router.refresh()} className="mt-4 w-full">
                Застосувати
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild>
            <a href="/products/new">Додати новий</a>
          </Button>
        </div>
      </div>

      {/* активні фільтри */}
      <div className="mb-2 flex flex-wrap items-center gap-3">
        {activeFilters.length > 0 && (
          <>
            <span className="text-sm">Фільтри:</span>
            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
              >
                {f.label}
                <button
                  className="opacity-70 hover:opacity-100"
                  onClick={() => applyParam(f.key, undefined)}
                  title="Очистити"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </>
        )}
      </div>

      {/* панель вибору */}
      {selectedIds.length > 0 && (
        <div className="bg-muted/40 mb-2 flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="text-sm">
            Обрано: <b>{selectedIds.length}</b>{' '}
            <button
              className="underline opacity-70 hover:opacity-100"
              onClick={() => dispatch(clearSelection())}
            >
              Очистити
            </button>
          </div>
          <Button variant="destructive" onClick={onBulkDelete}>
            <Trash2 className="mr-2 size-4" /> Видалити
          </Button>
        </div>
      )}

      {/* таблиця */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} style={{ width: h.getSize() ?? undefined }}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((r) => (
              <TableRow key={r.id} data-state={r.getIsSelected() && 'selected'}>
                {r.getVisibleCells().map((c) => (
                  <TableCell key={c.id}>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* пагінація */}
      <div className="mt-3 flex items-center justify-center gap-2 text-sm">
        <Button
          variant="ghost"
          onClick={() => applyParam('page', String(Math.max(1, page - 1)))}
          disabled={page <= 1}
        >
          «
        </Button>
        <span>
          {page} / {Math.max(1, Math.ceil(total / pageSize))}
        </span>
        <Button
          variant="ghost"
          onClick={() =>
            applyParam('page', String(Math.min(Math.max(1, Math.ceil(total / pageSize)), page + 1)))
          }
          disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
        >
          »
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Item['status'] }) {
  const map: Record<Item['status'], { label: string; className: string }> = {
    ACTIVE: {
      label: 'Активний',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    DRAFT: {
      label: 'Чорновик',
      className: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-300',
    },
    ARCHIVE: {
      label: 'Архів',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    },
  };
  const v = map[status];
  return (
    <Badge className={cn('px-2', v.className)} variant="secondary">
      {v.label}
    </Badge>
  );
}
