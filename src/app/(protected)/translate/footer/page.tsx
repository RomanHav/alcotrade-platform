import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import FooterEditor from './footer-editor';

// Human-readable item names for footer
const itemLabels: Record<string, string> = {
  warning: 'Попередження',
  companyName: 'Назва компанії',
  contactFormLink: "Посилання на контактну форму",
  email: 'Пошта',
  phone: 'Номер телефону',
  footerNote: 'Підвал: надпис',
};

export default async function TranslateFooterPage() {
  const section = await prisma.mainPageSection.findUnique({
    where: { key: 'footer' },
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
          <span className="opacity-80">Футер сайту</span>
        </div>
        <h1 className="text-4xl font-semibold">Футер сайту</h1>
      </div>
      <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-2xl font-medium">Основна інформація</h2>
        <FooterEditor initial={initialData} />
      </div>
    </div>
  );
}
