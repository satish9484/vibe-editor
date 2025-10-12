'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className='h-5 w-5 flex items-center justify-center'>
        <div className='animate-pulse bg-muted rounded-sm h-4 w-4' />
      </div>
    );
  }

  return (
    <div
      className='cursor-pointer'
      onClick={() => {
        setTheme(theme === 'light' ? 'dark' : 'light');
      }}
    >
      {theme === 'light' ? <Moon className='h-5 w-5 text-black' /> : <Sun className='h-5 w-5 text-white' color='white' />}
    </div>
  );
}
