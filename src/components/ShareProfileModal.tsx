import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Link as LinkIcon, Share2, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    profileId?: string;
    name: string;
    handle: string;
    rank: string;
    points: number;
    streak: number;
    solvedCases: number;
    totalCases: number;
    avatarUrl?: string | undefined;
    bannerUrl?: string | undefined;
  };
}

const LIME = "#ccff00";
const WHITE = "#f5f5f5";
const MUTED = "#8a8a8a";
const MONO = "'JetBrains Mono', monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif";

const ANIME_QUOTES: { quote: string; author: string }[] = [
  { quote: "I'm gonna be King of the Pirates!", author: "Monkey D. Luffy" },
  { quote: "I never go back on my word. That's my ninja way!", author: "Naruto Uzumaki" },
  { quote: "Throughout heaven and earth, I alone am the honored one.", author: "Satoru Gojo" },
  { quote: "Power comes in response to a need, not a desire.", author: "Son Goku" },
  { quote: "If you don't take risks, you can't create a future.", author: "Monkey D. Luffy" },
  { quote: "No matter how deep the night, it always turns to day.", author: "Brook" },
  {
    quote: "Hard work is worthless for those who don't believe in themselves.",
    author: "Naruto Uzumaki",
  },
  {
    quote: "Whatever you lose, you'll find it again. What you throw away, you'll never get back.",
    author: "Kenshin Himura",
  },
];

function getFlavor(handle: string) {
  const seed = [...handle].reduce((a, c) => a + c.charCodeAt(0) * 31, 7) || 7;
  const q = ANIME_QUOTES[seed % ANIME_QUOTES.length]!;
  return { quote: q.quote, author: q.author };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ir = img.width / img.height;
  const br = w / h;
  let dw: number;
  let dh: number;
  if (ir > br) {
    dh = h;
    dw = h * ir;
  } else {
    dw = w;
    dh = w / ir;
  }
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  user: ShareProfileModalProps["user"],
  avatar: HTMLImageElement | null,
  logo: HTMLImageElement | null,
) {
  const W = 1200;
  const H = 630;
  const flavor = getFlavor(user.handle);

  // Deep dark background
  ctx.fillStyle = "#070907";
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow near top-left
  const glow = ctx.createRadialGradient(250, 200, 20, 250, 200, 360);
  glow.addColorStop(0, "rgba(204, 255, 0, 0.12)");
  glow.addColorStop(1, "rgba(204, 255, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Main card panel
  const pad = 30;
  const cardW = W - pad * 2;
  const cardH = H - pad * 2;
  ctx.fillStyle = "#0d100d";
  roundRect(ctx, pad, pad, cardW, cardH, 24);
  ctx.fill();

  // Subtle card border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, pad, pad, cardW, cardH, 24);
  ctx.stroke();

  // Accent top neon bar
  ctx.fillStyle = LIME;
  roundRect(ctx, pad + 24, pad, 120, 3, 2);
  ctx.fill();

  // ── Header Bar ──
  // Logo & KRUZZ title
  const logoX = pad + 32;
  const logoY = pad + 28;
  if (logo) {
    ctx.save();
    roundRect(ctx, logoX, logoY, 40, 40, 10);
    ctx.clip();
    ctx.drawImage(logo, logoX, logoY, 40, 40);
    ctx.restore();
  }

  ctx.fillStyle = WHITE;
  ctx.font = `bold 20px ${MONO}`;
  ctx.fillText("KRUZZ", logoX + 52, logoY + 26);

  ctx.fillStyle = MUTED;
  ctx.font = `500 12px ${MONO}`;
  ctx.fillText("// SYSTEM INVESTIGATOR BADGE", logoX + 130, logoY + 25);

  // Rank Pill (Top-Right)
  const rankText = (user.rank || "Observer").toUpperCase();
  ctx.font = `bold 13px ${MONO}`;
  const rankW = ctx.measureText(rankText).width + 32;
  const rankX = W - pad - 32 - rankW;
  const rankY = pad + 26;

  ctx.fillStyle = "#182608";
  roundRect(ctx, rankX, rankY, rankW, 36, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(204, 255, 0, 0.4)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, rankX, rankY, rankW, 36, 12);
  ctx.stroke();

  ctx.fillStyle = LIME;
  ctx.fillText(rankText, rankX + 16, rankY + 23);

  // ── Divider Line ──
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 32, pad + 86);
  ctx.lineTo(W - pad - 32, pad + 86);
  ctx.stroke();

  // ── Left: User Identity ──
  const avX = pad + 40;
  const avY = 160;
  const avR = 64;

  // Avatar Ring
  ctx.save();
  ctx.shadowColor = "rgba(204, 255, 0, 0.35)";
  ctx.shadowBlur = 18;
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avX + avR, avY + avR, avR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Avatar Photo / Initials
  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avX + avR, avY + avR, avR - 3, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, avatar, avX + 3, avY + 3, (avR - 3) * 2, (avR - 3) * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#151c15";
    ctx.beginPath();
    ctx.arc(avX + avR, avY + avR, avR - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = LIME;
    ctx.font = `bold 44px ${SANS}`;
    ctx.textAlign = "center";
    ctx.fillText((user.name || "K").charAt(0).toUpperCase(), avX + avR, avY + avR + 15);
    ctx.textAlign = "left";
  }

  // Name & Handle
  ctx.fillStyle = WHITE;
  ctx.font = `bold 32px ${SANS}`;
  ctx.fillText(user.name || "Learner", avX + avR * 2 + 32, avY + 54);

  ctx.fillStyle = MUTED;
  ctx.font = `500 18px ${MONO}`;
  ctx.fillText(`@${user.handle}`, avX + avR * 2 + 32, avY + 92);

  // ── Right: 3 Metric Cards ──
  const metrics = [
    { label: "CASES SOLVED", value: `${user.solvedCases}`, sub: `of ${user.totalCases || 35}` },
    { label: "LEARNING STREAK", value: `${user.streak}d`, sub: "consistent" },
    { label: "REASONING CREDITS", value: `${user.points}`, sub: "RC earned" },
  ];

  const gridY = 320;
  const gridW = (cardW - 64 - 32) / 3;

  metrics.forEach((m, idx) => {
    const cardX = pad + 32 + idx * (gridW + 16);
    ctx.fillStyle = "#121712";
    roundRect(ctx, cardX, gridY, gridW, 130, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, gridY, gridW, 130, 16);
    ctx.stroke();

    // Metric Label
    ctx.fillStyle = MUTED;
    ctx.font = `bold 11px ${MONO}`;
    ctx.fillText(m.label, cardX + 20, gridY + 34);

    // Metric Value
    ctx.fillStyle = LIME;
    ctx.font = `bold 36px ${MONO}`;
    ctx.fillText(m.value, cardX + 20, gridY + 84);

    // Metric Subtext
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = `500 13px ${SANS}`;
    ctx.fillText(m.sub, cardX + 20 + ctx.measureText(m.value).width + 10, gridY + 80);
  });

  // ── Bottom Quote & Watermark ──
  const quoteY = H - pad - 42;
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = `italic 14px ${SANS}`;
  const truncatedQuote = flavor.quote.length > 70 ? flavor.quote.slice(0, 68) + "..." : flavor.quote;
  ctx.fillText(`“${truncatedQuote}” — ${flavor.author}`, pad + 32, quoteY);

  ctx.fillStyle = MUTED;
  ctx.font = `bold 12px ${MONO}`;
  ctx.textAlign = "right";
  ctx.fillText("kruzz.app", W - pad - 32, quoteY);
  ctx.textAlign = "left";
}

