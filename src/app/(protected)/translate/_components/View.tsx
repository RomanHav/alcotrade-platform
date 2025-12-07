'use client';

import { useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { GripVertical, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export type SectionData = {
  id: string;
  key: string;
  name: string;
  position: number;
  isVisible: boolean;
};

type ViewProps = {
  sections: SectionData[];
};

export default function View({ sections: initialSections }: ViewProps) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const savePositions = async (newSections: SectionData[]) => {
    setSaving(true);
    try {
      const res = await fetch('/api/translate/main-page/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: newSections.map((s, idx) => ({
            id: s.id,
            position: idx,
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Порядок секцій збережено');
      router.refresh();
    } catch {
      toast.error('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    setSaving(true);
    try {
      const res = await fetch('/api/translate/main-page/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          isVisible: !section.isVisible,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s))
      );
      toast.success(section.isVisible ? 'Секцію приховано' : 'Секцію показано');
      router.refresh();
    } catch {
      toast.error('Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    
    const oldIndex = sections.findIndex((i) => i.id === active.id);
    const newIndex = sections.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    
    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);
    savePositions(newSections);
  };

  return (
    <div className="flex w-2/5 flex-col gap-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium">Розташування секцій</h2>
        {saving && <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />}
      </div>
      <nav className="rounded-2xl border border-neutral-200 bg-white shadow-sm contain-paint dark:border-neutral-800 dark:bg-neutral-950">
        <div className="bg-neutral-200 dark:bg-neutral-700">
          <h3 className="px-4 py-3 font-medium">Головна</h3>
        </div>
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={onDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={sections.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col">
              {sections.map((item) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  isVisible={item.isVisible}
                  onToggleVisibility={() => toggleVisibility(item.id)}
                  disabled={saving}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </nav>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Перетягніть секції для зміни порядку. Натисніть на іконку ока щоб приховати/показати секцію на сайті.
      </p>
    </div>
  );
}

type SortableItemProps = {
  id: string;
  name: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  disabled: boolean;
};

function SortableItem({ id, name, isVisible, onToggleVisibility, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0',
        isDragging && 'shadow-lg relative',
        !isVisible && 'opacity-50'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'flex shrink-0 cursor-grab items-center justify-center touch-none',
          isDragging && 'cursor-grabbing',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        title="Перетягнути"
      >
        <GripVertical className="h-6 w-6 stroke-gray-600 dark:stroke-neutral-50" />
      </div>
      <span className={cn('flex-1 text-sm', !isVisible && 'line-through')}>{name}</span>
      <button
        onClick={onToggleVisibility}
        className={cn(
          'flex shrink-0 items-center justify-center p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
          !isVisible && 'text-neutral-400'
        )}
        title={isVisible ? 'Приховати секцію' : 'Показати секцію'}
        type="button"
        disabled={disabled}
      >
        {isVisible ? (
          <Eye className="h-5 w-5" />
        ) : (
          <EyeOff className="h-5 w-5" />
        )}
      </button>
    </li>
  );
}
