'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SeoPhotoButton from './SeoPhotoButton';
import { Textarea } from '@/components/ui/textarea';

type SeoSettingsProp = {
  defaultSeoTitle?: string | null;
  defaultSeoDescription?: string | null;
  titleSuffix?: string | null;
};

type Props = {
  className?: string;

  seoSettings: SeoSettingsProp;

  valueTitle: string;
  onChangeTitle: (v: string) => void;

  valueDescription: string;
  onChangeDescription: (v: string) => void;

  imageUrl: string | null;

  onSelect: (file: File, previewUrl?: string) => void;
  onClear: () => void;

  accept?: string;
  maxSizeMb?: number;
};

export default function SearchEnginesSettings({
  className,
  seoSettings,
  valueTitle,
  onChangeTitle,
  valueDescription,
  onChangeDescription,
  imageUrl,             
  onSelect,
  onClear,
  accept = 'image/*',
  maxSizeMb = 10,
}: Props) {
  const defaultSeoTitle = seoSettings?.defaultSeoTitle ?? '';
  const titleSuffix = seoSettings?.titleSuffix ?? '';
  const defaultSeoDescription = seoSettings?.defaultSeoDescription ?? '';

  const metaTitlePreview = [defaultSeoTitle, titleSuffix].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">Налаштування у пошукових системах</h2>

      <div className="flex flex-col gap-2.5 bg-white p-2.5 dark:bg-neutral-800">
        <h3 className="text-xl text-[#0055FF] underline">{metaTitlePreview}</h3>
        <span className="text-sm text-[#B9B9B9]">https://alcotrade.com.ua/</span>
        <p className="text-base text-[#616161]">{defaultSeoDescription}</p>
      </div>

      <div className="flex flex-col gap-4">
        <Label htmlFor="meta-title" className="text-xl">
          Змінити мета-заголовок
        </Label>
        <Input
          id="meta-title"
          type="text"
          maxLength={60}
          value={valueTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Заголовок сайту у пошукових системах"
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-4">
        <Label htmlFor="meta-description" className="text-xl">
          Змінити мета-опис
        </Label>
        <Textarea
          id="meta-description"
          maxLength={160}
          value={valueDescription}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="Опис сайту у пошукових системах"
          className="h-20 w-full resize-none"
        />
      </div>

      <SeoPhotoButton
        className={className}
        accept={accept}
        maxSizeMb={maxSizeMb}
        imageUrl={imageUrl}       
        onSelect={onSelect}
        onClear={onClear}
      />
    </div>
  );
}
