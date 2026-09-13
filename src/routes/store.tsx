import { createFileRoute } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { useAccount, useWallet } from "@/lib/account";
import { toast } from "sonner";
import {
  Download,
  Flame,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Store & Perks — KRUZZ" },
      {
        name: "description",
        content: "Redeem your Reasoning Credits for developer perks, themes, and blueprints.",
      },
    ],
  }),
  component: StorePage,
});

interface StoreItem {
  id: string;
  name: string;
  category: string;
  cost: number;
  description: string;
  icon: typeof Sparkles;
  unlocked?: boolean;
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: "theme-acid-lime",
    name: "Deep Obsidian & Electric Acid Lime UI",
    category: "Theme",
    cost: 0,
    description:
      "High-contrast dark obsidian cards with electric acid lime accents. Default active theme.",
    icon: Palette,
    unlocked: true,
  },
  {
    id: "pdf-architecture-blueprints",
    name: "System Architecture Cheat-Sheet Bundle",
    category: "Download",
    cost: 50,
    description:
      "High-resolution architectural flowcharts and trade-off matrices for all 5 systems.",
    icon: Download,
  },
  {
    id: "badge-verified-thinker",
    name: "Systems Thinker Certificate of Reasoning",
    category: "Credential",
    cost: 120,
    description:
      "Verifiable digital credential showcasing completion of distributed systems reasoning.",
    icon: ShieldCheck,
  },
  {
    id: "pack-terminal-themes",
    name: "JetBrains & VS Code Terminal Theme Pack",
    category: "Tooling",
    cost: 40,
    description: "Exportable color schemes matching KRUZZ's high-contrast carbon palette.",
    icon: Terminal,
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

function StorePage() {
  const { points, award, has } = useWallet();
  const { user, profile } = useAccount();

  const handleDownloadCheatSheet = () => {
    const content = `# KRUZZ — SYSTEM ARCHITECTURE CHEAT-SHEET BUNDLE
Generated for: ${user?.fullName || profile?.name || "Investigator"}
Verified at: kruzz.dev

---

## 1. Client-Server Architecture (Case 01)
- Core Protocol: HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)
- Request-Response Cycle: DNS -> TCP Handshake (3-way) -> TLS 1.3 -> HTTP Request -> Socket -> Handler
- Statelessness Trade-off: Scales horizontally without session affinity; requires external state store.

## 2. Authentication & Session Security (Case 04)
- JWT Structure: Header.Payload.Signature (HMAC-SHA256 or RS256)
- Password Hashing: bcrypt (adaptive cost factor, default 12 rounds)
- Stateless Tokens vs Stateful Sessions:
  * Tokens: No DB lookup on verify; cannot revoke instantly without blacklist (Redis TTL).
  * Sessions: Instant revocation; requires centralized Redis session cluster.

## 3. Distributed URL Shortener (Case 05)
- ID Generation: Base62 encoding on 64-bit auto-increment or Snowflake ID (timestamp + node ID + sequence).
- Capacity Math: 62^7 = ~3.5 trillion unique URLs with 7-character paths.
- Caching Strategy: Redis LRU (80/20 rule: top 20% URLs drive 80% traffic).
- Persistence: PostgreSQL / Cassandra with unique index on short_code.

## 4. Real-time Scaled Chat Architecture (Case 06)
- Transport: WebSocket duplex stream (RFC 6455) with HTTP upgrade.
- Horizontal Scaling: Stateless WebSocket gateways connected via Redis Pub/Sub backplane.
- Fan-out Mechanics: Client -> Node Gateway A -> Redis channel -> Node Gateway B -> Target Client.

## 5. Distributed API Rate Limiting (Case 08)
- Algorithms:
  * Token Bucket: Bursty traffic allowed, refills at steady rate.
  * Leaky Bucket: Smooths output rate, drops overflow.
  * Sliding Window Counter: High accuracy, prevents boundary spikes.
- Redis Atomic Execution: Single EVAL script running ZREMRANGEBYSCORE and ZADD to prevent race conditions.
`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kruzz-system-architecture-cheatsheet.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("System Architecture Cheat-Sheet Bundle downloaded!");
  };

  const handleDownloadTheme = () => {
    const themeJson = {
      name: "KRUZZ Acid Lime",
      type: "dark",
      colors: {
        "editor.background": "#080808",
        "editor.foreground": "#F5F5F5",
        "activityBar.background": "#000000",
        "sideBar.background": "#0a0a0a",
        "sideBar.border": "#1a1a1a",
        "statusBar.background": "#000000",
        "statusBar.foreground": "#CCFF00",
        "editorCursor.foreground": "#CCFF00",
        "editor.selectionBackground": "#182608",
        "editor.lineHighlightBackground": "#0f1505",
        "terminal.background": "#080808",
        "terminal.foreground": "#F5F5F5",
        "terminal.ansiGreen": "#CCFF00",
        "terminal.ansiBrightGreen": "#D4FF00",
      },
      tokenColors: [
        {
          scope: ["keyword", "storage.type", "storage.modifier"],
          settings: { foreground: "#CCFF00", fontStyle: "bold" },
        },
        {
          scope: ["string", "string.quoted"],
          settings: { foreground: "#A3E635" },
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
    a.download = "kruzz-acid-lime.color-theme.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("VS Code & Terminal Theme Pack downloaded!");
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

    // Outer and Inner Gold/Lime Borders
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

  const handleRedeem = (item: StoreItem) => {
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

    award(`store:${item.id}`, -item.cost);
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

  return (
    <AppChrome>
      <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6">
        {/* Store Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full recording-dot" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ccff00] font-bold">
                RC Exchange
              </p>
            </div>
            <h1 className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-[#f5f5f5]">
              Perks & Rewards Store
            </h1>
            <p className="mt-1 text-xs text-[#8a8a8a]">
              Redeem Reasoning Credits (RC) earned by reading architecture and writing code.
            </p>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-[#141a05] border border-[#ccff00]/30 px-4 py-2.5 shadow-[0_0_15px_rgba(204,255,0,0.2)]">
            <span className="font-mono text-xs text-[#8a8a8a]">Your Balance:</span>
            <span className="font-mono text-base font-bold text-[#ccff00]">{points} RC</span>
          </div>
        </div>

        {/* Store Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STORE_ITEMS.map((item) => {
            const isOwned = item.unlocked || has(`store:${item.id}`);
            const canAfford = points >= item.cost;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="glass-panel group relative flex flex-col justify-between rounded-3xl p-6 border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.45)] hover:border-[#ccff00]/40 transition-all hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a]">
                      {item.category}
                    </span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isOwned ? "text-[#a3e635]" : "text-[#ccff00]"
                      }`}
                    >
                      {isOwned ? "UNLOCKED" : `${item.cost} RC`}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[#182608] border border-[#ccff00]/30 text-[#ccff00] shadow-[0_0_10px_rgba(204,255,0,0.2)]">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#f5f5f5] group-hover:text-[#ccff00] transition-colors">
                        {item.name}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-[#b8b8b8]">{item.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => handleRedeem(item)}
                    disabled={!isOwned && !canAfford}
                    className={`w-full rounded-xl py-2.5 font-mono text-xs font-bold transition-all ${
                      isOwned
                        ? "bg-[#182608] border border-[#ccff00]/40 text-[#ccff00] hover:bg-[#20330a] shadow-[0_0_12px_rgba(204,255,0,0.2)] cursor-pointer"
                        : canAfford
                          ? "bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] text-[#080808] shadow-[0_0_15px_rgba(204,255,0,0.4)] hover:shadow-[0_0_20px_rgba(204,255,0,0.6)] cursor-pointer"
                          : "neu-btn text-[#8a8a8a] opacity-50 cursor-not-allowed"
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
