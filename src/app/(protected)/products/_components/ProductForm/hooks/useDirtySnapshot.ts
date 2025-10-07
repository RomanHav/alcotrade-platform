import { useEffect, useMemo, useRef } from 'react';
import type { ProductFormState } from '@/store/slices/productFormSlice';
import { slugify } from '../utils/slug';

export function useDirtySnapshot(
  server: (Partial<ProductFormState> & { slug?: string | null }) | undefined,
  data: ProductFormState,
  slug: string,
) {
  const initialRef = useRef<string>('');

  useEffect(() => {
    initialRef.current = JSON.stringify({
      id: server?.id ?? null,
      name: server?.name ?? '',
      status: server?.status ?? 'DRAFT',
      brandId: server?.brandId ?? '',
      description: server?.description ?? '',
      seoTitle: server?.seoTitle ?? server?.name ?? '',
      seoDescription: server?.seoDescription ?? (server?.description ?? '').slice(0, 160),
      coverId: server?.coverId ?? null,
      images: (server?.images ?? []).map((m) => m.id),
      variants: (server?.variants ?? []).map((v) => ({
        label: v.label ?? '',
        volumeMl: v.volumeMl ?? null,
        imageId: (v as any).imageId ?? null,
      })),
      slug: server?.slug ?? (server?.name ? slugify(server.name) : ''),
    });
  }, [server]);

  const comparable = useMemo(
    () =>
      JSON.stringify({
        id: data.id ?? null,
        name: data.name ?? '',
        status: data.status,
        brandId: data.brandId ?? '',
        description: data.description ?? '',
        seoTitle: data.seoTitle ?? '',
        seoDescription: data.seoDescription ?? '',
        coverId: data.coverId ?? null,
        images: data.images.map((m) => m.id),
        variants: data.variants.map((v) => ({
          label: v.label ?? '',
          volumeMl: v.volumeMl ?? null,
          imageId: v.imageId ?? null,
        })),
        slug: slug ?? '',
      }),
    [data, slug],
  );

  return { isDirty: comparable !== initialRef.current, initialRef, comparable };
}
