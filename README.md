<p align="center">
  <img src="public/logo.png" alt="KRUZZ Logo" width="160" style="border-radius: 24px;" />
</p>

<h1 align="center">KRUZZ</h1>

<p align="center">
  <strong>Real-World System Architecture Case Studies</strong><br>
  From a real-world problem to engineering understanding, visual architecture, implementation, and independent problem solving.
</p>

<p align="center">
  <a href="https://kruzz.indevs.in"><strong>🌐 Live App: kruzz.indevs.in</strong></a> •
  <a href="#what-is-kruzz">Overview</a> •
  <a href="#case-study-catalog">Case Studies</a> •
  <a href="#the-eight-section-case-study-method">The 8-Section Method</a> •
  <a href="#technical-stack">Tech Stack</a>
</p>

---

## What is KRUZZ?

KRUZZ is an interactive learning platform designed to help students understand how real-world software and technology systems work. Instead of beginning with isolated syntax, the learning journey starts with a real problem and progressively connects that problem to engineering principles, architecture, implementation decisions, code, and independent practice.

The platform is not another course library. Its purpose is to reduce the gap between "I know a programming concept" and "I understand why this concept is needed in a real system."

### Core Promise

Students move through a complete learning journey:

| Starting Point                  | Target Outcome                                                           |
| ------------------------------- | ------------------------------------------------------------------------ |
| "I know if/else and loops."     | "I understand where conditions and loops fit into a real system."        |
| "I copied an API example."      | "I understand what an API is and why the system needs one."              |
| "I know class syntax."          | "I understand why a class/object can represent a system responsibility." |
| "I can reproduce the tutorial." | "I can design a similar solution independently."                         |

---

## Learning Philosophy

Traditional learning follows: `Concept → Syntax → Exercises → Project`

**KRUZZ reverses the starting point:**

`Real-World Problem → Context → System Understanding → Engineering Principles → Design Decisions → Step-by-Step Implementation → Guided Practice → Independent Solution → Reflection`

The student repeatedly answers three questions:

- **What problem are we solving?**
- **Why does this engineering choice exist?**
- **How can I implement it myself?**

---

## The Eight-Section Case Study Method

Every case study follows a consistent structure:

### 01 — Discover the Problem

Introduce the real-world situation before technical jargon. Example: "When you open a website and ask to see your profile, your computer needs information that exists somewhere else. How does your computer ask for it?"

### 02 — Understand the System

Explain each component using: What is it? → Why does it exist? → What does it do?

### 03 — Engineering Principles

Introduce concepts with: Simple definition → Why needed → Real-world analogy → Technical explanation → Case application → Common mistakes → Practice

### 04 — Architecture Visualization

Progressive Mermaid diagrams from basic mental models to complete system flows. Architecture is revealed level by level, not dumped as a large enterprise diagram.

### 05 — Engineering Decisions

Explain why technologies, patterns, libraries, or approaches are selected. Every decision answers: WHAT? → WHY? → WHAT PROBLEM DOES IT SOLVE? → WHAT HAPPENS WITHOUT IT? → ALTERNATIVES? → TRADE-OFFS?

### 06 — Implementation

Build the solution step-by-step with explanations before and after important code sections. Implementation follows a ladder: Understand behavior → Language-independent algorithm → Basic logic → Functions → Classes when needed → Actual framework → Trade-offs

### 07 — Practice

Move from understanding to modification to independent construction:

- **Understand**: Check conceptual understanding
- **Modify**: Change an existing solution
- **Build**: Construct from requirements
- **Think**: Explore consequences

### 08 — Reflection

Learners explain the system and their decisions in their own words. Not a final quiz—active articulation of understanding.

---

## Case Study Catalog

### Available Cases

| Case                                    | Core Concepts                                          | Difficulty   |
| --------------------------------------- | ------------------------------------------------------ | ------------ |
| **How Does a Client Talk to a Server?** | Client, server, request, response, URL, API, functions | Beginner     |
| **How Does Authentication Work?**       | Users, hashing, tokens, sessions, authorization        | Intermediate |
| **How Does a URL Shortener Work?**      | APIs, databases, ID generation, redirects, caching     | Intermediate |
| **How Does a Real-Time Chat App Work?** | WebSockets, messages, real-time communication, fan-out | Intermediate |
| **How Does Rate Limiting Work?**        | Requests, counters, time windows, Redis, reliability   | Advanced     |

