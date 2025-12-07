import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import MainPageSectionEditor from './main-page-section-editor';

// Human-readable section names
const sectionNames: Record<string, string> = {
  hero: 'Головна секція',
  about: 'Про компанію',
  brands: 'Наші бренди',
  capabilities: 'Потужності',
  partners: 'Партнери',
};

// Human-readable item names for each section
const itemLabels: Record<string, Record<string, string>> = {
  hero: {
    title: 'Заголовок',
    buttonText: 'Кнопка заклику',
  },
  about: {
    sectionTitle: 'Заголовок секції',
    item1Title: 'Унікальне позиціонування',
    item2Title: 'Стабільно висока якість',
    item3Title: 'Роки на ринку',
    item3Prefix: 'Префікс (20+)',
    item4Title: 'Лінійка смаків',
    item5Title: 'Інноваційне виробництво',
    centerDescription: 'Центральний опис',
  },
  brands: {
    sectionTitle: 'Заголовок секції',
  },
  capabilities: {
    sectionTitle: 'Заголовок секції',
    item1Title: 'Виробничі лінії - заголовок',
    item1Description: 'Виробничі лінії - опис',
    item2Title: 'Лабораторії - заголовок',
    item2Description: 'Лабораторії - опис',
    item3Title: 'Сировина - заголовок',
    item3Description: 'Сировина - опис',
    item4Title: 'Виробничі площі - заголовок',
    item4Description: 'Виробничі площі - опис',
    item5Title: 'Кадровий потенціал - заголовок',
    item5Description: 'Кадровий потенціал - опис',
  },
  partners: {
    sectionTitle: 'Заголовок секції',
    description: 'Опис',
    findUsText: 'Текст "Шукайте нас"',
    clientsTitle: 'Заголовок клієнтів',
    suppliersTitle: 'Заголовок постачальників',
  },
};

export default async function TranslateMainPageSectionPage({
  params,
}: {
  params: Promise<{ sectionKey: string }>;
}) {
  const { sectionKey } = await params;
  
  const section = await prisma.mainPageSection.findUnique({
    where: { key: sectionKey },
    include: {
      items: {
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!section) {
    notFound();
  }

  const sectionName = sectionNames[sectionKey] || sectionKey;
  const labels = itemLabels[sectionKey] || {};

  const initialData = {
    id: section.id,
    key: section.key,
    name: sectionName,
    items: section.items.map((item) => ({
      id: item.id,
      key: item.key,
      label: labels[item.key] || item.key,
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
          <Link href="/translate/main" className="underline underline-offset-4">
            Головна
          </Link>{' '}
          <ChevronRight className="h-5 w-5 opacity-60" />
          <span className="opacity-80">{sectionName}</span>
        </div>
        <h1 className="text-4xl font-semibold">{sectionName}</h1>
      </div>
      <MainPageSectionEditor initial={initialData} />
    </div>
  );
}
