'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { makeColumns } from './makeColumns';
import ConfirmDialog from '../common/ConfirmDialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  cancelEdit,
  draftChange,
  startEdit,
  setDeleting,
  removeRowsByIds,
} from '@/store/slices/partnersSlice';

import { savePartnerRow, bulkDeletePartners } from '@/store/operations/partnersOperation';

import {
  selectPartners,
  selectEditingId,
  selectDrafts,
  selectDeleting,
  selectSearch,
} from '@/store/selectors/partnersSelector';

import { uploadPartnerLogo } from '@/store/operations/partnersOperation';
import type { Partner } from '../core/types';

export default function PartnersTable() {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectPartners);
  const editingId = useAppSelector(selectEditingId);
  const drafts = useAppSelector(selectDrafts);
  const deleting = useAppSelector(selectDeleting);
  const search = useAppSelector(selectSearch);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const cancelAndMaybeRemove = React.useCallback(
    (id: string) => {
      dispatch(cancelEdit(id));
    },
    [dispatch],
  );

  const onStartEdit = React.useCallback(
    (p: Partner) => {
      dispatch(startEdit(p));
    },
    [dispatch],
  );

  const onDraftChange = React.useCallback(
    (id: string, key: keyof Partner, value: any) => {
      dispatch(draftChange({ id, key, value }));
    },
    [dispatch],
  );

  const onSaveEdit = React.useCallback(
    (id: string) => {
      dispatch(savePartnerRow({ id }));
    },
    [dispatch],
  );

  const onUploadImage = React.useCallback(
    async (file: File, ctx: { publicId: string }) => {
      const res = await dispatch(uploadPartnerLogo({ file, publicId: ctx.publicId })).unwrap();
      return { url: res.url };
    },
    [dispatch],
  );

  const normalizedQuery = React.useMemo(
    () =>
      search
        .toLocaleLowerCase('uk')
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .trim(),
    [search],
  );

  const viewData = React.useMemo(() => {
    if (!normalizedQuery) return data;
    return data.filter((p) => {
      const name = (p.name ?? '')
        .toLocaleLowerCase('uk')
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '');
      return name.includes(normalizedQuery);
    });
  }, [data, normalizedQuery]);

  const columns = React.useMemo(
    () =>
      makeColumns({
        editingId,
        drafts,
        onDraftChange,
        onStartEdit,
        onCancelEdit: cancelAndMaybeRemove,
        onSaveEdit,
        onUploadImage,
      }),
    [
      editingId,
      drafts,
      onDraftChange,
      onStartEdit,
      cancelAndMaybeRemove,
      onSaveEdit,
      onUploadImage,
    ],
  );

  const table = useReactTable({
    data: viewData,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 6 } },
  });

  const handleDeleteSelected = React.useCallback(async () => {
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (ids.length === 0) return;

    try {
      dispatch(setDeleting(true));

      dispatch(removeRowsByIds(ids));
      table.resetRowSelection();
      await dispatch(bulkDeletePartners({ ids })).unwrap();
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      dispatch(setDeleting(false));
    }
  }, [table, dispatch]);

  const selectedCount = table.getSelectedRowModel().rows.length;

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-center" style={{ width: h.getSize() }}>
                    {h.isPlaceholder
                      ? null
                      : typeof h.column.columnDef.header === 'function'
                        ? h.column.columnDef.header(h.getContext())
                        : h.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getPaginationRowModel().rows.length ? (
              table.getPaginationRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-center align-middle"
                      style={{ width: cell.column.getSize() }}
                    >
                      <div className="mx-auto max-w-full">
                        {typeof cell.column.columnDef.cell === 'function'
                          ? cell.column.columnDef.cell(cell.getContext())
                          : cell.column.columnDef.cell}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Немає результатів.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center py-4">
        <div className="flex flex-1">
          {selectedCount > 0 && (
            <ConfirmDialog
              title="Видалити обрані?"
              description={`Буде видалено ${selectedCount} ${selectedCount === 1 ? 'партнера' : 'партнерів'}. Цю дію не можна скасувати.`}
              confirmText="Видалити"
              onConfirm={handleDeleteSelected}
              disabled={deleting}
              trigger={
                <Button variant="destructive" disabled={deleting} className="cursor-pointer">
                  {deleting ? 'Видаляю…' : `Видалити обрані (${selectedCount})`}
                </Button>
              }
            />
          )}
        </div>

        <span className="text-muted-foreground flex-1 text-center text-sm">
          Сторінка {table.getState().pagination.pageIndex + 1} з {table.getPageCount() || 1}
        </span>

        <div className="flex flex-1 items-center justify-end gap-3">
          <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Попередня
          </Button>
          <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Наступна
          </Button>
        </div>
      </div>
    </div>
  );
}