### Recommended Learning Path

The learning graph builds cumulatively:

```
Case 01: Client + Server + API
    ↓
Case 02: + Identity + Tokens
    ↓
Case 03: + Database + Cache
    ↓
Case 04: + Real-time + Fan-out
    ↓
Case 05: + Reliability + Limits
```

---

## Target Learner

**Primary audience**: First-year B.Tech students with basic programming exposure.

**Minimum assumed knowledge**:

- Variables and basic data types
- Input/output
- if/else conditions
- Basic for/while loops
- Simple functions

**Knowledge NOT assumed**:

- OOP, classes, and objects
- HTTP, networking, and client-server architecture
- APIs and endpoints
- Databases
- Authentication and authorization
- Caching, queues, WebSockets, cloud, or system design

If a case needs one of these concepts, it introduces the concept before relying on it.

---

## Technical Stack

### Frontend

- **TanStack Start** — Full-stack React framework
- **React 19** — UI components
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **Mermaid** — Architecture diagrams
- **Radix UI** — Accessible component primitives

### Backend & Infrastructure

- **TanStack Router** — Type-safe routing
- **TanStack Query** — Server state management
- **localStorage** — Client-side data persistence

### Key Features

- Interactive Mermaid diagram rendering
- Code arena with live testing
- Progress tracking per section
- Concept mastery tracking
- AI-powered learning assistance

---

## Project Structure

```
convex/
├── ai.ts                      # Multi-provider AI grading engine (Gemini, Groq, OpenRouter)
├── caseStudies.ts             # Curriculum data & progression queries
├── caseProgress.ts            # Section progression & lab tracking
├── streaks.ts                 # Timezone-safe daily login streaks
└── schema.ts                  # Convex database schema

src/
├── components/
│   ├── AppChrome.tsx          # Adaptive top navigation & user status
│   ├── CodeArena.tsx          # Interactive coding workspace & AI grader
│   ├── MermaidDiagram.tsx     # Progressive architecture visualization
│   ├── RCWallet.tsx           # Reasoning Credits (RC) balance & rank
│   └── StreakStrip.tsx        # Visual streak indicator
├── data/
│   └── schema.ts              # Canonical Case Study TypeScript schemas
├── lib/
│   ├── rc.ts                  # RC economy, ranks, and completion predicates
│   └── utils.ts               # Tailwind class merge utility
└── routes/
    ├── cases.$slug.tsx        # 8-section case study workspace
    ├── cases.index.tsx        # Case study catalog & unlock gate
    ├── dashboard.tsx          # User progress dashboard
    └── profile.tsx            # User profile, streak, & rank ladder
```

---

## Data Schema

Each case study follows the SRS-defined schema:

```typescript
type CaseStudy = {
  // Metadata (filterable, searchable)
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  learnerLevel: LearnerLevel;
  estimatedTime: string;
  learningObjectives: string[];
  prerequisites: string[];
  engineeringConcepts: string[];
  technologies: string[];

  // Educational body (eight sections)
  discover: { situation; humanFlow; question; whyItExists };
  understand: { overview; components; analogy; flow };
  concepts: Concept[];
  architecture: { caption; levels: DiagramLevel[] };
  decisions: Decision[];
  implementation: { behaviour; algorithm; ladder; samples };
  practice: Exercise[];
  reflection: string[];
};
```

---

## Development

### Prerequisites

