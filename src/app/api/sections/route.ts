// src/app/api/sections/route.ts
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function PUT(req: Request) {
  const authHeader = req.headers.get('x-api-secret');
  if (authHeader !== process.env.API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  revalidateTag('navigation');
  return NextResponse.json({ ok: true });
}