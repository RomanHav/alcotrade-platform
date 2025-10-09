'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
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
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hydrateFromServer, setField } from '@/store/slices/brandFormSlice';
import BrandMediaPicker from './BrandMediaPicker';
import type { BrandFormState } from '@/store/slices/brandFormSlice';
import type { BrandStatus } from '@prisma/client';
import UnsavedBar from '@/components/common/UnsavedBar';
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog';
import { saveBrand, deleteBrand } from '@/store/operations/brands';
import { useDirtyBrandSnapshot } from './hooks/useDirtySnapshot';
import { slug as makeSlug } from '@/lib/slug';

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Вкажіть назву бренду'),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVE']),
  description: z.string().optional(),
  seoTitle: z.string().max(60).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  coverId: z.string().nullable().optional(),
});

type ProductLite = { id: string; name: string; status: 'ACTIVE' | 'DRAFT' | 'ARCHIVE' };

export default function BrandForm({
  serverBrand,
  products,
}: {
  serverBrand?: Partial<BrandFormState> & { slug?: string | null }; // 👈
  products: ProductLite[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const data = useAppSelector((s) => s.brandForm);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // slug
  const [slug, setSlug] = useState<string>(serverBrand?.slug ?? '');
  const slugTouchedRef = useRef(false);

  // hydrate
  useEffect(() => {
    dispatch(hydrateFromServer(serverBrand ?? {}));
    slugTouchedRef.current = false;
    setSlug(serverBrand?.slug ?? '');
  }, [dispatch, serverBrand]);

  // dirty snapshot
  const { isDirty } = useDirtyBrandSnapshot(serverBrand, data, slug);

  // warn on unload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // simple errors (в т.ч. slug)
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!data.name?.trim()) next.name = 'Вкажіть назву бренду';
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) next.slug = 'Латиниця, цифри та дефіс';
    setErrors(next);
    if (next.name || next.slug) {
      toast.error('Перевірте форму', { description: next.name || next.slug });
      return false;
    }
    return true;
  };

  // save via thunk
  const onSave = async () => {
    if (saving || !isDirty) return;
    if (!validate()) return;

    try {
      const parsed = schema.parse({
        id: data.id,
        name: data.name ?? '',
        status: data.status as BrandStatus,
        description: data.description ?? '',
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        coverId: data.coverId ?? null,
      });
      setSaving(true);
      await dispatch(
        saveBrand({
          ...parsed,
          slug: makeSlug(slug || data.name || ''),
        }),
      ).unwrap();
      toast.success('Збережено', { description: 'Бренд успішно збережено.' });
      router.push('/brands');
    } catch (err: any) {
      if (err?.message === 'slug_taken') {
        setErrors((e) => ({ ...e, slug: 'Це посилання вже зайняте' }));
        toast.error('Посилання зайняте', { description: 'Оберіть інший slug.' });
      } else {
        const msg = err?.issues?.[0]?.message ?? 'Помилка збереження';
        toast.error('Не вдалося зберегти', { description: msg });
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!data.id) return setShowDelete(false);
    setDeleting(true);
    try {
      await dispatch(
        deleteBrand({ ids: [data.id], mode: 'restrict' }), // ⬅️ важно: ids массив
      ).unwrap();
      toast.success('Видалено', { description: 'Бренд успішно видалено.' });
      router.push('/brands');
    } catch (e: any) {
      toast.error('Не вдалося видалити', { description: e?.message ?? 'Спробуйте ще раз.' });
    } finally {
      setDeleting(false);
    }
  };

  const resetToServer = () => {
    dispatch(hydrateFromServer(serverBrand ?? {}));
    setSlug(serverBrand?.slug ?? '');
    toast('Зміни скасовано');
  };

  // SEO preview (аналогично продуктам)
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://alcotrade.com.ua';
  const previewTitle = (data.seoTitle || data.name || '').trim() || 'Мета-заголовок';
  const previewDesc =
    (data.seoDescription || data.description || '').trim().slice(0, 160) || 'Опис бренду';
  const previewSlug =
    (slug ? makeSlug(slug) : data.name ? makeSlug(data.name) : 'posylannya-brendu') ||
    'posylannya-brendu';

  return (
    <div className="px-4 pt-4 md:px-6">
      {/* sticky bar */}
      <UnsavedBar visible={isDirty} onCancel={resetToServer} onSave={onSave} saving={saving} />

      {/* breadcrumbs */}
      <div className="mb-1 text-sm">
        <Link href="/brands" className="underline-offset-4 hover:underline">
          Бренди
        </Link>{' '}
        <span className="opacity-60">›</span>{' '}
        <span className="opacity-80">{data.name?.trim() || 'Назва бренду'}</span>
      </div>

      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{data.id ? 'Редагувати бренд' : 'Новий бренд'}</h1>
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

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Статус</label>
              <Select
                value={data.status}
                onValueChange={(v: BrandFormState['status']) =>
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
            <label className="mb-1 block text-sm">Опис бренду</label>
            <Textarea
              rows={6}
              value={data.description ?? ''}
              onChange={(e) => dispatch(setField({ key: 'description', value: e.target.value }))}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">Продукти</div>
              <Button size="sm" variant="outline" onClick={() => router.push('/products/new')}>
                Додати продукт
              </Button>
            </div>
            <div className="rounded-lg border">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b p-3 last:border-b-0"
                >
                  <div className="truncate">{p.name}</div>
                  <Badge variant="secondary">
                    {p.status === 'ACTIVE'
                      ? 'Активний'
                      : p.status === 'DRAFT'
                        ? 'Чорновик'
                        : 'Архів'}
                  </Badge>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-muted-foreground p-3 text-sm">Немає продуктів</div>
              )}
            </div>
          </div>

          {/* SEO превʼю (идентично подходу в ProductForm) */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Налаштування в пошукових системах</div>

            <div className="bg-muted/30 rounded-lg border p-3">
              <a
                href={`${SITE}/uk/brands/${previewSlug}`}
                className="text-primary block text-lg underline-offset-4 hover:underline"
              >
                {previewTitle}
              </a>
              <div className="text-muted-foreground text-sm">
                {SITE}/uk/brands/<span className="opacity-80">{previewSlug}</span>
              </div>
              <div className="mt-2">{previewDesc}</div>
            </div>

            <div>
              <label className="mb-1 block text-sm">Змінити мета-заголовок</label>
              <Input
                placeholder="&lt;Назва бренду взята з заголовку&gt;"
                value={data.seoTitle ?? ''}
                onChange={(e) => dispatch(setField({ key: 'seoTitle', value: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">Змінити мета-опис</label>
              <Textarea
                rows={3}
                placeholder="&lt;Опис бренду взятий з опису&gt;"
                value={data.seoDescription ?? ''}
                onChange={(e) =>
                  dispatch(setField({ key: 'seoDescription', value: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">Змінити посилання на бренд (slug)</label>
              <Input
                placeholder="posylannya-brendu"
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

        <Card className="space-y-2 p-4">
          <BrandMediaPicker />
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
              title="Видалити бренд?"
              description="Дію неможливо скасувати."
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
