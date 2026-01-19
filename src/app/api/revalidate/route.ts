/**
 * Универсальный endpoint для revalidation
 * Используется для очистки кэша при обновлении данных в CMS
 *
 * Пример использования в CMS:
 * await fetch('/api/revalidate', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'x-api-secret': process.env.API_SECRET,
 *   },
 *   body: JSON.stringify({
 *     tags: ['articles', 'products', 'brands', 'sections']
 *   })
 * })
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    // Проверяем API секрет
    const authHeader = req.headers.get('x-api-secret');
    const apiSecret = process.env.API_SECRET;

    if (!authHeader || !apiSecret || authHeader !== apiSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Парсим тело запроса
    const body = await req.json();
    const { tags } = body;

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Tags array is required' },
        { status: 400 }
      );
    }

    // Валидируем теги
    const validTags = [
      'articles',
      'products',
      'brands',
      'partners',
      'sections',
      'navigation',
      'site-settings',
      'footer',
      'main-page'
    ];

    const invalidTags = tags.filter(tag => !validTags.includes(tag));
    if (invalidTags.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid tags',
          validTags,
          invalidTags
        },
        { status: 400 }
      );
    }

    // Revalidate все указанные теги
    tags.forEach(tag => {
      revalidateTag(tag);
      console.log(`Revalidated tag: ${tag}`);
    });

    return NextResponse.json({
      success: true,
      message: `Revalidated ${tags.length} tag(s)`,
      tags
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}