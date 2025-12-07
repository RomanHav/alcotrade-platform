// prisma/seed-navigation-footer.ts
// Seed script to populate navigation and footer sections with default content

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sections = [
  {
    key: 'navigation',
    position: 10,
    items: [
      {
        key: 'home',
        valueUk: 'Головна',
        valueEn: 'Main',
      },
      {
        key: 'products',
        valueUk: 'Продукція',
        valueEn: 'Products',
      },
      {
        key: 'partners',
        valueUk: 'Партнери',
        valueEn: 'Partnership',
      },
      {
        key: 'news',
        valueUk: 'Новини',
        valueEn: 'News',
      },
      {
        key: 'contacts',
        valueUk: 'Контакти',
        valueEn: 'Contacts',
      },
      {
        key: 'license',
        valueUk: 'Ліцензія',
        valueEn: 'License',
      },
      {
        key: 'privacyPolicy',
        valueUk: 'Політика конфіденційності',
        valueEn: 'Privacy policy',
      },
    ],
  },
  {
    key: 'footer',
    position: 11,
    items: [
      {
        key: 'warning',
        valueUk: 'Надмірне вживання алкоголю шкідливе для вашого здоров\'я',
        valueEn: 'Excessive alcohol consumption is harmful to your health',
      },
      {
        key: 'companyName',
        valueUk: 'ТОВ "АЛКОТРЕЙД"',
        valueEn: 'ALCOTRADE LLC',
      },
      {
        key: 'contactFormLink',
        valueUk: "Зв'язатись з нами",
        valueEn: 'Contact us',
      },
      {
        key: 'email',
        valueUk: 'info@alcotrade.com.ua',
        valueEn: 'info@alcotrade.com.ua',
      },
      {
        key: 'phone',
        valueUk: '+380 44 123 45 67',
        valueEn: '+380 44 123 45 67',
      },
      {
        key: 'footerNote',
        valueUk: '© 2024 Alcotrade. Всі права захищено.',
        valueEn: '© 2024 Alcotrade. All rights reserved.',
      },
    ],
  },
];

async function main() {
  console.log('Seeding navigation and footer sections...');

  for (const section of sections) {
    // Create or update section
    const createdSection = await prisma.mainPageSection.upsert({
      where: { key: section.key },
      update: { position: section.position },
      create: {
        key: section.key,
        position: section.position,
        isVisible: true,
      },
    });

    // Create or update items
    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      await prisma.mainPageSectionItem.upsert({
        where: {
          sectionId_key: {
            sectionId: createdSection.id,
            key: item.key,
          },
        },
        update: {
          valueUk: item.valueUk,
          valueEn: item.valueEn,
          position: i,
        },
        create: {
          sectionId: createdSection.id,
          key: item.key,
          valueUk: item.valueUk,
          valueEn: item.valueEn,
          position: i,
        },
      });
    }

    console.log(`✓ Section "${section.key}" seeded with ${section.items.length} items`);
  }

  console.log('Navigation and footer seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
