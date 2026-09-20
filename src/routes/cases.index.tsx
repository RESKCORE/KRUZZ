import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import {
  isUnlocked,
  unlockThreshold,
  caseAwardId,
  labAwardId,
  isStudyComplete,
  getCaseStudyRc,
} from "@/lib/rc";
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
  Explorer: "bg-white text-black border-2 border-black",
  Builder: "bg-white text-black border-2 border-black",
  Engineer: "bg-white text-black border-2 border-black font-bold",
};

function Library() {
  const [active, setActive] = useState("All");
  const { points, has, isAuthenticated, awards } = useWallet();
  const cloudProgress = useQuery(
    api.caseProgress.getAllUserProgress,
    isAuthenticated ? {} : "skip",
  );
  const unlockedCases = useQuery(api.caseProgress.getUserUnlockedCases, {});

  const allDbCases = (useQuery(api.caseStudies.list, {}) ?? []) as any[];
  const dbCases = (useQuery(api.caseStudies.list, active === "All" ? {} : { category: active }) ??
    []) as any[];

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
              <span className="size-2.5 rounded-full bg-black ring-2 ring-black/20" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
                Investigation Deck
              </p>
            </div>
            <h1 className="text-balance text-3xl font-black tracking-tight text-black mt-1.5 md:text-4xl">
              Explore the Investigations
            </h1>
            <p className="mt-2 max-w-[56ch] text-pretty text-sm leading-relaxed text-black font-medium">
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
                      ? "rounded-xl bg-black px-3.5 py-1.5 font-mono text-xs font-black text-white border-2 border-black shadow-xs"
                      : "rounded-xl bg-white border-2 border-black px-3.5 py-1.5 font-mono text-xs font-black text-black hover:bg-neutral-100 transition-all shadow-xs"
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
          <div className="glass-panel rounded-3xl p-5 border-2 border-black bg-white text-black shadow-xs">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <p className="font-mono text-xs uppercase tracking-wider text-black font-black">
                Reasoning Credit (RC) Rules
              </p>
              <span className="font-mono text-[10px] text-black font-black">GAMIFIED PROGRESS</span>
            </div>
            <ul className="mt-3.5 grid gap-2.5 text-xs leading-relaxed text-black font-medium sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="text-black font-black underline">+20 RC</span>
                <span>Beginner Case complete (100% path)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black font-black underline">+30 RC</span>
                <span>Medium Case complete (100% path)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black font-black underline">+50 RC</span>
                <span>Advanced Case complete (100% path)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black font-black underline">Path Rule</span>
                <span>All 8 steps required (reading + lab + reflection)</span>
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
                      isCompleted ? "text-black font-black" : "text-black font-bold"
                    }`}
                  >
                    {c.category}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black border-2 border-black px-3 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                      <CheckCircle2 className="size-3 stroke-[2.5]" />
                      Completed
                    </span>
                  ) : open ? (
                    <span className="font-mono text-[10px] font-black text-black bg-neutral-100 border-2 border-black px-2.5 py-0.5 rounded-full">
                      🔓 Available · {c.index}
                    </span>
                  ) : c.tier === "premium" ? (
                    <span className="font-mono text-[10px] font-black text-black bg-neutral-100 border-2 border-black px-2.5 py-0.5 rounded-full">
                      🔒 Premium Tier
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-black text-black bg-white border-2 border-black px-2.5 py-0.5 rounded-full">
                      🔒 Locked (Sequential)
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-balance text-lg font-black tracking-tight text-black group-hover:underline transition-colors">
                  {c.title}
                </h2>

                <p className="mt-2 text-pretty text-xs leading-relaxed text-black font-medium line-clamp-3">
                  {c.summary}
                </p>

                {/* Progress bar visual for completed & in-progress cases */}
                {isCompleted ? (
                  <div className="mt-4 space-y-1.5 rounded-2xl bg-neutral-100 border-2 border-black p-2.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-black font-black flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Investigation Cleared
                      </span>
                      <span className="text-black font-black">08 / 08 Sections</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 border border-black">
                      <div className="h-full w-full rounded-full bg-black" />
                    </div>
                  </div>
                ) : completedCount > 0 ? (
                  <div className="mt-4 space-y-1.5 rounded-2xl bg-neutral-50 border-2 border-black p-2.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-black font-black">In Progress</span>
                      <span className="text-black font-bold">
                        {completedCount} / 08 Sections ({progressPercent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 border border-black">
                      <div
                        className="h-full rounded-full bg-black"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-lg px-2.5 py-0.5 font-mono text-[10px] font-black border-2 border-black bg-white text-black">
                    {c.learnerLevel}
                  </span>

                  <span className="rounded-lg bg-white border-2 border-black px-2 py-0.5 font-mono text-[10px] font-black text-black">
                    {c.estimatedTime}
                  </span>

                  {(c.tech ?? []).map((t: string) => (
                    <span
                      key={t}
                      className="rounded-lg bg-white border-2 border-black px-2 py-0.5 font-mono text-[10px] font-bold text-black"
                    >
                      {t}
                    </span>
                  ))}

                  {isCompleted ? (
                    <span className="rounded-lg bg-black text-white border-2 border-black px-2 py-0.5 font-mono text-[10px] font-black ml-auto">
                      ✓ +{getCaseStudyRc(c.difficulty)} RC
                    </span>
                  ) : (
                    <span className="rounded-lg bg-white border-2 border-black px-2 py-0.5 font-mono text-[10px] font-black text-black ml-auto">
                      +{getCaseStudyRc(c.difficulty)} RC
                    </span>
                  )}
                </div>

                {!open && (
                  <p className="mt-4 rounded-xl px-3 py-2 font-mono text-[11px] leading-relaxed border-2 border-black bg-neutral-100 text-black font-black">
                    {c.tier === "premium"
                      ? "🔒 Locked · Premium tier architecture study."
                      : "🔒 Locked · Complete preceding case study to unlock."}
                  </p>
                )}
              </>
            );

            if (!isAuthenticated) {
              return (
                <Link
                  key={c.slug}
                  to="/sign-in"
                  search={{ redirect: `/cases/${c.slug}` }}
                  className="glass-panel group block rounded-3xl p-6 transition-all border-2 border-black bg-white text-black shadow-xs hover:bg-neutral-50 hover:-translate-y-1"
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
                className="glass-panel group block rounded-3xl p-6 transition-all border-2 border-black bg-white text-black shadow-xs hover:bg-neutral-50 hover:-translate-y-1"
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
