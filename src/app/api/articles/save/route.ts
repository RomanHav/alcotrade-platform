// app/api/articles/save/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bodySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVE']),
  excerpt: z.string().max(300).optional().nullable(),
  content: z.string().optional().nullable(),
  date: z.string().optional().nullable(), // ISO або null
  seoTitle: z.string().max(60).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  coverId: z.string().optional().nullable(),
  slug: z.string().min(1),
  locale: z.string().min(2).max(5).optional().default('uk'),
});

function parseDateISO(v?: string | null) {
  if (!v) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const data = bodySchema.parse(raw);

    // унікальність slug+locale (окрім поточного id у режимі update)
    const conflict = await prisma.article.findFirst({
      where: {
        slug: data.slug,
        locale: data.locale,
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
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      coverId: data.coverId ?? null,
      slug: data.slug,
      locale: data.locale,
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
