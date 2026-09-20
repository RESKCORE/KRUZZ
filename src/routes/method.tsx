import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { SECTION_LABELS } from "@/data/schema";

const TITLE = "The KRUZZ Method — Eight Sections per Case Study";
const DESCRIPTION =
  "How KRUZZ structures every case study: problem, system, principles, architecture, decisions, implementation, practice and reflection.";

export const Route = createFileRoute("/method")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: MethodPage,
});

const DETAIL: Record<string, { tone: string; text: string }> = {
  Discover: {
    tone: "bg-white border-2 border-black",
    text: "A real situation, and the dilemma an engineer is actually being asked to solve. No code yet.",
  },
  Understand: {
    tone: "bg-white border-2 border-black",
    text: "The path a request takes, described conceptually before any framework or syntax details.",
  },
  Principles: {
    tone: "bg-white border-2 border-black",
    text: "Each fundamental concept answers: what is it, why is it needed, where does it fit.",
  },
  Architecture: {
    tone: "bg-white border-2 border-black",
    text: "Progressive Mermaid diagrams of the components and how they communicate under load.",
  },
  Decisions: {
    tone: "bg-white border-2 border-black",
    text: "Technology plus reason plus trade-off — never a technology name on its own.",
  },
  Implementation: {
    tone: "bg-white border-2 border-black",
    text: "Progressive code through the implementation ladder, with every block explained in plain English.",
  },
  Practice: {
    tone: "bg-white border-2 border-black",
    text: "Graded challenges and an interactive CodeArena that test understanding over memorization.",
  },
  Reflection: {
    tone: "bg-white border-2 border-black",
    text: "Open engineering prompts where learners explain the system in their own words to build judgement.",
  },
};

function MethodPage() {
  return (
    <AppChrome>
      <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 text-black">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-black" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
            Pedagogical Engine
          </p>
        </div>
        <h1 className="mt-2 max-w-[26ch] text-balance text-3xl font-black tracking-tight text-black md:text-4xl">
          Every case runs the same eight moves.
        </h1>
        <p className="mt-3 max-w-[58ch] text-pretty text-sm leading-relaxed text-neutral-600 font-medium">
          The sequence is intentional. Understanding comes before architecture, architecture before
          technology, technology before code, and code before independent construction.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SECTION_LABELS.map((label, i) => {
            const d = DETAIL[label];
            return (
              <div
                key={label}
                className={`rounded-3xl p-6 shadow-xs transition-all hover:bg-neutral-50 ${d?.tone}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-black uppercase tracking-widest text-black">
                    STEP {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="size-1.5 rounded-full bg-black/30" />
                </div>
                <p className="mt-2 text-xl font-black tracking-tight text-black">{label}</p>
                <p className="mt-2 text-pretty text-[13px] leading-relaxed text-neutral-600 font-medium">
                  {d?.text}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-3xl p-8 border-2 border-black bg-white shadow-xs">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
            The Learning Objective
          </p>
          <p className="mt-3 max-w-[52ch] text-balance text-2xl font-black leading-snug tracking-tight text-black">
            Move from &ldquo;I know how to write this code&rdquo; to &ldquo;I understand why this
            system needs this code.&rdquo;
          </p>
          <Link
            to="/cases"
            className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-xs font-black text-white hover:bg-neutral-800 border-2 border-black shadow-xs transition-all hover:-translate-y-px"
          >
            Explore Case Investigations →
          </Link>
        </div>
      </div>
    </AppChrome>
  );
}
