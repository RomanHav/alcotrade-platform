// src/app/(protected)/brands/_components/BrandsTable.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ColumnDef,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Pencil } from 'lucide-react';
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog';
import IndeterminateCheckbox from '@/components/common/IndeterminateCheckbox';
import SelectionBar from '@/components/common/SelectionBar';
import { toast } from 'sonner';
import { SlidersHorizontal, Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteBrand } from '@/store/operations/brands';
import { useAppDispatch } from '@/store/hooks';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ResolveBrandDeletionDialog from '@/components/common/ResolveBrandDeletionDialog';

type Item = {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVE';
  cover?: { url: string | null; alt?: string | null } | null;
};

type BrandLite = { id: string; name: string };

export default function BrandsTable({
  items,
  total,
  page,
  pageSize,
  brandOptions,
}: {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  brandOptions: BrandLite[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const dispatch = useAppDispatch();

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [showDelete, setShowDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [resolving, setResolving] = React.useState(false);
  const [resolverOpen, setResolverOpen] = React.useState(false);
  const [conflicts, setConflicts] = React.useState<Array<{ id: string; count: number }>>([]);

  const columns: ColumnDef<Item>[] = [
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
      header: 'Назва бренду',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      size: 140,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'edit',
      header: 'Редагувати',
      size: 80,
      cell: ({ row }) => (
        <a href={`/brands/${row.original.id}/edit`} className="inline-flex">
          <Pencil className="size-4" />
        </a>
      ),
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const selectedIds = React.useMemo(
    () => table.getSelectedRowModel().rows.map((r) => r.original.id),
    [rowSelection, items],
  );

  const applyParam = (key: string, value?: string) => {
    const params = new URLSearchParams(sp.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const onBulkDelete = async () => {
    if (!selectedIds.length) return;
    setDeleting(true);
    try {
      await dispatch(deleteBrand({ ids: selectedIds, mode: 'restrict' })).unwrap();
      setShowDelete(false);
      table.resetRowSelection();
      toast.success('Видалено', { description: `Брендів: ${selectedIds.length}` });
      router.refresh();
    } catch (e: any) {
      // поймали конфликт
      if (e?.code === 'HAS_PRODUCTS' && Array.isArray(e.conflicts)) {
        setConflicts(e.conflicts);
        setShowDelete(false);
        setResolverOpen(true);
      } else {
        toast.error('Не вдалося видалити', { description: e?.message ?? 'Спробуйте ще раз' });
      }
    } finally {
      setDeleting(false);
    }
  };

  const resolveDeletion = async (p: { mode: 'cascade' | 'reassign'; reassignToId?: string }) => {
    setResolving(true);
    try {
      await dispatch(deleteBrand({ ids: selectedIds, ...p })).unwrap();
      setResolverOpen(false);
      table.resetRowSelection();
      toast.success('Готово', { description: 'Операція завершена' });
      router.refresh();
    } catch (e: any) {
      toast.error('Помилка', { description: e?.message ?? 'Спробуйте ще раз' });
    } finally {
      setResolving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // активні фільтри
  const activeFilters: { label: string; key: string }[] = [];
  if (sp.get('query'))
    activeFilters.push({ label: `Назва бренду: ${sp.get('query')}`, key: 'query' });
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
                <div className="mb-2 text-sm font-medium">Назва бренду</div>
                <Input
                  defaultValue={sp.get('query') ?? ''}
                  onBlur={(e) => applyParam('query', e.target.value || undefined)}
                  placeholder="містить…"
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
                  ['status', 'Статус'],
                  ['updated', 'Останні оновлені'],
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

      {/* selection bar (общий) */}
      <SelectionBar
        visible={selectedIds.length > 0}
        count={selectedIds.length}
        onClear={() => table.resetRowSelection()}
        onDelete={() => setShowDelete(true)}
        deleteLabel="Видалити"
      />

      {/* таблица */}
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
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          onClick={() => applyParam('page', String(Math.min(totalPages, page + 1)))}
          disabled={page >= totalPages}
        >
          »
        </Button>
      </div>

      {/* confirm */}
      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={
          selectedIds.length > 1 ? `Видалити ${selectedIds.length} брендів?` : 'Видалити бренд?'
        }
        description="Дію неможливо скасувати."
        confirmLabel="Видалити"
        loading={deleting}
        onConfirm={onBulkDelete}
      />

      <ResolveBrandDeletionDialog
        open={resolverOpen}
        onOpenChange={setResolverOpen}
        conflicts={conflicts}
        brands={brandOptions}
        loading={resolving}
        onResolve={resolveDeletion}
      />
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
