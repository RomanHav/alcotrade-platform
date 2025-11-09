'use client';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import RichTextarea from '@/components/ui/rich-textarea';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTranslateProduct, saveTranslateProduct } from '@/store/operations/translate';
import { hydrateFromServer, resetDraft, resetDraftToServer, setField, setVariantLabel } from '@/store/slices/translateDetailSlice';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import UnsavedBar from '@/components/common/UnsavedBar';

type Variant = { id: string; label: string | null; position: number; translations: { id: string; label: string | null }[] };

type Initial = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  translations: { id: string; name: string; slug: string | null; description: string | null; seoTitle: string | null; seoDescription: string | null }[];
  variants: Variant[];
};

export default function TranslateEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const detail = useAppSelector((s) => s.translateDetail);
  const draft = detail.draft;
  const saving = detail.saving;

  // Hydrate from server and fetch latest to ensure freshness
  useEffect(() => {
    dispatch(hydrateFromServer(initial as any));
    dispatch(fetchTranslateProduct({ id: initial.id }));
  }, [dispatch, initial.id, initial]);

  const canSave = useMemo(() => {
    if (!draft) return false;
    return (
      draft.name.trim().length > 0 ||
      draft.description.trim().length > 0 ||
      draft.variants.some((v) => (v.label ?? '').trim().length > 0) ||
      draft.seoTitle.trim().length > 0 ||
      draft.seoDescription.trim().length > 0
    );
  }, [draft]);

  // Compute dirty state comparing draft to server baseline
  const isDirty = useMemo(() => {
    if (!detail.data || !draft) return false;
    const en = detail.data.translations?.[0] || null;
    const base = {
      name: en?.name ?? '',
      slug: en?.slug ?? '',
      description: en?.description ?? '',
      seoTitle: en?.seoTitle ?? '',
      seoDescription: en?.seoDescription ?? '',
      variantsMap: new Map(detail.data.variants.map((v) => [v.id, v.translations?.[0]?.label ?? ''])),
    };
    if (draft.name !== base.name) return true;
    if (draft.slug !== base.slug) return true;
    if (draft.description !== base.description) return true;
    if (draft.seoTitle !== base.seoTitle) return true;
    if (draft.seoDescription !== base.seoDescription) return true;
    if (draft.variants.length !== detail.data.variants.length) return true;
    for (const v of draft.variants) {
      const baseLabel = base.variantsMap.get(v.variantId) ?? '';
      if ((v.label ?? '') !== baseLabel) return true;
    }
    return false;
  }, [detail.data, draft]);

  // Warn on page leave if dirty
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
        saveTranslateProduct({
          id: initial.id,
          name: draft.name,
          slug: draft.slug,
          description: draft.description,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
          variants: draft.variants,
        }),
      ) as any).unwrap();
      toast.success('Переклад збережено', { description: 'EN-версію успішно оновлено.' });
      // Навигация сразу после показа тоста, без startTransition — как в BrandForm
      router.push('/translate/products');
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
      {/* Bottom sticky action bar (reuse common component) */}
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
            <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">Назва</div>
            <div className="rounded border border-neutral-200 bg-neutral-50 p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">{initial.name}</div>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">Опис</div>
            <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900">{initial.description || '—'}</div>
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
            <div className="mb-2 text-[11px] uppercase tracking-wide opacity-60">Варіанти</div>
            <div className="grid gap-2">
              {initial.variants.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <span className="opacity-70">{v.label || '—'}</span>
                  <span className="text-[11px] opacity-50">pos {v.position}</span>
                </div>
              ))}
            </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">SEO Title (EN)</div>
              <Input value={draft?.seoTitle ?? ''} maxLength={60} onChange={(e) => dispatch(setField({ key: 'seoTitle', value: e.target.value }))} placeholder="до 60 символів" />
            </div>
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide opacity-60">SEO Description (EN)</div>
              <Textarea value={draft?.seoDescription ?? ''} maxLength={160} onChange={(e) => dispatch(setField({ key: 'seoDescription', value: e.target.value }))} placeholder="до 160 символів" rows={3} className="max-w-2xl resize-y" />
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wide opacity-60">Варіанти (EN)</div>
            <div className="grid gap-2">
              {draft?.variants.map((v, idx) => (
                <div key={v.variantId} className="grid grid-cols-2 items-center gap-3">
                  <div className="text-xs opacity-60">{initial.variants[idx]?.label || '—'}</div>
                  <Input value={v.label ?? ''} onChange={(e) => dispatch(setVariantLabel({ variantId: v.variantId, label: e.target.value }))} placeholder="Label EN" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
