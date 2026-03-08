'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('toolhub_theme') as ThemeMode;
    if (saved === 'light' || saved === 'dark') setThemeModeState(saved);
  }, []);

  useEffect(() => {
    document.body.style.background = themeMode === 'dark' ? '#1a1a1a' : '#f5f5f5';
    document.body.style.color = themeMode === 'dark' ? '#c9c9c9' : '#1a1a1a';
  }, [themeMode]);

  const setThemeMode = (t: ThemeMode) => {
    setThemeModeState(t);
    localStorage.setItem('toolhub_theme', t);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
