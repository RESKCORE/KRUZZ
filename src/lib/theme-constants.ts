export interface ThemeMeta {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  cost: number;
  unlockedByDefault?: boolean;
  palette: {
    primary: string;
    glow: string;
    surface: string;
    border: string;
    chipBg: string;
    badgeText: string;
  };
}

export const THEMES: ThemeMeta[] = [
  {
    id: "theme-acid-lime",
    name: "KRUZZ Light",
    subtitle: "High-Contrast Light Theme",
    description:
      "Signature KRUZZ aesthetic: clean white surfaces with bold black borders and high-contrast black typography.",
    cost: 0,
    unlockedByDefault: true,
    palette: {
      primary: "#000000",
      glow: "transparent",
      surface: "#ffffff",
      border: "#000000",
      chipBg: "bg-black",
      badgeText: "Light Theme",
    },
  },
];

export const STORAGE_KEY = "kruzz_active_theme";
export const DEFAULT_THEME = "theme-acid-lime";
export const DEFAULT_THEME_META: ThemeMeta = THEMES[0]!;
