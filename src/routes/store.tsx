import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { useAccount, useWallet } from "@/lib/account";
import { useTheme, THEMES } from "@/lib/theme";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Download,
  Flame,
  Palette,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Store & Perks — KRUZZ" },
      {
        name: "description",
        content:
          "Redeem your Reasoning Credits for developer perks, in-app UI themes, and blueprints.",
      },
    ],
  }),
  component: StorePage,
});

interface StoreItem {
  id: string;
  name: string;
  category: "Theme" | "Download" | "Tooling" | "Credential" | "Utility";
  cost: number;
  description: string;
  icon: typeof Sparkles;
  unlocked?: boolean;
  themeId?: string;
  paletteChips?: string[];
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: "theme-acid-lime",
    themeId: "theme-acid-lime",
    name: "Electric Acid Lime UI",
    category: "Theme",
    cost: 0,
    description:
      "Signature KRUZZ aesthetic: deep matte obsidian surfaces with high-energy electric acid lime accents. Default active theme.",
    icon: Palette,
    unlocked: true,
    paletteChips: ["#ccff00", "#d4ff00", "#182608"],
  },
  {
    id: "theme-cyberpunk",
    themeId: "theme-cyberpunk",
    name: "Cyberpunk Neon UI",
    category: "Theme",
    cost: 35,
    description:
      "Night-city architecture: vivid electric cyan highlights, hot magenta glows, and midnight obsidian cards across all pages.",
    icon: Palette,
    paletteChips: ["#00f0ff", "#ff007f", "#040810"],
  },
  {
    id: "theme-matrix",
    themeId: "theme-matrix",
    name: "Matrix Phosphor UI",
    category: "Theme",
    cost: 35,
    description:
      "Hacker systems console: high-intensity terminal phosphor green glowing against deep onyx void surfaces.",
    icon: Palette,
    paletteChips: ["#00ff66", "#10b981", "#020a04"],
  },
  {
    id: "theme-monochrome",
    themeId: "theme-monochrome",
    name: "Monolith Slate UI",
    category: "Theme",
    cost: 25,
    description:
      "Minimalist architectural palette: crisp stark white contrast with cold titanium shadows and dark slate accents.",
    icon: Palette,
    paletteChips: ["#ffffff", "#e2e8f0", "#1e1e1e"],
  },
  {
    id: "pdf-architecture-blueprints",
    name: "System Architecture Cheat-Sheet & Roadmap",
    category: "Download",
    cost: 150,
    description:
      "Exhaustive 15-section system design engineering roadmap, mental models, invariant laws, and architectural cheat-sheets in Markdown.",
    icon: Download,
  },
  {
    id: "pack-terminal-themes",
    name: "JetBrains & VS Code Terminal Theme Pack",
    category: "Tooling",
    cost: 100,
    description:
      "Exportable color schemes matching KRUZZ palettes for your external IDE, terminal, and code editor.",
    icon: Terminal,
  },
  {
    id: "badge-verified-thinker",
    name: "Systems Thinker Certificate of Reasoning",
    category: "Credential",
    cost: 250,
    description:
      "Verifiable high-resolution stamped digital credential showcasing mastery of distributed systems reasoning.",
    icon: ShieldCheck,
  },
  {
    id: "streak-shield",
    name: "Streak Freeze Protection",
    category: "Utility",
    cost: 30,
    description: "Preserves your active daily investigation streak if you miss a single day.",
    icon: Flame,
  },
];

const CATEGORIES = ["All", "Theme", "Download", "Tooling", "Credential"] as const;

