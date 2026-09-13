import { rankFor } from "@/lib/rc";
import { useWallet, useStreak } from "@/lib/account";
import { Flame } from "lucide-react";

/** Compact Streak badge for the header with flame icon. */
export function StreakBadge() {
  const { current } = useStreak();
  return (
    <span
      title={`${current} Day${current === 1 ? "" : "s"} Active Streak`}
      className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#141414] border border-white/[0.08] px-2.5 py-1.5 font-mono text-[11px] font-bold text-[#f5f5f5] transition-transform hover:scale-105"
    >
      <Flame
        className={`size-3.5 ${current > 0 ? "text-[#ccff00] fill-[#ccff00]" : "text-[#8a8a8a]"}`}
      />
      <span>{current}d</span>
    </span>
  );
}

/** Compact RC counter for the header with electric acid lime badge styling. */
export function RCBadge() {
  const { points } = useWallet();
  const rank = rankFor(points);
  return (
    <span
      title={`${rank.name}${rank.next ? ` · ${rank.toNext} RC to ${rank.next}` : ""}`}
      className="inline-flex items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#d4ff00] to-[#ccff00] px-2.5 py-1.5 font-mono text-[11px] font-black text-[#080808] shadow-[0_0_12px_rgba(204,255,0,0.35)] transition-transform hover:scale-105"
    >
      <span className="grid size-4 place-items-center rounded bg-[#080808] text-[8px] font-black text-[#ccff00]">
        RC
      </span>
      <span>{points}</span>
      <span className="hidden text-[#080808]/80 sm:inline">· {rank.name}</span>
    </span>
  );
}

/** Full wallet panel with dark neumorphic surface and glowing progress meter. */
export function RCWalletPanel() {
  const { points } = useWallet();
  const rank = rankFor(points);
  return (
    <div className="glass-panel rounded-3xl p-5 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a]">
          Your RC Wallet
        </p>
        <span className="rounded-[8px] bg-[#ccff00]/15 border border-[#ccff00]/40 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#ccff00]">
          {rank.name}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-bold tracking-tight text-[#f5f5f5]">{points}</span>
        <span className="font-mono text-xs font-semibold text-[#ccff00]">RC</span>
      </div>

      <div className="mt-3.5">
        <div className="flex justify-between text-[11px] font-mono text-[#8a8a8a] mb-1.5">
          <span>Rank Progress</span>
          <span className="text-[#f5f5f5] font-semibold">{rank.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#161616] p-0.5 border border-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] shadow-[0_0_12px_rgba(204,255,0,0.6)] transition-all duration-500"
            style={{ width: `${rank.progress}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-[#b8b8b8]">
        {rank.next ? (
          <>
            <span className="font-semibold text-[#ccff00]">{rank.toNext} RC</span> needed to reach{" "}
            <span className="text-[#f5f5f5] font-medium">{rank.next}</span>.
          </>
        ) : (
          <span className="text-[#ccff00] font-medium">
            Top rank reached — Systems Thinker unlocked.
          </span>
        )}
      </p>
    </div>
  );
}
