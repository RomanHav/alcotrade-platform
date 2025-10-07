'use client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearVariantImage,
  removeVariant,
  setField,
  setVariantImage,
} from '@/store/slices/productFormSlice';
import { fmtLabel, toMl, detectUnit, UnitKey } from './utils/volume';
import VariantEditor from './VariantEditor';
import VariantCard from './VariantCard';
import { uploadOne } from './services/upload';

export default function VariantsSection({
  editorOpen,
  openEditor,
  closeEditor,
}: {
  editorOpen: boolean;
  openEditor: () => void;
  closeEditor: () => void;
}) {
  const dispatch = useAppDispatch();
  const data = useAppSelector((s) => s.productForm);

  if (!editorOpen && data.variants.length === 0) {
    return (
      <div className="rounded-xl border p-3">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">Варіанти не додані</div>
          <Button size="sm" onClick={openEditor}>
            Додати варіант
          </Button>
        </div>
      </div>
    );
  }

  if (editorOpen) {
    const defaults =
      data.variants.length > 0
        ? data.variants.map((v) => {
            const unit = detectUnit({ label: v.label, volumeMl: v.volumeMl });
            const ml = v.volumeMl ?? 0;
            const value =
              unit === 'l' ? String(ml / 1000) : unit === 'cl' ? String(ml / 10) : String(ml || '');
            return { value, unit };
          })
        : [
            { value: '', unit: 'ml' as UnitKey },
            { value: '', unit: 'ml' as UnitKey },
          ];

    return (
      <VariantEditor
        defaultName="Обʼєм"
        defaultRows={defaults}
        onCancel={closeEditor}
        onSave={(_, rows) => {
          const items = rows
            .map(({ value, unit }) => {
              const n = parseInt(String(value || '').replace(/[^\d]/g, ''), 10);
              if (!Number.isFinite(n) || n <= 0) return null;
              return { label: fmtLabel(n, unit), volumeMl: toMl(n, unit) };
            })
            .filter(Boolean) as { label: string; volumeMl: number }[];

          if (items.length === 0) {
            toast('Зміни скасовано');
            return closeEditor();
          }

          const prev = data.variants;
          const next = items.map((it, i) => {
            const found =
              prev.find((p) => (p.volumeMl ?? null) === it.volumeMl) ||
              prev.find((p) => (p.label ?? '') === it.label);
            return {
              id: found?.id,
              position: i,
              label: it.label,
              volumeMl: it.volumeMl,
              imageId: found?.imageId ?? null,
              imageUrl: found?.imageUrl ?? null,
              imagePublicId: found?.imagePublicId ?? null,
            };
          });

          dispatch(setField({ key: 'variants', value: next as any }));
          toast.success('Варіанти оновлено');
          closeEditor();
        }}
      />
    );
  }

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between p-3">
        <div>
          <div className="text-sm font-medium">Обʼєм</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.variants.map((v, i) => (
              <span
                key={`${v.position}-${v.label ?? ''}-${i}`}
                className="rounded-full border px-2 py-0.5 text-xs"
              >
                {v.label}
              </span>
            ))}
          </div>
        </div>
        <Button variant="ghost" onClick={openEditor}>
          Змінити
        </Button>
      </div>

      <div className="space-y-3 border-t p-3">
        {data.variants.map((v, index) => (
          <VariantCard
            key={`${v.position}-${v.label ?? ''}-${index}`}
            productName={data.name ?? 'Назва продукту'}
            valueLabel={v.label ?? ''}
            imageUrl={v.imageUrl ?? null}
            onPick={async (file) => {
              try {
                const media = await uploadOne(file);
                dispatch(setVariantImage({ index, media }));
                toast.success('Фото додано', { description: v.label ?? undefined });
              } catch {
                toast.error('Не вдалося завантажити фото');
              }
            }}
            onRemoveImage={() => {
              dispatch(clearVariantImage(index));
              toast('Фото прибрано');
            }}
            onRemove={() => {
              dispatch(removeVariant(index));
              toast('Варіант видалено');
            }}
          />
        ))}
      </div>
    </div>
  );
}
