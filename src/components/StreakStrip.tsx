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
    <section className="bg-white relative overflow-hidden rounded-3xl p-6 border-2 border-black text-black shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-black ring-2 ring-black/20" />
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black">
              Consistency Matrix
            </p>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <h3 className="text-2xl font-black tracking-tight text-black">
              {current} Day{current === 1 ? "" : "s"} Consecutive
            </h3>
            <span className="font-mono text-xs font-bold text-black">
              (Personal Record: {longest}d)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-white border-2 border-black px-3.5 py-1.5 text-xs font-mono font-black text-black">
          <Shield className="size-3.5 text-black stroke-[2.5]" />
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
              className={`group relative flex flex-col items-center justify-between rounded-2xl p-2.5 transition-all duration-300 border-2 border-black ${
                on
                  ? "bg-black text-white shadow-xs"
                  : isToday
                    ? "bg-neutral-100 text-black shadow-xs"
                    : "bg-white text-black"
              }`}
            >
              <span
                className={`font-mono text-[10px] uppercase font-black ${
                  on ? "text-white" : "text-black"
                }`}
              >
                {DAY_NAMES[d.getDay()]}
              </span>

              <div className="my-2 flex size-7 items-center justify-center rounded-xl">
                {on ? (
                  <Flame className="size-4.5 text-white fill-white" />
                ) : (
                  <span className="font-mono text-xs font-black text-black">{d.getDate()}</span>
                )}
              </div>

              <span
                className={`font-mono text-[9px] font-black tracking-wider ${
                  on ? "text-white" : "text-black"
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
