'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import ProfileBadge from '../ui/ProfileBadge';
import type { Role } from '@prisma/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { navItems, type NavItem } from '@/config/nav';
import { BoxesIcon } from 'lucide-react';
import { useIsDark } from './uselsDark';

type SidebarUser = { name: string | null; role: Role; image: string };

export default function Sidebar({ user, fixed = false }: { user: SidebarUser; fixed?: boolean }) {
  const pathname = usePathname();
  const { mounted, isDark } = useIsDark();

  const logoSrc = mounted && isDark ? '/dark-logo.svg' : '/logo.svg';

  return (
    <aside
      className={cn(
        'bg-card/40 hidden h-dvh w-72 shrink-0 border-r md:flex',
        fixed && 'fixed inset-y-0 left-0 z-40',
      )}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex h-40 items-center justify-center border-b px-4">
          <Link href="/dashboard" className="font-semibold" aria-label="Home">
            <Image src={logoSrc} alt="logo" width={214} height={106} priority />
          </Link>
        </div>

        <ScrollArea className="flex-1 px-6 py-8">
          <nav className="space-y-2 px-3 py-3">
            {navItems.map((item, index) => {
              if (!item.children) {
                const active =
                  item.href && (pathname === item.href || pathname.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.href ?? item.label}
                    href={item.href!}
                    className={cn(
                      'group hover:bg-accent hover:text-accent-foreground flex items-center gap-4 rounded-lg px-2 py-2 text-sm',
                      active && 'bg-accent text-accent-foreground',
                    )}
                  >
                    <item.icon
                      className={`${active && 'opacity-100'} h-6 w-6 opacity-70 group-hover:opacity-100`}
                    />
                    <span className={`${index === navItems.length - 1 ? 'max-w-32' : ''} text-2xl`}>
                      {item.label}
                    </span>
                  </Link>
                );
              }

              const parentActive =
                item.href && (pathname === item.href || pathname.startsWith(item.href + '/'));
              const childActive = item.children!.some(
                (c) => pathname === c.href || pathname.startsWith(c.href + '/'),
              );

              return (
                <NavWithChildren
                  key={item.label}
                  item={item}
                  open={Boolean(parentActive || childActive)}
                  highlightParent={Boolean(item.href && pathname === item.href)}
                />
              );
            })}
          </nav>
        </ScrollArea>

        <div className="flex flex-col gap-3">
          <ProfileBadge user={user} />
          <div className="text-muted-foreground flex items-center justify-center border-t py-2 text-xs">
            © {new Date().getFullYear()} Alcotrade
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavWithChildren({
  item,
  open,
  highlightParent,
}: {
  item: NavItem;
  open: boolean;
  highlightParent: boolean;
}) {
  const pathname = usePathname();
  const active = item.href && (pathname === item.href || pathname.startsWith(item.href + '/'));

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'group hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-lg px-2 py-2 text-sm',
          highlightParent && 'bg-accent text-accent-foreground',
        )}
      >
        <Link href={item.href!} className="group flex min-w-0 flex-1 items-center gap-4">
          <item.icon
            className={`${active && 'opacity-100'} h-6 w-6 opacity-70 group-hover:opacity-100`}
          />
          <span className="truncate text-2xl">{item.label}</span>
        </Link>
      </div>

      {open && (
        <div id={`submenu-${item.label}`} className="ml-7 space-y-1">
          {item.children!.map((c) => {
            const childActive = pathname === c.href || pathname.startsWith(c.href + '/');
            return (
              <div key={c.href} className="relative">
                <Image
                  className="absolute -left-3"
                  src="/arrow.svg"
                  alt="arrow"
                  width={10}
                  height={25}
                />
                <Link
                  href={c.href}
                  className={cn(
                    'hover:bg-accent hover:text-accent-foreground group flex items-center gap-4 rounded-md px-2 py-1.5',
                    childActive && 'bg-accent text-accent-foreground',
                  )}
                >
                  <BoxesIcon
                    className={`${childActive && 'opacity-100'} opacity-70 group-hover:opacity-100`}
                  />
                  <span className="text-2xl">{c.label}</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
