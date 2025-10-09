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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearSelection, setSelectedIds } from '@/store/slices/productsUiSlice';
import StatusBadge from './StatusBadge';
import IndeterminateCheckbox from '../../../../../components/common/IndeterminateCheckbox';
import FilterSheet from './FilterSheet';
import SortSheet from './SortSheet';
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog';
import { deleteProductsBulk } from '@/store/operations/products';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import SelectionBar from '@/components/common/SelectionBar';

type Item = {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVE';
  brand: { id: string; name: string; slug: string };
  cover?: { url: string | null; alt?: string | null } | null;
};

const PAGE_SIZE = 10;

/* helpers */
function arraysEqual(a: string[], b: string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export default function ProductsTable({
  items,
  total,
  page,
  brands,
}: {
  items: Item[];
  total: number;
  page: number;
  brands: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector((s) => s.productsUi.selectedIds);

  /* ----------------------- sheets state + drafts ----------------------- */

  type FilterDraft = { query: string; status?: string; brand?: string };

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);

  const [filterDraft, setFilterDraft] = React.useState<FilterDraft>({
    query: sp.get('query') ?? '',
    status: sp.get('status') ?? undefined,
    brand: sp.get('brand') ?? undefined,
  });
  const [sortDraft, setSortDraft] = React.useState<string>(sp.get('sort') ?? 'name_asc');

  React.useEffect(() => {
    setFilterDraft({
      query: sp.get('query') ?? '',
      status: sp.get('status') ?? undefined,
      brand: sp.get('brand') ?? undefined,
    });
    setSortDraft(sp.get('sort') ?? 'name_asc');
  }, [sp.toString()]);

  /* --------------------- selection <-> redux sync ---------------------- */
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
        const want = !!next[id];
        const has = newIds.includes(id);
        if (want && !has) newIds.push(id);
        if (!want && has) newIds = newIds.filter((x) => x !== id);
      }

      newIds.sort();
      const prevSorted = [...selectedIds].sort();
      if (!arraysEqual(newIds, prevSorted)) dispatch(setSelectedIds(newIds));
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
    if (!arraysEqual(ids, selectedIds)) dispatch(setSelectedIds(ids));
  }, [rowSelection, selectedIds, dispatch]);

  /* --------------------------- apply helpers --------------------------- */
  const applyParams = React.useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (!v) params.delete(k);
        else params.set(k, v);
      }
      params.set('page', '1');
      params.set('limit', String(PAGE_SIZE));
      router.push(`?${params.toString()}`);
    },
    [router, sp],
  );

  const applyFilter = () => {
    applyParams({
      query: filterDraft.query || undefined,
      status: filterDraft.status || undefined,
      brand: filterDraft.brand || undefined,
    });
    setFilterOpen(false);
  };
  const clearFilter = () => {
    setFilterDraft({ query: '', status: undefined, brand: undefined });
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', String(PAGE_SIZE));
    router.push(`?${params.toString()}`);
    setFilterOpen(false);
  };
  const applySort = () => {
    applyParams({ sort: sortDraft || 'name_asc' });
    setSortOpen(false);
  };

  /* -------------------------- bulk deletion --------------------------- */
  const [showDelete, setShowDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const onBulkDelete = async () => {
    if (!selectedIds.length) return;
    setDeleting(true);
    try {
      await dispatch(deleteProductsBulk({ ids: selectedIds })).unwrap();
      setShowDelete(false);
      dispatch(clearSelection());
      toast.success('Видалено', { description: `Продуктів: ${selectedIds.length}` });
      router.refresh();
    } catch (e: any) {
      toast.error('Не вдалося видалити', { description: e?.message ?? 'Спробуйте ще раз' });
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------ pagination ------------------------------ */
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goToPage = (next: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set('limit', String(PAGE_SIZE));
    params.set('page', String(next));
    router.push(`?${params.toString()}`);
  };

  /* ------------------------------ active filters ------------------------------ */
  const activeFilters: { label: string; key: string }[] = [];
  if (sp.get('brand')) {
    const b = brands.find((x) => x.slug === sp.get('brand'));
    activeFilters.push({ label: `Бренд: ${b?.name ?? sp.get('brand')}`, key: 'brand' });
  }
  if (sp.get('query'))
    activeFilters.push({ label: `Назва продукту: ${sp.get('query')}`, key: 'query' });
  if (sp.get('status')) activeFilters.push({ label: `Статус: ${sp.get('status')}`, key: 'status' });

  return (
    <motion.div
      layout
      className="bg-card rounded-2xl border p-5 shadow-sm"
      transition={{ duration: 0.2 }}
    >
      {/* top bar */}
      <motion.div layout className="mb-3 flex items-center gap-2">
        <Input
          placeholder="Пошук"
          defaultValue={sp.get('query') ?? ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter')
              applyParams({ query: (e.target as HTMLInputElement).value || undefined });
          }}
          className="w-56"
        />

        <FilterSheet
          open={filterOpen}
          setOpen={setFilterOpen}
          brands={brands}
          draft={filterDraft}
          setDraft={setFilterDraft}
          onApply={applyFilter}
          onClear={clearFilter}
        />
        <SortSheet
          open={sortOpen}
          setOpen={setSortOpen}
          draft={sortDraft}
          setDraft={setSortDraft}
          onApply={applySort}
        />

        <div className="ml-auto flex items-center gap-2">
          <Button asChild>
            <a href="/products/new">Додати новий</a>
          </Button>
        </div>
      </motion.div>

      {/* active chips */}
      <motion.div layout className="mb-2 flex flex-wrap items-center gap-3">
        <AnimatePresence initial={false}>
          {activeFilters.length > 0 && (
            <motion.span
              key="filters-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm"
            >
              Фільтри:
            </motion.span>
          )}
          {activeFilters.map((f) => (
            <motion.span
              key={f.key}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
            >
              {f.label}
              <button
                className="opacity-70 transition-opacity hover:opacity-100"
                onClick={() => applyParams({ [f.key]: undefined })}
                title="Очистити"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* selection bar */}
      <SelectionBar
        visible={selectedIds.length > 0}
        count={selectedIds.length}
        onClear={() => dispatch(clearSelection())}
        onDelete={() => setShowDelete(true)}
      />

      {/* table */}
      <motion.div layout className="overflow-x-auto rounded-lg border">
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
            {table.getRowModel().rows.map((r, i) => (
              <TableRow
                key={r.id}
                data-state={r.getIsSelected() && 'selected'}
                className={`${i % 2 === 1 && 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'} transition-colors`}
              >
                {r.getVisibleCells().map((c) => (
                  <TableCell key={c.id} className={`transition-colors`}>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* pagination */}
      <motion.div layout className="mt-3 flex items-center justify-center gap-2 text-sm">
        <Button
          variant="ghost"
          onClick={() => goToPage(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          «
        </Button>
        <span>
          {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </span>
        <Button
          variant="ghost"
          onClick={() => goToPage(Math.min(Math.max(1, Math.ceil(total / PAGE_SIZE)), page + 1))}
          disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))}
        >
          »
        </Button>
      </motion.div>

      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={
          selectedIds.length > 1 ? `Видалити ${selectedIds.length} продуктів?` : 'Видалити продукт?'
        }
        description="Дію неможливо скасувати."
        confirmLabel="Видалити"
        loading={deleting}
        onConfirm={onBulkDelete}
      />
    </motion.div>
  );
}
