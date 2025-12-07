// prisma/seed-main-page.ts
// Seed script to populate main page sections with default content from alcotrade.com.ua

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sections = [
  {
    key: 'hero',
    position: 0,
    items: [
      {
        key: 'title',
        valueUk: 'НАДІЙНИЙ ПАРТНЕР У СВІТІ АЛКОГОЛЬНОЇ ПРОДУКЦІЇ. СПІВПРАЦЯ, ЩО ГАРАНТУЄ УСПІХ!',
        valueEn: 'A RELIABLE PARTNER IN THE WORLD OF ALCOHOL PRODUCTS. PARTNERSHIP THAT GUARANTEES SUCCESS!',
      },
      {
        key: 'buttonText',
        valueUk: "ЗВ'ЯЗАТИСЬ З НАМИ",
        valueEn: 'CONTACT US',
      },
    ],
  },
  {
    key: 'about',
    position: 1,
    items: [
      {
        key: 'sectionTitle',
        valueUk: 'ПРО КОМПАНІЮ',
        valueEn: 'ABOUT THE COMPANY',
      },
      {
        key: 'item1Title',
        valueUk: 'УНІКАЛЬНЕ ПОЗИЦІОНУВАННЯ КОЖНОЇ ТОРГОВОЇ МАРКИ',
        valueEn: 'UNIQUE POSITIONING OF EACH BRAND',
      },
      {
        key: 'item2Title',
        valueUk: 'СТАБІЛЬНО ВИСОКА ЯКІСТЬ',
        valueEn: 'CONSISTENTLY HIGH QUALITY',
      },
      {
        key: 'item3Title',
        valueUk: 'КОМПАНІЯ НА РИНКУ АЛКОГОЛЮ УКРАЇНИ З 2002 РОКУ',
        valueEn: 'COMPANY IN THE UKRAINIAN ALCOHOL MARKET SINCE 2002',
      },
      {
        key: 'item3Prefix',
        valueUk: '20+',
        valueEn: '20+',
      },
      {
        key: 'item4Title',
        valueUk: 'РІЗНОМАНІТНА ЛІНІЙКА СМАКІВ',
        valueEn: 'DIVERSE RANGE OF FLAVORS',
      },
      {
        key: 'item5Title',
        valueUk: 'ІННОВАЦІЙНЕ ВИРОБНИЦТВО',
        valueEn: 'INNOVATIVE PRODUCTION',
      },
      {
        key: 'centerDescription',
        valueUk: 'НАШІ ДИСТРИБУЦІЙНІ ПОТУЖНОСТІ ДОЗВОЛЯЮТЬ ДОСТАВЛЯТИ ПРОДУКЦІЮ ШВИДКО ТА НАДІЙНО В БУДЬ-ЯКИЙ КУТОЧОК УКРАЇНИ. ЦЕ ГАРАНТУЄ, ЩО НАШІ НАПОЇ ЗАВЖДИ ДОСТУПНІ ДЛЯ КОЖНОГО СПОЖИВАЧА.',
        valueEn: 'OUR DISTRIBUTION CAPABILITIES ALLOW US TO DELIVER PRODUCTS QUICKLY AND RELIABLY TO ANY CORNER OF UKRAINE. THIS GUARANTEES THAT OUR BEVERAGES ARE ALWAYS AVAILABLE TO EVERY CONSUMER.',
      },
    ],
  },
  {
    key: 'brands',
    position: 2,
    items: [
      {
        key: 'sectionTitle',
        valueUk: 'НАШІ БРЕНДИ',
        valueEn: 'OUR BRANDS',
      },
    ],
  },
  {
    key: 'capabilities',
    position: 3,
    items: [
      {
        key: 'sectionTitle',
        valueUk: 'ПОТУЖНОСТІ',
        valueEn: 'CAPABILITIES',
      },
      {
        key: 'item1Title',
        valueUk: 'ВИРОБНИЧІ ЛІНІЇ',
        valueEn: 'PRODUCTION LINES',
      },
      {
        key: 'item1Description',
        valueUk: 'Завод обладнаний сучасними виробничими лініями, які дозволяють виготовляти різноманітні алкогольні напої великими обсягами без втрати якості.',
        valueEn: 'The plant is equipped with modern production lines that allow the production of various alcoholic beverages in large volumes without loss of quality.',
      },
      {
        key: 'item2Title',
        valueUk: 'ЛАБОРАТОРІЇ КОНТРОЛЮ ЯКОСТІ',
        valueEn: 'QUALITY CONTROL LABORATORIES',
      },
      {
        key: 'item2Description',
        valueUk: 'На підприємстві працюють лабораторії контролю якості, що забезпечують дотримання всіх стандартів виробництва.',
        valueEn: 'Quality control laboratories operate at the enterprise, ensuring compliance with all production standards.',
      },
      {
        key: 'item3Title',
        valueUk: 'СИРОВИНА',
        valueEn: 'RAW MATERIALS',
      },
      {
        key: 'item3Description',
        valueUk: 'Використовується лише якісна сировина від перевірених постачальників.',
        valueEn: 'Only high-quality raw materials from verified suppliers are used.',
      },
      {
        key: 'item4Title',
        valueUk: 'ВИРОБНИЧІ ПЛОЩІ',
        valueEn: 'PRODUCTION FACILITIES',
      },
      {
        key: 'item4Description',
        valueUk: 'Загальна площа виробничих приміщень забезпечує можливість масштабування виробництва.',
        valueEn: 'The total area of production premises provides the possibility of scaling production.',
      },
      {
        key: 'item5Title',
        valueUk: 'КАДРОВИЙ ПОТЕНЦІАЛ',
        valueEn: 'HUMAN RESOURCES',
      },
      {
        key: 'item5Description',
        valueUk: 'Команда досвідчених фахівців забезпечує високу якість продукції.',
        valueEn: 'A team of experienced specialists ensures high product quality.',
      },
    ],
  },
  {
    key: 'partners',
    position: 4,
    items: [
      {
        key: 'sectionTitle',
        valueUk: 'ПАРТНЕРИ',
        valueEn: 'PARTNERS',
      },
      {
        key: 'description',
        valueUk: "Завод співпрацює з дистриб'юторами по всій Україні і планує вихід на міжнародний ринок.",
        valueEn: 'The plant cooperates with distributors throughout Ukraine and plans to enter the international market.',
      },
      {
        key: 'findUsText',
        valueUk: 'Шукайте нас на полицях в:',
        valueEn: 'Find us on the shelves at:',
      },
      {
        key: 'clientsTitle',
        valueUk: 'Основні клієнти включають:',
        valueEn: 'Key clients include:',
      },
      {
        key: 'suppliersTitle',
        valueUk: 'Постачальники:',
        valueEn: 'Suppliers:',
      },
    ],
  },
];

async function main() {
  console.log('Seeding main page sections...');

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

  console.log('Main page seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
