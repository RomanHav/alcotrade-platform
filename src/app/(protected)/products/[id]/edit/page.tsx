import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductForm from '../../_components/ProductForm';
import type { ProductFormState } from '@/store/slices/productFormSlice';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [brands, product] = await Promise.all([
    prisma.brand.findMany({ select: { id: true, name: true } }),
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { position: 'asc' },
          include: { image: { select: { id: true, url: true } } },
        },
        cover: true,
        images: {
          orderBy: { position: 'asc' },
          include: { media: { select: { id: true, url: true, alt: true } } },
        },
        brand: true,
      },
    }),
  ]);

  if (!product) notFound();

  const baseGallery =
    product.images
      .filter((pi) => !!pi.media?.url)
      .map((pi) => ({
        id: pi.media.id,
        url: pi.media.url,
        alt: pi.media.alt ?? null,
      })) ?? [];

  const images =
    product.cover && !baseGallery.some((g) => g.id === product.cover!.id)
      ? [
          { id: product.cover.id, url: product.cover.url, alt: product.cover.alt ?? null },
          ...baseGallery,
        ]
      : baseGallery;

  const serverProduct: Partial<ProductFormState> & { slug?: string | null } = {
    id: product.id,
    name: product.name,
    status: product.status as ProductFormState['status'],
    brandId: product.brandId,
    description: product.description ?? undefined,
    seoTitle: product.seoTitle ?? null,
    seoDescription: product.seoDescription ?? null,
    coverId: product.coverId ?? null,
    coverFallbackUrl: product.cover?.url ?? null,
    images,
    variants: product.variants.map((v) => ({
      id: v.id,
      label: v.label ?? undefined,
      volumeMl: v.volumeMl ?? undefined,
      position: v.position,
      imageId: v.imageId ?? null,
      imageUrl: v.image?.url ?? null,
    })),
    slug: product.slug ?? null,
  };

  return <ProductForm brands={brands} serverProduct={serverProduct} />;
}
