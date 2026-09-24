import React, { createContext, useContext, useCallback } from "react";
import { useTheme as useThemeHook } from "./hooks/useTheme";

const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => {},
  isGlass: true,
  toggleGlass: () => {},
  theme: "still-dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const { theme, setTheme } = useThemeHook();

  // isDark = theme termina em "-dark"
  const isDark = theme.endsWith("-dark");

  // toggleTheme alterna dentro da mesma família (still / retro)
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      if (prev === "still-light") return "still-dark";
      if (prev === "still-dark") return "still-light";
      if (prev === "retro-light") return "retro-dark";
      if (prev === "retro-dark") return "retro-light";
      return prev;
    });
  }, [setTheme]);

  // Glass é agora o único modo — toggleGlass é no-op (compat com componentes antigos)
  const isGlass = true;
  const toggleGlass = useCallback(() => {}, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, isGlass, toggleGlass, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);