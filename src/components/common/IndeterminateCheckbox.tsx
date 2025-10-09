'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

export default function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  title,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (next: boolean) => void;
  title?: string;
}) {
  const state = indeterminate ? 'indeterminate' : checked;

  return (
    <Checkbox
      checked={state as any}
      onCheckedChange={(v) => onChange(Boolean(v))}
      aria-label={title}
      title={title}
      className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground data-[state=checked]:text-background h-4 w-4"
    />
  );
}
