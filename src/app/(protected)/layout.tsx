// src/app/(protected)/layout.tsx
import type { ReactNode } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';
import Providers from '@/app/(protected)/providers';
import { Toaster } from '@/components/ui/sonner';

const DEFAULT_AVATAR = process.env.NEXT_PUBLIC_DEFAULT_USER_IMAGE ?? '/avatar.jpg';

type SidebarUser = { name: string | null; role: Role; image: string };

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const userDb = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, role: true, image: true },
  });
  if (!userDb) redirect('/sign-in');

  const user: SidebarUser = {
    name: userDb.name,
    role: userDb.role,
    image: userDb.image ?? DEFAULT_AVATAR,
  };

  return (
    <Providers>
      <div className="flex min-h-dvh">
        <Sidebar user={user} fixed />
        <div className="hidden w-72 shrink-0 md:block" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
      <Toaster />
    </Providers>
  );
}
