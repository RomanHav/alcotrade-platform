'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTranslateNews } from '@/store/operations/translateNews';
import { hydrateInitial, setMissingOnly, setQuery, setStatus } from '@/store/slices/translateNewsListSlice';

interface RowItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  date: string | null;
  updatedAt: string;
  coverUrl: string | null;
  hasEn: boolean;
}

export default function NewsList({ initial }: { initial: RowItem[] }) {
  const dispatch = useAppDispatch();
  const { items, q, missingOnly, loading, status, page, total, limit } = useAppSelector((s) => s.translateNewsList);

  useEffect(() => {
    if (initial?.length) dispatch(hydrateInitial({ items: initial, total: initial.length }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(fetchTranslateNews({ q: q.trim() || undefined, missingOnly, status: status || undefined }));
    }, 250);
    return () => clearTimeout(t);
  }, [q, missingOnly, status, dispatch]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex h-full gap-6">
      <div className="flex w-[300px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Показано {items.length} з {total}
          </span>
          <button className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <FilterIcon className="h-4 w-4 text-neutral-500" />
          </button>
        </div>
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
          <Input
            placeholder="Пошук новин..."
            value={q}
            onChange={(e) => dispatch(setQuery(e.target.value))}
            className="h-9"
          />
          <Select value={status ?? undefined} onValueChange={(v) => dispatch(setStatus(v === 'all' ? undefined : v))}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі статуси</SelectItem>
              <SelectItem value="ACTIVE">Активний</SelectItem>
              <SelectItem value="DRAFT">Чорновик</SelectItem>
              <SelectItem value="ARCHIVE">Архів</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-xs font-medium opacity-80">
            <Checkbox checked={missingOnly} onCheckedChange={(v) => dispatch(setMissingOnly(v === true))} />
            Тільки без перекладу EN
          </label>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {items.map((article) => (
              <li key={article.id} className="group">
                <Link
                  href={`/translate/news/${article.id}`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900',
                  )}
                >
                  {article.coverUrl ? (
                    <Image
                      src={article.coverUrl}
                      alt={article.title}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-neutral-200 text-neutral-400 dark:bg-neutral-800">
                      📰
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{article.title}</span>
                      {!article.hasEn && (
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          NO EN
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] opacity-70">
                      {article.date
                        ? format(new Date(article.date), 'dd.MM.y', { locale: uk })
                        : format(new Date(article.updatedAt), 'dd.MM.y', { locale: uk })}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {loading && (
              <li className="flex items-center justify-center gap-2 px-4 py-4 text-xs text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Оновлення...
              </li>
            )}
            {!loading && items.length === 0 && (
              <li className="px-4 py-6 text-center text-xs opacity-60">Нічого не знайдено</li>
            )}
          </ul>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
            <button
              disabled={page === 1}
              className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-neutral-500">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        Оберіть новину для перекладу
      </div>
    </div>
  );
}
