import { prisma } from '@/lib/prisma';
import Translate from './Translate';
import View, { type SectionData } from './View';

// Human-readable section names
const sectionNames: Record<string, string> = {
  hero: 'Головна секція',
  about: 'Про компанію',
  brands: 'Наші бренди',
  capabilities: 'Потужності',
  partners: 'Партнери',
};

export default async function TranslateAndView() {
  const dbSections = await prisma.mainPageSection.findMany({
    where: {
      key: { notIn: ['navigation', 'footer'] },
    },
    orderBy: { position: 'asc' },
  });

  const sections: SectionData[] = dbSections.map((s) => ({
    id: s.id,
    key: s.key,
    name: sectionNames[s.key] || s.key,
    position: s.position,
    isVisible: s.isVisible,
  }));

  return (
    <div className="px-8 pt-16">
      <h1 className="mb-9 text-4xl font-semibold">Вигляд та переклад</h1>
      <div className="flex w-full items-start gap-6">
        <Translate />
        <View sections={sections} />
      </div>
    </div>
  );
}
