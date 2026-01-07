"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTranslateProducts } from '@/store/operations/translateProducts';
import { hydrateInitial, setMissingOnly, setQuery, setStatus, setBrandId } from '@/store/slices/translateProductListSlice';

interface ProductRowItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: string;
  hasEn: boolean;
  brandName?: string;
}

interface Brand {
  id: string;
  name: string;
}

export default function ProductList({ initial, brands }: { initial: ProductRowItem[]; brands: Brand[] }) {
  const dispatch = useAppDispatch();
  const { items, q, missingOnly, loading, status, brandId } = useAppSelector((s) => s.translateProductList);

  useEffect(() => {
    if (initial?.length) {
      dispatch(hydrateInitial({ items: initial }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(fetchTranslateProducts({ 
        q: q.trim() || undefined, 
        missingOnly, 
        status: status || undefined,
        brandId: brandId || undefined 
      }));
    }, 250);
    return () => clearTimeout(t);
  }, [q, missingOnly, status, brandId, dispatch]);

  return (
    <div className="flex h-full gap-6">
      <div className="flex w-[380px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
          <Input
            placeholder="Пошук продуктів..."
            value={q}
            onChange={(e) => dispatch(setQuery(e.target.value))}
            className="h-9"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={status ?? 'all'} onValueChange={(v) => dispatch(setStatus(v === 'all' ? undefined : v))}>
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
            <Select value={brandId ?? 'all'} onValueChange={(v) => dispatch(setBrandId(v === 'all' ? undefined : v))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Бренд" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі бренди</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium opacity-80">
            <Checkbox checked={missingOnly} onCheckedChange={(v) => dispatch(setMissingOnly(v === true))} />
            Тільки без перекладу EN
          </label>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 px-4 py-4 text-xs text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Оновлення...
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="px-4 py-6 text-center text-xs opacity-60">Нічого не знайдено</div>
          )}
          {!loading && items.length > 0 && (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/translate/products/${p.id}`}
                    className="flex flex-col gap-1 px-4 py-3 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.name}</span>
                      {!p.hasEn && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          NO EN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] opacity-70">
                      <span>{p.brandName || 'Без бренду'}</span>
                      <span>{format(new Date(p.updatedAt), 'dd.MM.y HH:mm', { locale: uk })}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        Оберіть продукт для перекладу
      </div>
    </div>
  );
}
