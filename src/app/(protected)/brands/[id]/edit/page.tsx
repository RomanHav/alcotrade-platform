import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BrandForm from '../../_components/BrandForm';

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      cover: true,
      products: { select: { id: true, name: true, status: true }, orderBy: { name: 'asc' } },
    },
  });
  if (!brand) notFound();

  const brandsForReassign = await prisma.brand.findMany({
    where: { id: { not: id } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const serverBrand = {
    id: brand.id,
    name: brand.name,
    status: brand.status as 'ACTIVE' | 'DRAFT' | 'ARCHIVE',
    description: brand.description ?? '',
    seoTitle: brand.seoTitle ?? null,
    seoDescription: brand.seoDescription ?? null,
    coverId: brand.coverId ?? null,
    coverUrl: brand.cover?.url ?? null, // для мгновенного превью
    // coverPublicId: мы не знаем для существующих (если не храните), можно оставить null
  };

  return (
    <BrandForm
      serverBrand={serverBrand}
      products={brand.products}
      brandsForReassign={brandsForReassign}
    />
  );
}
