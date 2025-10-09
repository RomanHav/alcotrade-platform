// app/(protected)/products/_components/ProductForm/index.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
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

import MediaPicker from '../MediaPicker';
import VariantsSection from './VariantsSection';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hydrateFromServer, setField } from '@/store/slices/productFormSlice';
import type { ProductFormState } from '@/store/slices/productFormSlice';
import type { ProductStatus } from '@prisma/client';
import { slug as makeSlug } from '@/lib/slug';
import { useDirtySnapshot } from './hooks/useDirtySnapshot';
import { saveProduct, deleteProduct } from '@/store/operations/products';
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog';

type Brand = { id: string; name: string };

export default function ProductForm({
  serverProduct,
  brands,
}: {
  serverProduct?: Partial<ProductFormState> & { slug?: string | null };
  brands: Brand[];
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
    dispatch(hydrateFromServer(serverProduct ?? {}));
    slugTouchedRef.current = false;
    setSlug(serverProduct?.slug ?? '');
  }, [dispatch, serverProduct]);

  useEffect(() => {
    setEditorOpen((data.variants?.length ?? 0) === 0);
  }, [data.variants.length]);

  const { isDirty, initialRef, comparable } = useDirtySnapshot(serverProduct, data, slug);

  // предупреждение при закрытии, если есть изменения
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // валидация
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
    if (firstError) toast.error('Перевірте форму', { description: firstError });
    return Object.keys(next).length === 0;
  }

  // сохранить (thunk)
  const onSave = async () => {
    if (saving || !isDirty) return;
    if (!validate()) return;

    setSaving(true);
    const payload = {
      id: data.id,
      name: data.name!,
      status: data.status as ProductStatus,
      brandId: data.brandId!,
      description: data.description ?? null,
      seoTitle: (data.seoTitle && data.seoTitle.trim()) || (data.name ?? null),
      seoDescription:
        (data.seoDescription && data.seoDescription.trim()) ||
        (data.description ?? '').slice(0, 160) ||
        null,
      coverId: data.coverId ?? null,
      imageIds: data.images.map((m) => m.id),
      slug: makeSlug(slug || data.name || ''),
      variants: data.variants.map((v, i) => ({
        id: v.id,
        label: v.label ?? null,
        volumeMl: v.volumeMl ?? null,
        position: i,
        imageId: v.imageId ?? null,
      })),
    };

    try {
      await dispatch(saveProduct(payload)).unwrap();
      toast.success('Збережено', { description: 'Продукт успішно збережено.' });
      router.push('/products');
    } catch (e: any) {
      if (e?.message === 'slug_taken') {
        setErrors((prev) => ({ ...prev, slug: 'Це посилання вже зайняте' }));
        toast.error('Посилання зайняте', { description: 'Оберіть інший slug.' });
      } else {
        toast.error('Помилка збереження', { description: 'Спробуйте ще раз.' });
      }
    } finally {
      setSaving(false);
    }
  };

  // удалить (thunk)
  const onDelete = async () => {
    if (!data.id) return setShowDelete(false);
    setDeleting(true);
    try {
      await dispatch(deleteProduct({ id: data.id! })).unwrap();
      toast.success('Видалено', { description: 'Продукт видалено.' });
      router.push('/products');
    } catch (e: any) {
      toast.error('Не вдалося видалити', { description: e?.message ?? 'Спробуйте ще раз.' });
    } finally {
      setDeleting(false);
    }
  };

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://alcotrade.com.ua';
  const previewTitle = (data.seoTitle || data.name || '').trim() || 'Мета-заголовок';
  const previewDesc =
    (data.seoDescription || data.description || '').trim().slice(0, 160) || 'Опис продукту';
  const previewSlug =
    (slug ? makeSlug(slug) : data.name ? makeSlug(data.name) : 'posylannya-na-produkt') ||
    'posylannya-na-produkt';

  const resetToServer = () => {
    dispatch(hydrateFromServer(serverProduct ?? {}));
    setSlug(serverProduct?.slug ?? '');
    toast('Зміни скасовано');
  };

  return (
    <div className="px-4 pt-4 md:px-6">
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
                  <Button onClick={onSave} disabled={saving || !isDirty}>
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

      {/* header */}
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
          <Button onClick={onSave} disabled={saving || !isDirty}>
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
                if (!slugTouchedRef.current) setSlug(makeSlug(value));
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

          {/* Variants */}
          <VariantsSection
            editorOpen={editorOpen}
            openEditor={() => setEditorOpen(true)}
            closeEditor={() => setEditorOpen(false)}
          />

          {/* SEO preview */}
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
              <label className="text_sm mb-1 block">Змінити мета-заголовок</label>
              <Input
                placeholder="&lt;Назва продукту взята з заголовку&gt;"
                value={data.seoTitle ?? ''}
                onChange={(e) => dispatch(setField({ key: 'seoTitle', value: e.target.value }))}
              />
            </div>

            <div>
              <label className="text_sm mb-1 block">Змінити мета-опис</label>
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
                onBlur={() => setSlug((s) => makeSlug(s))}
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

      {/* bottom actions */}
      <div className="mt-6 flex items-center justify-end gap-2">
        {data.id && (
          <>
            <Button variant="destructive" onClick={() => setShowDelete(true)} disabled={deleting}>
              {deleting ? 'Видалення…' : 'Видалити'}
            </Button>
            <ConfirmDeleteDialog
              open={showDelete}
              onOpenChange={setShowDelete}
              title="Видалити продукт?"
              description="Дію неможливо скасувати. Будуть видалені також варіанти."
              confirmLabel="Підтвердити"
              loading={deleting}
              onConfirm={onDelete}
            />
          </>
        )}
        <Button onClick={onSave} disabled={saving || !isDirty}>
          {saving ? 'Збереження…' : 'Зберегти'}
        </Button>
      </div>
    </div>
  );
}
