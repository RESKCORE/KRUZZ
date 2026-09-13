import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Link as LinkIcon, Share2, Check, ShieldCheck, QrCode } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

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

function loadImage(src?: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
    setTimeout(() => resolve(null), 2500);
  });
}

/**
 * Generates a high-contrast QR code canvas with the circular KRUZZ logo
 * composited right in the center using Error Correction Level 'H' (30% recovery).
 */
async function generateBrandedQR(
  url: string,
  logoImg: HTMLImageElement | null,
  size = 512,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  // 1. Generate base high-contrast QR code
  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#050805",
      light: "#ffffff",
    },
  });

  const ctx = canvas.getContext("2d");
  if (!ctx || !logoImg) return canvas;

  const cx = size / 2;
  const cy = size / 2;
  // Radius ~20% of QR size ensures QR remains 100% scannable with Level H (30% tolerance)
  const outerR = size * 0.115;
  const innerR = size * 0.10;

  // Solid white backing disc so QR data does not bleed into the logo
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerR + 4, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Dark circular badge container
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = "#090d09";
  ctx.fill();

  // Glowing neon lime ring around center logo
  ctx.strokeStyle = LIME;
  ctx.lineWidth = Math.max(2.5, size * 0.008);
  ctx.shadowColor = "rgba(204, 255, 0, 0.45)";
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Clip and draw KRUZZ logo
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.clip();
  drawCover(ctx, logoImg, cx - innerR, cy - innerR, innerR * 2, innerR * 2);
  ctx.restore();

  return canvas;
}

/**
 * Composites the full 800x1050 "Investigator Credential Card" for high-res PNG download.
 */
