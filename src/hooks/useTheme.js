import { useState, useEffect } from "react";

export const THEMES = ["still-light", "still-dark", "retro-light", "retro-dark"];
export const DEFAULT_THEME = "still-dark";

const STORAGE_KEY = "watcher-theme";
const OLD_SKIN_KEY = "watcher-skin";

function migrate(value) {
  if (value === "dark") return "still-dark";
  if (value === "light") return "still-light";
  if (THEMES.includes(value)) return value;
  return DEFAULT_THEME;
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return migrate(stored);
    } catch {
      return DEFAULT_THEME;
    }
  });

  // Aplica o data-theme no <html> e persiste a escolha
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  // Limpa a chave antiga "watcher-skin" (legacy glass/classic toggle)
  useEffect(() => {
    try {
      if (localStorage.getItem(OLD_SKIN_KEY) !== null) {
        localStorage.removeItem(OLD_SKIN_KEY);
      }
    } catch {}
  }, []);

  return { theme, setTheme, themes: THEMES };
}