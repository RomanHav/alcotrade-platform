'use client';

import { Button } from '@/components/ui/button';

export default function UnsavedBar({
  visible,
  onCancel,
  onSave,
  saving,
  disabled,
  className = '',
}: {
  visible: boolean;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  if (!visible) return null;
  return (
    <div className={`fixed inset-x-0 bottom-5 z-40 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="bg-card rounded-lg border px-3 py-2 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="text-sm">Наявні незбережені зміни</div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Відмінити
              </Button>
              <Button onClick={onSave} disabled={saving || disabled}>
                {saving ? 'Збереження…' : 'Зберегти'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
