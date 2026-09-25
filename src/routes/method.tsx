import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  GraduationCap,
  Layers,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

const TITLE = "How KRUZZ Works — The 8-Section System Architecture Method";
const DESCRIPTION =
  "Explore how KRUZZ reverse-engineers 59 real-world distributed systems: from production incidents to progressive architecture, FAANG interview badges, dual-language CodeLabs, and university leaderboards.";

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

const EIGHT_STEPS = [
  {
    step: "01",
    label: "Discover",
    tagline: "The Outage or Crisis",
    icon: AlertTriangle,
    description:
      "Every case study starts with a high-stakes real-world production dilemma—a Black Friday inventory oversell, an unredacted PII streaming leak, or a database lock freeze. No technical jargon or framework buzzwords yet; only the human dilemma an engineer must resolve.",
    keyBenefit: "Builds problem-first mental framing over syntax memorization.",
  },
  {
    step: "02",
    label: "Understand",
    tagline: "The Conceptual Request Flow",
    icon: Compass,
    description:
      "Trace the end-to-end journey of a request from client to origin. Every architectural actor is dissected through three simple questions: What is it? Why does it exist? What breaks if it fails?",
    keyBenefit: "Isolates core responsibilities before committing to frameworks.",
  },
  {
    step: "03",
    label: "Principles",
    tagline: "Invariant Computer Science Laws",
    icon: Scale,
    description:
      "Deep dive into non-negotiable computer science laws—CAP & PACELC tradeoffs, Lamport logical clocks, Merkle hash trees, and bounded latency budgets. Illustrated with intuitive real-world analogies and mathematical limits.",
    keyBenefit: "Grounds design intuition in timeless fundamental laws.",
  },
  {
    step: "04",
    label: "Architecture",
    tagline: "3-Level Progressive Blueprints",
    icon: Layers,
    description:
      "Systems are never shown as overwhelming monolithic dumps. Instead, progressive Mermaid diagrams evolve through three distinct stages: Level 1 (Single-Node Foundation) → Level 2 (Scale & Sharding) → Level 3 (Production Resilience & Circuit Breakers).",
    keyBenefit: "Teaches evolutionary architecture and bottleneck diagnosis.",
  },
  {
    step: "05",
    label: "Decisions",
    tagline: "Structured Trade-off Matrices",
    icon: Zap,
    description:
      "Real senior engineering is choosing what to optimize and what to sacrifice. Every design choice features structured comparisons: chosen solution vs. discarded alternatives, operational complexity, and failure blast radius.",
    keyBenefit: "Prepares you to defend architectural decisions in interview rounds.",
  },
  {
    step: "06",
    label: "Implementation",
    tagline: "Step-by-Step Code Ladder",
    icon: Code2,
    description:
      "Progress from abstract architecture to working code. A language-independent algorithm unfolds into a multi-rung implementation ladder with annotated blocks, edge case treatments, and invariant validations.",
    keyBenefit: "Connects high-level system boxes directly to executable code.",
  },
  {
    step: "07",
    label: "Practice",
    tagline: "Multi-Dimensional Challenges",
    icon: Cpu,
    description:
      "Four levels of engineering depth: Understand (dilemma diagnosis), Modify (adjust parameters for load), Build (add resilient fallbacks), and Think (scale to 100x traffic).",
    keyBenefit: "Tests depth of reasoning rather than rote flashcard recall.",
  },
  {
    step: "08",
    label: "Reflection & Lab",
    tagline: "Live Dual-Language CodeArena",
    icon: ShieldCheck,
    description:
      "Prove mastery by implementing the core algorithm in Python or Java directly in the browser. Run live unit test assertions and submit your reasoning defense for evaluation against strict rubrics.",
    keyBenefit: "Validates both algorithmic execution and articulation ability.",
  },
];

