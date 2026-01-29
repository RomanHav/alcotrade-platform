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
  const [progress, setProgress] = useState<number>(0);
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
    const signRes = await fetch('/api/cloudinary/sign', { method: 'POST' });
    if (!signRes.ok) throw new Error('Не вдалося отримати підпис');

    const { signature, timestamp, cloudName, apiKey, folder } =
      await signRes.json();

    const uploadResult = await new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Помилка завантаження у Cloudinary'));
      }
    };

    xhr.onerror = () => reject(new Error('Помилка мережі'));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    xhr.send(formData);
});

    onUploadComplete({
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    duration: uploadResult.duration,
});

    setProgress(0);

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
              <div className="mt-3 w-full">
                <div className="h-2 w-full overflow-hidden rounded bg-neutral-200 dark:bg-neutral-700">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }}/>
                </div>
                <p className="mt-1 text-xs text-neutral-500">{progress}%</p>
              </div>
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
