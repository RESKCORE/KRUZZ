import { Flame, Shield } from "lucide-react";

const DAY = 86_400_000;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Seven-day investigation streak with refined day nodes and active flame indicators.
 */
export function StreakStrip({
  current,
  longest,
  lastActive,
}: {
  current: number;
  longest: number;
  lastActive: string | null;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() - (6 - i) * DAY));

  const activeKeys = new Set<string>();
  if (lastActive) {
    const end = new Date(`${lastActive}T00:00:00Z`);
    for (let i = 0; i < current; i++) {
      activeKeys.add(dayKey(new Date(end.getTime() - i * DAY)));
    }
  }

  return (
    <section className="glass-panel relative overflow-hidden rounded-3xl p-6 border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full recording-dot" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Consistency Matrix
            </p>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <h3 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">
              {current} Day{current === 1 ? "" : "s"} Consecutive
            </h3>
            <span className="font-mono text-xs text-[#8a8a8a]">(Personal Record: {longest}d)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-1.5 text-xs font-mono text-[#b8b8b8]">
          <Shield className="size-3.5 text-primary" />
          <span>Daily Cadence Active</span>
        </div>
      </div>

      {/* 7-Day Matrix Row */}
      <div className="mt-5 grid grid-cols-7 gap-2.5">
        {days.map((d, index) => {
          const key = dayKey(d);
          const isToday = index === 6;
          const on = activeKeys.has(key) || (isToday && current > 0);

          return (
            <div
              key={key}
              className={`group relative flex flex-col items-center justify-between rounded-2xl p-2.5 transition-all duration-300 ${
                on
                  ? "bg-[var(--theme-surface,#182608)] border border-primary/50 shadow-[0_0_12px_var(--glow-color,rgba(204,255,0,0.2))]"
                  : isToday
                    ? "bg-[#181818] border border-primary/30"
                    : "bg-[#121212] border border-white/[0.05]"
              }`}
            >
              <span
                className={`font-mono text-[10px] font-medium uppercase ${
                  on ? "text-primary" : isToday ? "text-[#f5f5f5]" : "text-[#8a8a8a]"
                }`}
              >
                {DAY_NAMES[d.getDay()]}
              </span>

              <div className="my-2 flex size-7 items-center justify-center rounded-xl">
                {on ? (
                  <Flame className="size-4.5 text-primary fill-primary" />
                ) : (
                  <span className="font-mono text-xs text-[#8a8a8a]">{d.getDate()}</span>
                )}
              </div>

              <span
                className={`font-mono text-[9px] font-bold ${
                  on ? "text-primary" : isToday ? "text-[#8a8a8a]" : "text-white/20"
                }`}
              >
                {on ? "LOGGED" : isToday ? "TODAY" : "REST"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
