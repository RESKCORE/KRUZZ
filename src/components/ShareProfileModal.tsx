import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Link as LinkIcon, Share2, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
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

const LIME = "#d6ff00";
const GRAY = "#9a9a93";
const WHITE = "#ffffff";
const PANEL = "#111111";
const MONO = "'JetBrains Mono', monospace";
const DISPLAY = "'Anton', 'Archivo Black', sans-serif";
const HAND = "'Caveat', cursive";

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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  user: ShareProfileModalProps["user"],
  avatar: HTMLImageElement | null,
  logo: HTMLImageElement | null,
) {
  const W = 1600;
  const H = 900;
  const flavor = getFlavor(user.handle);

  // Background + panel
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PANEL;
  roundRect(ctx, 40, 40, 1520, 820, 20);
  ctx.fill();

  // Zone boundaries
  const leftEnd = 496; // divider x
  const centerMid = 610;
  const rightStart = 760;

  // ---- LEFT ZONE — portrait & motion ----
  const px = 268;
  const py = 450;
  const pr = 120;

  // halftone burst — concentric dot rings (2-3px diameter dots), photo out
  for (const ring of [36, 64, 92, 120, 148, 176]) {
    const r = ring;
    const t = 1 - r / 180;
    const count = Math.max(10, Math.floor((2 * Math.PI * r) / (14 + r * 0.03)));
    for (let i = 0; i < count; i++) {
      const a = (2 * Math.PI * i) / count + i * 0.7;
      ctx.globalAlpha = 0.25 * t;
      ctx.fillStyle = LIME;
      ctx.beginPath();
      ctx.arc(px + Math.cos(a) * r, py + Math.sin(a) * r, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // speed lines radiating leftward
  ctx.save();
  ctx.translate(px, py);
  for (let i = 0; i < 12; i++) {
    const aBase = Math.PI + (i / 11) * Math.PI * 1.1 - Math.PI * 0.55;
    const a = aBase + (Math.random() - 0.5) * 0.18;
    const len = 170 + Math.random() * 120;
    ctx.globalAlpha = 0.14 + Math.random() * 0.22;
    ctx.strokeStyle = i % 3 === 0 ? WHITE : LIME;
    ctx.lineWidth = 1.5 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(pr * 0.72 * Math.cos(a), pr * 0.72 * Math.sin(a));
    ctx.lineTo((pr * 0.72 + len) * Math.cos(a), (pr * 0.72 + len) * Math.sin(a));
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // outer glow ring
  const glow = ctx.createRadialGradient(px, py, pr, px, py, pr + 46);
  glow.addColorStop(0, "rgba(214,255,0,0.32)");
  glow.addColorStop(1, "rgba(214,255,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(px, py, pr + 46, 0, Math.PI * 2);
  ctx.fill();

  // portrait
  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, avatar, px - pr, py - pr, pr * 2, pr * 2);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = "#182608";
    ctx.fill();
    ctx.fillStyle = LIME;
    ctx.font = `900 130px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.fillText((user.name.trim()[0] ?? "?").toUpperCase(), px, py + 45);
    ctx.textAlign = "left";
  }
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 6;
  ctx.stroke();

  // rotated verified stamp
  ctx.save();
  ctx.translate(px + pr * 0.7, py + pr * 0.7);
  ctx.rotate((-15 * Math.PI) / 180);
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-11, 2);
  ctx.lineTo(-2, 11);
  ctx.lineTo(13, -8);
  ctx.stroke();
  ctx.restore();
  ctx.lineCap = "butt";

  // ---- CENTER ZONE — CASES SOLVED callout ----
  // vertical divider with soft glow underlay
  ctx.fillStyle = "rgba(214,255,0,0.16)";
  ctx.fillRect(leftEnd - 4, 40, 10, 820);
  ctx.fillStyle = LIME;
  ctx.fillRect(leftEnd, 40, 2, 820);

  ctx.textAlign = "center";
  ctx.fillStyle = WHITE;
  ctx.font = `600 24px ${MONO}`;
  ctx.letterSpacing = "0.1em";
  ctx.fillText("CASES SOLVED", centerMid, 300);
  ctx.letterSpacing = "0px";

  // big skewed number — Anton, largest element, cyan ghost offset behind
  const count = String(user.solvedCases);
  let fs = 210;
  ctx.font = `900 ${fs}px ${DISPLAY}`;
  const wide = ctx.measureText(count).width;
  if (wide > 480) fs = Math.floor((480 * fs) / wide);
  const skew = (-10 * Math.PI) / 180;
  const numY = 500;

  const drawNum = (dx: number, dy: number, fill: string, strokeColor: string | null) => {
    ctx.save();
    ctx.transform(1, 0, Math.tan(skew), 1, dx, dy);
    ctx.font = `900 ${fs}px ${DISPLAY}`;
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 5;
      ctx.strokeText(count, centerMid, numY);
    }
    ctx.fillStyle = fill;
    ctx.fillText(count, centerMid, numY);
    ctx.restore();
  };
  drawNum(3, 3, "rgba(61,242,192,0.35)", null);
  drawNum(0, 0, LIME, "#000000");

  // hand-drawn scribble underline
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const sy = numY + 34;
  ctx.moveTo(centerMid - 96, sy);
  for (let i = 0; i < 8; i++) {
    const x0 = centerMid - 96 + i * 24;
    ctx.quadraticCurveTo(x0 + 12, sy + (i % 2 ? -5 : 5), x0 + 24, sy);
  }
  ctx.stroke();
  ctx.textAlign = "left";

  // ---- RIGHT ZONE — quote bubble ----
  const bx = 820;
  const by = 330;
  const bw = 700;
  const bh = 230;

  // bubble tail (left, pointing to divider)
  ctx.fillStyle = PANEL;
  ctx.beginPath();
  ctx.moveTo(bx - 2, by + bh / 2 + 18);
  ctx.lineTo(bx - 2, by + bh / 2 - 18);
  ctx.lineTo(bx - 34, by + bh / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 2;
  ctx.stroke();

  // bubble body
  ctx.fillStyle = PANEL;
  roundRect(ctx, bx, by, bw, bh, 20);
  ctx.fill();
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bw, bh, 20);
  ctx.stroke();

  // decorative quote marks
  ctx.fillStyle = LIME;
  ctx.font = `700 84px ${HAND}`;
  ctx.fillText("❝", bx - 22, by - 12);
  ctx.fillText("❞", bx + bw - 40, by + bh + 40);

  // quote text
  ctx.fillStyle = WHITE;
  ctx.font = `400 36px ${HAND}`;
  const qLines = wrapText(ctx, `“${flavor.quote}”`, bw - 110);
  let qy = by + 84;
  for (const line of qLines.slice(0, 4)) {
    ctx.fillText(line, bx + 48, qy);
    qy += 46;
  }

  // attribution
  const attribution = `${user.name} @${user.handle}`;
  ctx.fillStyle = GRAY;
  ctx.font = `500 24px ${MONO}`;
  ctx.fillText(
    attribution.length > 46 ? `${attribution.slice(0, 45)}…` : attribution,
    bx + 48,
    by + bh + 52,
  );

  // rotated sticker badge — anchored bottom-right, fully inside card bounds
  const skText = user.rank.toUpperCase();
  ctx.font = `700 26px ${MONO}`;
  const skW = ctx.measureText(skText).width + 72;
  const skX = W - 20 - skW;
  const skY = H - 20 - 62;
  ctx.save();
  ctx.translate(skX, skY);
  ctx.rotate((-6 * Math.PI) / 180);
  ctx.fillStyle = "#000000";
  ctx.fillRect(4, 4, skW, 62);
  ctx.fillStyle = LIME;
  ctx.fillRect(0, 0, skW, 62);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.fillText(skText, skW / 2, 41);
  ctx.restore();
  ctx.textAlign = "left";

  // ---- KRUZZ logo — circular, top-right ----
  const lgX = 1528;
  const lgY = 78;
  const lgR = 40;
  ctx.save();
  ctx.shadowColor = "rgba(214,255,0,0.4)";
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(lgX, lgY, lgR, 0, Math.PI * 2);
  ctx.fillStyle = "#000000";
  ctx.fill();
  ctx.restore();
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(lgX, lgY, lgR - 3, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, logo, lgX - lgR + 3, lgY - lgR + 3, (lgR - 3) * 2, (lgR - 3) * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = LIME;
    ctx.font = `900 42px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.fillText("K", lgX, lgY + 15);
    ctx.textAlign = "left";
  }
  ctx.beginPath();
  ctx.arc(lgX, lgY, lgR, 0, Math.PI * 2);
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 3;
  ctx.stroke();
}

export function ShareProfileModal({ isOpen, onClose, user }: ShareProfileModalProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const flavor = useMemo(() => getFlavor(user.handle), [user.handle]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 900;
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
        setTimeout(() => resolve(null), 3000);
      });

    const fonts = Promise.all([
      document.fonts.load(`900 100px Anton`, "1"),
      document.fonts.load(`400 32px Caveat`, "1"),
    ]).catch(() => undefined);

    Promise.all([load(user.avatarUrl), load("/logo.png"), fonts]).then(([avatar, logo]) => {
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
    a.download = `kruzz-card-${user.handle}.png`;
    a.click();
    toast.success("Investigator card downloaded!");
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/profile`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success("Profile link copied!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Solved ${user.solvedCases} case studies on @KRUZZDev! “${flavor.quote}” — ${flavor.author}. Check my card:`,
    );
    const url = encodeURIComponent(`${window.location.origin}/profile`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl rounded-[32px] border border-white/[0.1] bg-[#080808] p-6 text-[#f5f5f5] shadow-[0_24px_64px_rgba(0,0,0,0.8)]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full recording-dot" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#ccff00] font-bold">
              Social Card Exporter
            </p>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-[#f5f5f5] mt-1">
            Share Investigator Card
          </DialogTitle>
          <p className="mt-1 font-mono text-[11px] italic text-[#8a8a8a]">
            “{flavor.quote}” — {flavor.author}
          </p>
        </DialogHeader>

        {/* Card Preview */}
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Investigator Card Preview"
              className="block w-full aspect-[1600/900] object-cover"
              role="img"
            />
          ) : (
            <div className="flex aspect-[1600/900] w-full items-center justify-center text-xs text-[#8a8a8a] font-mono">
              Rendering Social Card...
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-full bg-[#d6ff00] px-5 py-2.5 font-mono text-xs font-black text-[#080808] shadow-[0_0_15px_rgba(214,255,0,0.35)] hover:scale-105 active:scale-95 transition-all"
            >
              <Download className="size-4 stroke-[2.5]" />
              <span>Download Card (.png)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="neu-btn flex items-center gap-2 rounded-full px-4 py-2.5 font-mono text-xs font-semibold text-[#f5f5f5] hover:border-white/20 active:scale-95 transition-all"
            >
              {isCopied ? (
                <Check className="size-4 text-[#d6ff00]" />
              ) : (
                <LinkIcon className="size-4 text-[#8a8a8a]" />
              )}
              <span>{isCopied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareTwitter}
            className="neu-btn flex items-center gap-2 rounded-full px-4 py-2.5 font-mono text-xs font-semibold text-[#8a8a8a] hover:text-[#f5f5f5] active:scale-95 transition-all"
          >
            <Share2 className="size-4 text-[#ccff00]" />
            <span>Share on X / Twitter</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
