'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { FilterIcon, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SectionItem {
  id: string;
  key: string;
  name: string;
  position: number;
  isVisible: boolean;
  itemsCount: number;
  hasAllEnTranslations: boolean;
  updatedAt: string;
}

export default function MainPageSectionList({ initial }: { initial: SectionItem[] }) {
  const [items] = useState(initial);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Pagination state (if needed)
  const [page, setPage] = useState(1);
  const itemsPerPage = 30;
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const displayedItems = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const selectedSection = selectedKey ? items.find((i) => i.key === selectedKey) : null;

  return (
    <div className="flex h-full gap-6">
      {/* Left panel - section list */}
      <div className="flex w-[300px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Показано {displayedItems.length} з {totalItems}
          </span>
          <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
            <FilterIcon className="h-4 w-4 text-neutral-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {displayedItems.map((section) => (
              <li key={section.id} className="group">
                <button
                  onClick={() => setSelectedKey(section.key)}
                  className={cn(
                    'flex w-full flex-col gap-1 px-4 py-3 text-sm text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900',
                    selectedKey === section.key && 'bg-neutral-100 dark:bg-neutral-800'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{section.name}</span>
                    {section.hasAllEnTranslations ? (
                      <span className="flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        <Check className="h-3 w-3" /> EN
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        <X className="h-3 w-3" /> NO EN
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-neutral-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Right panel - section preview or prompt */}
      {selectedSection ? (
        <div className="flex flex-1 flex-col rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">{selectedSection.name}</h3>
            <Link
              href={`/translate/main/${selectedSection.key}`}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Редагувати переклад
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-2 text-[11px] uppercase tracking-wide opacity-60">Кількість полів</div>
              <div className="text-lg font-medium">{selectedSection.itemsCount}</div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-2 text-[11px] uppercase tracking-wide opacity-60">Статус перекладу EN</div>
              <div className="flex items-center gap-2">
                {selectedSection.hasAllEnTranslations ? (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Всі поля перекладено</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">Потрібен переклад</span>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-2 text-[11px] uppercase tracking-wide opacity-60">Останнє оновлення</div>
              <div className="text-sm">
                {format(new Date(selectedSection.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: uk })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          Оберіть секцію для перегляду
        </div>
      )}
    </div>
  );
}
