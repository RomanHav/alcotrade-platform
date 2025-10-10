import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const navItems = [
  {
    name: 'Продукція',
    content: [
      { name: 'Продукти', href: '/translate/products' },
      { name: 'Бренди', href: '/translate/brands' },
    ],
  },
  {
    name: 'Сторінки',
    content: [
      { name: 'Головна', href: '/translate/main' },
      { name: 'Новини', href: '/translate/news' },
    ],
  },
  {
    name: 'Сайт',
    content: [
      { name: 'Навігація', href: '/translate/navigation' },
      { name: 'Футер сайту', href: '/translate/footer' },
    ],
  },
];

export default function Translate() {
  return (
    <div className="flex w-3/5 flex-col gap-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-2xl font-medium">Переклад</h2>
      <nav className="rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm contain-paint dark:border-neutral-800 dark:bg-neutral-900">
        {navItems.map((section) => (
          <div key={section.name} className="">
            <div className="bg-neutral-200 dark:bg-neutral-700">
              <h3 className="px-4 py-3 font-medium">{section.name}</h3>
            </div>
            <ul className="flex flex-col">
              {section.content.map((item) => (
                <li
                  key={item.name}
                  className="px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Link href={item.href} className="flex items-center justify-between">
                    <span className="text-sm">{item.name}</span>
                    <ChevronRight className="size-5 stroke-neutral-900 dark:stroke-neutral-50" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
