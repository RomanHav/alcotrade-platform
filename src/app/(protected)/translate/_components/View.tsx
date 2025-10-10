'use client';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';

const section = [
  { id: 2346, name: 'Головна секція' },
  { id: 3647, name: 'Про компанію' },
  { id: 9675, name: 'Наші бренди' },
  { id: 9712, name: 'Потужності' },
  { id: 4204, name: 'Партнери' },
];

export default function View() {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = section.findIndex((i) => i.id === active.id);
    const newIndex = section.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    // const next = arrayMove(section, oldIndex, newIndex);
    // dispatch(setField({ key: 'sections', value: next }));
  };

  return (
    <div className="flex w-2/5 flex-col gap-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-2xl font-medium">Розташування секцій</h2>
      <nav className="rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm contain-paint dark:border-neutral-800 dark:bg-neutral-900">
        <div className="bg-neutral-200 dark:bg-neutral-700">
          <h3 className="px-4 py-3 font-medium">Головна</h3>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={section.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col">
              {section.map((item) => (
                <Thumb key={item.id} id={item.id} name={item.name} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </nav>
    </div>
  );
}

function Thumb({ id, name }: { id: number; name: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });
  return (
    <li
      key={id}
      className="flex items-center gap-2.5 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex shrink-0 items-center justify-center"
        title="Перетягнути"
        type="button"
      >
        <GripVertical className="h-6 w-6 stroke-gray-600 dark:stroke-neutral-50"/>
      </button>
      <span className="text-sm">{name}</span>
    </li>
  );
}
