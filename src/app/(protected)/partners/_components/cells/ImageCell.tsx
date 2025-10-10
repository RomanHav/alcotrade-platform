'use client';
import * as React from 'react';
import Image from 'next/image';
import { Brush } from 'lucide-react';

export function ImageCell({
  src, alt, editing, onPickFile,
}: { src?: string|null; alt: string; editing: boolean; onPickFile?: (f: File)=>void|Promise<void> }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const onClick = () => editing && inputRef.current?.click();
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPickFile) await onPickFile(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="flex items-center justify-center">
      <div
        onClick={onClick}
        className={['relative size-10 overflow-hidden rounded-md border', editing ? 'cursor-pointer':'cursor-default'].join(' ')}
        aria-label={editing ? 'Редагувати зображення' : 'Зображення'}
      >
        {src ? <Image src={src} alt={alt || 'logo'} fill className="object-cover" />
             : <div className="flex h-full w-full items-center justify-center text-xs">—</div>}

        {editing && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/60">
            <Brush className="h-4 w-4 text-white" />
          </div>
        )}
        {editing && (
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange}/>
        )}
      </div>
    </div>
  );
}
