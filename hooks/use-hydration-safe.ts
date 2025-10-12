'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to safely handle client-side only logic without hydration issues
 * @param initialValue - The initial value to use during SSR
 * @returns The actual value after hydration
 */
export function useHydrationSafe<T>(initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted ? value : initialValue;
}

/**
 * Hook to get the current theme without hydration issues
 * @returns The current theme or 'system' during SSR
 */
export function useHydrationSafeTheme(): string {
  const [theme, setTheme] = useState<string>('system');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('system');
    }
  }, []);

  return hasMounted ? theme : 'system';
}