function drawFullCredentialBadge(
  ctx: CanvasRenderingContext2D,
  user: ShareProfileModalProps["user"],
  qrCanvas: HTMLCanvasElement,
  avatarImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null,
) {
  const W = 800;
  const H = 1050;

  // 1. Deep Void Background
  ctx.fillStyle = "#050705";
  ctx.fillRect(0, 0, W, H);

  // Radial Neon Glow from top
  const glow = ctx.createRadialGradient(W / 2, 180, 20, W / 2, 220, 420);
  glow.addColorStop(0, "rgba(204, 255, 0, 0.14)");
  glow.addColorStop(1, "rgba(204, 255, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Subtle Dot Grid
  ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
  for (let x = 30; x < W; x += 30) {
    for (let y = 30; y < H; y += 30) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Main Card Panel
  const pad = 36;
  const cardW = W - pad * 2;
  const cardH = H - pad * 2;

  ctx.fillStyle = "#0a0e0a";
  roundRect(ctx, pad, pad, cardW, cardH, 28);
  ctx.fill();

  ctx.strokeStyle = "rgba(204, 255, 0, 0.22)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, pad, pad, cardW, cardH, 28);
  ctx.stroke();

  // Top Neon Accent Bar
  ctx.fillStyle = LIME;
  roundRect(ctx, pad + 32, pad, 140, 3.5, 2);
  ctx.fill();

  // 3. Header Bar
  const logoX = pad + 36;
  const logoY = pad + 32;
  if (logoImg) {
    ctx.save();
    roundRect(ctx, logoX, logoY, 44, 44, 12);
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, 44, 44);
    ctx.restore();
  }

  ctx.fillStyle = WHITE;
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("KRUZZ", logoX + 56, logoY + 28);

  ctx.fillStyle = MUTED;
  ctx.font = `bold 11px ${MONO}`;
  ctx.fillText("// SYSTEM INVESTIGATOR CREDENTIAL", logoX + 144, logoY + 28);

  // Rank Pill Top-Right
  const rankText = (user.rank || "OBSERVER").toUpperCase();
  ctx.font = `bold 12px ${MONO}`;
  const rankW = ctx.measureText(rankText).width + 30;
  const rankX = W - pad - 36 - rankW;
  const rankY = pad + 30;

  ctx.fillStyle = "#152408";
  roundRect(ctx, rankX, rankY, rankW, 34, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(204, 255, 0, 0.45)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, rankX, rankY, rankW, 34, 10);
  ctx.stroke();

  ctx.fillStyle = LIME;
  ctx.fillText(rankText, rankX + 15, rankY + 22);

  // Divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 36, pad + 95);
  ctx.lineTo(W - pad - 36, pad + 95);
  ctx.stroke();

  // 4. User Identity Section
  const avX = pad + 40;
  const avY = pad + 120;
  const avR = 46;

  // Avatar Ring
  ctx.save();
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "rgba(204, 255, 0, 0.4)";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(avX + avR, avY + avR, avR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Avatar Photo / Fallback
  if (avatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avX + avR, avY + avR, avR - 3, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, avatarImg, avX + 3, avY + 3, (avR - 3) * 2, (avR - 3) * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#141c14";
    ctx.beginPath();
    ctx.arc(avX + avR, avY + avR, avR - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = LIME;
    ctx.font = `bold 32px ${SANS}`;
    ctx.textAlign = "center";
    ctx.fillText((user.name || "K").charAt(0).toUpperCase(), avX + avR, avY + avR + 11);
    ctx.textAlign = "left";
  }

  // Name & Handle
  ctx.fillStyle = WHITE;
  ctx.font = `bold 28px ${SANS}`;
  ctx.fillText(user.name || "Investigator", avX + avR * 2 + 24, avY + 44);

  ctx.fillStyle = MUTED;
  ctx.font = `500 16px ${MONO}`;
  ctx.fillText(`@${user.handle}`, avX + avR * 2 + 24, avY + 74);

  // 5. Central Scannable QR Frame
  const qrFrameSize = 400;
  const qrFrameX = (W - qrFrameSize) / 2;
  const qrFrameY = avY + avR * 2 + 40;

  // Backdrop behind QR
  ctx.fillStyle = "#0e140e";
  roundRect(ctx, qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  roundRect(ctx, qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, 20);
  ctx.stroke();

  // Cyber Corner Brackets
  const bracketLen = 22;
  const bpad = 12;
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 2.5;

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(qrFrameX + bpad, qrFrameY + bpad + bracketLen);
  ctx.lineTo(qrFrameX + bpad, qrFrameY + bpad);
  ctx.lineTo(qrFrameX + bpad + bracketLen, qrFrameY + bpad);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(qrFrameX + qrFrameSize - bpad - bracketLen, qrFrameY + bpad);
  ctx.lineTo(qrFrameX + qrFrameSize - bpad, qrFrameY + bpad);
  ctx.lineTo(qrFrameX + qrFrameSize - bpad, qrFrameY + bpad + bracketLen);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(qrFrameX + bpad, qrFrameY + qrFrameSize - bpad - bracketLen);
  ctx.lineTo(qrFrameX + bpad, qrFrameY + qrFrameSize - bpad);
  ctx.lineTo(qrFrameX + bpad + bracketLen, qrFrameY + qrFrameSize - bpad);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(qrFrameX + qrFrameSize - bpad - bracketLen, qrFrameY + qrFrameSize - bpad);
  ctx.lineTo(qrFrameX + qrFrameSize - bpad, qrFrameY + qrFrameSize - bpad);
  ctx.lineTo(qrFrameX + qrFrameSize - bpad, qrFrameY + qrFrameSize - bpad - bracketLen);
  ctx.stroke();

  // Draw the QR Canvas
  const qrInnerPad = 26;
  const qrInnerSize = qrFrameSize - qrInnerPad * 2;
  ctx.drawImage(
    qrCanvas,
    qrFrameX + qrInnerPad,
    qrFrameY + qrInnerPad,
    qrInnerSize,
    qrInnerSize,
  );

  // Instruction Pill Below QR
  const scanLabel = "SCAN WITH PHONE CAMERA TO VIEW DOSSIER";
  ctx.font = `bold 11px ${MONO}`;
  const scanW = ctx.measureText(scanLabel).width + 28;
  const scanX = (W - scanW) / 2;
  const scanY = qrFrameY + qrFrameSize + 18;

  ctx.fillStyle = "#121912";
  roundRect(ctx, scanX, scanY, scanW, 28, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(204, 255, 0, 0.3)";
  ctx.lineWidth = 1;
  roundRect(ctx, scanX, scanY, scanW, 28, 8);
  ctx.stroke();

  ctx.fillStyle = LIME;
  ctx.fillText(scanLabel, scanX + 14, scanY + 18);

  // 6. Stats Triple Bar
  const statsY = scanY + 54;
  const statsH = 88;
  const stats = [
    { label: "RC BALANCE", val: `${user.points}`, sub: "points" },
    { label: "CASES SOLVED", val: `${user.solvedCases}`, sub: `of ${user.totalCases || 35}` },
    { label: "DAY STREAK", val: `${user.streak}d`, sub: "streak" },
  ];

  const statGridW = (cardW - 72 - 32) / 3;
  stats.forEach((st, idx) => {
    const sx = pad + 36 + idx * (statGridW + 16);
    ctx.fillStyle = "#0e130e";
    roundRect(ctx, sx, statsY, statGridW, statsH, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    roundRect(ctx, sx, statsY, statGridW, statsH, 14);
    ctx.stroke();

    ctx.fillStyle = MUTED;
    ctx.font = `bold 10px ${MONO}`;
    ctx.fillText(st.label, sx + 16, statsY + 26);

    ctx.fillStyle = LIME;
    ctx.font = `bold 26px ${MONO}`;
    ctx.fillText(st.val, sx + 16, statsY + 62);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = `500 12px ${SANS}`;
    ctx.fillText(st.sub, sx + 16 + ctx.measureText(st.val).width + 8, statsY + 60);
  });

  // 7. Footer Watermark & Target URL
  const footY = H - pad - 32;
  const slugOrId = user.profileId || user.handle;
  ctx.fillStyle = MUTED;
  ctx.font = `bold 11px ${MONO}`;
  ctx.fillText(`kruzz.app/profile/${slugOrId}`, pad + 36, footY);

  ctx.fillStyle = LIME;
  ctx.font = `bold 11px ${MONO}`;
  ctx.textAlign = "right";
  ctx.fillText("VERIFIED ON-CHAIN DOSSIER", W - pad - 36, footY);
  ctx.textAlign = "left";
}

export function ShareProfileModal({ isOpen, onClose, user }: ShareProfileModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [badgeImageUrl, setBadgeImageUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const slugOrId = user.profileId || user.handle;
  const targetUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/profile/${slugOrId}`;
    }
    return `https://kruzz.app/profile/${slugOrId}`;
  }, [slugOrId]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsGenerating(true);

    async function build() {
      try {
        const [avatarImg, logoImg] = await Promise.all([
          loadImage(user.avatarUrl),
          loadImage("/logo.png"),
        ]);
        if (cancelled) return;

        // 1. Generate clean QR code with centered circular KRUZZ logo
        const qrCanvas = await generateBrandedQR(targetUrl, logoImg, 512);
        if (cancelled) return;
        qrCanvasRef.current = qrCanvas;
        setQrDataUrl(qrCanvas.toDataURL("image/png"));

        // 2. Composite full downloadable credential badge
        const badgeCanvas = document.createElement("canvas");
        badgeCanvas.width = 800;
        badgeCanvas.height = 1050;
        const bCtx = badgeCanvas.getContext("2d");
        if (bCtx) {
          drawFullCredentialBadge(bCtx, user, qrCanvas, avatarImg, logoImg);
          setBadgeImageUrl(badgeCanvas.toDataURL("image/png"));
        }
      } catch (err) {
        console.error("Failed to generate QR badge:", err);
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    void build();

    return () => {
      cancelled = true;
    };
  }, [isOpen, targetUrl, user]);

  const handleDownloadBadge = () => {
    const urlToDownload = badgeImageUrl || qrDataUrl;
    if (!urlToDownload) return;
    const a = document.createElement("a");
    a.href = urlToDownload;
    a.download = `kruzz-investigator-${user.handle}-qr.png`;
    a.click();
    toast.success("Investigator QR Badge downloaded!");
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setIsCopied(true);
      toast.success("Public profile link copied!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Check out my verified investigator dossier on @KRUZZDev! Solved ${user.solvedCases} system architecture cases:`,
    );
    const url = encodeURIComponent(targetUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl border border-white/[0.1] bg-[#090c09] p-5 text-[#f5f5f5] shadow-[0_24px_64px_rgba(0,0,0,0.85)] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full recording-dot" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#ccff00] font-bold">
              Investigator QR Clearance
            </p>
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight text-[#f5f5f5] mt-0.5">
            Share Your Investigator Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-[#8a8a8a]">
            Anyone who scans this QR code will directly open your public profile and case studies without signing in.
          </DialogDescription>
        </DialogHeader>

        {/* Dynamic Cyber QR Credential Card Preview */}
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-[#ccff00]/20 bg-[#060906] p-5 shadow-2xl">
          {/* Subtle lime glow in background */}
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 size-44 rounded-full bg-[#ccff00]/10 blur-3xl" />

          {/* Card Top: Identity */}
          <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
            <div className="flex items-center gap-3">
              {/* Avatar with glowing ring */}
              <div className="relative size-11 shrink-0 rounded-full border-2 border-[#ccff00] p-0.5 shadow-[0_0_12px_rgba(204,255,0,0.3)]">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center rounded-full bg-[#141b14] font-mono text-xs font-bold text-[#ccff00]">
                    {(user.name || "K").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-[#f5f5f5] leading-tight line-clamp-1">
                    {user.name}
                  </h4>
                  <ShieldCheck className="size-3.5 text-[#ccff00] shrink-0" />
                </div>
                <p className="font-mono text-[11px] text-[#8a8a8a]">@{user.handle}</p>
              </div>
            </div>

            {/* Rank Pill */}
            <span className="rounded-full bg-[#162409] border border-[#ccff00]/30 px-2.5 py-1 font-mono text-[10px] font-bold text-[#ccff00] shrink-0">
              {user.rank || "OBSERVER"}
            </span>
          </div>

          {/* Card Center: QR Code with Target Brackets */}
          <div className="relative z-10 my-4 flex flex-col items-center justify-center">
            <div className="relative rounded-2xl bg-white p-3 shadow-[0_0_32px_rgba(0,0,0,0.6)] group">
              {/* Corner Cyber Brackets */}
              <div className="pointer-events-none absolute -top-1.5 -left-1.5 size-4 border-t-2 border-l-2 border-[#ccff00]" />
              <div className="pointer-events-none absolute -top-1.5 -right-1.5 size-4 border-t-2 border-r-2 border-[#ccff00]" />
              <div className="pointer-events-none absolute -bottom-1.5 -left-1.5 size-4 border-b-2 border-l-2 border-[#ccff00]" />
              <div className="pointer-events-none absolute -bottom-1.5 -right-1.5 size-4 border-b-2 border-r-2 border-[#ccff00]" />

              {isGenerating ? (
                <div className="flex size-48 items-center justify-center bg-[#f5f5f5]">
                  <div className="size-6 animate-spin rounded-full border-2 border-[#ccff00] border-t-transparent" />
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for @${user.handle}`}
                  className="size-48 rounded-lg object-contain"
                />
              ) : (
                <div className="flex size-48 items-center justify-center text-xs text-[#8a8a8a] font-mono">
                  Failed to generate QR
                </div>
              )}
            </div>

            {/* Scanner Helper Label */}
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-[#0c120c] border border-white/[0.08] px-3 py-1 text-[10px] font-mono text-[#8a8a8a]">
              <QrCode className="size-3 text-[#ccff00]" />
              <span>Point camera to inspect dossier</span>
            </div>
          </div>

          {/* Quick Target URL Bar with 1-click Copy */}
          <div className="relative z-10 flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#0c120c] px-3 py-2">
            <span className="truncate font-mono text-[11px] text-[#8a8a8a]">
              {targetUrl.replace(/^https?:\/\//, "")}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 rounded-lg bg-white/[0.06] hover:bg-[#ccff00]/20 hover:text-[#ccff00] px-2 py-1 font-mono text-[10px] font-bold text-[#f5f5f5] transition-colors cursor-pointer shrink-0"
            >
              {isCopied ? (
                <>
                  <Check className="size-3 text-[#ccff00]" />
                  <span className="text-[#ccff00]">Copied</span>
                </>
              ) : (
                <>
                  <LinkIcon className="size-3 text-[#8a8a8a]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadBadge}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4ff00] to-[#ccff00] px-4 py-2.5 font-mono text-xs font-bold text-[#080808] shadow-[0_0_16px_rgba(204,255,0,0.35)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="size-4 stroke-[2.5]" />
            <span>Download QR Badge</span>
          </button>

          <button
            type="button"
            onClick={handleShareTwitter}
            className="neu-btn flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold text-[#f5f5f5] hover:border-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="size-3.5 text-[#ccff00]" />
            <span>Share on X</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
