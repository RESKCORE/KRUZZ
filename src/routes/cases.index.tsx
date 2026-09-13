import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { isUnlocked, unlockThreshold, caseAwardId, labAwardId, isStudyComplete } from "@/lib/rc";
import { useWallet } from "@/lib/account";
import { RCWalletPanel } from "@/components/RCWallet";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CheckCircle2, Sparkles, Award } from "lucide-react";

const TITLE = "Arena Centre — Real-World Engineering Investigations";
const DESCRIPTION =
  "Browse KRUZZ's real-world engineering investigations: from client-server architecture to distributed rate limiting.";

export const Route = createFileRoute("/cases/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Library,
});

const DIFFICULTY_TONES: Record<string, string> = {
  Explorer: "bg-[#a3e635]/15 text-[#a3e635] border-[#a3e635]/30",
  Builder: "bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/30",
  Engineer: "bg-[#d4ff00]/20 text-[#d4ff00] border-[#d4ff00]/40 font-bold",
};

function Library() {
  const [active, setActive] = useState("All");
  const { points, has, isAuthenticated, awards } = useWallet();
  const cloudProgress = useQuery(
    api.caseProgress.getAllUserProgress,
    isAuthenticated ? {} : "skip",
  );
  const unlockedCases = useQuery(api.caseProgress.getUserUnlockedCases, {});

  const allDbCases = useQuery(api.caseStudies.list, {}) ?? [];
  const dbCases = useQuery(api.caseStudies.list, active === "All" ? {} : { category: active });

  const categories = [
    "All",
    ...Array.from(new Set(allDbCases.map((c: any) => c.category).filter(Boolean))),
  ];

  const shown = dbCases ?? [];

  return (
    <AppChrome>
      <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full recording-dot" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ccff00] font-bold">
                Investigation Deck
              </p>
            </div>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-[#f5f5f5] mt-1.5 md:text-4xl">
              Explore the Investigations
            </h1>
            <p className="mt-2 max-w-[56ch] text-pretty text-sm leading-relaxed text-[#b8b8b8]">
              Each case runs the 8-section investigation method: problem, system, principles,
              architecture, decisions, implementation, practice, and reflection.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const selected = cat === active;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActive(cat)}
                  className={
                    selected
                      ? "rounded-xl bg-[#ccff00] px-3.5 py-1.5 font-mono text-xs font-black text-[#080808] shadow-[0_0_15px_rgba(204,255,0,0.35)]"
                      : "rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-1.5 font-mono text-xs font-medium text-[#b8b8b8] hover:text-[#f5f5f5] hover:border-white/20 transition-all"
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gamified Reward Banner + Live Wallet Status */}
        <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="glass-panel rounded-3xl p-5 border border-white/[0.08]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <p className="font-mono text-xs uppercase tracking-wider text-[#f5f5f5] font-bold">
                Reasoning Credit (RC) Rules
              </p>
              <span className="font-mono text-[10px] text-[#ccff00] font-bold">
                GAMIFIED PROGRESS
              </span>
            </div>
            <ul className="mt-3.5 grid gap-2.5 text-xs leading-relaxed text-[#b8b8b8] sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="text-[#ccff00] font-bold">+1 RC</span>
                <span>Complete any reading section</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ccff00] font-bold">+20 RC</span>
                <span>Finish all eight sections of a case study</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ccff00] font-bold">+10 RC</span>
                <span>Pass all CodeArena tests + write explanation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ccff00] font-bold">Unlocking</span>
                <span>Requires 50+ RC earned from foundational cases</span>
              </li>
            </ul>
          </div>
          <RCWalletPanel />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => {
            const userProgressDoc = (
              cloudProgress as
                | Array<{ caseSlug: string; completedSections?: number[]; passed?: boolean }>
                | undefined
            )?.find((p) => p.caseSlug === c.slug);
            const isCompleted = isStudyComplete(awards, userProgressDoc, c.slug);
            const isCaseUnlocked = unlockedCases ? unlockedCases.includes(c.slug) : c.rcCost <= 0;
            const open = isCaseUnlocked || isCompleted;
            const labPassed = has(labAwardId(c.slug));
            const viewedCount = userProgressDoc?.completedSections?.length ?? 0;
            const labAccounted = labPassed && !userProgressDoc?.completedSections?.includes(6);
            const completedCount = isCompleted
              ? 8
              : Math.min(8, viewedCount + (labAccounted ? 1 : 0));
            const progressPercent = isCompleted ? 100 : Math.round((completedCount / 8) * 100);

            const card = (
              <>
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest ${
                      isCompleted ? "text-[#ccff00] font-bold" : "text-[#8a8a8a]"
                    }`}
                  >
                    {c.category}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] px-3 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#080808] shadow-[0_0_15px_rgba(204,255,0,0.45)]">
                      <CheckCircle2 className="size-3 stroke-[2.5]" />
                      Completed
                    </span>
                  ) : open ? (
                    <span className="font-mono text-[10px] font-bold text-[#ccff00] bg-[#141a05] border border-[#ccff00]/30 px-2.5 py-0.5 rounded-full">
                      🔓 Available · {c.index}
                    </span>
                  ) : c.tier === "premium" ? (
                    <span className="font-mono text-[10px] font-bold text-[#f59e0b] bg-[#1f1505] border border-[#f59e0b]/30 px-2.5 py-0.5 rounded-full">
                      🔒 Premium Tier
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-bold text-[#8a8a8a] bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 rounded-full">
                      🔒 Locked (Sequential)
                    </span>
                  )}
                </div>

                <h2
                  className={`mt-3 text-balance text-lg font-bold tracking-tight transition-colors ${
                    isCompleted
                      ? "text-[#f5f5f5] group-hover:text-[#ccff00]"
                      : "text-[#f5f5f5] group-hover:text-[#ccff00]"
                  }`}
                >
                  {c.title}
                </h2>

                <p className="mt-2 text-pretty text-xs leading-relaxed text-[#b8b8b8] line-clamp-3">
                  {c.summary}
                </p>

                {/* Progress bar visual for completed & in-progress cases */}
                {isCompleted ? (
                  <div className="mt-4 space-y-1.5 rounded-2xl bg-black/40 border border-[#ccff00]/30 p-2.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-[#ccff00] font-bold flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Investigation Cleared
                      </span>
                      <span className="text-[#ccff00] font-extrabold">08 / 08 Sections</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#182608]">
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] shadow-[0_0_12px_rgba(204,255,0,0.6)]" />
                    </div>
                  </div>
                ) : completedCount > 0 ? (
                  <div className="mt-4 space-y-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-2.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-[#ccff00] font-medium">In Progress</span>
                      <span className="text-[#8a8a8a]">
                        {completedCount} / 08 Sections ({progressPercent}%)
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-lg px-2.5 py-0.5 font-mono text-[10px] font-medium border ${
                      isCompleted
                        ? "bg-[#182608] text-[#ccff00] border-[#ccff00]/30"
                        : (DIFFICULTY_TONES[c.learnerLevel] ?? "text-[#8a8a8a] border-white/10")
                    }`}
                  >
                    {c.learnerLevel}
                  </span>

                  <span className="rounded-lg bg-white/[0.03] border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-[#b8b8b8]">
                    {c.estimatedTime}
                  </span>

                  {c.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-[#f5f5f5]"
                    >
                      {t}
                    </span>
                  ))}

                  {isCompleted && (
                    <span className="rounded-lg bg-[#182608] border border-[#ccff00]/40 px-2 py-0.5 font-mono text-[10px] font-bold text-[#ccff00] ml-auto">
                      ✓ +30 RC
                    </span>
                  )}
                </div>

                {!open && (
                  <p
                    className={`mt-4 rounded-xl px-3 py-2 font-mono text-[11px] leading-relaxed border ${
                      c.tier === "premium"
                        ? "bg-[#1f1505] border-[#f59e0b]/40 text-[#f59e0b]"
                        : "bg-[#141a05] border-[#ccff00]/30 text-[#ccff00]"
                    }`}
                  >
                    {c.tier === "premium"
                      ? "🔒 Locked · Premium tier architecture study."
                      : "🔒 Locked · Complete preceding case study to unlock."}
                  </p>
                )}
              </>
            );

            if (isCompleted) {
              return (
                <Link
                  key={c.slug}
                  to="/cases/$slug"
                  params={{ slug: c.slug }}
                  className="relative overflow-hidden group block rounded-3xl p-6 transition-all border-2 border-[#ccff00]/60 bg-gradient-to-b from-[#182608]/95 via-[#101905]/95 to-[#080c03]/95 shadow-[0_0_35px_rgba(204,255,0,0.18)] hover:border-[#ccff00] hover:shadow-[0_0_50px_rgba(204,255,0,0.35)] hover:-translate-y-1"
                >
                  {card}
                </Link>
              );
            }

            return (
              <Link
                key={c.slug}
                to="/cases/$slug"
                params={{ slug: c.slug }}
                className={
                  open
                    ? "glass-panel group block rounded-3xl p-6 transition-all hover:border-[#ccff00]/40 hover:shadow-[0_20px_40px_rgba(204,255,0,0.12)] hover:-translate-y-1"
                    : "glass-panel group block rounded-3xl p-6 opacity-75 border-white/[0.06] hover:border-white/[0.15] transition-all"
                }
              >
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </AppChrome>
  );
}
