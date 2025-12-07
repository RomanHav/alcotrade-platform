import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import MainPageSectionList from './_components/MainPageSectionList';

// Human-readable section names
const sectionNames: Record<string, string> = {
  hero: 'Головна секція',
  about: 'Про компанію',
  brands: 'Наші бренди',
  capabilities: 'Потужності',
  partners: 'Партнери',
};

export default async function TranslateMainPage() {
  const sections = await prisma.mainPageSection.findMany({
    orderBy: { position: 'asc' },
    include: {
      items: {
        orderBy: { position: 'asc' },
      },
    },
  });

  const sectionsWithNames = sections.map((s) => ({
    id: s.id,
    key: s.key,
    name: sectionNames[s.key] || s.key,
    position: s.position,
    isVisible: s.isVisible,
    itemsCount: s.items.length,
    hasAllEnTranslations: s.items.every((i) => i.valueEn && i.valueEn.trim().length > 0),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col px-8 pt-7">
      <div className="mb-9 flex flex-col gap-5">
        <div className="flex items-center gap-2.5 text-xl font-extralight">
          <Link href="/translate" className="underline underline-offset-4">
            Переклад
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <span className="opacity-80">Головна</span>
        </div>
        <h1 className="text-4xl font-semibold">Вигляд та переклад</h1>
      </div>
      <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-2xl font-medium">Головна</h2>
        <MainPageSectionList initial={sectionsWithNames} />
      </div>
    </div>
  );
}
