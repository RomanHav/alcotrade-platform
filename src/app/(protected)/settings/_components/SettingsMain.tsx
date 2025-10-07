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

  const themeDraft = useAppSelector(selectThemeDraft);
  const themeDirty = useAppSelector(selectThemeDirty);
  const themeSaving = useAppSelector(selectThemeLoading);

  const seoTitle = useAppSelector(selectSeoVisibleTitle);
  const seoDesc = useAppSelector(selectSeoVisibleDesc);
  const seoImageUrl = useAppSelector(selectSeoImageUrl);
  const seoDirty = useAppSelector(selectSeoDirty);
  const seoValid = useAppSelector(selectSeoValid);
  const seoSaving = useAppSelector(selectSeoLoading);

  const avatar = useAvatarSettings(defaultAvatar);

  const [saving, setSaving] = useState(false);

  const dirty = themeDirty || avatar.dirty || seoDirty;
  const formValid = seoValid;

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
      dispatch(cancelPreview());
      revokeLastUrl();
    };
  }, [dispatch, initialTheme, userId]);

  const onThemeChange = (mode: ClientTheme) => {
    dispatch(previewTheme(mode));
  };

  const onSeoTitle = (v: string) => dispatch(seoSetTitle(v));
  const onSeoDesc = (v: string) => dispatch(seoSetDescription(v));

  const onSeoSelect = (file: File) => {
    revokeLastUrl();
    const url = URL.createObjectURL(file);
    lastObjectUrlRef.current = url;
    dispatch(seoSelectImage({ file, previewUrl: url }));
  };

  const onSeoClear = () => {
    revokeLastUrl();
    dispatch(seoClearImage());
  };

  const onCancel = () => {
    dispatch(cancelPreview());
    dispatch(seoResetAll());
    revokeLastUrl();
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await dispatch(saveTheme({ userId })).unwrap();
      await avatar.save();
      await dispatch(saveSeoSettings()).unwrap();
      revokeLastUrl();
    } finally {
      setSaving(false);
    }
  };

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
          <ThemeSettings value={themeDraft} onChange={onThemeChange} />

          <ProfileSettings
            previewUrl={avatar.previewUrl}
            onSelect={avatar.onSelect}
            onReset={avatar.onReset}
            defaultAvatar={defaultAvatar}
          />

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
