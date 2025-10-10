import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Partner } from '@/app/(protected)/partners/_components/core/types';
import type { RootState } from '../index';

export const uploadPartnerLogo = createAsyncThunk<
  { url: string },
  { file: File; publicId: string }
>('partners/uploadLogo', async ({ file, publicId }) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('publicId', publicId);

  const res = await fetch('/api/upload/partner-logo', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  const json = await res.json();
  return { url: json.url as string };
});

export const savePartnerRow = createAsyncThunk<Partner, { id: string }, { state: RootState }>(
  'partners/saveRow',
  async ({ id }, { getState }) => {
    const st = getState().partners;
    const d = st.drafts[id];
    if (!d) throw new Error('No draft');

    const name = String(d.name ?? '').trim();
    if (!name) throw new Error('Назва партнера не може бути порожньою');

    const linkStr = typeof d.link === 'string' ? d.link.trim() : '';
    const imageStr = typeof d.image === 'string' ? d.image.trim() : '';

    if (!imageStr) throw new Error('Зображення партнера не може бути порожнім');

    const payload = {
      name,
      link: linkStr ? linkStr : null,
      image: imageStr,
    };

    if (id.startsWith('tmp_')) {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Create failed');
      return (await res.json()) as Partner;
    }

    const res = await fetch(`/api/partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Update failed');
    return (await res.json()) as Partner;
  },
);

export const bulkDeletePartners = createAsyncThunk<{ deleted: number }, { ids: string[] }>(
  'partners/bulkDelete',
  async ({ ids }) => {
    const res = await fetch('/api/partners/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Bulk delete failed');
    const json = await res.json();
    return { deleted: Number(json.deleted ?? ids.length) };
  },
);
