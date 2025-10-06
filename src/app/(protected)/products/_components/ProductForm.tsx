// app/(protected)/products/_components/ProductForm.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import MediaPicker from './MediaPicker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  hydrateFromServer,
  setField,
  removeVariant,
  setVariantsFromValues,
  setVariantImage,
  clearVariantImage,
} from '@/store/slices/productFormSlice';
import type { ProductFormState } from '@/store/slices/productFormSlice';
import type { ProductStatus } from '@prisma/client';
import { Trash2 } from 'lucide-react';

/* upload helper */
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

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

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

  /* UI state */
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true);

  /* SEO/slug (локально) */
  const [slug, setSlug] = useState<string>(serverProduct?.slug ?? '');

  /* гидратация из serverProduct */
  useEffect(() => {
    dispatch(hydrateFromServer(serverProduct ?? {}));
    setSlug(serverProduct?.slug ?? '');
  }, [dispatch, serverProduct?.id]);

  /* редактор вариантов открыт, если вариантов нет */
  useEffect(() => {
    setEditorOpen((data.variants?.length ?? 0) === 0);
  }, [data.variants.length]);

  /* ------ корректный dirty: сравниваем с исходником от сервера ------ */
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
  }, [serverProduct?.id]); // пересчитываем при открытии другой записи

  const comparable = useMemo(
    () =>
      JSON.stringify({
        id: data.id ?? null,
        name: data.name ?? '',
        status: data.status,
        brandId: data.brandId ?? '',
        description: data.description ?? '',
        // сохраняем фактические поля (если пустые — это осознанный выбор)
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

  /* предупреждение при закрытии */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /* валидация */
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    images?: string;
    slug?: string;
  }>({});
  function validate(): boolean {
    const next: typeof errors = {};
    if (!data.name?.trim()) next.name = 'Вкажіть назву продукту';
    if (!data.description?.trim()) next.description = 'Додайте опис продукту';
    if ((data.images?.length ?? 0) === 0) next.images = 'Додайте принаймні одне зображення';
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) next.slug = 'Латиниця, цифри та дефіс';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /* сохранение */
  const save = async () => {
    if (saving) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        id: data.id,
        name: data.name,
        status: data.status as ProductStatus,
        brandId: data.brandId,
        description: data.description ?? null,
        // если SEO не заполнили вручную — проставим из name/description
        seoTitle: (data.seoTitle && data.seoTitle.trim()) || (data.name ?? null),
        seoDescription:
          (data.seoDescription && data.seoDescription.trim()) ||
          (data.description ?? '').slice(0, 160) ||
          null,
        coverId: data.coverId ?? null,
        imageIds: data.images.map((m) => m.id),
        slug: slug ? slugify(slug) : undefined,
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
      if (!res.ok) throw new Error('Save failed');

      // после успешного сохранения сбрасываем "грязь"
      initialComparableRef.current = JSON.stringify({
        ...JSON.parse(comparable),
      });
      router.push('/products');
    } catch {
      // TODO: toast('Помилка збереження')
    } finally {
      setSaving(false);
    }
  };

  /* удаление */
  const doDelete = async () => {
    if (!data.id) return setShowDelete(false);
    setDeleting(true);
    try {
      await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [data.id] }),
      });
      setShowDelete(false);
      router.push('/products');
    } finally {
      setDeleting(false);
    }
  };

  /* превью SEO */
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://alcotrade.com.ua';
  const previewTitle = (data.seoTitle || data.name || '').trim() || 'Мета-заголовок';
  const previewDesc =
    (data.seoDescription || data.description || '').trim().slice(0, 160) || 'Опис продукту';
  const previewSlug =
    (slug ? slugify(slug) : data.name ? slugify(data.name) : 'posylannya-na-produkt') ||
    'posylannya-na-produkt';

  /* действия */
  const resetToServer = () => {
    dispatch(hydrateFromServer(serverProduct ?? {}));
    setSlug(serverProduct?.slug ?? '');
    // пересобрать «базу» и скрыть бар
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
  };

  return (
    <div className="px-4 pt-4 md:px-6">
      {/* fixed bottom bar */}
      {isDirty && (
        <div className="fixed inset-x-0 bottom-2 z-40">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="bg-card rounded-lg border px-3 py-2 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="text-sm">Наявні незбережені зміни</div>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" onClick={resetToServer}>
                    Відмінити
                  </Button>
                  <Button onClick={save} disabled={saving}>
                    {saving ? 'Збереження…' : 'Зберегти'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {data.id ? 'Редагувати продукт' : 'Новий продукт'}
        </h1>
        <div className="flex gap-2">
          {isDirty && (
            <Button variant="outline" onClick={() => router.push('/products')}>
              Відмінити
            </Button>
          )}
          <Button onClick={save} disabled={saving}>
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
                onValueChange={(v) => dispatch(setField({ key: 'brandId', value: v }))}
              >
                <SelectTrigger>
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
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm">Заголовок</label>
            <Input
              value={data.name ?? ''}
              onChange={(e) => dispatch(setField({ key: 'name', value: e.target.value }))}
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

          {/* SEO превью */}
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
                onChange={(e) => setSlug(e.target.value)}
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

      {/* нижняя панель */}
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
        <Button onClick={save} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти'}
        </Button>
      </div>
    </div>
  );
}

/* === ВАРІАНТИ (как раньше) ============================================ */
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
    return (
      <OptionEditor
        defaultName="Обʼєм"
        defaultValues={data.variants.map((v) => v.label ?? '').filter(Boolean)}
        onCancel={closeEditor}
        onSave={(name, values) => {
          dispatch(setVariantsFromValues({ optionName: name, values }));
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
              const media = await uploadOne(file);
              dispatch(setVariantImage({ index: idx, media }));
            }}
            onRemoveImage={() => dispatch(clearVariantImage(idx))}
            onRemove={() => dispatch(removeVariant(idx))}
          />
        ))}
      </div>
    </div>
  );
}

function OptionEditor({
  defaultName = 'Обʼєм',
  defaultValues = [],
  onCancel,
  onSave,
}: {
  defaultName?: string;
  defaultValues?: string[];
  onCancel: () => void;
  onSave: (name: string, values: string[]) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [tokens, setTokens] = useState<string[]>(
    defaultValues.map((v) => v.trim()).filter(Boolean),
  );
  const [input, setInput] = useState('');
  const addToken = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (!tokens.includes(v)) setTokens((t) => [...t, v]);
  };
  const removeToken = (i: number) => setTokens((t) => t.filter((_, idx) => idx !== i));
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addToken(input);
      setInput('');
    }
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const parts = e.clipboardData
      .getData('text')
      .split(/[,\n;]/g)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) {
      e.preventDefault();
      setTokens((t) => Array.from(new Set([...t, ...parts])));
    }
  };
  const save = () => {
    const values = tokens.map((v) => v.trim()).filter(Boolean);
    if (!values.length) return onCancel();
    onSave(name.trim() || 'Варіант', values);
  };

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
      <div className="rounded-lg border p-2">
        <div className="mb-2 flex flex-wrap gap-2">
          {tokens.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
            >
              {t}
              <button
                type="button"
                onClick={() => removeToken(i)}
                className="text-muted-foreground hover:text-foreground ml-1"
                title="Видалити"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder="Введіть значення і натисніть Enter або ,"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        <div className="text-muted-foreground mt-1 text-xs">
          Підтримується вставка через кому або новий рядок.
        </div>
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
