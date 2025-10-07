'use client';
import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

export function useThemeSettings() {
  const [mounted, setMounted] = useState(false);
  const [initial, setInitial] = useState<ThemeMode>('system');
  const [draft, setDraftState] = useState<ThemeMode>('system');

  useEffect(() => {
    setMounted(true);
    const init = readInitialTheme();
    setInitial(init);
    setDraftState(init);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme:preview:end'));
    }
  }, []);

  const dirty = mounted && draft !== initial;

  const setDraft = (mode: ThemeMode) => {
    setDraftState(mode);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme:preview', { detail: { mode } }));
    }
  };

  const resetPreview = () => {
    setDraftState(initial);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme:preview:end'));
    }
  };

  const save = async () => {
    if (!dirty) return;

    if (draft === 'light' || draft === 'dark') localStorage.setItem('theme', draft);
    else localStorage.removeItem('theme');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme:apply', { detail: { mode: draft } }));
      window.dispatchEvent(new CustomEvent('theme:preview:end'));
    }

    setInitial(draft);
  };

  return { draft, setDraft, dirty, save, resetPreview };
}
