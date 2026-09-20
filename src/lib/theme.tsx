/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  THEMES,
  STORAGE_KEY,
  DEFAULT_THEME,
  DEFAULT_THEME_META,
  type ThemeMeta,
} from "./theme-constants";

export { THEMES, type ThemeMeta } from "./theme-constants";

interface ThemeContextType {
  currentTheme: string;
  setTheme: (themeId: string) => void;
  activeThemeMeta: ThemeMeta;
  themes: ThemeMeta[];
  isThemeUnlocked: (themeId: string, hasAward: (awardId: string) => boolean) => boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentThemeState] = useState<string>(DEFAULT_THEME);

  // Initialize theme on client mount - always enforce single light theme
  useEffect(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
      setCurrentThemeState(DEFAULT_THEME);
    } catch {
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    }
  }, []);

  const setTheme = useCallback((_themeId: string) => {
    // Single light theme enforced
    setCurrentThemeState(DEFAULT_THEME);
    try {
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    } catch {
      // ignore
    }
  }, []);

  const activeThemeMeta: ThemeMeta =
    THEMES.find((t) => t.id === currentTheme) ?? DEFAULT_THEME_META;

  const isThemeUnlocked = useCallback((themeId: string, hasAward: (awardId: string) => boolean) => {
    const meta = THEMES.find((t) => t.id === themeId);
    if (meta?.unlockedByDefault) return true;
    return hasAward(`store:${themeId}`);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        activeThemeMeta,
        themes: THEMES,
        isThemeUnlocked,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback if rendered outside ThemeProvider
    return {
      currentTheme: DEFAULT_THEME,
      setTheme: () => {},
      activeThemeMeta: DEFAULT_THEME_META,
      themes: THEMES,
      isThemeUnlocked: (id: string) => id === DEFAULT_THEME,
    };
  }
  return ctx;
}
