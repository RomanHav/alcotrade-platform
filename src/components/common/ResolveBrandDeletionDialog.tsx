// src/components/brands/DeleteBrandResolverDialog.tsx
'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

type Conflict = { id: string; count: number };
type BrandLite = { id: string; name: string };

export default function ResolveBrandDeletionDialog({
  open,
  onOpenChange,
  conflicts,
  brands,
  onResolve,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conflicts: Conflict[];
  brands: BrandLite[];
  onResolve: (params: { mode: 'cascade' | 'reassign'; reassignToId?: string }) => Promise<void>;
  loading?: boolean;
}) {
  const total = conflicts.reduce((s, c) => s + c.count, 0);

  const [mode, setMode] = React.useState<'cascade' | 'reassign'>('reassign');
  const [target, setTarget] = React.useState<string>('');

  const options = brands.filter((b) => !conflicts.some((c) => c.id === b.id));

  const handleConfirm = () => {
    if (mode === 'reassign' && !target) return;
    onResolve({ mode, reassignToId: mode === 'reassign' ? target : undefined });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Бренд має прив’язані продукти</AlertDialogTitle>
          <AlertDialogDescription>
            Виберіть, що зробити з {total} продуктами:
          </AlertDialogDescription>
          <ul className="mt-2 list-inside list-disc text-sm">
            {conflicts.map((c) => (
              <li key={c.id}>
                {c.count} · бренд ID: <code>{c.id}</code>
              </li>
            ))}
          </ul>
        </AlertDialogHeader>

        <div className="mt-3 space-y-3">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="reassign" id="reassign" />
              <Label htmlFor="reassign">Перепризначити на інший бренд</Label>
            </div>
            {mode === 'reassign' && (
              <div className="ml-6">
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger className="w-80">
                    <SelectValue placeholder="Оберіть бренд" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="mt-3 flex items-center space-x-2">
              <RadioGroupItem value="cascade" id="cascade" />
              <Label htmlFor="cascade">Видалити бренд разом із продуктами</Label>
            </div>
          </RadioGroup>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Скасувати</AlertDialogCancel>
          <Button onClick={handleConfirm} disabled={loading || (mode === 'reassign' && !target)}>
            {loading ? 'Опрацювання…' : 'Підтвердити'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
