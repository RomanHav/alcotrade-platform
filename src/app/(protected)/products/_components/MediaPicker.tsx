// app/(protected)/products/_components/MediaPicker.tsx
'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Star, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addImages, removeImage, setField } from '@/store/slices/productFormSlice';
import imageCompression from 'browser-image-compression';

export default function MediaPicker() {
  const dispatch = useAppDispatch();
  const { images, coverId, coverFallbackUrl } = useAppSelector((s) => s.productForm);

  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const pick = () => inputRef.current?.click();

  const compressFile = async (file: File): Promise<File> => {
    if (file.size <= 1024 * 1024) return file; // Skip compression for small files

    try {
      const options = {
        maxSizeMB: 2, // Maximum size in MB
        maxWidthOrHeight: 1920, // Maximum width/height
        useWebWorker: true,
        quality: 0.8, // JPEG quality
      };
      const compressedFile = await imageCompression(file, options);
      console.log(`Image compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return compressedFile;
    } catch (error) {
      console.warn('Image compression failed, using original file:', error);
      return file;
    }
  };

  const coverUrl = useMemo(() => {
    if (coverId) {
      const found = images.find((m) => m.id === coverId)?.url;
      if (found) return found;
    }
    if (coverFallbackUrl) return coverFallbackUrl;
    return images[0]?.url ?? null;
  }, [images, coverId, coverFallbackUrl]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const added: { id: string; url: string; alt?: string | null; publicId?: string | null }[] =
        [];
      for (const file of Array.from(files)) {
        // Compress file if needed
        const fileToUpload = await compressFile(file);

        const fd = new FormData();
        fd.append('file', fileToUpload);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json?.ok && json?.media?.id && json?.media?.url) {
          added.push({
            id: json.media.id,
            url: json.media.url,
            alt: json.media.alt ?? null,
            publicId: json.cloudinary?.publicId ?? null,
          });
        }
      }
      if (added.length) dispatch(addImages(added));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onRemove = async (id: string, publicId?: string | null) => {
    const qs = new URLSearchParams();
    if (publicId) qs.set('public_id', publicId);
    qs.set('mediaId', id);
    try {
      await fetch(`/api/upload?${qs.toString()}`, { method: 'DELETE' });
    } catch {}
    dispatch(removeImage(id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(images, oldIndex, newIndex);
    dispatch(setField({ key: 'images', value: next }));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">Медіафайли</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
        <Button size="sm" variant="secondary" onClick={pick} disabled={busy}>
          {busy ? 'Завантаження…' : '+ додати'}
        </Button>
      </div>

      <div className="bg-muted aspect-[4/5] overflow-hidden rounded-xl border">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            width={800}
            height={1000}
            className="h-full w-full object-cover"
            unoptimized
            priority
            sizes="(max-width: 768px) 100vw, 320px"
          />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      <div className="mt-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="grid grid-cols-1 gap-2">
              {images.map((m) => (
                <Thumb
                  key={m.id}
                  id={m.id}
                  url={m.url}
                  alt={m.alt ?? ''}
                  isCover={coverId === m.id}
                  onMakeCover={() => dispatch(setField({ key: 'coverId', value: m.id }))}
                  onRemove={() => onRemove(m.id, m.publicId)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function Thumb({
  id,
  url,
  alt,
  isCover,
  onMakeCover,
  onRemove,
}: {
  id: string;
  url: string;
  alt: string;
  isCover: boolean;
  onMakeCover: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="relative overflow-hidden rounded-lg border bg-white dark:bg-neutral-900"
    >
      <div className="flex items-center gap-2 p-2">
        <button
          {...attributes}
          {...listeners}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border"
          title="Перетягнути"
          type="button"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="relative h-16 w-16 overflow-hidden rounded-md border">
          {url ? (
            <Image
              src={url}
              alt={alt}
              width={64}
              height={64}
              className="h-full w-full object-cover"
              unoptimized
              sizes="64px"
            />
          ) : (
            <div className="bg-muted h-full w-full" />
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="icon"
            variant={isCover ? 'default' : 'secondary'}
            className="h-8 w-8"
            onClick={onMakeCover}
            title="Зробити обкладинкою"
            type="button"
          >
            <Star className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            onClick={onRemove}
            title="Видалити"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
