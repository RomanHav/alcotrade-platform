// app/api/articles/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateCache } from '@/lib/revalidate';
import type { Prisma } from '@prisma/client';

function parseIntSafe(v: string | null, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function startOfDayISO(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}
function nextDayISO(s: string) {
  const d = startOfDayISO(s);
  if (!d) return null;
  const n = new Date(d);
  n.setDate(n.getDate() + 1);
  return n;
}

function sortToOrderBy(sort?: string): Prisma.ArticleOrderByWithRelationInput[] {
  switch (sort) {
    case 'name_desc':
      return [{ title: 'desc' }];
    case 'date_desc':
      return [{ date: 'desc' }, { publishedAt: 'desc' }];
    case 'date_asc':
      return [{ date: 'asc' }, { publishedAt: 'asc' }];
    case 'status':
      return [{ status: 'asc' }];
    case 'updated_desc':
      return [{ updatedAt: 'desc' }];
    case 'created_desc':
      return [{ createdAt: 'desc' }];
    case 'name_asc':
    default:
      return [{ title: 'asc' }];
  }
}

export async function GET(req: Request) {
  try {
    console.log('GET /api/articles called');

    const { searchParams } = new URL(req.url);
    const page = parseIntSafe(searchParams.get('page'), 1);
    const pageSize = Math.min(100, parseIntSafe(searchParams.get('pageSize'), 10));
    const query = searchParams.get('query')?.trim() || '';

    const status = searchParams.get('status') as 'DRAFT' | 'ACTIVE' | 'ARCHIVE' | null;

    const dateParam = searchParams.get('date')?.trim() || '';
    const sort = searchParams.get('sort') || 'date_desc';

    const where: Prisma.ArticleWhereInput = {
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      }),
      ...(status ? { status } : {}),
    };

    if (dateParam) {
      const gte = startOfDayISO(dateParam);
      const lt = nextDayISO(dateParam);
      if (gte && lt) {
        where.OR = [
          { AND: [{ date: { not: null } }, { date: { gte, lt } }] },
          { AND: [{ date: null }, { publishedAt: { gte, lt } }] },
        ];
      }
    }

    const [total, items] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        orderBy: sortToOrderBy(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          status: true,
          date: true,
          publishedAt: true,
          slug: true,
          excerpt: true,
          cover: { select: { id: true, url: true, alt: true, width: true, height: true } },
          translations: {
            where: { locale: 'en' },
            select: { id: true },
          },
        },
      }),
    ]);

    // Add hasTranslation flag
    const itemsWithTranslation = items.map((item) => ({
      ...item,
      hasEnTranslation: item.translations.length > 0,
      translations: undefined,
    }));

    return NextResponse.json({ items: itemsWithTranslation, total }, {
      headers: { 'x-next-cache-tags': 'articles' }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { ids?: string[] };
    const ids = Array.isArray(body?.ids) ? body!.ids.filter(Boolean) : [];
    if (!ids.length) {
      return NextResponse.json({ error: 'No ids provided' }, { status: 400 });
    }

    const result = await prisma.article.deleteMany({ where: { id: { in: ids } } });

    // Invalidate cache
    await revalidateCache(['articles'], 'articles');

    return NextResponse.json({ deleted: result.count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed' }, { status: 500 });
  }
}