// app/api/articles/save/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateCache } from '@/lib/revalidate';
import { z } from 'zod';

const bodySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVE']),
  excerpt: z.string().max(300).optional().nullable(),
  content: z.string().optional().nullable(),
  date: z.string().optional().nullable(), // ISO або null
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  coverId: z.string().optional().nullable(),
  slug: z.string().min(1),
});

function parseDateISO(v?: string | null) {
  if (!v) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function processSeoTitle(seoTitle?: string | null): string | null {
  if (!seoTitle) return null;
  const trimmed = seoTitle.trim();
  if (trimmed.length <= 60) return trimmed;
  return trimmed.substring(0, 57) + '...';
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const data = bodySchema.parse(raw);

    // Check if slug is already taken by another article
    const conflict = await prisma.article.findFirst({
      where: {
        slug: data.slug,
        ...(data.id ? { id: { not: data.id } } : {}),
      },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ message: 'slug_taken' }, { status: 409 });
    }

    const common = {
      title: data.title,
      status: data.status,
      excerpt: data.excerpt ?? null,
      content: data.content ?? null,
      date: parseDateISO(data.date),
      seoTitle: processSeoTitle(data.seoTitle),
      seoDescription: data.seoDescription ?? null,
      coverId: data.coverId ?? null,
      slug: data.slug,
    };

    if (data.id) {
      const updated = await prisma.article.update({
        where: { id: data.id },
        data: common,
        select: { id: true },
      });
      return NextResponse.json({ id: updated.id });
    } else {
      const created = await prisma.article.create({
        data: common,
        select: { id: true },
      });
      return NextResponse.json({ id: created.id });
    }

    // Invalidate cache
    await revalidateCache(['articles'], 'articles');

  } catch (e: any) {
    // якщо це помилка валідації zod — 400
    if (e?.issues) {
      return NextResponse.json(
        { message: e.issues?.[0]?.message ?? 'Bad Request' },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: e?.message ?? 'Failed' }, { status: 500 });
  }
}
