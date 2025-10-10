import { Home, Package, Newspaper, Users, Languages } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type NavChild = { label: string; href: string };

export type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon | SvgIcon;
  children?: NavChild[];
};

export const navItems: NavItem[] = [
  { label: 'Головна', href: '/dashboard', icon: Home },
  {
    label: 'Продукти',
    href: '/products',
    icon: Package,
    children: [{ label: 'Бренди', href: '/brands' }],
  },
  { label: 'Новини', href: '/news', icon: Newspaper },
  { label: 'Партнери', href: '/partners', icon: Users },
  { label: 'Вигляд та переклад', href: '/translate', icon: Languages },
];