export function ShareProfileModal({ isOpen, onClose, user }: ShareProfileModalProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const flavor = useMemo(() => getFlavor(user.handle), [user.handle]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const load = (src?: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
        setTimeout(() => resolve(null), 2500);
      });

    Promise.all([load(user.avatarUrl), load("/logo.png")]).then(([avatar, logo]) => {
      if (cancelled) return;
      drawScene(ctx, user, avatar, logo);
      setImageUrl(canvas.toDataURL("image/png"));
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, user]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `kruzz-badge-${user.handle}.png`;
    a.click();
    toast.success("Investigator badge downloaded!");
  };

  const handleCopyLink = () => {
    const slugOrId = user.profileId || user.handle;
    const url = `${window.location.origin}/profile/${slugOrId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success("Public profile link copied!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleShareTwitter = () => {
    const slugOrId = user.profileId || user.handle;
    const text = encodeURIComponent(
      `Solved ${user.solvedCases} cases on @KRUZZDev! “${flavor.quote}” — ${flavor.author}. Check my public profile:`,
    );
    const url = encodeURIComponent(`${window.location.origin}/profile/${slugOrId}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-3xl border border-white/[0.1] bg-[#090b09] p-5 text-[#f5f5f5] shadow-[0_24px_64px_rgba(0,0,0,0.85)]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full recording-dot" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#ccff00] font-bold">
              Investigator Card Exporter
            </p>
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight text-[#f5f5f5] mt-0.5">
            Share Your Engineering Profile
          </DialogTitle>
        </DialogHeader>

        {/* Card Preview (1200x630 ratio) */}
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050705] shadow-2xl">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Investigator Badge Preview"
              className="block w-full aspect-[1200/630] object-cover"
              role="img"
            />
          ) : (
            <div className="flex aspect-[1200/630] w-full items-center justify-center text-xs text-[#8a8a8a] font-mono">
              Generating Badge...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#d4ff00] to-[#ccff00] px-4 py-2 font-mono text-xs font-bold text-[#080808] shadow-[0_0_12px_rgba(204,255,0,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="size-3.5 stroke-[2.5]" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="neu-btn flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-mono text-xs font-semibold text-[#f5f5f5] hover:border-white/20 active:scale-95 transition-all cursor-pointer"
            >
              {isCopied ? (
                <Check className="size-3.5 text-[#ccff00]" />
              ) : (
                <LinkIcon className="size-3.5 text-[#8a8a8a]" />
              )}
              <span>{isCopied ? "Copied" : "Copy Link"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareTwitter}
            className="neu-btn flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-mono text-xs font-semibold text-[#8a8a8a] hover:text-[#f5f5f5] active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="size-3.5 text-[#ccff00]" />
            <span>Share on X</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
