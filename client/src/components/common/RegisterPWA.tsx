'use client';

import { useEffect } from 'react';

export function RegisterPWA(): React.ReactElement | null {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/serwist/sw.js').catch(() => {
        // Service worker registration failed — silently ignore
      });
    }
  }, []);

  return null;
}
