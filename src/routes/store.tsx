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

const CATEGORIES = ["All", "Download", "Tooling", "Credential", "Utility"] as const;

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
          : "#000000";

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
    grad.addColorStop(0, "rgba(0, 0, 0, 0.05)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(70, 70, 1460, 860);

    // Title
    ctx.fillStyle = "#000000";
    ctx.font = "bold 24px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("KRUZZ · COUNCIL OF DISTRIBUTED ARCHITECTURE", 800, 180);

    ctx.fillStyle = "#000000";
    ctx.font = "900 64px 'Inter', sans-serif";
    ctx.fillText("CERTIFICATE OF SYSTEMS REASONING", 800, 280);

    ctx.fillStyle = "#555555";
    ctx.font = "20px 'JetBrains Mono', monospace";
    ctx.fillText("THIS DIGITAL CREDENTIAL FORMALLY ATTESTS THAT", 800, 360);

    // Recipient Name
    const name = user?.fullName || profile?.name || "Systems Investigator";
    ctx.fillStyle = "#000000";
    ctx.font = "900 54px 'Inter', sans-serif";
    ctx.fillText(name.toUpperCase(), 800, 450);

    ctx.fillStyle = "#333333";
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
    ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
    ctx.beginPath();
    ctx.arc(800, 720, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#000000";
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-black ring-2 ring-black/20" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black font-black">
                RC Exchange & Deliverables
              </p>
            </div>
            <h1 className="mt-1.5 text-2xl md:text-3xl font-black tracking-tight text-black">
              Perks & Deliverables Store
            </h1>
            <p className="mt-1 text-xs text-black font-medium">
              Redeem Reasoning Credits (RC) for architecture blueprints, deliverables, and verified
              credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white border-2 border-black px-4 py-2.5 shadow-xs">
              <span className="font-mono text-xs text-black font-bold">Your Balance:</span>
              <span className="font-mono text-base font-black text-black">{points} RC</span>
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
                className={`rounded-xl px-3.5 py-1.5 font-mono text-xs font-black transition-all cursor-pointer border-2 border-black ${
                  isSelected
                    ? "bg-black text-white shadow-xs"
                    : "bg-white text-black hover:bg-neutral-100"
                }`}
              >
                {cat === "All" ? "All Deliverables" : cat}
              </button>
            );
          })}
        </div>

        {/* Store Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const isOwned = item.unlocked || has(`store:${item.id}`);
            const canAfford = points >= item.cost;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="glass-panel group relative flex flex-col justify-between rounded-3xl p-6 border-2 border-black bg-white text-black shadow-xs transition-all hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between border-b-2 border-black pb-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-black font-black">
                      {item.category}
                    </span>
                    <span className="font-mono text-xs font-black text-black">
                      {isOwned ? "UNLOCKED" : `${item.cost} RC`}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white border-2 border-black text-black shadow-xs">
                      <Icon className="size-5 text-black" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-black transition-colors">
                        {item.name}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-black font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={() => handleRedeem(item)}
                    disabled={!isOwned && !canAfford}
                    className={`w-full rounded-xl py-2.5 font-mono text-xs font-black transition-all border-2 border-black ${
                      isOwned
                        ? "bg-white text-black hover:bg-neutral-100 cursor-pointer"
                        : canAfford
                          ? "bg-black text-white hover:bg-neutral-800 cursor-pointer shadow-xs"
                          : "bg-neutral-100 text-neutral-600 cursor-not-allowed"
                    }`}
                  >
                    {isOwned
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
