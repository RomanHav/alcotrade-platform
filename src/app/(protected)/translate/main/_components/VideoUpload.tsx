'use client';

import { useState, useRef } from 'react';
import { Upload, X, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VideoUploadProps {
  sectionId: string;
  currentVideoUrl?: string | null;
  currentVideoPublicId?: string | null;
  onUploadComplete: (data: { url: string; publicId: string; duration?: number }) => void;
  onDelete: () => void;
  disabled?: boolean;
  muted?: boolean; // для видео без звука (hero секція)
}

export default function VideoUpload({
  sectionId,
  currentVideoUrl,
  currentVideoPublicId,
  onUploadComplete,
  onDelete,
  disabled = false,
  muted = false,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Потрібне відео');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Файл завеликий (макс 100MB)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sectionId', sectionId);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Помилка завантаження');
      }

      onUploadComplete({
        url: data.video.url,
        publicId: data.video.publicId,
        duration: data.video.duration,
      });

      toast.success('Відео завантажено');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Помилка завантаження';
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentVideoPublicId) return;

    setUploading(true);
    try {
      const response = await fetch(
        `/api/upload/video?public_id=${encodeURIComponent(currentVideoPublicId)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Помилка видалення');
      }

      onDelete();
      toast.success('Відео видалено');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Помилка видалення';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {currentVideoUrl ? (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video
              src={currentVideoUrl}
              controls
              muted={muted}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <Play className="h-4 w-4" />
              <span>Відео завантажено</span>
            </div>
            <button
              onClick={handleDelete}
              disabled={uploading || disabled}
              className="rounded px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
              : 'border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleChange}
            disabled={uploading || disabled}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  Завантаження...
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-neutral-400" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Перетягніть відео сюди
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    або натисніть щоб вибрати (макс 100MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
