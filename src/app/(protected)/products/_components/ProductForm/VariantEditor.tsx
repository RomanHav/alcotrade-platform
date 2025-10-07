'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { UnitKey } from './utils/volume';

export default function VariantEditor({
  defaultName = 'Обʼєм',
  defaultRows = [{ value: '', unit: 'ml' as UnitKey }],
  onCancel,
  onSave,
}: {
  defaultName?: string;
  defaultRows?: { value: string | number; unit: UnitKey }[];
  onCancel: () => void;
  onSave: (name: string, rows: { value: string | number; unit: UnitKey }[]) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [rows, setRows] = useState<{ value: string; unit: UnitKey }[]>(
    defaultRows.map((r) => ({ value: String(r.value ?? ''), unit: r.unit })),
  );

  const setRow = (i: number, patch: Partial<{ value: string; unit: UnitKey }>) =>
    setRows((rs) => {
      const next = [...rs];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  const addRow = () => setRows((rs) => [...rs, { value: '', unit: 'ml' }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const onValueChange = (i: number, raw: string) => setRow(i, { value: raw.replace(/[^\d]/g, '') });

  return (
    <div className="bg-muted/40 rounded-xl border p-3">
      <div className="mb-2 text-sm font-medium">Варіант</div>
      <Input
        className="mb-3"
        placeholder="Назва варіанту"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="mb-2 text-sm font-medium">Значення варіанту</div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2">
            <Input
              inputMode="numeric"
              pattern="\d*"
              placeholder="число"
              value={r.value}
              onChange={(e) => onValueChange(i, e.target.value)}
              className="w-32"
            />
            <Select value={r.unit} onValueChange={(v: UnitKey) => setRow(i, { unit: v })}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="од." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ml">мл</SelectItem>
                <SelectItem value="cl">cl</SelectItem>
                <SelectItem value="l">л</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="ghost" onClick={() => removeRow(i)} title="Видалити">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addRow}>
          Додати значення
        </Button>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Відмінити
        </Button>
        <Button onClick={() => onSave(name.trim() || 'Варіант', rows)}>Зберегти</Button>
      </div>
    </div>
  );
}
