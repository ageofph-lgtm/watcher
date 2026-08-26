import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({ isDark: true, toggleTheme: () => {}, isGlass: false, toggleGlass: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('watcher-theme');
    if (stored) return stored === 'dark';
    return true; // default dark
  });

  const [isGlass, setIsGlass] = useState(() => localStorage.getItem('watcher-skin') === 'glass');

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) { root.classList.add('dark'); }
    else { root.classList.remove('dark'); }
    localStorage.setItem('watcher-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (isGlass) { root.classList.add('glass'); }
    else { root.classList.remove('glass'); }
    localStorage.setItem('watcher-skin', isGlass ? 'glass' : 'classic');
  }, [isGlass]);

  const toggleTheme = () => setIsDark(p => !p);
  const toggleGlass = () => setIsGlass(p => !p);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, isGlass, toggleGlass }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);