'use client';
import { useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextarea from '@/components/ui/rich-textarea';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTranslateBrand, saveTranslateBrand } from '@/store/operations/translateBrands';
import { hydrateFromServer, resetDraftToServer, setField } from '@/store/slices/translateBrandDetailSlice';
import { toast } from 'sonner';
import UnsavedBar from '@/components/common/UnsavedBar';
import { Loader2 } from 'lucide-react';

type Initial = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  translations: { id: string; name: string; slug: string | null; description: string | null; seoTitle: string | null; seoDescription: string | null }[];
  _count: { products: number };
};

export default function TranslateBrandEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const detail = useAppSelector((s) => s.translateBrandDetail);
  const draft = detail.draft;
  const saving = detail.saving;

  useEffect(() => {
    dispatch(hydrateFromServer(initial as any));
    dispatch(fetchTranslateBrand({ id: initial.id }));
  }, [dispatch, initial.id, initial]);

  const canSave = useMemo(() => {
    if (!draft) return false;
    return (
      draft.name.trim().length > 0 ||
      draft.description.trim().length > 0 ||
      draft.seoTitle.trim().length > 0 ||
      draft.seoDescription.trim().length > 0 ||
      draft.slug.trim().length > 0
    );
  }, [draft]);

  // Derived SEO preview (fallbacks)
  const previewTitle = (draft?.seoTitle || draft?.name || initial.name || '').trim() || 'Мета-заголовок';
  const previewDesc = (draft?.seoDescription || draft?.description || initial.description || '')
    .trim()
    .slice(0, 160) || 'Опис бренду';
  const previewSlug = (draft?.slug || draft?.name || initial.slug || 'brand-slug')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'brand';
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://alcotrade.com.ua';

  const isDirty = useMemo(() => {
    if (!detail.data || !draft) return false;
    const en = detail.data.translations?.[0] || null;
    const base = {
      name: en?.name ?? '',
      slug: en?.slug ?? '',
      description: en?.description ?? '',
      seoTitle: en?.seoTitle ?? '',
      seoDescription: en?.seoDescription ?? '',
    };
    return (
      draft.name !== base.name ||
      draft.slug !== base.slug ||
      draft.description !== base.description ||
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
        saveTranslateBrand({
          id: initial.id,
          name: draft.name,
          slug: draft.slug,
          description: draft.description,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
        }),
      ) as any).unwrap();
      toast.success('Переклад бренду збережено', { description: 'EN-версія успішно оновлена.' });
      router.push('/translate/brands');
    } catch (e: any) {
      if (e?.message === 'slug_taken') {
        toast.error('Посилання (slug) зайняте', { description: 'Оберіть інший slug для EN.' });
      } else {
        toast.error('Помилка збереження', { description: 'Спробуйте ще раз.' });
      }
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
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
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h3 className="mb-3 text-lg font-medium">Оригінал (uk)</h3>
        <div className="grid gap-3 text-sm opacity-80">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">Назва бренду</div>
            <div className="rounded border border-neutral-200 bg-neutral-50 p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">{initial.name}</div>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">Опис бренду</div>
            <div className="whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">{initial.description || '—'}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">SEO Title</div>
              <div className="rounded border border-neutral-200 bg-neutral-50 p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">{initial.seoTitle || '—'}</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">SEO Description</div>
              <div className="max-h-24 overflow-y-auto rounded border border-neutral-200 bg-neutral-50 p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">{initial.seoDescription || '—'}</div>
            </div>
          </div>
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wide opacity-60">Кількість продуктів</div>
            <div className="rounded border border-neutral-200 bg-neutral-50 p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">{initial._count.products}</div>
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-medium">Переклад (en)</h3>
          <div className="flex items-center gap-2">
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

        <div className="grid gap-4">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">Name (EN)</div>
            <Input value={draft?.name ?? ''} onChange={(e) => dispatch(setField({ key: 'name', value: e.target.value }))} placeholder="Назва англійською" />
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">Slug (EN)</div>
            <Input value={draft?.slug ?? ''} onChange={(e) => dispatch(setField({ key: 'slug', value: e.target.value }))} placeholder="Оставьте пустым для автогенерации" />
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">Description (EN)</div>
            <RichTextarea value={draft?.description ?? ''} onChange={(v) => dispatch(setField({ key: 'description', value: v }))} placeholder="Опис англійською" rows={7} />
          </div>
          {/* SEO Preview */}
          <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-[11px] font-semibold uppercase tracking-wide opacity-60">Перегляд SEO</div>
            <a
              href={`${SITE}/en/brands/${previewSlug}`}
              className="text-primary block text-sm underline-offset-4 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {previewTitle}
            </a>
            <div className="opacity-70">{SITE}/en/brands/<span className="opacity-90">{previewSlug}</span></div>
            <div className="mt-1 whitespace-pre-wrap opacity-80">{previewDesc}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">SEO Title (EN)</div>
              <Input value={draft?.seoTitle ?? ''} maxLength={60} onChange={(e) => dispatch(setField({ key: 'seoTitle', value: e.target.value }))} placeholder="до 60 символів" />
              <div className={`mt-1 text-right text-[11px] ${((draft?.seoTitle ?? '').trim().length > 60) ? 'text-amber-600' : 'opacity-60'}`}>{(draft?.seoTitle ?? '').trim().length} / 60</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">SEO Description (EN)</div>
              <Textarea value={draft?.seoDescription ?? ''} maxLength={160} onChange={(e) => dispatch(setField({ key: 'seoDescription', value: e.target.value }))} placeholder="до 160 символів" rows={3} className="max-w-2xl resize-y" />
              <div className={`mt-1 text-right text-[11px] ${((draft?.seoDescription ?? '').trim().length > 160) ? 'text-amber-600' : 'opacity-60'}`}>{(draft?.seoDescription ?? '').trim().length} / 160</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
