'use client';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function VariantCard({
  productName,
  valueLabel,
  imageUrl,
  onPick,
  onRemoveImage,
  onRemove,
}: {
  productName: string;
  valueLabel: string;
  imageUrl: string | null;
  onPick: (file: File) => Promise<void>;
  onRemoveImage: () => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = () => fileRef.current?.click();

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={pick}
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border"
            title="додати"
          >
            {imageUrl ? (
              <Image src={imageUrl} alt={`${productName} - ${valueLabel}`} className="h-16 w-16 object-cover" width={250} height={250} />
            ) : (
              <span className="text-2xl">＋</span>
            )}
          </button>
          <div>
            <div className="font-medium">{productName}</div>
            <div className="text-muted-foreground text-sm">{valueLabel}</div>
          </div>
        </div>
        <Button variant="ghost" onClick={onRemove} title="Видалити">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          await onPick(f);
          if (fileRef.current) fileRef.current.value = '';
        }}
      />
      {imageUrl && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onRemoveImage}>
            Прибрати фото
          </Button>
        </div>
      )}
    </div>
  );
}
