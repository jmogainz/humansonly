'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem('humansonly_theme', theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = window.localStorage.getItem('humansonly_theme');
    const nextTheme: Theme = stored === 'light' ? 'light' : 'dark';
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
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
