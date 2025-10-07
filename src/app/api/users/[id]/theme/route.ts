import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import type { Theme as DbTheme } from '@prisma/client';

type ClientTheme = 'light' | 'dark' | 'system';

const toClient = (db: DbTheme): ClientTheme =>
  db === 'LIGHT' ? 'light' : db === 'DARK' ? 'dark' : 'system';

const toDb = (c: ClientTheme): DbTheme =>
  c === 'light' ? 'LIGHT' : c === 'dark' ? 'DARK' : 'DEFAULT';

// GET /api/users/:id/theme -> { theme: 'light'|'dark'|'system' }
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.id !== params.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { theme: true } });
  const theme = user ? toClient(user.theme) : ('system' as ClientTheme);
  return NextResponse.json({ theme });
}

// PATCH /api/users/:id/theme body: { theme: 'light'|'dark'|'system' }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.id !== params.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const theme = (body as { theme?: unknown })?.theme;
  if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
  }

  await prisma.user.update({ where: { id: params.id }, data: { theme: toDb(theme) } });
  return NextResponse.json({ ok: true, theme });
}
