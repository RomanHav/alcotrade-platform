'use client';
import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { ImageCell } from '../cells/ImageCell';
import { NameCell } from '../cells/NameCell';
import { LinkCell } from '../cells/LinkCell';
import { ActionCell } from '../cells/ActionCell';
import { RowCheckbox } from '../cells/RowCheckbox';
import { SelectAllCheckbox } from '../cells/SelectAllCheckbox';
import { COL_WIDTHS, ukCollator } from '../core/constants';
import type { Partner, EditOptions } from '../core/types';
import { extractCloudinaryPublicId } from '@/lib/cloudinary-publicid';

export function makeColumns(opts: EditOptions): ColumnDef<Partner>[] {
  const { editingId, drafts, onDraftChange, onStartEdit, onCancelEdit, onSaveEdit, onUploadImage } =
    opts;

  return [
    {
      id: 'select',
      size: COL_WIDTHS.select,
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => <RowCheckbox row={row} />,
      enableHiding: false,
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'image',
      header: 'Зображення',
      size: COL_WIDTHS.image,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const r = row.original;
        const isEditing = r.id === editingId;
        const draft = drafts[r.id] ?? {};
        const currentUrl = (isEditing ? draft.image : r.image) ?? '';
        const alt = (isEditing ? draft.name : r.name) || 'logo';

        const handlePick = async (file: File) => {
          try {
            const fromUrl = extractCloudinaryPublicId(currentUrl);
            const publicId = fromUrl ?? `Alcotrade/partners/${r.id}`;

            if (!onUploadImage) return;
            const { url } = await onUploadImage(file, { publicId });
            onDraftChange(r.id, 'image', url);
          } catch (e) {
            console.error('Image upload error:', e);
          }
        };

        return (
          <div className="flex w-full items-center justify-center">
            <div className="w-10">
              <ImageCell src={currentUrl} alt={alt} editing={isEditing} onPickFile={handlePick} />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(isSorted === 'asc')}
            className="mx-auto flex cursor-pointer items-center justify-center gap-1 px-0 font-medium"
          >
            Назва партнера
            {isSorted === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : isSorted === 'desc' ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUpDown className="h-4 w-4 opacity-60" />
            )}
          </Button>
        );
      },
      size: COL_WIDTHS.name,
      sortingFn: (a, b, id) => {
        const na = String(a.getValue(id) ?? '')
          .replace(/\./g, '')
          .trim();
        const nb = String(b.getValue(id) ?? '')
          .replace(/\./g, '')
          .trim();
        return ukCollator.compare(na, nb);
      },
      cell: ({ row }) => {
        const r = row.original;
        const isEditing = r.id === editingId;
        const draft = drafts[r.id] ?? {};
        const value = String(isEditing ? (draft.name ?? r.name) : r.name);
        return (
          <div className="w-full max-w-full">
            <NameCell
              value={value}
              editing={isEditing}
              onChange={(v) => onDraftChange(r.id, 'name', v)}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'link',
      header: 'Посилання',
      size: COL_WIDTHS.link,
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const isEditing = r.id === editingId;
        const draft = drafts[r.id] ?? {};
        const value = (isEditing ? draft.link : r.link) ?? '';
        return (
          <div className="w/full max-w-full">
            <LinkCell
              value={value}
              editing={isEditing}
              onChange={(v) => onDraftChange(r.id, 'link', v)}
            />
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Дії',
      size: COL_WIDTHS.actions,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const isEditing = r.id === editingId;
        return (
          <ActionCell
            partner={r}
            editing={isEditing}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
          />
        );
      },
    },
  ];
}
