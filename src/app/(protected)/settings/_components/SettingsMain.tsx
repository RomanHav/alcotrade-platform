'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

import ThemeSettings from './settings-sections/ThemeSettings';
import ProfileSettings from './settings-sections/ProfileSettings';
import SearchEnginesSettings from './settings-sections/SearchEnginesSettings';
import UserAndRolesTable from './UsersTable/UsersAndRolesTable';
import { AddUserModalProvider } from './UsersTable/context';

import { useAvatarSettings } from './hooks/useAvatarSettings';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

// THEME (Redux)
import {
  hydrateTheme,
  previewTheme,
  cancelPreview,
  saveTheme,
  syncThemeFromDB,
} from '@/store/operations/themeOperation';
import {
  selectThemeDraft,
  selectThemeDirty,
  selectThemeLoading,
} from '@/store/selectors/themeSelectors';
import { setInitial as setInitialTheme } from '@/store/slices/themeSlice';

// SEO (Redux)
import { loadSeoSettings, saveSeoSettings } from '@/store/operations/defaultSeoOperations';
import {
  selectSeoVisibleTitle,
  selectSeoVisibleDesc,
  selectSeoImageUrl,
  selectSeoDirty,
  selectSeoValid,
  selectSeoLoading,
} from '@/store/selectors/defaultSeoSelectors';
import {
  setTitle as seoSetTitle,
  setDescription as seoSetDescription,
  selectImage as seoSelectImage,
  clearImage as seoClearImage,
  resetAll as seoResetAll,
} from '@/store/slices/defaultSeoSlice';

type RoleProp = { role: string };
type SettingsProp = {
  defaultSeoTitle?: string | null;
  defaultSeoDescription?: string | null;
  titleSuffix?: string | null;
};
type ClientTheme = 'light' | 'dark' | 'system';

export default function SettingsMain({
  role,
  seoSettings,
  initialTheme,
  userId,
}: {
  role: RoleProp;
  seoSettings: SettingsProp;
  initialTheme: ClientTheme;
  userId: string;
}) {
  const defaultAvatar = process.env.NEXT_PUBLIC_DEFAULT_USER_IMAGE ?? '/avatar.jpg';

  const dispatch = useAppDispatch();

  // THEME
  const themeDraft = useAppSelector(selectThemeDraft);
  const themeDirty = useAppSelector(selectThemeDirty);
  const themeSaving = useAppSelector(selectThemeLoading);

  // SEO (Redux)
  const seoTitle = useAppSelector(selectSeoVisibleTitle);
  const seoDesc = useAppSelector(selectSeoVisibleDesc);
  const seoImageUrl = useAppSelector(selectSeoImageUrl);
  const seoDirty = useAppSelector(selectSeoDirty);
  const seoValid = useAppSelector(selectSeoValid);
  const seoSaving = useAppSelector(selectSeoLoading);

  // AVATAR (залишаємо твій існуючий хук)
  const avatar = useAvatarSettings(defaultAvatar);

  const [saving, setSaving] = useState(false);

  // Глобальна "брудність" і валідність (SEO керує валідацією інпутів і OG)
  const dirty = themeDirty || avatar.dirty || seoDirty;
  const formValid = seoValid;

  // Для безпечного revoке objectURL, створеного для прев’ю OG (щоб уникнути утечок)
  const lastObjectUrlRef = useRef<string | null>(null);
  const revokeLastUrl = () => {
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
  };

  useEffect(() => {
    dispatch(hydrateTheme());
    dispatch(setInitialTheme(initialTheme));
    dispatch(syncThemeFromDB({ userId }));
    dispatch(loadSeoSettings());

    return () => {
      dispatch(cancelPreview()); // повернути тему до збереженої при виході
      revokeLastUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, initialTheme, userId]);

  // THEME change -> глобальний прев'ю
  const onThemeChange = (mode: ClientTheme) => {
    dispatch(previewTheme(mode));
  };

  // SEO handlers
  const onSeoTitle = (v: string) => dispatch(seoSetTitle(v));
  const onSeoDesc = (v: string) => dispatch(seoSetDescription(v));

  const onSeoSelect = (file: File) => {
    // створимо objectURL для прев’ю (керований Redux’ом)
    revokeLastUrl();
    const url = URL.createObjectURL(file);
    lastObjectUrlRef.current = url;
    dispatch(seoSelectImage({ file, previewUrl: url }));
  };

  const onSeoClear = () => {
    // видалити локальне прев'ю; Redux покаже null/попереднє
    revokeLastUrl();
    dispatch(seoClearImage());
  };

  // CANCEL: скасувати всі незбережені зміни
  const onCancel = () => {
    dispatch(cancelPreview()); // тема -> збережена
    dispatch(seoResetAll()); // SEO -> збережене (включно з фото)
    revokeLastUrl();
    // за потреби відкочуй і аватар:
    // avatar.onReset();
  };

  // SAVE: тема + аватар + SEO
  const onSave = async () => {
    setSaving(true);
    try {
      await dispatch(saveTheme({ userId })).unwrap(); // тема
      await avatar.save(); // аватар (твій хук)
      await dispatch(saveSeoSettings()).unwrap(); // SEO
      revokeLastUrl();
    } finally {
      setSaving(false);
    }
  };

  // Окремі умови для кнопок:
  // Cancel активна, якщо є зміни (навіть якщо форма невалідна)
  // Save активна, лише коли dirty && formValid
  const disableCancel = !dirty || saving || themeSaving || seoSaving;
  const disableSave = !dirty || !formValid || saving || themeSaving || seoSaving;

  return (
    <AddUserModalProvider>
      <div className="px-8 pt-16">
        <div className="mb-9 flex items-center justify-between">
          <h1 className="text-4xl">Налаштування</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={disableCancel}
              className={`${!disableCancel ? 'opacity-100' : 'opacity-50'} cursor-pointer`}
            >
              Відмінити
            </Button>
            <Button
              onClick={onSave}
              disabled={disableSave}
              className={`${!disableSave ? 'opacity-100' : 'opacity-50'} cursor-pointer`}
            >
              {saving || themeSaving || seoSaving ? 'Збереження…' : 'Зберегти'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {/* THEME */}
          <ThemeSettings value={themeDraft} onChange={onThemeChange} />

          {/* PROFILE / AVATAR */}
          <ProfileSettings
            previewUrl={avatar.previewUrl}
            onSelect={avatar.onSelect}
            onReset={avatar.onReset}
            defaultAvatar={defaultAvatar}
          />

          {/* SEO (керовані значення з Redux) */}
          <SearchEnginesSettings
            seoSettings={seoSettings}
            className=""
            valueTitle={seoTitle}
            onChangeTitle={onSeoTitle}
            valueDescription={seoDesc}
            onChangeDescription={onSeoDesc}
            imageUrl={seoImageUrl}
            onSelect={(file) => onSeoSelect(file)}
            onClear={onSeoClear}
          />

          {role.role === 'ADMIN' && <UserAndRolesTable />}
        </div>
      </div>
    </AddUserModalProvider>
  );
}
