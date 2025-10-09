'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Table, TableHeader, TableBody, TableRow, TableCell, TableHead,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { makeColumns } from './makeColumns';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cancelEdit, draftChange, startEdit } from '@/store/slices/partnersSlice';
import {
  selectPartners,
  selectEditingId,
  selectDrafts,
  selectSearch,
  selectRowSelection,         // ✅
} from '@/store/selectors/partnersSelector';
import { setRowSelection as setRowSelectionAction } from '@/store/slices/partnersSlice'; // ✅
import { uploadPartnerLogo, savePartnerRow } from '@/store/operations/partnersOperation';
import type { Partner } from '../core/types';

export default function PartnersTable() {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectPartners);
  const editingId = useAppSelector(selectEditingId);
  const drafts = useAppSelector(selectDrafts);
  const search = useAppSelector(selectSearch);
  const rowSelection = useAppSelector(selectRowSelection); // ✅ з Redux

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const cancelAndMaybeRemove = React.useCallback(
    (id: string) => { dispatch(cancelEdit(id)); },
    [dispatch],
  );

  const onStartEdit = React.useCallback(
    (p: Partner) => { dispatch(startEdit(p)); },
    [dispatch],
  );

  const onDraftChange = React.useCallback(
    (id: string, key: keyof Partner, value: any) => {
      dispatch(draftChange({ id, key, value }));
    },
    [dispatch],
  );

  const onSaveEdit = React.useCallback(
    (id: string) => { void dispatch(savePartnerRow({ id })); },
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
    [editingId, drafts, onDraftChange, onStartEdit, cancelAndMaybeRemove, onSaveEdit, onUploadImage],
  );

  const table = useReactTable({
    data: viewData,
    columns,
    
    getRowId: (row: Partner) => row.id,
    state: { sorting, rowSelection },                       
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {                
      const next =
        typeof updater === 'function'
          ? (updater as (old: RowSelectionState) => RowSelectionState)(rowSelection)
          : updater;
      dispatch(setRowSelectionAction(next));
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },

     enableRowSelection: (row) => !String(row.original.id).startsWith('tmp_'),
  enableMultiRowSelection: true
  });


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
              table.getPaginationRowModel().rows.map((row, i) => (
                <TableRow
                  className={`${i % 2 === 1 && 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'} transition-colors`}
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
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

      {/*ПАГІНАЦІЯ*/}
      <div className="mt-3 flex items-center justify-center gap-2 text-sm">
        <Button
          variant="ghost"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          «
        </Button>
        <span>
          {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
        </span>
        <Button variant="ghost" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          »
        </Button>
      </div>
    </div>
  );
}
