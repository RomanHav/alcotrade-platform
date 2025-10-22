'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Upload } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setFormField as setField } from '@/store/slices/articles';
import { toast } from 'sonner';

export default function ArticleMediaPicker() {
  const dispatch = useAppDispatch();
  const { coverId, coverUrl, pendingCoverFile } = useAppSelector((s) => s.articles.form);

  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // cleanup blob URL
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const pick = () => inputRef.current?.click();

  const onPickFile = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];

    // локальне превʼю
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return blobUrl;
    });

    // відкладаємо аплоад до "Зберегти"
    dispatch(setField({ key: 'pendingCoverFile', value: file as unknown as any }));
    // якщо раніше натискали "Видалити" — скасовуємо відкладене видалення
    dispatch(setField({ key: 'pendingCoverDelete', value: false }));

    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = () => {
    // якщо є новий ще не завантажений файл — просто скасовуємо вибір
    if (pendingCoverFile || localPreview) {
      dispatch(setField({ key: 'pendingCoverFile', value: null }));
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      toast('Вибране зображення скасовано');
      return;
    }
    // якщо є поточна обкладинка з БД — відкладено видаляємо її на "Зберегти"
    if (coverId || coverUrl) {
      dispatch(setField({ key: 'pendingCoverDelete', value: true }));
      dispatch(setField({ key: 'coverId', value: null }));
      dispatch(setField({ key: 'coverUrl', value: null }));
      toast('Зображення буде видалено при збереженні');
    }
  };

  const previewSrc = localPreview || coverUrl || '';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">Обкладинка статті</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files)}
        />
        <Button size="sm" variant="secondary" onClick={pick}>
          <Upload className="mr-2 h-4 w-4" />
          Обрати файл
        </Button>
      </div>

      <div className="bg-muted aspect-[4/5] overflow-hidden rounded-xl border">
        {previewSrc ? (
          <Image
            src={previewSrc}
            alt=""
            width={800}
            height={1000}
            className="h-full w-full object-cover"
            unoptimized
            priority
            sizes="(max-width: 768px) 100vw, 320px"
          />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      {(coverId || coverUrl || pendingCoverFile || localPreview) && (
        <div className="mt-3 flex justify-end">
          <Button variant="destructive" onClick={remove}>
            <Trash2 className="mr-2 h-4 w-4" />
            Видалити
          </Button>
        </div>
      )}
    </div>
  );
}
