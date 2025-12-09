'use client';
import { useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextarea from '@/components/ui/rich-textarea';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTranslateNewsDetail, saveTranslateNews } from '@/store/operations/translateNews';
import { hydrateFromServer, resetDraftToServer, setField } from '@/store/slices/translateNewsDetailSlice';
import { toast } from 'sonner';
import UnsavedBar from '@/components/common/UnsavedBar';
import { Loader2 } from 'lucide-react';

type Initial = {
  uk: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    date: string | null;
    status: string;
    seoTitle: string | null;
    seoDescription: string | null;
    cover: { id: string; url: string; alt: string | null } | null;
  };
  en: {
    id: string;
    title: string;
    slug: string | null;
    excerpt: string | null;
    content: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  } | null;
};

export default function TranslateNewsEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const detail = useAppSelector((s) => s.translateNewsDetail);
  const draft = detail.draft;
  const saving = detail.saving;

  useEffect(() => {
    dispatch(hydrateFromServer(initial as any));
    dispatch(fetchTranslateNewsDetail({ id: initial.uk.id }));
  }, [dispatch, initial.uk.id, initial]);

  const canSave = useMemo(() => {
    if (!draft) return false;
    return (
      draft.title.trim().length > 0 ||
      draft.content.trim().length > 0 ||
      draft.seoTitle.trim().length > 0 ||
      draft.seoDescription.trim().length > 0 ||
      draft.slug.trim().length > 0
    );
  }, [draft]);

  // Derived SEO preview (fallbacks)
  const previewTitle = (draft?.seoTitle || draft?.title || initial.uk.title || '').trim() || 'Мета-заголовок';
  const previewDesc = (draft?.seoDescription || draft?.content || initial.uk.content || '')
    .trim()
    .slice(0, 160) || 'Опис новини';
  const previewSlug = (draft?.slug || initial.uk.slug || 'news-slug')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'news';
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://alcotrade.com.ua';

  const isDirty = useMemo(() => {
    if (!detail.data || !draft) return false;
    const en = detail.data.en;
    const base = {
      title: en?.title ?? '',
      slug: en?.slug ?? '',
      content: en?.content ?? '',
      seoTitle: en?.seoTitle ?? '',
      seoDescription: en?.seoDescription ?? '',
    };
    return (
      draft.title !== base.title ||
      draft.slug !== base.slug ||
      draft.content !== base.content ||
      draft.seoTitle !== base.seoTitle ||
      draft.seoDescription !== base.seoDescription
    );
  }, [detail.data, draft]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const onSave = async () => {
    if (!draft) return;
    try {
      await (dispatch(
        saveTranslateNews({
          id: initial.uk.id,
          title: draft.title,
          slug: draft.slug,
          content: draft.content,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
        }),
      ) as any).unwrap();
      toast.success('Переклад новини збережено', { description: 'EN-версія успішно оновлена.' });
      router.push('/translate/news');
    } catch (e: any) {
      if (e?.message === 'slug_taken') {
        toast.error('Посилання (slug) зайняте', { description: 'Оберіть інший slug для EN.' });
      } else {
        toast.error('Помилка збереження', { description: 'Спробуйте ще раз.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <UnsavedBar
        visible={isDirty}
        onCancel={() => {
          dispatch(resetDraftToServer());
          toast('Зміни скасовано');
        }}
        onSave={onSave}
        saving={saving}
        disabled={!isDirty || !canSave}
      />

      {/* Article section */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h3 className="mb-4 text-lg font-medium">Новина</h3>
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <th className="w-[180px] px-4 py-3 text-left text-sm font-medium"></th>
                <th className="px-4 py-3 text-left text-sm font-medium">Оригінал</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Англійська</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Заголовок новини
                </td>
                <td className="px-4 py-3">
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-2 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                    {initial.uk.title}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={draft?.title ?? ''}
                    onChange={(e) => dispatch(setField({ key: 'title', value: e.target.value }))}
                    placeholder="Input English post title"
                    className="bg-white dark:bg-neutral-950"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Контент
                </td>
                <td className="px-4 py-3">
                  <textarea
                    readOnly
                    value={initial.uk.content || '—'}
                    rows={8}
                    className="w-full resize-none overflow-y-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-2 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
                  />
                </td>
                <td className="px-4 py-3">
                  <RichTextarea
                    value={draft?.content ?? ''}
                    onChange={(v) => dispatch(setField({ key: 'content', value: v }))}
                    placeholder="Input English content"
                    rows={6}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SEO section */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h3 className="mb-4 text-lg font-medium">Вигляд у пошукових системах</h3>
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <th className="w-[180px] px-4 py-3 text-left text-sm font-medium"></th>
                <th className="px-4 py-3 text-left text-sm font-medium">Оригінал</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Англійська</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Мета заголовок новини
                </td>
                <td className="px-4 py-3">
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-2 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                    {initial.uk.seoTitle || '—'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={draft?.seoTitle ?? ''}
                    maxLength={60}
                    onChange={(e) => dispatch(setField({ key: 'seoTitle', value: e.target.value }))}
                    placeholder="Input English meta-title"
                    className="bg-white dark:bg-neutral-950"
                  />
                  <div className={`mt-1 text-right text-[11px] ${((draft?.seoTitle ?? '').trim().length > 60) ? 'text-amber-600' : 'opacity-60'}`}>
                    {(draft?.seoTitle ?? '').trim().length} / 60
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Мета опис новини
                </td>
                <td className="px-4 py-3">
                  <div className="max-h-24 overflow-y-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-2 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                    {initial.uk.seoDescription || '—'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Textarea
                    value={draft?.seoDescription ?? ''}
                    maxLength={160}
                    onChange={(e) => dispatch(setField({ key: 'seoDescription', value: e.target.value }))}
                    placeholder="Input English meta-description"
                    rows={3}
                    className="resize-y bg-white dark:bg-neutral-950"
                  />
                  <div className={`mt-1 text-right text-[11px] ${((draft?.seoDescription ?? '').trim().length > 160) ? 'text-amber-600' : 'opacity-60'}`}>
                    {(draft?.seoDescription ?? '').trim().length} / 160
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Посилання на новину
                </td>
                <td className="px-4 py-3">
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-2 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                    {initial.uk.slug}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={draft?.slug ?? ''}
                    onChange={(e) => dispatch(setField({ key: 'slug', value: e.target.value }))}
                    placeholder="Input English meta-url"
                    className="bg-white dark:bg-neutral-950"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SEO Preview */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h3 className="mb-4 text-lg font-medium">Перегляд SEO (EN)</h3>
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
          <a
            href={`${SITE}/en/news/${previewSlug}`}
            className="text-primary block font-medium underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {previewTitle}
          </a>
          <div className="text-xs text-green-700 dark:text-green-400">
            {SITE}/en/news/{previewSlug}
          </div>
          <div className="text-neutral-600 dark:text-neutral-400">{previewDesc}</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="secondary"
          disabled={saving}
          onClick={() => {
            dispatch(resetDraftToServer());
            toast('Зміни скасовано');
          }}
        >
          Скинути
        </Button>
        <Button disabled={saving || !isDirty || !canSave} onClick={onSave}>
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Збереження…
            </span>
          ) : (
            'Зберегти'
          )}
        </Button>
      </div>
    </div>
  );
}
