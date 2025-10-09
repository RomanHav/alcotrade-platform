'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { BrandFormState } from '@/store/slices/brandFormSlice';

export function useDirtyBrandSnapshot(
  server: Partial<BrandFormState> | undefined,
  data: BrandFormState,
  slug: string,
) {
  const initialRef = useRef<string>('');

  useEffect(() => {
    initialRef.current = JSON.stringify({
      id: server?.id ?? null,
      name: server?.name ?? '',
      status: server?.status ?? 'DRAFT',
      description: server?.description ?? '',
      seoTitle: server?.seoTitle ?? null,
      seoDescription: server?.seoDescription ?? null,
      coverId: server?.coverId ?? null,
      slug: (server as any)?.slug ?? '',
    });
  }, [server]);

  const comparable = useMemo(
    () =>
      JSON.stringify({
        id: data.id ?? null,
        name: data.name ?? '',
        status: data.status,
        description: data.description ?? '',
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        coverId: data.coverId ?? null,
        slug: slug ?? '',
      }),
    [data, slug],
  );

  return { isDirty: comparable !== initialRef.current, initialRef, comparable };
}
