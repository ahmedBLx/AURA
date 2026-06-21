'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';

export default function BodySync() {
  const pathname = usePathname();
  const { theme } = useTheme();

  useEffect(() => {
    if (!pathname) return;
    const path = pathname.toLowerCase();
    const prefix = theme === 'light' ? 'light' : 'dark';
    if (path === '/shop' || path === '/men' || path === '/women' || path === '/offers') {
      document.body.className = `${prefix}-shop`;
    } else if (path === '/admin') {
      document.body.className = `${prefix}-admin`;
    } else if (path === '/login') {
      document.body.className = `${prefix}-landing`;
    } else {
      document.body.className = `${prefix}-landing`;
    }
  }, [pathname, theme]);

  return null;
}
