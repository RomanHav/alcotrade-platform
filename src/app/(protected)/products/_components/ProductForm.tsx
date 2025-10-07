// app/(protected)/products/_components/ProductForm.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

import MediaPicker from './MediaPicker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  hydrateFromServer,
  setField,
  removeVariant,
  setVariantImage,
  clearVariantImage,
} from '@/store/slices/productFormSlice';
import type { ProductFormState } from '@/store/slices/productFormSlice';
import type { ProductStatus } from '@prisma/client';

/* -------------------------------- upload helper -------------------------------- */
async function uploadOne(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/api/upload', { method: 'POST', body: fd });
  const j = await r.json();
  if (j?.ok && j?.media?.id && j?.media?.url) {
    return {
      id: j.media.id as string,
      url: j.media.url as string,
      publicId: j.cloudinary?.publicId as string | undefined,
    };
  }
  throw new Error('Upload failed');
}

/* -------------------------------- slug helper -------------------------------- */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/* ------------------------------- units for volume ------------------------------ */
type UnitKey = 'ml' | 'l' | 'cl';
const UNITS: Record<UnitKey, { label: string; factor: number }> = {
  ml: { label: 'мл', factor: 1 },
  cl: { label: 'cl', factor: 10 },
  l: { label: 'л', factor: 1000 },
};
const fmtLabel = (value: number, unit: UnitKey) => `${value} ${UNITS[unit].label}`;
const toMl = (value: number, unit: UnitKey) => value * UNITS[unit].factor;

