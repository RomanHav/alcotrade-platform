'use client';
import { useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

function readLocal(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const t = localStorage.getItem('theme');
  return t === 'light' || t === 'dark' ? t : 'system';
}

function applyTheme(mode: ThemeMode) {
  const d = document.documentElement;
  if (mode === 'light') d.classList.remove('dark');
  else if (mode === 'dark') d.classList.add('dark');
  else d.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
  d.setAttribute('data-theme', mode);
  d.style.colorScheme = mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
}

export default function ThemeHydrator() {
  useEffect(() => {
    let previewing = false;
    let mql: MediaQueryList | null = null;

    applyTheme(readLocal());

    const onSystemChange = () => {

      const current = previewing ? currentPreviewMode : readLocal();
      if (current === 'system') applyTheme('system');
    };

    let currentPreviewMode: ThemeMode = readLocal();

    const onPreview = (e: Event) => {
      const mode = (e as CustomEvent<{ mode: ThemeMode }>).detail.mode;
      previewing = true;
      currentPreviewMode = mode;
      applyTheme(mode);


      if (!mql && typeof window !== 'undefined') {
        mql = window.matchMedia('(prefers-color-scheme: dark)');
        mql.addEventListener?.('change', onSystemChange);
      }
    };

    const onPreviewEnd = () => {
      previewing = false;
      applyTheme(readLocal());
      if (mql) {
        mql.removeEventListener?.('change', onSystemChange);
        mql = null;
      }
    };

    const onApply = (e: Event) => {
      const mode = (e as CustomEvent<{ mode: ThemeMode }>).detail.mode;
      previewing = false;
      applyTheme(mode);
      if (mql) {
        mql.removeEventListener?.('change', onSystemChange);
        mql = null;
      }
    };

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'theme' && !previewing) {
        applyTheme(readLocal());
      }
    };

    window.addEventListener('theme:preview', onPreview as EventListener);
    window.addEventListener('theme:preview:end', onPreviewEnd as EventListener);
    window.addEventListener('theme:apply', onApply as EventListener);
    window.addEventListener('storage', onStorage);

    const baseMql = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
    const baseChange = () => { if (!previewing && readLocal() === 'system') applyTheme('system'); };
    baseMql?.addEventListener?.('change', baseChange);

    return () => {
      window.removeEventListener('theme:preview', onPreview as EventListener);
      window.removeEventListener('theme:preview:end', onPreviewEnd as EventListener);
      window.removeEventListener('theme:apply', onApply as EventListener);
      window.removeEventListener('storage', onStorage);
      baseMql?.removeEventListener?.('change', baseChange);
      mql?.removeEventListener?.('change', onSystemChange);
    };
  }, []);

  return null;
}