function StorePage() {
  const { points, redeemStoreItem, has, isAuthenticated } = useWallet();
  const { user, profile } = useAccount();
  const { currentTheme, setTheme, isThemeUnlocked, activeThemeMeta } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const handleDownloadCheatSheet = async () => {
    try {
      let content = "";
      try {
        const res = await fetch("/SYSTEM_DESIGN_ROADMAP.md");
        if (res.ok) {
          content = await res.text();
        }
      } catch {
        // Fallback to embedded summary if offline or fetch fails
      }

      const investigatorName = user?.fullName || profile?.name || "Systems Investigator";

      if (content) {
        content = content.replace(
          "**Target Audience:** Software Engineers, Backend Architects, and Systems Thinkers",
          `**Investigator:** ${investigatorName}\n**Issued By:** KRUZZ Engineering Academy (kruzz.dev)\n**Target Audience:** Software Engineers, Backend Architects, and Systems Thinkers`,
        );
      } else {
        content = `# KRUZZ — SYSTEM DESIGN ROADMAP & ARCHITECTURAL CHEAT-SHEET
Investigator: ${investigatorName}
Verified: https://kruzz.dev

## 1. What is System Design?
System Design is the discipline of defining components, modules, interfaces, and data architectures to meet scalability, reliability, and maintainability requirements under high load and failure modes.

## 2. Invariant Theorems
- CAP Theorem: In the presence of network partitions (P), choose Consistency (CP) or Availability (AP).
- PACELC Theorem: If Partition (P), choose Availability (A) or Consistency (C); Else (E), choose Latency (L) or Consistency (C).

## 3. Core Concepts Roadmap
- L4 vs L7 Load Balancing & Consistent Hashing
- Caching: Cache-Aside, Write-Through, Write-Back, Stampede Throttling
- Storage: B+ Trees (Reads) vs LSM Trees (Writes)
- Message Queues & Event Streaming: RabbitMQ vs Apache Kafka
- Distributed Transactions: Sagas, Outbox Pattern, 2PC
- Anti-Abuse: Sliding Window Counter Rate Limiting in Redis Lua
`;
      }

      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kruzz-system-design-roadmap.md";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("System Architecture Roadmap downloaded!");
    } catch {
      toast.error("Failed to generate download. Please try again.");
    }
  };

  const handleDownloadTheme = (themeId?: string) => {
    const targetTheme = themeId || currentTheme;
    const isCyber = targetTheme === "theme-cyberpunk";
    const isMatrix = targetTheme === "theme-matrix";
    const isMono = targetTheme === "theme-monochrome";

    const themeName = isCyber
      ? "KRUZZ Cyberpunk Neon"
      : isMatrix
        ? "KRUZZ Matrix Phosphor"
        : isMono
          ? "KRUZZ Monolith Slate"
          : "KRUZZ Acid Lime";

    const primaryColor = isCyber
      ? "#00F0FF"
      : isMatrix
        ? "#00FF66"
        : isMono
          ? "#FFFFFF"
          : "#CCFF00";

    const bgColor = isCyber ? "#070614" : isMatrix ? "#010802" : isMono ? "#0A0A0A" : "#080808";

    const themeJson = {
      name: themeName,
      type: "dark",
      colors: {
        "editor.background": bgColor,
        "editor.foreground": "#F5F5F5",
        "activityBar.background": "#000000",
        "sideBar.background": "#0a0a0a",
        "sideBar.border": "#1a1a1a",
        "statusBar.background": "#000000",
        "statusBar.foreground": primaryColor,
        "editorCursor.foreground": primaryColor,
        "editor.selectionBackground": isCyber ? "#003344" : "#182608",
        "editor.lineHighlightBackground": "#0f1505",
        "terminal.background": bgColor,
        "terminal.foreground": "#F5F5F5",
        "terminal.ansiGreen": primaryColor,
        "terminal.ansiBrightGreen": primaryColor,
      },
      tokenColors: [
        {
          scope: ["keyword", "storage.type", "storage.modifier"],
          settings: { foreground: primaryColor, fontStyle: "bold" },
        },
        {
          scope: ["string", "string.quoted"],
          settings: { foreground: isCyber ? "#38BDF8" : isMatrix ? "#34D399" : "#E2E8F0" },
        },
        {
          scope: ["comment"],
          settings: { foreground: "#666666", fontStyle: "italic" },
        },
        {
          scope: ["entity.name.function", "support.function"],
          settings: { foreground: "#FFFFFF", fontStyle: "bold" },
        },
      ],
    };
    const blob = new Blob([JSON.stringify(themeJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${themeName.toLowerCase().replace(/\s+/g, "-")}.color-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${themeName} exported for VS Code & Terminal!`);
  };

  const handleDownloadCertificate = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, 1600, 1000);

    // Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 1600; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1000);
      ctx.stroke();
    }
    for (let y = 0; y < 1000; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1600, y);
      ctx.stroke();
    }

    // Outer and Inner Borders
    ctx.strokeStyle = "rgba(204, 255, 0, 0.4)";
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, 1500, 900);

    ctx.strokeStyle = "rgba(204, 255, 0, 0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(70, 70, 1460, 860);

    // Glow
    const grad = ctx.createRadialGradient(800, 500, 50, 800, 500, 600);
    grad.addColorStop(0, "rgba(204, 255, 0, 0.08)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(70, 70, 1460, 860);

    // Title
    ctx.fillStyle = "#ccff00";
    ctx.font = "bold 24px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("KRUZZ · COUNCIL OF DISTRIBUTED ARCHITECTURE", 800, 180);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 64px 'Inter', sans-serif";
    ctx.fillText("CERTIFICATE OF SYSTEMS REASONING", 800, 280);

    ctx.fillStyle = "#8a8a8a";
    ctx.font = "20px 'JetBrains Mono', monospace";
    ctx.fillText("THIS DIGITAL CREDENTIAL FORMALLY ATTESTS THAT", 800, 360);

    // Recipient Name
    const name = user?.fullName || profile?.name || "Systems Investigator";
    ctx.fillStyle = "#ccff00";
    ctx.font = "900 54px 'Inter', sans-serif";
    ctx.fillText(name.toUpperCase(), 800, 450);

    ctx.fillStyle = "#b8b8b8";
    ctx.font = "20px 'Inter', sans-serif";
    ctx.fillText(
      "has demonstrated mastery in decomposing distributed trade-offs, state synchronization,",
      800,
      530,
    );
    ctx.fillText(
      "and progressive system reconstruction through the KRUZZ 8-Section Investigation Method.",
      800,
      570,
    );

    // Seal
    ctx.fillStyle = "rgba(204, 255, 0, 0.1)";
    ctx.beginPath();
    ctx.arc(800, 720, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ccff00";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ccff00";
    ctx.font = "bold 16px 'JetBrains Mono', monospace";
    ctx.fillText("VERIFIED", 800, 715);
    ctx.fillText("REASONING", 800, 735);

    // Metadata Footer
    ctx.fillStyle = "#666666";
    ctx.font = "16px 'JetBrains Mono', monospace";
    ctx.fillText(
      `ISSUED: ${new Date().toLocaleDateString()} · PERSISTENCE ID: #RC-THINKER-VERIFIED`,
      800,
      870,
    );

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `kruzz-systems-thinker-certificate-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
    toast.success("Systems Thinker Certificate of Reasoning downloaded!");
  };

  const handleRedeem = async (item: StoreItem) => {
    // Handling Themes
    if (item.category === "Theme") {
      const isOwned = item.unlocked || isThemeUnlocked(item.id, has);
      if (isOwned) {
        setTheme(item.id);
        toast.success(`Active website theme changed to "${item.name}"!`);
        return;
      }

      if (!isAuthenticated) {
        toast.error("Please sign in to unlock in-app themes with your RC balance.");
        return;
      }

      if (points < item.cost) {
        toast.error(`Insufficient RC balance! You need ${item.cost - points} more RC.`);
        return;
      }

      const res = await redeemStoreItem(item.id);
      if (!res.success) {
        toast.error((res as any).error || "Failed to unlock theme.");
        return;
      }

      toast.success(`Successfully unlocked and equipped ${item.name}!`);
      setTheme(item.id);
      return;
    }

    // Handling Non-Theme Items
    if (!isAuthenticated) {
      toast.error("Please sign in to redeem items from the store.");
      return;
    }

    if (item.unlocked || has(`store:${item.id}`)) {
      if (item.id === "pdf-architecture-blueprints") {
        handleDownloadCheatSheet();
      } else if (item.id === "pack-terminal-themes") {
        handleDownloadTheme();
      } else if (item.id === "badge-verified-thinker") {
        handleDownloadCertificate();
      } else {
        toast.info(`${item.name} is active in your account.`);
      }
      return;
    }

    if (points < item.cost) {
      toast.error(`Insufficient RC balance! You need ${item.cost - points} more RC.`);
      return;
    }

    const res = await redeemStoreItem(item.id);
    if (!res.success) {
      toast.error((res as any).error || "Failed to redeem item.");
      return;
    }

    toast.success(`Successfully unlocked ${item.name}!`);

    // Auto trigger deliverable upon purchase
    if (item.id === "pdf-architecture-blueprints") {
      handleDownloadCheatSheet();
    } else if (item.id === "pack-terminal-themes") {
      handleDownloadTheme();
    } else if (item.id === "badge-verified-thinker") {
      handleDownloadCertificate();
    }
  };

  const filteredItems =
    selectedCategory === "All"
      ? STORE_ITEMS
      : STORE_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <AppChrome>
      <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6">
        {/* Store Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full recording-dot" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ccff00] font-bold">
                RC Exchange & Perks
              </p>
            </div>
            <h1 className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-[#f5f5f5]">
              Perks & Themes Store
            </h1>
            <p className="mt-1 text-xs text-[#8a8a8a]">
              Redeem Reasoning Credits (RC) for real-time in-app website themes, architecture
              blueprints, and credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl bg-[#141a05] border border-[#ccff00]/30 px-4 py-2.5 shadow-[0_0_15px_rgba(204,255,0,0.2)]">
              <span className="font-mono text-xs text-[#8a8a8a]">Your Balance:</span>
              <span className="font-mono text-base font-bold text-[#ccff00]">{points} RC</span>
            </div>
          </div>
        </div>

        {/* Active Theme Quick-Bar Banner */}
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-4 sm:p-5 shadow-lg backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--theme-surface,#182608)] border border-primary/30 text-primary shadow-[0_0_10px_var(--glow-color,rgba(204,255,0,0.2))]">
                <Palette className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8a8a8a]">
                    Active In-App Theme
                  </span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary border border-primary/30">
                    Live
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#f5f5f5]">
                  {activeThemeMeta?.name ?? "Electric Acid Lime"} —{" "}
                  <span className="text-xs font-normal text-[#b8b8b8]">
                    {activeThemeMeta?.subtitle ?? "Deep Obsidian & Neon Lime"}
                  </span>
                </h3>
              </div>
            </div>

            {/* Quick-equip pills for all unlocked themes */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-[#8a8a8a] hidden sm:inline">
                Quick Switch:
              </span>
              {THEMES.map((theme) => {
                const isUnlocked = isThemeUnlocked(theme.id, has);
                const isActive = currentTheme === theme.id;
                if (!isUnlocked) return null;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setTheme(theme.id);
                      toast.success(`Switched theme to ${theme.name}`);
                    }}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[var(--theme-surface,#182608)] border border-primary/60 text-primary shadow-[0_0_12px_var(--glow-color,rgba(204,255,0,0.25))]"
                        : "bg-white/[0.04] border border-white/[0.08] text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-white/[0.08]"
                    }`}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: theme.palette.primary }}
                    />
                    {theme.name.split(" ")[0]}
                    {isActive && <Check className="size-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold shadow-[0_0_12px_var(--glow-color,rgba(204,255,0,0.3))]"
                    : "bg-white/[0.04] border border-white/[0.08] text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-white/[0.08]"
                }`}
              >
                {cat === "All" ? "All Items" : cat === "Theme" ? "Website Themes" : cat}
              </button>
            );
          })}
        </div>

        {/* Store Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const isTheme = item.category === "Theme";
            const isOwned =
              item.unlocked ||
              has(`store:${item.id}`) ||
              (isTheme && isThemeUnlocked(item.id, has));
            const isActiveTheme = isTheme && currentTheme === item.id;
            const canAfford = points >= item.cost;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className={`glass-panel group relative flex flex-col justify-between rounded-3xl p-6 border shadow-[0_20px_40px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-1 ${
                  isActiveTheme
                    ? "border-primary/60 shadow-[0_0_25px_var(--glow-color,rgba(204,255,0,0.15))]"
                    : "border-white/[0.08] hover:border-primary/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a]">
                        {item.category === "Theme" ? "In-App Theme" : item.category}
                      </span>
                      {isActiveTheme && (
                        <span className="flex items-center gap-1 rounded-md bg-[var(--theme-surface,#182608)] border border-primary/40 px-2 py-0.5 font-mono text-[9px] font-bold text-primary">
                          <CheckCircle2 className="size-2.5" /> ACTIVE
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isOwned ? "text-primary" : "text-primary/90"
                      }`}
                    >
                      {isOwned ? "UNLOCKED" : `${item.cost} RC`}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--theme-surface,#182608)] border border-primary/30 text-primary shadow-[0_0_10px_var(--glow-color,rgba(204,255,0,0.2))]">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#f5f5f5] group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-[#b8b8b8]">{item.description}</p>

                  {/* Visual palette chips for theme items */}
                  {item.paletteChips && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-black/40 border border-white/[0.06] p-2.5">
                      <span className="font-mono text-[10px] text-[#8a8a8a] mr-1">Palette:</span>
                      {item.paletteChips.map((color, idx) => (
                        <div key={idx} className="flex items-center gap-1.5" title={color}>
                          <span
                            className="size-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-mono text-[10px] text-[#8a8a8a]">
                            {idx === 0 ? "Accent" : idx === 1 ? "Glow" : "Surface"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => handleRedeem(item)}
                    disabled={!isTheme && !isOwned && !canAfford}
                    className={`w-full rounded-xl py-2.5 font-mono text-xs font-bold transition-all ${
                      isActiveTheme
                        ? "bg-[var(--theme-surface,#182608)] border border-primary/60 text-primary cursor-default shadow-[0_0_15px_var(--glow-color,rgba(204,255,0,0.2))]"
                        : isTheme && isOwned
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_var(--glow-color,rgba(204,255,0,0.3))] cursor-pointer"
                          : isOwned
                            ? "bg-[var(--theme-surface,#182608)] border border-primary/40 text-primary hover:brightness-110 shadow-[0_0_12px_var(--glow-color,rgba(204,255,0,0.2))] cursor-pointer"
                            : canAfford
                              ? "bg-primary text-primary-foreground shadow-[0_0_15px_var(--glow-color,rgba(204,255,0,0.4))] hover:shadow-[0_0_20px_var(--glow-color,rgba(204,255,0,0.6))] cursor-pointer"
                              : "neu-btn text-[#8a8a8a] opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {isActiveTheme
                      ? "✓ Active In-App Theme"
                      : isTheme && isOwned
                        ? "Equip In-App Theme"
                        : isOwned
                          ? item.category === "Download" || item.category === "Tooling"
                            ? "↓ Download Deliverable"
                            : item.category === "Credential"
                              ? "↓ Download Certificate"
                              : "✓ Active in Account"
                          : canAfford
                            ? `Unlock for ${item.cost} RC`
                            : `Need ${item.cost - points} more RC`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppChrome>
  );
}
