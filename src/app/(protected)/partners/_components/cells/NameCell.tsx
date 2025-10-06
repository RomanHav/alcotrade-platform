'use client';
import { Input } from '@/components/ui/input';

export function NameCell({
  value,
  editing,
  onChange,
}: {
  value: string;
  editing: boolean;
  onChange?: (v: string) => void;
}) {
  if (editing) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-9 w-full"
        placeholder="Назва партнера"
      />
    );
  }

  const display = value?.trim();
  return display ? (
    <div className="truncate">{display}</div>
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}
