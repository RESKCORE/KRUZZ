# KRUZZ Frontend (`src/`)

The `src/` directory contains the modern, reactive web application for **KRUZZ**. Built with **TanStack Start**, **React 19**, **Tailwind CSS v4**, and **Convex React client bindings**.

> **Architecture Invariant:**
> **No case study content is stored in frontend code.**
> All 35 case studies, progressive levels, trade-offs, code labs, unit tests, and reflection prompts are stored exclusively in the **Convex Database** (`convex/`). The frontend dynamically queries Convex and renders the data.

---

## 📁 Directory Structure

```
src/
├── components/          # Reusable UI components & interactives
│   ├── CodeArena.tsx       # Live interactive Python/Java/C coding sandbox
│   ├── CodeEditor.tsx      # Monaco/Prism code editor with syntax highlighting
│   ├── MermaidDiagram.tsx  # Dynamic Mermaid renderer for progressive topology
│   ├── AppChrome.tsx       # Desktop/mobile navigation, streak pill, RC wallet
│   ├── ThemeToggle.tsx     # Light/dark mode controller
│   └── ui/                 # Radix UI primitives & design system components
├── data/                # Frontend TypeScript schema contracts
│   └── schema.ts           # CaseStudy, CodeLab, Exercise, Primer type definitions
├── lib/                 # Core client utilities
│   ├── codeLabs.ts         # Guaranteed CodeLab resolution from DB records
│   ├── codeRunner.ts       # In-browser Pyodide client-side Python execution engine
│   ├── rc.ts               # Reasoning Credits (RC) client formatting & helpers
│   ├── theme.tsx           # CSS theme provider & context
│   └── utils.ts            # Class merging (cn) and formatting utilities
├── routes/              # TanStack Start file-based routing
│   ├── __root.tsx          # Root layout, theme provider, and global error boundary
│   ├── index.tsx           # Landing page & hero experience
│   ├── dashboard.tsx       # User progress overview & active study track
│   ├── leaderboard.tsx     # Global engineering rank & streak standings
│   ├── store.tsx           # Reasoning Credits (RC) rewards shop
│   ├── cases.index.tsx     # 35-case catalog explorer with filtering & search
│   └── cases.$slug.tsx     # 8-Section Case Study Workspace & CodeArena
├── styles.css           # Global typography, color tokens, and Tailwind v4 directives
├── router.tsx           # TanStack Router configuration
├── server.ts            # Server-Side Rendering (SSR) entry point
└── start.ts             # Application bootstrapper
```

---

## 🎨 Key Features & Rendering Models

1. **8-Section Incident Workspace (`src/routes/cases.$slug.tsx`)**:
   - Renders sections 01 through 08 dynamically from Convex (`useQuery(api.caseStudies.getBySlug, { slug })`).
   - Progressive disclosure: Level 1 (Topology) $\rightarrow$ Level 2 (Data Flow) $\rightarrow$ Level 3 (Failure Paths).
   - Standardized architectural decisions with badges, chosen patterns, alternatives, and trade-off blocks.

2. **In-Browser Code Execution (`src/lib/codeRunner.ts`)**:
   - Runs unit test suites inside an isolated WebAssembly **Pyodide** runtime.
   - Parses arguments and tuples deterministically with zero backend server lag.

3. **AI-Judged CodeArena (`src/components/CodeArena.tsx`)**:
   - Submits code and student explanations to the Convex backend (`api.caseProgress.submitCaseLab`).
   - Evaluates multi-language implementations (Python, Java, C) and awards Reasoning Credits (RC).
