'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import UnsavedBar from '@/components/common/UnsavedBar';
import { Loader2 } from 'lucide-react';

type ItemData = {
  id: string;
  key: string;
  label: string;
  valueUk: string;
  valueEn: string;
};

type Initial = {
  id: string;
  key: string;
  items: ItemData[];
};

export default function NavigationEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, { valueUk: string; valueEn: string }>>({});

  // Initialize draft from initial data
  useEffect(() => {
    const initialDraft: Record<string, { valueUk: string; valueEn: string }> = {};
    initial.items.forEach((item) => {
      initialDraft[item.key] = {
        valueUk: item.valueUk,
        valueEn: item.valueEn,
      };
    });
    setDraft(initialDraft);
  }, [initial]);

  const isDirty = useMemo(() => {
    return initial.items.some((item) => {
      const d = draft[item.key];
      if (!d) return false;
      return d.valueUk !== item.valueUk || d.valueEn !== item.valueEn;
    });
  }, [draft, initial.items]);

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

  const handleChange = (key: string, field: 'valueUk' | 'valueEn', value: string) => {
    setDraft((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleReset = () => {
    const initialDraft: Record<string, { valueUk: string; valueEn: string }> = {};
    initial.items.forEach((item) => {
      initialDraft[item.key] = {
        valueUk: item.valueUk,
        valueEn: item.valueEn,
      };
    });
    setDraft(initialDraft);
    toast('Зміни скасовано');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = initial.items.map((item) => ({
        key: item.key,
        valueUk: draft[item.key]?.valueUk ?? item.valueUk,
        valueEn: draft[item.key]?.valueEn || null,
      }));

      const res = await fetch('/api/translate/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      toast.success('Переклад збережено', { description: 'Навігацію успішно оновлено.' });
      router.refresh();
    } catch (e) {
      toast.error('Помилка збереження', { description: 'Спробуйте ще раз.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <UnsavedBar
        visible={isDirty}
        onCancel={handleReset}
        onSave={handleSave}
        saving={saving}
        disabled={!isDirty}
      />

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">Пункти меню</h3>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={saving || !isDirty} onClick={handleReset}>
              Скинути
            </Button>
            <Button disabled={saving || !isDirty} onClick={handleSave}>
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

        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                <th className="px-4 py-3 text-left text-sm font-medium w-[200px]">Пункт меню</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Оригінал</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Англійська</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {initial.items.map((item) => (
                <tr key={item.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  <td className="px-4 py-3 text-sm font-medium align-middle">
                    {item.label}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Input
                      value={draft[item.key]?.valueUk ?? item.valueUk}
                      onChange={(e) => handleChange(item.key, 'valueUk', e.target.value)}
                      placeholder="Текст українською"
                    />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Input
                      value={draft[item.key]?.valueEn ?? item.valueEn}
                      onChange={(e) => handleChange(item.key, 'valueEn', e.target.value)}
                      placeholder="Input English text"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
