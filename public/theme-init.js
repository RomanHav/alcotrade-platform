(function () {
  try {
    var d = document.documentElement;
    var t = localStorage.getItem('theme');
    var isSystemDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var mode = t === 'light' || t === 'dark' ? t : isSystemDark ? 'dark' : 'light';

    if (mode === 'dark') d.classList.add('dark');
    else d.classList.remove('dark');
    d.setAttribute('data-theme', t || 'system');
    d.style.colorScheme = mode;
  } catch (e) {
    сonsole.error(e);
  }
})();
