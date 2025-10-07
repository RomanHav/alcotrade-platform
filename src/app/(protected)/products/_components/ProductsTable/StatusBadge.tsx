'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Status = 'ACTIVE' | 'DRAFT' | 'ARCHIVE';

export default function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; className: string }> = {
    ACTIVE: {
      label: 'Активний',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    DRAFT: {
      label: 'Чорновик',
      className: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-300',
    },
    ARCHIVE: {
      label: 'Архів',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    },
  };
  const v = map[status];
  return (
    <Badge className={cn('px-2', v.className)} variant="secondary">
      {v.label}
    </Badge>
  );
}
