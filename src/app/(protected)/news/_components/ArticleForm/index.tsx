'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextarea from '@/components/ui/rich-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  hydrateFormFromServer as hydrateFromServer,
  setFormField as setField,
  type ArticleForm as ArticleFormState,
} from '@/store/slices/articles';

import ArticleMediaPicker from './ArticleMediaPicker';
import UnsavedBar from '@/components/common/UnsavedBar';
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog';

import { saveArticle, deleteArticle } from '@/store/operations/articles';

import NewsDatePicker from './NewsDatePicker';

import { slug as makeSlug } from '@/lib/slug';
import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import type { NewsStatus } from '@prisma/client';

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'Вкажіть заголовок статті'),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVE']),
  excerpt: z.string().max(300).optional(),
  content: z.string().optional(),
  date: z.string().nullable().optional(),
  seoTitle: z.string().max(60).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  coverId: z.string().nullable().optional(),
  slug: z.string().min(1, 'Вкажіть або згенеруйте посилання (slug)'),
});

const toYMDfromAny = (v?: string | null) =>
  v ? (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : new Date(v).toISOString().slice(0, 10)) : undefined;

export default function ArticleForm({
  serverArticle,
}: {
  serverArticle?: Partial<ArticleFormState> & { slug?: string | null };
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const data = useAppSelector((s) => s.articles.form);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // slug
  const [slug, setSlug] = useState<string>(serverArticle?.slug ?? '');
  const slugTouchedRef = useRef(false);

  // hydrate
  useEffect(() => {
    dispatch(hydrateFromServer(serverArticle ?? {}));
    slugTouchedRef.current = false;
    setSlug(serverArticle?.slug ?? '');
  }, [dispatch, serverArticle]);

  const isDirty = React.useMemo(() => {
  const pick = (v: any) =>
    JSON.stringify({
      id: v.id ?? null,
      status: v.status ?? 'DRAFT',
      title: v.title ?? '',
      excerpt: v.excerpt ?? '',
      content: v.content ?? '',
      seoTitle: v.seoTitle ?? null,
      seoDescription: v.seoDescription ?? null,
      coverId: v.coverId ?? null,
      date: v.date ?? null,
      _pendingCover: !!v.pendingCoverFile,
      _pendingDelete: !!v.pendingCoverDelete,
    });

  return pick(serverArticle ?? {}) !== pick({ ...data });
}, [serverArticle, data]);

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
  const [errors, setErrors] = useState<{ title?: string; slug?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!data.title?.trim()) next.title = 'Вкажіть заголовок статті';
    const s = (slug || '').trim();
    if (!s || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) next.slug = 'Латиниця, цифри та дефіс';
    setErrors(next);
    if (next.title || next.slug) {
      toast.error('Перевірте форму', { description: next.title || next.slug });
      return false;
    }
    return true;
  };

  // save via thunk
  const onSave = async () => {
    if (saving || !isDirty) return;
    if (!validate()) return;

    try {
      // нормалізуємо дату до ISO початку дня або null
      const dateISO =
        data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date)
          ? new Date(`${data.date}T00:00:00`).toISOString()
          : data.date || null;

      const parsed = schema.parse({
        id: data.id || undefined,
        title: data.title ?? '',
        status: (data.status as NewsStatus) ?? 'DRAFT',
        // excerpt формируем автоматически из контента (до 300 символов)
        excerpt: (data.content ?? '').slice(0, 300),
        content: data.content ?? '',
        date: dateISO,
        seoTitle: (data.seoTitle && data.seoTitle.trim()) || (data.title ?? null),
        seoDescription:
        (data.seoDescription && data.seoDescription.trim()) ||
        (data.content ?? '').slice(0, 160) ||
        null,
        coverId: data.coverId ?? null,
        slug: makeSlug(slug || data.title || ''),
      });

      setSaving(true);
      await dispatch(saveArticle(parsed)).unwrap();
      console.log('Article saved successfully:', parsed);

      toast.success('Збережено', { description: 'Статтю успішно збережено.' });
      router.push('/news');
    } catch (err: any) {
      const code = typeof err === 'string' ? err : err?.message;
      if (code === 'slug_taken') {
        setErrors((e) => ({ ...e, slug: 'Це посилання вже зайняте' }));
        toast.error('Посилання зайняте', { description: 'Оберіть інший slug.' });
      } else {
        const msg =
          err?.issues?.[0]?.message ?? (typeof err === 'string' ? err : 'Помилка збереження');
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
      await dispatch(deleteArticle({ ids: [data.id] })).unwrap();
      toast.success('Видалено', { description: 'Статтю успішно видалено.' });
      router.push('/news');
    } catch (e: any) {
      toast.error('Не вдалося видалити', { description: e?.message ?? 'Спробуйте ще раз.' });
    } finally {
      setDeleting(false);
    }
  };

  const resetToServer = () => {
    dispatch(hydrateFromServer(serverArticle ?? {}));
    setSlug(serverArticle?.slug ?? '');
    toast('Зміни скасовано');
  };

  // SEO preview
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://alcotrade.com.ua';
  const previewTitle = (data.seoTitle || data.title || '').trim() || 'Мета-заголовок';
  const previewDesc =
    (data.seoDescription || data.excerpt || data.content || '').trim().slice(0, 160) ||
    'Опис новини';
  const previewSlug =
    (slug ? makeSlug(slug) : data.title ? makeSlug(data.title) : 'posylannya-novyny') ||
    'posylannya-novyny';

  return (
    <div className="px-4 pt-4 md:px-6">
      {/* sticky bar */}
      <UnsavedBar visible={isDirty} onCancel={resetToServer} onSave={onSave} saving={saving} />

      {/* breadcrumbs */}
      <div className="mb-5 flex items-center gap-2.5 text-xl font-extralight">
        <Link href="/news" className="underline-offset-4 hover:underline">
          Новини
        </Link>{' '}
        <ChevronRight className="h-5 w-5 opacity-60" />
        <span className="opacity-80">{data.title?.trim() || 'Заголовок статті'}</span>
      </div>

      {/* header */}
      <div className="mb-9 flex items-center justify-between">
        <h1 className="text-4xl font-semibold">{data.id ? 'Редагувати статтю' : 'Нова стаття'}</h1>
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
                value={(data.status as NewsStatus) ?? 'DRAFT'}
                onValueChange={(v: NewsStatus) => dispatch(setField({ key: 'status', value: v }))}
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
              <label className="mb-1 block text-sm">Дата (для показу/сорту)</label>
              <NewsDatePicker
                value={toYMDfromAny(data.date)}
                onChange={(v) => dispatch(setField({ key: 'date', value: v ?? null }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm">Заголовок</label>
            <Input
              value={data.title ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                dispatch(setField({ key: 'title', value }));
                if (!slugTouchedRef.current) setSlug(makeSlug(value));
              }}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-destructive mt-1 text-xs">{errors.title}</p>}
          </div>


          <div>
            <label className="mb-1 block text-sm">Контент</label>
            <RichTextarea
              rows={8}
              value={data.content ?? ''}
              onChange={(v) => dispatch(setField({ key: 'content', value: v }))}
            />
          </div>

          {/* SEO */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Налаштування в пошукових системах</div>

            <div className="bg-muted/30 rounded-lg border p-3 w-full max-w-[720px] break-words">
              <a
                href={`${SITE}/uk/news/${previewSlug}`}
                className="text-primary block text-lg underline-offset-4 hover:underline"
              >
                {previewTitle}
              </a>
              <div className="text-muted-foreground text-sm">
                {SITE}/uk/news/<span className="opacity-80">{previewSlug}</span>
              </div>
              <div className="mt-2">{previewDesc}</div>
            </div>

            <div>
              <label className="mb-1 block text-sm">Мета-заголовок</label>
              <Input
                placeholder="&lt;Береться із заголовку статті&gt;"
                value={data.seoTitle ?? ''}
                onChange={(e) => dispatch(setField({ key: 'seoTitle', value: e.target.value }))}
              />
              <div
                className={`mt-1 text-right text-xs ${((data.seoTitle ?? '').trim().length > 60) ? 'text-amber-600' : 'text-muted-foreground'}`}
              >
                {((data.seoTitle ?? '').trim().length)} / 60
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm">Мета-опис</label>
              <Textarea
                rows={3}
                placeholder="&lt;Береться з короткого опису&gt;"
                value={data.seoDescription ?? ''}
                onChange={(e) =>
                  dispatch(setField({ key: 'seoDescription', value: e.target.value }))
                }
                className="max-w-[720px] resize-y"
              />
              <div
                className={`mt-1 text-right text-xs ${((data.seoDescription ?? '').trim().length > 160) ? 'text-amber-600' : 'text-muted-foreground'}`}
              >
                {((data.seoDescription ?? '').trim().length)} / 160
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm">Посилання на статтю (slug)</label>
              <Input
                placeholder="news-link"
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
          {/* Обкладинка (coverId/coverUrl) */}
          <ArticleMediaPicker />
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
              title="Видалити статтю?"
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