- Node.js (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or bun

### Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd RCA

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run format   # Format with Prettier
```

---

## Content Authoring

### Workflow

```
Topic → Research → Source Collection → Technical Understanding →
Structured Draft → Diagram Design → Implementation Design →
Practice Design → Technical Review → Beginner Clarity Review → Publish
```

### Quality Standards

| Dimension              | Requirement                                      |
| ---------------------- | ------------------------------------------------ |
| Technical accuracy     | Engineering claims and code must be correct      |
| Beginner clarity       | First-year learner should follow the explanation |
| Engineering reasoning  | Important choices must explain why they exist    |
| Visual clarity         | Diagrams reduce cognitive load, not decoration   |
| Implementation clarity | Code explained progressively                     |
| Practice quality       | Learners modify and build, not only answer MCQs  |
| Independent thinking   | Case ends with design/explain opportunity        |

### Authoring Rules

1. Start with the real-world problem
2. Use simple language before technical terminology
3. Never assume unexplained knowledge
4. Explain why a concept is needed before implementation
5. Use diagrams whenever relationships or flows are involved
6. Explain every important diagram component
7. Never dump unexplained code
8. Explain why each technology/library is used
9. Explain alternatives when educationally relevant
10. Give learners an independent build opportunity
11. Ask learners to explain their own understanding
12. Optimize for understanding, not lesson brevity

---

## AI Learning Assistant

AI acts as an engineering mentor, not an answer vending machine:

- Ask guiding questions before revealing solutions
- Simplify explanations without removing technical correctness
- Review student code against requirements
- Identify conceptual gaps
- Compare alternative approaches
- Generate targeted practice
- Review written explanations

**Core rule**: AI should increase the learner's thinking, not replace it.

---

## Validation Strategy

1. **Founding Cohort**: 10–20 students from the college/branch
2. **Beta Access**: Small number of high-quality case studies
3. **Observe Behavior**: Completion, time spent, practice attempts, return rate
4. **Collect Feedback**: What helped, what was unclear, what to change
5. **Social Proof**: Learners share honest experience
6. **Iterate**: Improve before expanding
7. **Paid Validation**: Affordable premium after demonstrated value

**Success metrics**: Learners complete cases, attempt independent challenges, return for more, and recommend voluntarily.

---

## Business Model

**Freemium approach for early validation**:

- **Free Arena**: Selected introductory case studies
- **Premium Arena**: Advanced cases, full learning paths, deeper implementations, enhanced AI feedback
- **Learning Paths**: Curated collections (Backend Engineering, AI Engineering, Full-Stack Systems, Data Engineering)
- **Campus Cohorts**: Affordable group access for early adoption

---

## Long-Term Positioning

KRUZZ competes on depth and clarity of each learning journey, not the number of courses.

**Positioning statement**:

> KRUZZ helps students understand how real-world systems work, why engineering decisions are made, and how to translate those decisions into working code.

**Final principle**:

> "Never teach a student how to write code without first helping them understand why that code needs to exist."

---

## Documentation

- `RC_Arena_Product_Architecture.pdf` — Complete product concept, platform architecture, and business model
- `RC_Arena_Detailed_Case_Study_Content_Schema_SRS.pdf` — Educational content architecture specification

---

## Built With

- [TanStack Start](https://tanstack.com/start)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Mermaid](https://mermaid.js.org)

---

## Production Deployment Guide

KRUZZ is built on **TanStack Start** with a **Nitro** server engine and a **Convex** real-time serverless backend.

### 1. Pre-Deployment Verification

Before pushing to production, run the comprehensive verification pipeline:

```bash
npm run verify
```

This single gate validates:

- `tsc --noEmit` (TypeScript types)
- `eslint .` (Code quality & rules)
- `prettier --check .` (Formatting)
- `npm test` (All 90 end-to-end and unit test invariants)
- `npm run build` (Client + SSR + Nitro production bundles)

### 2. Backend Deployment (Convex)

Deploy your Convex functions, schemas, and migrations to production:

```bash
npx convex deploy
```

Then configure your production environment variables in Convex:

```bash
# Clerk JWT configuration
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-instance>.clerk.accounts.dev

# AI Grading Providers (free tier keys)
npx convex env set GEMINI_API_KEY <your-gemini-key>
npx convex env set GROQ_API_KEY <your-groq-key>
npx convex env set OPENROUTER_API_KEY <your-openrouter-key>
```

### 3. Frontend Deployment (Vercel / Netlify / Node.js)

#### Option A: Vercel / Netlify

1. Connect your GitHub repository to Vercel or Netlify.
2. Set the build command to `npm run build` and output directory to `.output/public` (Nitro handles SSR functions automatically).
3. Set the following environment variables in your hosting dashboard:
   - `VITE_CONVEX_URL`: Your production Convex URL (e.g. `https://<your-deployment>.convex.cloud`)
   - `VITE_CONVEX_SITE_URL`: Your production Convex site URL
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk production publishable key (`pk_live_...`)
   - `CLERK_SECRET_KEY`: Your Clerk production secret key (`sk_live_...`)
   - `CLERK_JWT_ISSUER_DOMAIN`: Your Clerk domain

#### Option B: Self-Hosted Docker / Node.js Server

After running `npm run build`, Nitro produces a self-contained server in `.output`:

```bash
node .output/server/index.mjs
```

The server will bind to `PORT` (default 3000) and `HOST` (`0.0.0.0`).

---

## License

Open source educational project.

---

**KRUZZ**: Explore the problem. Understand the system. Think like an engineer. Build with purpose.

---

## Updated Rank & RC System (January 2025)

### Rank Ladder

The rank progression has been updated to provide better incentive structure:

| Rank                | RC Required | Estimated Cases | Description                     |
| ------------------- | ----------- | --------------- | ------------------------------- |
| **Observer**        | 0 RC        | Starting point  | All users begin here            |
| **Apprentice**      | 200 RC      | ~7 cases        | Basic systems understanding     |
| **Investigator**    | 500 RC      | ~17 cases       | Intermediate engineering skills |
| **Engineer**        | 2,000 RC    | ~67 cases       | Advanced system designer        |
| **Systems Thinker** | 5,000 RC    | ~167 cases      | Master-level achievement        |

### How to Earn RC (Reasoning Credits)

RC is the gamified progress currency that unlocks advanced case studies and tracks learning achievements.

#### Earning Structure

- **Code Lab Pass**: +10 RC (must score ≥80% on AI-graded lab)
- **Case Complete**: +20 RC (awarded only after lab pass + all 8 sections viewed)
- **Total per case**: 30 RC maximum

#### Important Rules

1. **No RC for section viewing** - Reading sections tracks progress but doesn't award points
2. **Lab validation is strict** - AI grades code + explanation; must score 80%+ to pass
3. **Case completion is gated** - 20 RC bonus only unlocks after:
   - Lab passed at 80%+
   - All 8 sections viewed
   - Cannot be bypassed

### AI Grading System

#### Grading Criteria

Students submit:

- **Code** (minimum 50 characters, must be actual implementation)
- **Explanation** (minimum 20 words, must show genuine understanding)

AI evaluates using strict rubric:

- **60 points**: Working code that solves the problem correctly
- **10 points**: Code follows best practices (error handling, edge cases)
- **20 points**: Explanation shows genuine understanding (not generic)
- **10 points**: Explanation is clear and insightful

**Pass threshold**: 80/100 (strict enforcement)

#### What's Never Stored

- Student code submissions (sent to AI, graded, then discarded)
- Written explanations (evaluated but never persisted)
- Only score and pass/fail status are recorded

#### Retry Logic

- Failed attempts return specific, actionable feedback
- Students can retry unlimited times
- Best score is tracked (but RC only awarded on pass)

### Privacy & Security

1. **Server-side validation** - All grading happens in Convex functions
2. **No client manipulation** - Students cannot award themselves RC
3. **Data minimization** - Only scores persisted, never code/explanations
4. **Free-tier AI models** - Uses Gemini, Groq, or OpenRouter (no cost to students)

### Setup for Instructors

See `AI_GRADING_SETUP.md` for detailed configuration of AI providers.

Quick setup:

```bash
# Set at least one AI provider
npx convex env set GEMINI_API_KEY your_key_here
npx convex env set GROQ_API_KEY your_key_here
npx convex env set OPENROUTER_API_KEY your_key_here
```

Free tier limits support ~7,700 submissions per day across all providers.