const CURRICULUM_TRACKS = [
  {
    name: "Track 0: Machine Coding & Foundations (OOP)",
    cases: "Cases 01 – 07",
    tier: "Free Tier",
    badge: "Campus Ready",
    focus:
      "ATM Machine, Library Management, Parking Lot, Vending Machine, Seat Booking, Inventory Stock.",
    target:
      "SDE 1 Machine Coding & LLD rounds at Uber, Swiggy, Amazon, and campus placement drives.",
  },
  {
    name: "Track 1: Web Systems & Edge Delivery",
    cases: "Cases 08 – 12",
    tier: "Premium",
    badge: "Core Infra",
    focus: "Client-Server, DNS Resolution, Image CDN, E-Commerce Checkout, Search Autocomplete.",
    target:
      "System Design rounds: low-latency caching, HTTP/3, and edge point-of-presence routing.",
  },
  {
    name: "Track 2: Security & Cryptographic Identity",
    cases: "Cases 13 – 17",
    tier: "Premium",
    badge: "Zero-Trust",
    focus:
      "Authentication Tokens, Password Hashing (Argon2id), API Key Vaults, TOTP RFC 6238, Cookie Flags.",
    target:
      "Security & Auth rounds: zero-trust perimeter defense and session hijacking mitigation.",
  },
  {
    name: "Track 3: Distributed Data & Storage",
    cases: "Cases 18 – 21",
    tier: "Premium",
    badge: "Persistence",
    focus:
      "URL Shortener (Base62), In-Memory Cache (LRU), Database B+ Tree Indexing, Cloud Data Deduplication.",
    target:
      "Data platform rounds: storage engine indexing, cache stampede locks, and hash chunking.",
  },
  {
    name: "Track 4: Realtime Systems & Streaming",
    cases: "Cases 22 – 25",
    tier: "Premium",
    badge: "Streaming",
    focus:
      "Real-Time WebSocket Chat, Push Notification Pipelines, Gaming Live Leaderboard, Webhooks.",
    target:
      "Concurrency & State rounds: persistent socket fanout, dead-letter queues, and Redis ZSETs.",
  },
  {
    name: "Track 5: Reliability, Resiliency & Scale",
    cases: "Cases 26 – 30",
    tier: "Premium",
    badge: "Resilience",
    focus:
      "Distributed API Rate Limiting, Background Job Queues, Circuit Breakers, Health Probes, Idempotent Payments.",
    target:
      "Site Reliability & Distributed Systems: poison-pill retries, distributed locks, and graceful degradation.",
  },
  {
    name: "Track 6: Advanced Distributed Architectures & Consensus",
    cases: "Cases 31 – 35",
    tier: "Premium",
    badge: "Consensus",
    focus:
      "Two-Phase Commit (2PC), Partitioned Event Logs (Kafka), Consistent Hashing Ring, Raft Consensus, Quorum Math.",
    target:
      "Senior Distributed Systems rounds: split-brain defense, tunable consistency (R+W > N), and leader leases.",
  },
  {
    name: "Track 7: Campus & Explorer LLD (Placement & Machine Coding)",
    cases: "Cases 36 – 40",
    tier: "Free Tier",
    badge: "Campus Ready",
    focus:
      "Attendance & Timetable Tracker, Campus Placement Portal, Splitwise Expense Splitter, Online Chess, Ticket Router.",
    target: "College placement drives and entry-level SDE 1 machine coding interviews (100% Free).",
  },
  {
    name: "Track 8: Scalable Web & Edge Platform Services",
    cases: "Cases 41 – 50",
    tier: "Premium",
    badge: "Platform Scale",
    focus:
      "MCQ Proctoring, Geospatial Tinder Matcher, Slack Threads, Fleet Telemetry, Anycast Proxy, Bot Defense, Video Pipeline.",
    target:
      "Platform engineering: Geohashing, BGP Anycast routing, PoW defense, and HLS video transcoding.",
  },
  {
    name: "Track 9: Advanced Distributed AI, Ledgers & CRDTs",
    cases: "Cases 51 – 59",
    tier: "Premium",
    badge: "Cutting-Edge",
    focus:
      "LLM Streaming Gateway, Vector DB & RAG, Google Sheets CRDT, Notion Offline Sync, APM Tracing, Virtual Git, Ledger.",
    target:
      "Staff Engineer & AI Infra rounds: sliding guardrails, HNSW vector search, vector clocks, and double-entry accounting.",
  },
];

const FEATURED_EMPLOYERS = [
  "Google",
  "Meta",
  "Amazon",
  "Apple",
  "Netflix",
  "Microsoft",
  "Stripe",
  "OpenAI",
  "Datadog",
  "Slack",
  "Discord",
  "Uber",
  "Snowflake",
  "Bloomberg",
  "Cloudflare",
  "GitHub",
  "Pinecone",
];

