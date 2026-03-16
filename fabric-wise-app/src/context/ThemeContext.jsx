import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_THEME  = 'fi_theme';
const STORAGE_ACCENT = 'fi_accent';

export function ThemeProvider({ children }) {
  const [theme, setTheme]   = useState(() => localStorage.getItem(STORAGE_THEME)  || 'dark');
  const [accent, setAccent] = useState(() => localStorage.getItem(STORAGE_ACCENT) || 'green');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem(STORAGE_ACCENT, accent);
  }, [accent]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
