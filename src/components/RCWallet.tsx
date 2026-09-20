import { rankFor } from "@/lib/rc";
import { useWallet, useStreak } from "@/lib/account";
import { Flame } from "lucide-react";

/** Compact Streak badge for the header with flame icon. */
export function StreakBadge() {
  const { current } = useStreak();
  return (
    <span
      title={`${current} Day${current === 1 ? "" : "s"} Active Streak`}
      className="inline-flex items-center gap-1 sm:gap-1.5 rounded-[10px] bg-white border-2 border-black px-2.5 py-1.5 font-mono text-[11px] font-black text-black transition-transform hover:scale-105 shrink-0"
    >
      <Flame className={`size-3.5 ${current > 0 ? "text-black fill-black" : "text-black/40"}`} />
      <span>{current}d</span>
    </span>
  );
}

/** Compact RC counter for the header with dynamic themed badge styling. */
export function RCBadge() {
  const { points } = useWallet();
  const rank = rankFor(points);
  return (
    <span
      title={`${rank.name}${rank.next ? ` · ${rank.toNext} RC to ${rank.next}` : ""}`}
      className="inline-flex items-center gap-1 sm:gap-1.5 rounded-[10px] bg-black text-white border-2 border-black px-2.5 py-1.5 font-mono text-[11px] font-black transition-transform hover:scale-105 shrink-0 shadow-xs"
    >
      <span className="grid size-4 place-items-center rounded bg-white text-[8px] font-black text-black">
        RC
      </span>
      <span>{points}</span>
      <span className="hidden md:inline text-white/90">· {rank.name}</span>
    </span>
  );
}

/** Full wallet panel with clean light surface and black border. */
export function RCWalletPanel() {
  const { points } = useWallet();
  const rank = rankFor(points);
  return (
    <div className="glass-panel rounded-3xl p-5 border-2 border-black bg-white text-black shadow-xs">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-black font-black">
          Your RC Wallet
        </p>
        <span className="rounded-[8px] bg-neutral-100 border-2 border-black px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black">
          {rank.name}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-black tracking-tight text-black">{points}</span>
        <span className="font-mono text-xs font-black text-black">RC</span>
      </div>

      <div className="mt-3.5">
        <div className="flex justify-between text-[11px] font-mono text-black font-bold mb-1.5">
          <span>Rank Progress</span>
          <span className="text-black font-black">{rank.progress}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 p-0.5 border border-black">
          <div
            className="h-full rounded-full bg-black transition-all duration-500"
            style={{ width: `${rank.progress}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-black font-medium">
        {rank.next ? (
          <>
            <span className="font-bold text-black">{rank.toNext} RC</span> needed to reach{" "}
            <span className="text-black font-black underline">{rank.next}</span>.
          </>
        ) : (
          <span className="text-black font-black">
            Top rank reached — Systems Thinker unlocked.
          </span>
        )}
      </p>
    </div>
  );
}
