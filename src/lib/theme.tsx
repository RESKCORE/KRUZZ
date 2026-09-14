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

  // Initialize theme on client mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && THEMES.some((t) => t.id === stored)) {
        setCurrentThemeState(stored);
        document.documentElement.setAttribute("data-theme", stored);
      } else {
        document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
      }
    } catch {
      // localStorage disabled or SSR fallback
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    }
  }, []);

  const setTheme = useCallback((themeId: string) => {
    if (!THEMES.some((t) => t.id === themeId)) return;
    setCurrentThemeState(themeId);
    try {
      window.localStorage.setItem(STORAGE_KEY, themeId);
      document.documentElement.setAttribute("data-theme", themeId);
    } catch {
      // ignore storage failure
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