function MethodPage() {
  return (
    <AppChrome>
      <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6 text-black space-y-16">
        {/* 1. Hero Banner */}
        <section className="rounded-3xl border-2 border-black bg-white p-8 md:p-12 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="size-2.5 rounded-full bg-black ring-2 ring-black/20" />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
              Pedagogical Engine · The KRUZZ Standard
            </p>
          </div>
          <h1 className="mt-3 text-balance text-3xl md:text-5xl font-black tracking-tight text-black leading-tight max-w-[28ch]">
            How KRUZZ Works: Reverse-Engineering Real-World Architecture
          </h1>
          <p className="mt-4 max-w-[68ch] text-pretty text-base leading-relaxed text-neutral-700 font-medium">
            Traditional programming education starts with syntax in a vacuum. When students
            encounter real-world system design interviews or production outages, they face a
            cognitive cliff. KRUZZ reverses the starting point: every case starts with a production
            incident, moves through progressive Mermaid blueprints, explores trade-off decisions,
            and concludes with a dual-language test-driven CodeArena.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/cases"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3.5 text-xs font-black text-white hover:bg-neutral-800 border-2 border-black shadow-xs transition-all hover:-translate-y-px"
            >
              Explore 59 Case Studies <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/cases"
              search={{ category: "Foundations (OOP)" }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-black text-black hover:bg-neutral-100 border-2 border-black shadow-xs transition-all hover:-translate-y-px"
            >
              🎓 Try Track 0: Machine Coding (Free)
            </Link>
          </div>
        </section>

        {/* 2. Visual Architecture Reasoning Chain */}
        <section className="rounded-3xl border-2 border-black bg-white p-8 shadow-xs">
          <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
                Cognitive Progression
              </p>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-black mt-1">
                The 5-Stage Reasoning Chain
              </h2>
            </div>
            <span className="hidden sm:inline-flex font-mono text-xs text-neutral-600 font-bold bg-neutral-100 px-3 py-1.5 rounded-lg border border-black/20">
              Shift from Syntax to Judgment
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              {
                num: "01",
                label: "Incident Dilemma",
                tag: "Real Outage / Scale Crisis",
                color: "bg-red-50 text-red-950 border-red-900/30",
              },
              {
                num: "02",
                label: "System Roles",
                tag: "Conceptual Request Flow",
                color: "bg-amber-50 text-amber-950 border-amber-900/30",
              },
              {
                num: "03",
                label: "Progressive Blueprint",
                tag: "3-Level Mermaid Diagrams",
                color: "bg-blue-50 text-blue-950 border-blue-900/30",
              },
              {
                num: "04",
                label: "Trade-Off Matrix",
                tag: "Chosen vs Discarded",
                color: "bg-purple-50 text-purple-950 border-purple-900/30",
              },
              {
                num: "05",
                label: "CodeArena & Tests",
                tag: "Python & Java Verification",
                color: "bg-emerald-50 text-emerald-950 border-emerald-900/30",
              },
            ].map((chain) => (
              <div
                key={chain.num}
                className={`rounded-2xl border-2 p-4 flex flex-col justify-between shadow-xs ${chain.color}`}
              >
                <div>
                  <span className="font-mono text-xs font-black tracking-wider opacity-70">
                    STAGE {chain.num}
                  </span>
                  <p className="font-black text-sm mt-1">{chain.label}</p>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wide opacity-80 mt-3">
                  {chain.tag}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. The Eight Moves Grid */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-black" />
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
                  The Investigation Framework
                </p>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-black mt-1">
                Every Case Follows the Same 8 Structured Moves
              </h2>
            </div>
            <p className="text-xs text-neutral-600 font-bold font-mono">
              8 Sections · Verified by Convex Quality Gate
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EIGHT_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="rounded-3xl border-2 border-black bg-white p-6 shadow-xs flex flex-col justify-between transition-all hover:bg-neutral-50 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-black">STEP {s.step}</span>
                      <div className="size-8 rounded-xl border border-black/20 bg-neutral-100 flex items-center justify-center">
                        <Icon className="size-4 text-black" />
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-black mt-3">{s.label}</h3>
                    <p className="font-mono text-[11px] font-bold text-neutral-600 uppercase tracking-wide mt-0.5">
                      {s.tagline}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-neutral-700 font-medium">
                      {s.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/10">
                    <p className="text-[11px] text-black font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-black shrink-0" />
                      {s.keyBenefit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. The 59 Case Curriculum Tracks */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-black" />
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
                  Comprehensive Curriculum
                </p>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-black mt-1">
                59 Case Studies Across 10 Structured Tracks
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black text-white text-[10px] font-mono px-3 py-1 font-black">
                12 Free Tier Cases
              </span>
              <span className="rounded-full bg-neutral-200 text-black text-[10px] font-mono px-3 py-1 font-black">
                47 Premium Tier Cases
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {CURRICULUM_TRACKS.map((track) => (
              <div
                key={track.name}
                className="rounded-3xl border-2 border-black bg-white p-5 shadow-xs flex flex-col justify-between hover:bg-neutral-50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-black">{track.cases}</span>
                    <span
                      className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        track.tier === "Free Tier"
                          ? "bg-black text-white border-black"
                          : "bg-neutral-100 text-black border-black/30"
                      }`}
                    >
                      {track.tier}
                    </span>
                  </div>
                  <h3 className="font-black text-sm text-black mt-2">{track.name}</h3>
                  <p className="mt-2 text-xs text-neutral-600 font-medium leading-relaxed">
                    <strong>Focus:</strong> {track.focus}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-700 font-semibold truncate max-w-[34ch]">
                    🎯 {track.target}
                  </span>
                  <span className="font-mono text-[10px] font-black text-black shrink-0">
                    {track.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Company & Interview Badges */}
        <section className="rounded-3xl border-2 border-black bg-white p-8 md:p-10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-black" />
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
                  Interview Round Alignment
                </p>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-black mt-1">
                Real Interview Rounds at Tier-1 Employers
              </h2>
            </div>
            <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-xl border border-black/20">
              Targeted for SDE 1, SDE 2 & Senior Systems
            </span>
          </div>

          <p className="text-sm text-neutral-700 leading-relaxed font-medium max-w-[70ch]">
            Every single case study displays the specific interview round type and the top tech
            companies where the problem is frequently tested. Filter the catalog by company or round
            to prepare precisely for your upcoming interviews:
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {FEATURED_EMPLOYERS.map((comp) => (
              <span
                key={comp}
                className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-black bg-white text-black shadow-2xs hover:bg-black hover:text-white transition-colors cursor-default"
              >
                {comp}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t-2 border-black/10">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-black/20">
              <h4 className="font-black text-xs text-black">🧩 Machine Coding (LLD)</h4>
              <p className="text-xs text-neutral-600 mt-1 font-medium">
                Object-oriented design, state machine models, and thread-safe collections.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-black/20">
              <h4 className="font-black text-xs text-black">📐 High-Level System Design</h4>
              <p className="text-xs text-neutral-600 mt-1 font-medium">
                Global CDN caching, Anycast routing, shard rings, and streaming pipelines.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-black/20">
              <h4 className="font-black text-xs text-black">🪐 Concurrency & Consensus</h4>
              <p className="text-xs text-neutral-600 mt-1 font-medium">
                CRDTs, Vector Clocks, Raft leader election, and double-entry accounting ledgers.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Dual-Language CodeArena & Campus Leaderboard */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dual-Language CodeArena */}
          <div className="rounded-3xl border-2 border-black bg-white p-8 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-black" />
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
                  In-Browser CodeArena
                </p>
              </div>
              <h3 className="text-xl font-black tracking-tight text-black mt-2">
                Python & Java Interactive Test Assertion Sandbox
              </h3>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium mt-3">
                Solve realistic algorithmic core components in either Python or Java. Your code is
                tested against live deterministic unit test assertions right in the browser. When
                you submit, our multi-provider AI review verifies your engineering rationale.
              </p>
            </div>
            <div className="rounded-2xl border border-black/20 bg-neutral-50 p-4 font-mono text-[11px] text-neutral-800 space-y-1">
              <p className="text-black font-bold">// Runnable starter code & full types</p>
              <p>✔ Python 3.12 via Pyodide WebAssembly</p>
              <p>✔ Modern Java 21 Class Solution Scaffold</p>
              <p>✔ Automated Multi-Case Test Suite Verification</p>
            </div>
          </div>

          {/* Campus Placement & University Leaderboard */}
          <div className="rounded-3xl border-2 border-black bg-white p-8 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-black" />
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
                  University Placements
                </p>
              </div>
              <h3 className="text-xl font-black tracking-tight text-black mt-2">
                Campus Placement Ready & University Leaderboards
              </h3>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium mt-3">
                All 12 foundational machine coding cases (Track 0 & Track 7) are 100% free forever.
                Compete with your university classmates on the dedicated Campus Leaderboard filter
                and build an unassailable proof-of-work portfolio.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-4 py-2.5 text-xs font-black hover:bg-neutral-800 transition-colors"
              >
                <Trophy className="size-3.5" /> View University Leaderboard
              </Link>
              <Link
                to="/cases"
                search={{ category: "Foundations (OOP)" }}
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 text-black border border-black/30 px-4 py-2.5 text-xs font-black hover:bg-neutral-200 transition-colors"
              >
                Start Track 0
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Bottom Call to Action */}
        <section className="rounded-3xl border-2 border-black bg-black text-white p-8 md:p-12 shadow-sm text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-mono text-[11px] text-white">
            <Sparkles className="size-3.5" />
            <span>59 Real-World Investigations Ready in DB</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-balance max-w-[26ch] mx-auto leading-tight">
            Stop memorizing syntax. Start building system judgment.
          </h2>
          <p className="text-sm text-neutral-300 max-w-[55ch] mx-auto font-medium">
            Jump into Case 01 to model your first state machine, or take on Advanced Distributed AI
            gateways and event-sourced ledgers.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/cases"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-6 py-3.5 text-xs font-black hover:bg-neutral-100 transition-all hover:-translate-y-px"
            >
              Enter Investigation Deck →
            </Link>
            <Link
              to="/cases/$slug"
              params={{ slug: "atm-machine" }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 text-white px-6 py-3.5 text-xs font-black hover:bg-white/20 transition-all hover:-translate-y-px"
            >
              Start Case 01: ATM Machine
            </Link>
          </div>
        </section>
      </div>
    </AppChrome>
  );
}
