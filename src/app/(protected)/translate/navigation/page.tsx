import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import NavigationEditor from './navigation-editor';

// Human-readable item names for navigation
const itemLabels: Record<string, string> = {
  home: 'Головна',
  products: 'Продукція',
  partners: 'Партнери',
  news: 'Новини',
  contacts: 'Контакти',
  license: 'Ліцензія',
  privacyPolicy: 'Політика конфіденційності',
};

export default async function TranslateNavigationPage() {
  const section = await prisma.mainPageSection.findUnique({
    where: { key: 'navigation' },
    include: {
      items: {
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!section) {
    notFound();
  }

  const initialData = {
    id: section.id,
    key: section.key,
    items: section.items.map((item) => ({
      id: item.id,
      key: item.key,
      label: itemLabels[item.key] || item.key,
      valueUk: item.valueUk,
      valueEn: item.valueEn ?? '',
    })),
  };

  return (
    <div className="flex flex-col px-8 pt-7">
      <div className="mb-9 flex flex-col gap-5">
        <div className="flex items-center gap-2.5 text-xl font-extralight">
          <Link href="/translate" className="underline underline-offset-4">
            Переклад
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <span className="opacity-80">Навігація</span>
        </div>
        <h1 className="text-4xl font-semibold">Навігація сайту</h1>
      </div>
      <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-2xl font-medium">Елементи навігації</h2>
        <NavigationEditor initial={initialData} />
      </div>
    </div>
  );
}
