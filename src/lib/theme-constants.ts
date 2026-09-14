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
    name: "Electric Acid Lime",
    subtitle: "Deep Obsidian & Neon Lime",
    description:
      "Signature KRUZZ aesthetics: matte carbon obsidian surfaces with intense electric acid lime accents.",
    cost: 0,
    unlockedByDefault: true,
    palette: {
      primary: "#ccff00",
      glow: "rgba(204, 255, 0, 0.4)",
      surface: "#182608",
      border: "rgba(204, 255, 0, 0.4)",
      chipBg: "bg-[#ccff00]",
      badgeText: "Default Active",
    },
  },
  {
    id: "theme-cyberpunk",
    name: "Cyberpunk Neon",
    subtitle: "Electric Cyan & Hot Magenta",
    description:
      "Night-city architecture: vivid electric cyan primary highlights, magenta accents, and midnight obsidian.",
    cost: 35,
    palette: {
      primary: "#00f0ff",
      glow: "rgba(0, 240, 255, 0.45)",
      surface: "rgba(0, 240, 255, 0.12)",
      border: "rgba(0, 240, 255, 0.4)",
      chipBg: "bg-[#00f0ff]",
      badgeText: "Neon Cyan",
    },
  },
  {
    id: "theme-matrix",
    name: "Matrix Phosphor",
    subtitle: "Terminal Emerald & Deep Onyx",
    description:
      "Classic systems console: high-intensity terminal phosphor green glowing against pure black void.",
    cost: 35,
    palette: {
      primary: "#00ff66",
      glow: "rgba(0, 255, 102, 0.45)",
      surface: "rgba(0, 255, 102, 0.1)",
      border: "rgba(0, 255, 102, 0.4)",
      chipBg: "bg-[#00ff66]",
      badgeText: "Terminal Green",
    },
  },
  {
    id: "theme-monochrome",
    name: "Monolith Slate",
    subtitle: "High-Contrast White & Titanium",
    description:
      "Minimalist executive architectural palette: crisp stark white contrast with cold titanium shadows.",
    cost: 25,
    palette: {
      primary: "#ffffff",
      glow: "rgba(255, 255, 255, 0.35)",
      surface: "rgba(255, 255, 255, 0.08)",
      border: "rgba(255, 255, 255, 0.35)",
      chipBg: "bg-white",
      badgeText: "Stark White",
    },
  },
];

export const STORAGE_KEY = "kruzz_active_theme";
export const DEFAULT_THEME = "theme-acid-lime";
export const DEFAULT_THEME_META: ThemeMeta = THEMES[0]!;
