import SettingsMain from './_components/SettingsMain';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { Theme as DbTheme } from '@prisma/client';

type UserRole = { role: string };
type ClientTheme = 'light' | 'dark' | 'system';

const toClient = (db: DbTheme | null | undefined): ClientTheme =>
  db === 'LIGHT' ? 'light' : db === 'DARK' ? 'dark' : 'system';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, theme: true, id: true },
  });
  if (!user) redirect('/sign-in');

  const seoSettings = await prisma.siteSettings.findFirst({
    select: {
      defaultSeoTitle: true,
      defaultSeoDescription: true,
      titleSuffix: true,
    },
  });

  const role: UserRole = { role: user.role };
  const settings = {
    defaultSeoTitle: seoSettings?.defaultSeoTitle,
    defaultSeoDescription: seoSettings?.defaultSeoDescription,
    titleSuffix: seoSettings?.titleSuffix,
  };

  return (
    <SettingsMain
      role={role}
      seoSettings={settings}
      initialTheme={toClient(user.theme)}
      userId={user.id}
    />
  );
}
