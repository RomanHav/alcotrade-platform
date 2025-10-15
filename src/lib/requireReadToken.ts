import { NextResponse } from 'next/server';

export function requireReadToken(req: Request) {
  const expected = process.env.CMS_READONLY_TOKEN?.trim();
  if (!expected) {
    // Чтобы случайно не открыть API без токена в проде
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const auth = req.headers.get('authorization') || '';
  const ok = auth === `Bearer ${expected}`;

  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // всё ок
}
