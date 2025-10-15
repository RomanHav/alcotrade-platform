'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, X } from 'lucide-react';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  RowSelectionState,
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

import IndeterminateCheckbox from '@/components/common/IndeterminateCheckbox';
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog';
import SelectionBar from '@/components/common/SelectionBar';
import StatusBadge from '@/app/(protected)/products/_components/ProductsTable/StatusBadge';

import FilterSheet, { type FilterDraft } from './FilterSheet';
import SortSheet from './SortSheet';

type NewsStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVE';

type MediaAsset = {
  id: string;
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
};

export type NewsItem = {
  id: string;
  title: string;
  status: NewsStatus;
  date?: string | null;
  publishedAt?: string | null;
  slug: string;
  locale: string;
  cover?: MediaAsset | null;
};

type ListResponse = {
  items: NewsItem[];
  total: number;
};

const PAGE_SIZE = 10;
const fmtUA = new Intl.DateTimeFormat('uk-UA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const formatDate = (iso?: string | null) => (iso ? fmtUA.format(new Date(iso)) : '—');

function setSearchParams(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  params: Record<string, string | number | boolean | undefined>,
) {
  const usp = new URLSearchParams(window.location.search);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === '' || v === null) usp.delete(k);
    else usp.set(k, String(v));
  });
  router.replace(`${pathname}?${usp.toString()}`);
}

export default function NewsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // URL-параметри
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const query = sp.get('query') ?? '';
  const status = (sp.get('status') as NewsStatus | null) ?? undefined;
  const dateFrom = sp.get('dateFrom') ?? undefined; // YYYY-MM-DD
  const dateTo = sp.get('dateTo') ?? undefined; // YYYY-MM-DD
  const sort = sp.get('sort') ?? 'name_asc'; // ⬅️ нове: читаємо сортування

  // UI-стани шитів
  const [sortOpen, setSortOpen] = useState(false);
  const [sortDraft, setSortDraft] = useState<string>(sort); // ⬅️ ініціал з URL

  // Синхронізація draft сорту з URL, якщо юзер змінив параметри поза шитом
  useEffect(() => {
    setSortDraft(sort);
  }, [sort]);

  // Стан таблиці/даних
  const [items, setItems] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);

  // Вибір рядків
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Фільтр-стік
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState<FilterDraft>({
    query,
    status,
    dateFrom,
    dateTo,
  });

  // ⬅️ тримаємо draft фільтра синхронним з URL (щоб у шиті були актуальні значення)
  useEffect(() => {
    setFilterDraft((d) => ({
      ...d,
      query,
      status,
      dateFrom,
      dateTo,
    }));
  }, [query, status, dateFrom, dateTo]);

  // Завантаження списку (враховуючи page + фільтри + СОРТ)
  useEffect(() => {
    let abort = false;

    (async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      if (query) params.set('query', query);
      if (status) params.set('status', status);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (sort) params.set('sort', sort); // ⬅️ нове: передаємо сортування на бек

      const res = await fetch(`/api/articles?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) return;

      const data: ListResponse = await res.json();
      if (!abort) {
        setItems(data.items);
        setTotal(data.total);
        setRowSelection({});
      }
    })();

    return () => {
      abort = true;
    };
  }, [page, query, status, dateFrom, dateTo, sort]); // ⬅️ sort у залежностях

  // Колонки таблиці
  const columns = useMemo<ColumnDef<NewsItem>[]>(
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
          <div className="size-10 overflow-hidden rounded-md border">
            {row.original.cover?.url ? (
              <Image
                src={row.original.cover.url}
                alt={row.original.cover.alt || row.original.title}
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
        accessorKey: 'title',
        header: 'Заголовок новини',
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        size: 140,
      },
      {
        accessorKey: 'date',
        header: 'Дата',
        cell: ({ row }) => formatDate(row.original.date ?? row.original.publishedAt),
        size: 140,
      },
      {
        id: 'edit',
        header: 'Редагувати',
        cell: ({ row }) => (
          <Link href={`/news/${row.original.id}/edit`} className="inline-flex" title="Редагувати">
            <Pencil className="size-4" />
          </Link>
        ),
        size: 80,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);

  const applyParams = (params: Record<string, string | number | boolean | undefined>) => {
    if (
      Object.prototype.hasOwnProperty.call(params, 'query') ||
      Object.prototype.hasOwnProperty.call(params, 'status') ||
      Object.prototype.hasOwnProperty.call(params, 'dateFrom') ||
      Object.prototype.hasOwnProperty.call(params, 'dateTo')
    ) {
      params.page = 1;
    }
    setSearchParams(router, pathname, params);
  };

  const goToPage = (p: number) => {
    applyParams({ page: p });
  };

  const onBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/articles/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error('Failed to delete');

      const nextTotal = total - selectedIds.length;
      const maxPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      applyParams({ page: Math.min(page, maxPage) });
      setShowDelete(false);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  // Дії фільтра
  const applyFilter = () => {
    applyParams({
      query: filterDraft.query || undefined,
      status: filterDraft.status || undefined,
      dateFrom: filterDraft.dateFrom || undefined,
      dateTo: filterDraft.dateTo || undefined,
    });
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setFilterDraft({ query: '', status: undefined, dateFrom: undefined, dateTo: undefined });
    applyParams({ query: undefined, status: undefined, dateFrom: undefined, dateTo: undefined });
    setFilterOpen(false);
  };

  const activeFilters: Array<{ key: string; label: string }> = [];
  if (query) activeFilters.push({ key: 'query', label: `Пошук: “${query}”` });
  if (status) {
    activeFilters.push({
      key: 'status',
      label: `Статус: ${
        status === 'ACTIVE' ? 'Активний' : status === 'DRAFT' ? 'Чорновик' : 'Архів'
      }`,
    });
  }
  if (dateFrom || dateTo) {
    const label =
      dateFrom && dateTo
        ? `${formatDate(dateFrom)} — ${formatDate(dateTo)}`
        : dateFrom
          ? `від ${formatDate(dateFrom)}`
          : `до ${formatDate(dateTo!)}`;
    activeFilters.push({ key: 'date', label: `Дата: ${label}` });
  }

  // Дії сорту
  const applySort = () => {
    applyParams({ sort: sortDraft || 'name_asc' });
    setSortOpen(false);
  };

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
          defaultValue={query}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              applyParams({ query: (e.target as HTMLInputElement).value || undefined });
            }
          }}
          className="w-56"
        />

        <FilterSheet
          open={filterOpen}
          setOpen={setFilterOpen}
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
            <Link href="/news/new">Додати нову</Link>
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
                onClick={() => {
                  if (f.key === 'query') applyParams({ query: undefined });
                  if (f.key === 'status') applyParams({ status: undefined });
                  if (f.key === 'date') applyParams({ dateFrom: undefined, dateTo: undefined });
                }}
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
        onClear={() => setRowSelection({})}
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
                  <TableCell key={c.id} className="transition-colors">
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
          aria-label="Попередня сторінка"
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
          aria-label="Наступна сторінка"
        >
          »
        </Button>
      </motion.div>

      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={
          selectedIds.length > 1 ? `Видалити ${selectedIds.length} новин?` : 'Видалити новину?'
        }
        description="Дію неможливо скасувати."
        confirmLabel="Видалити"
        loading={deleting}
        onConfirm={onBulkDelete}
      />
    </motion.div>
  );
}
