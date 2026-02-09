'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import VideoUpload from './VideoUpload';
import { ca } from 'date-fns/locale';

interface MainPageSection {
  id: string;
  key: string;
  videoUrl: string | null;
  videoPublicId: string | null;
}

interface MainPageVideoManagerProps {
  sections: MainPageSection[];
}

export default function MainPageVideoManager({ sections }: MainPageVideoManagerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Only show video management for hero and partners sections
  const videoSections = sections.filter((s) => ['hero', 'partners', 'capabilities'].includes(s.key));

  const handleVideoUpload = async (
    sectionId: string,
    videoData: { url: string; publicId: string; duration?: number }
  ) => {
    setSaving(true);
    try {
      const response = await fetch('/api/translate/main-page/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          videoUrl: videoData.url,
          videoPublicId: videoData.publicId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save video');
      }

      toast.success('Відео збережено');
      router.refresh();
    } catch {
      toast.error('Помилка збереження відео');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoDelete = async (sectionId: string) => {
    setSaving(true);
    try {
      const response = await fetch('/api/translate/main-page/video', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      toast.success('Відео видалено');
      router.refresh();
    } catch {
      toast.error('Помилка видалення відео');
    } finally {
      setSaving(false);
    }
  };

  if (videoSections.length === 0) {
    return null;
  }

  const sectionLabels: Record<string, { label: string; muted: boolean }> = {
    hero: { label: 'Відео головної (без звука)', muted: true },
    partners: { label: 'Відео Партнерів', muted: false },
    capabilities: { label: 'Відео Потужності', muted: false },
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-5 text-2xl font-medium">Відео</h2>
      <div className="flex flex-col gap-6">
        {videoSections.map((section) => {
          const config = sectionLabels[section.key] || { label: section.key, muted: false };
          return (
            <div key={section.id} className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {config.label}
              </label>
              <VideoUpload
                sectionId={section.id}
                currentVideoUrl={section.videoUrl}
                currentVideoPublicId={section.videoPublicId}
                muted={config.muted}
                disabled={saving}
                onUploadComplete={(data) => handleVideoUpload(section.id, data)}
                onDelete={() => handleVideoDelete(section.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
