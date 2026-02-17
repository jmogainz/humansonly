'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function readDomTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem('humansonly_theme', theme);
  
  // Update favicon based on theme
  const darkIcon = document.querySelector('link[href="/favicon-dark.svg"]');
  const lightIcon = document.querySelector('link[href="/favicon-light.svg"]');
  
  if (theme === 'dark') {
    if (darkIcon) darkIcon.removeAttribute('media');
    if (lightIcon) lightIcon.setAttribute('media', 'none');
  } else {
    if (lightIcon) lightIcon.removeAttribute('media');
    if (darkIcon) darkIcon.setAttribute('media', 'none');
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readDomTheme());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem('humansonly_theme');
    const nextTheme: Theme = stored === 'light' || stored === 'dark' ? stored : readDomTheme();
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  return (
    <button
      type="button"
      className="button buttonGhost"
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        applyTheme(next);
      }}
      aria-label="Toggle theme"
    >
      {mounted ? (theme === 'dark' ? 'Light' : 'Dark') : 'Theme'}
    </button>
  );
}