/* =========================================================================================
   ProductForm
========================================================================================= */
export default function ProductForm({
  serverProduct,
  brands,
}: {
  serverProduct?: Partial<ProductFormState> & { slug?: string | null };
  brands: { id: string; name: string }[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const data = useAppSelector((s) => s.productForm);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true);
  const [slug, setSlug] = useState<string>(serverProduct?.slug ?? '');
  const slugTouchedRef = useRef(false);
  useEffect(() => {
    slugTouchedRef.current = false;
  }, [serverProduct?.id]);

  /* hydrate + open editor only when empty */
  useEffect(() => {
    dispatch(hydrateFromServer(serverProduct ?? {}));
    slugTouchedRef.current = false;
    setSlug(serverProduct?.slug ?? '');
  }, [dispatch, serverProduct?.id]);

  useEffect(() => {
    setEditorOpen((data.variants?.length ?? 0) === 0);
  }, [data.variants.length]);

  /* dirty-state snapshot */
  const initialComparableRef = useRef<string>('');
  useEffect(() => {
    const initialFromServer = JSON.stringify({
      id: serverProduct?.id ?? null,
      name: serverProduct?.name ?? '',
      status: serverProduct?.status ?? 'DRAFT',
      brandId: serverProduct?.brandId ?? '',
      description: serverProduct?.description ?? '',
      seoTitle: serverProduct?.seoTitle ?? serverProduct?.name ?? '',
      seoDescription:
        serverProduct?.seoDescription ?? (serverProduct?.description ?? '').slice(0, 160),
      coverId: serverProduct?.coverId ?? null,
      images: (serverProduct?.images ?? []).map((m) => m.id),
      variants: (serverProduct?.variants ?? []).map((v) => ({
        label: v.label ?? '',
        volumeMl: v.volumeMl ?? null,
        imageId: (v as any).imageId ?? null,
      })),
      slug: serverProduct?.slug ?? (serverProduct?.name ? slugify(serverProduct.name) : ''),
    });
    initialComparableRef.current = initialFromServer;
  }, [serverProduct?.id]);

  const comparable = useMemo(
    () =>
      JSON.stringify({
        id: data.id ?? null,
        name: data.name ?? '',
        status: data.status,
        brandId: data.brandId ?? '',
        description: data.description ?? '',
        seoTitle: data.seoTitle ?? '',
        seoDescription: data.seoDescription ?? '',
        coverId: data.coverId ?? null,
        images: data.images.map((m) => m.id),
        variants: data.variants.map((v) => ({
          label: v.label ?? '',
          volumeMl: v.volumeMl ?? null,
          imageId: v.imageId ?? null,
        })),
        slug: slug ?? '',
      }),
    [data, slug],
  );
  const isDirty = comparable !== initialComparableRef.current;

  /* warn on close if dirty (edit only) */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /* validation */
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    images?: string;
    slug?: string;
    brandId?: string;
  }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!data.name?.trim()) next.name = 'Вкажіть назву продукту';
    if (!data.description?.trim()) next.description = 'Додайте опис продукту';
    if (!data.brandId) next.brandId = 'Оберіть бренд';
    if ((data.images?.length ?? 0) === 0) next.images = 'Додайте принаймні одне зображення';
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) next.slug = 'Латиниця, цифри та дефіс';

    setErrors(next);

    const firstError =
      next.brandId || next.name || next.description || next.images || next.slug || null;
    if (firstError) {
      toast.error('Перевірте форму', { description: firstError });
    }
    return Object.keys(next).length === 0;
  }

  /* save */
  const save = async () => {
    if (saving || !isDirty) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        id: data.id,
        name: data.name,
        status: data.status as ProductStatus,
        brandId: data.brandId,
        description: data.description ?? null,
        seoTitle: (data.seoTitle && data.seoTitle.trim()) || (data.name ?? null),
        seoDescription:
          (data.seoDescription && data.seoDescription.trim()) ||
          (data.description ?? '').slice(0, 160) ||
          null,
        coverId: data.coverId ?? null,
        imageIds: data.images.map((m) => m.id),
        slug: slugify(slug || data.name || ''),
        variants: data.variants.map((v, i) => ({
          id: v.id,
          label: v.label ?? null,
          volumeMl: v.volumeMl ?? null,
          position: i,
          imageId: v.imageId ?? null,
        })),
      };

      const res = await fetch('/api/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setErrors((prev) => ({ ...prev, slug: 'Це посилання вже зайняте' }));
        toast.error('Посилання зайняте', { description: 'Оберіть інший slug для продукту.' });
        setSaving(false);
        return;
      }
      if (!res.ok) throw new Error('Save failed');

      initialComparableRef.current = JSON.stringify({ ...JSON.parse(comparable) });
      toast.success('Збережено', { description: 'Продукт успішно збережено.' });
      router.push('/products');
    } catch {
      toast.error('Помилка збереження', {
        description: 'Спробуйте ще раз або перевірте підключення.',
      });
    } finally {
      setSaving(false);
    }
  };

  /* delete */
  const doDelete = async () => {
    if (!data.id) return setShowDelete(false);
    setDeleting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [data.id] }),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Видалено', { description: 'Продукт успішно видалено.' });
      setShowDelete(false);
      router.push('/products');
    } catch {
      toast.error('Не вдалося видалити', { description: 'Спробуйте ще раз.' });
    } finally {
      setDeleting(false);
    }
  };

  /* SEO preview values */
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://alcotrade.com.ua';
  const previewTitle = (data.seoTitle || data.name || '').trim() || 'Мета-заголовок';
  const previewDesc =
    (data.seoDescription || data.description || '').trim().slice(0, 160) || 'Опис продукту';
  const previewSlug =
    (slug ? slugify(slug) : data.name ? slugify(data.name) : 'posylannya-na-produkt') ||
    'posylannya-na-produkt';

  /* actions */
  const resetToServer = () => {
    dispatch(hydrateFromServer(serverProduct ?? {}));
    setSlug(serverProduct?.slug ?? '');
    const initialFromServer = JSON.stringify({
      id: serverProduct?.id ?? null,
      name: serverProduct?.name ?? '',
      status: serverProduct?.status ?? 'DRAFT',
      brandId: serverProduct?.brandId ?? '',
      description: serverProduct?.description ?? '',
      seoTitle: serverProduct?.seoTitle ?? serverProduct?.name ?? '',
      seoDescription:
        serverProduct?.seoDescription ?? (serverProduct?.description ?? '').slice(0, 160),
      coverId: serverProduct?.coverId ?? null,
      images: (serverProduct?.images ?? []).map((m) => m.id),
      variants: (serverProduct?.variants ?? []).map((v) => ({
        label: v.label ?? '',
        volumeMl: v.volumeMl ?? null,
        imageId: (v as any).imageId ?? null,
      })),
      slug: serverProduct?.slug ?? (serverProduct?.name ? slugify(serverProduct.name) : ''),
    });
    initialComparableRef.current = initialFromServer;
    toast('Зміни скасовано');
  };

  return (
    <div className="px-4 pt-4 md:px-6">
      {/* sticky save bar */}
      {isDirty && (
        <div className="fixed inset-x-0 bottom-5 z-40">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="bg-card rounded-lg border px-3 py-2 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="text-sm">Наявні незбережені зміни</div>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" onClick={resetToServer}>
                    Відмінити
                  </Button>
                  <Button onClick={save} disabled={saving || !isDirty}>
                    {saving ? 'Збереження…' : 'Зберегти'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* breadcrumbs */}
      <div className="mb-1 text-sm">
        <Link href="/products" className="underline-offset-4 hover:underline">
          Продукти
        </Link>{' '}
        <span className="opacity-60">›</span>{' '}
        <span className="opacity-80">{data.name?.trim() || 'Назва продукту'}</span>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {data.id ? 'Редагувати продукт' : 'Новий продукт'}
        </h1>
        <div className="flex gap-2">
          {isDirty && (
            <Button variant="outline" onClick={resetToServer}>
              Відмінити
            </Button>
          )}
          <Button onClick={save} disabled={saving || !isDirty}>
            {saving ? 'Збереження…' : 'Зберегти'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Статус</label>
              <Select
                value={data.status}
                onValueChange={(v: ProductFormState['status']) =>
                  dispatch(setField({ key: 'status', value: v }))
                }
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
            <div>
              <label className="mb-1 block text-sm">Бренд</label>
              <Select
                value={data.brandId}
                onValueChange={(v) => {
                  dispatch(setField({ key: 'brandId', value: v }));
                  if (errors.brandId) setErrors((e) => ({ ...e, brandId: undefined }));
                }}
              >
                <SelectTrigger aria-invalid={!!errors.brandId}>
                  <SelectValue placeholder="Оберіть бренд" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brandId && <p className="text-destructive mt-1 text-xs">{errors.brandId}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm">Заголовок</label>
            <Input
              value={data.name ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                dispatch(setField({ key: 'name', value }));
                if (!slugTouchedRef.current) setSlug(slugify(value));
              }}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm">Опис продукту</label>
            <Textarea
              rows={6}
              value={data.description ?? ''}
              onChange={(e) => dispatch(setField({ key: 'description', value: e.target.value }))}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-destructive mt-1 text-xs">{errors.description}</p>
            )}
          </div>

          {/* Варіанти */}
          <VariantsSection
            editorOpen={editorOpen}
            openEditor={() => setEditorOpen(true)}
            closeEditor={() => setEditorOpen(false)}
          />

          {/* SEO превʼю */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Налаштування в пошукових системах</div>

            <div className="bg-muted/30 rounded-lg border p-3">
              <a
                href={`${SITE}/uk/products/${previewSlug}`}
                className="text-primary block text-lg underline-offset-4 hover:underline"
              >
                {previewTitle}
              </a>
              <div className="text-muted-foreground text-sm">
                {SITE}/uk/products/<span className="opacity-80">{previewSlug}</span>
              </div>
              <div className="mt-2">{previewDesc}</div>
            </div>

            <div>
              <label className="mb-1 block text-sm">Змінити мета-заголовок</label>
              <Input
                placeholder="&lt;Назва продукту взята з заголовку&gt;"
                value={data.seoTitle ?? ''}
                onChange={(e) => dispatch(setField({ key: 'seoTitle', value: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">Змінити мета-опис</label>
              <Textarea
                rows={3}
                placeholder="&lt;Опис продукту взятий з опису&gt;"
                value={data.seoDescription ?? ''}
                onChange={(e) =>
                  dispatch(setField({ key: 'seoDescription', value: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">Змінити посилання на продукт (slug)</label>
              <Input
                placeholder="posylannya-na-produkt"
                value={slug}
                onChange={(e) => {
                  slugTouchedRef.current = true;
                  setSlug(e.target.value);
                }}
                onBlur={() => setSlug((s) => slugify(s))}
                aria-invalid={!!errors.slug}
              />
              {errors.slug && <p className="text-destructive mt-1 text-xs">{errors.slug}</p>}
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <MediaPicker />
          {errors.images && <p className="text-destructive text-xs">{errors.images}</p>}
        </Card>
      </div>

      {/* нижние действия */}
      <div className="mt-6 flex items-center justify-end gap-2">
        {data.id && (
          <>
            <Button variant="destructive" onClick={() => setShowDelete(true)} disabled={deleting}>
              {deleting ? 'Видалення…' : 'Видалити'}
            </Button>
            <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Видалити продукт?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Дію неможливо скасувати. Будуть видалені також варіанти.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={doDelete}
                    className="bg-destructive hover:bg-destructive/90 text-white"
                  >
                    Підтвердити
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        <Button onClick={save} disabled={saving || !isDirty}>
          {saving ? 'Збереження…' : 'Зберегти'}
        </Button>
      </div>
    </div>
  );
}

/* =========================================================================================
   Variants
========================================================================================= */

type VariantLike = { label?: string | null; volumeMl?: number | null };

function detectUnit(v: VariantLike): UnitKey {
  const label = (v.label || '').toLowerCase().trim();

  // явные подсказки из подписи
  if (label.includes('мл') || /\bml\b/.test(label)) return 'ml';
  if (/\bcl\b/.test(label)) return 'cl';
  // літри/литры (але не "мл")
  if (/літр/.test(label) || /литр/.test(label) || /\bл\b/.test(label) || /\bl\b/.test(label)) {
    // если было "мл", мы бы вышли раньше
    return 'l';
  }

  // fallback по числу
  const ml = v.volumeMl ?? 0;
  if (ml >= 1000 && ml % 1000 === 0) return 'l';
  return 'ml';
}

function VariantsSection({
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
    // дефолтные строки из существующих variants
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
      <OptionEditor
        defaultName="Обʼєм"
        defaultRows={defaults}
        onCancel={closeEditor}
        onSave={(name, rows) => {
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
        {data.variants.map((v, idx) => (
          <VariantCard
            key={`${v.position}-${v.label ?? ''}-${idx}`}
            idx={idx}
            productName={data.name ?? 'Назва продукту'}
            valueLabel={v.label ?? ''}
            imageUrl={v.imageUrl ?? null}
            onPick={async (file) => {
              try {
                const media = await uploadOne(file);
                dispatch(setVariantImage({ index: idx, media }));
                toast.success('Фото додано', { description: v.label ?? undefined });
              } catch {
                toast.error('Не вдалося завантажити фото', { description: 'Спробуйте ще раз.' });
              }
            }}
            onRemoveImage={() => {
              dispatch(clearVariantImage(idx));
              toast('Фото прибрано');
            }}
            onRemove={() => {
              dispatch(removeVariant(idx));
              toast('Варіант видалено');
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Редактор опції: строки «целое число + единица» */
function OptionEditor({
  defaultName = 'Обʼєм',
  defaultRows = [{ value: '', unit: 'ml' as UnitKey }],
  onCancel,
  onSave,
}: {
  defaultName?: string;
  defaultRows?: { value: string | number; unit: UnitKey }[];
  onCancel: () => void;
  onSave: (name: string, rows: { value: string | number; unit: UnitKey }[]) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [rows, setRows] = useState<{ value: string; unit: UnitKey }[]>(
    defaultRows.map((r) => ({ value: String(r.value ?? ''), unit: r.unit })),
  );

  const setRow = (i: number, patch: Partial<{ value: string; unit: UnitKey }>) => {
    setRows((rs) => {
      const next = [...rs];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };
  const addRow = () => setRows((rs) => [...rs, { value: '', unit: 'ml' }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const onValueChange = (i: number, raw: string) => {
    const cleaned = raw.replace(/[^\d]/g, ''); // только целые
    setRow(i, { value: cleaned });
  };

  const save = () => onSave(name.trim() || 'Варіант', rows);

  return (
    <div className="bg-muted/40 rounded-xl border p-3">
      <div className="mb-2 text-sm font-medium">Варіант</div>
      <Input
        className="mb-3"
        placeholder="Назва варіанту"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="mb-2 text-sm font-medium">Значення варіанту</div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2">
            <Input
              inputMode="numeric"
              pattern="\d*"
              placeholder="число"
              value={r.value}
              onChange={(e) => onValueChange(i, e.target.value)}
              className="w-32"
            />
            <Select value={r.unit} onValueChange={(v: UnitKey) => setRow(i, { unit: v })}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="од." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ml">мл</SelectItem>
                <SelectItem value="cl">cl</SelectItem>
                <SelectItem value="l">л</SelectItem>
              </SelectContent>
            </Select>

            <Button type="button" variant="ghost" onClick={() => removeRow(i)} title="Видалити">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addRow}>
          Додати значення
        </Button>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Відмінити
        </Button>
        <Button onClick={save}>Зберегти</Button>
      </div>
    </div>
  );
}

/** Карточка варианта (изображення + назва продукту + значення) */
function VariantCard({
  idx,
  productName,
  valueLabel,
  imageUrl,
  onPick,
  onRemoveImage,
  onRemove,
}: {
  idx: number;
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
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
