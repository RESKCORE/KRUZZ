# Contributing to KRUZZ

Thank you for your interest in contributing to **KRUZZ**! 🚀

KRUZZ is an open-source interactive system architecture learning platform designed to bridge the gap between "I know basic syntax" and "I understand how distributed systems, cloud architectures, and scalable backends actually operate."

Whether you want to author a new system architecture case study, fix a bug, or enhance an interactive diagram, we welcome your contributions.

---

## Table of Contents

1. [Ways to Contribute](#ways-to-contribute)
2. [Local Development Setup](#local-development-setup)
3. [The Verification Pipeline](#the-verification-pipeline)
4. [How to Author & Contribute a Case Study](#how-to-author--contribute-a-case-study)
5. [Pull Request Guidelines](#pull-request-guidelines)
6. [Code Style & Standards](#code-style--standards)

---

## Ways to Contribute

- 📚 **Author New System Case Studies**: Submit investigations into real-world architectures (e.g., Netflix CDN, WhatsApp E2EE, Stripe Idempotent Retries, Uber Geospatial Dispatch).
- 🎨 **Enhance Diagrams & UI**: Improve Mermaid visual architecture flows, interactive animations, and dark-mode ergonomics.
- 💻 **Improve CodeArena & Lab Challenges**: Add edge-case test suites, clearer hints, or multi-language starter code (TypeScript, Python, Go, Rust, Java, C++).
- 📖 **Expand the System Design Roadmap**: Contribute new sections, mental models, and cheatsheet notes to [`public/SYSTEM_DESIGN_ROADMAP.md`](public/SYSTEM_DESIGN_ROADMAP.md).
- 🐛 **Bug Fixes**: Resolve rendering, state synchronization, or streak/grading edge cases.

---

## Local Development Setup

### Prerequisites

- **Node.js**: >= 22.0.0 (use [nvm](https://github.com/nvm-sh/nvm))
- **Package Manager**: npm >= 10.0.0 or [Bun](https://bun.sh)
- **Convex Account**: (Free tier) for the real-time serverless database

### Step-by-Step Setup

1. **Fork and clone the repository**:

   ```bash
   git clone https://github.com/<your-username>/KRUZZ.git
   cd KRUZZ
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure Environment Variables**:
   Copy the example environment template:

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Convex and Clerk development keys.

4. **Start Convex Backend**:
   In a separate terminal:

   ```bash
   npx convex dev
   ```

5. **Start Frontend Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## The Verification Pipeline

Before opening a pull request, run the single comprehensive verification gate:

```bash
npm run verify
```

This single gate runs:

- `npm run typecheck` — TypeScript compiler checks (`tsc --noEmit`)
- `npm run lint` — ESLint strict linting rules
- `npm run format:check` — Prettier formatting validation
- `npm test` — Node.js native test suite
- `npm run build` — Production SSR and Nitro bundle compilation

---

## How to Author & Contribute a Case Study

Every KRUZZ case study adheres to the canonical **8-Section Progressive Architecture**:

1. **01 — Discover the Problem**: Real-world incident or crisis situation without jargon.
2. **02 — Understand the System**: Component roles (What / Why / Does), everyday analogies, and end-to-end flows.
3. **03 — Engineering Principles**: Invariant computer science laws, failure modes, and mental models.
4. **04 — Architecture Visualization**: 3 progressive Mermaid diagrams (Level 1 Topology, Level 2 Component Flow, Level 3 Failure Resiliency).
5. **05 — Engineering Decisions**: Trade-off matrices (What, Why, Alternatives, Trade-offs).
6. **06 — Step-by-Step Implementation**: Language-independent algorithm, code ladder, and fully commented sample.
7. **07 — Practice**: 4 multi-dimensional exercises (Understand, Modify, Build, Think).
8. **08 — Reflection**: Critical engineering articulation questions.
9. **Interactive Code Lab**: Guided coding challenge with test cases and AI rubric.

### Using the AI Generation Template

We provide a comprehensive generation prompt and TypeScript schema template in:

- [`docs/KRUZ_CASE_STUDY_PROMPT_TEMPLATE.md`](docs/KRUZ_CASE_STUDY_PROMPT_TEMPLATE.md)
- [`kruz-case-study-schema-v2.md`](kruz-case-study-schema-v2.md)

You can pass this prompt along with your chosen topic (e.g. _"Case 36: Raft Consensus & Leader Election"_) to Claude 3.7 Sonnet, OpenAI o3-mini/GPT-4o, or Gemini 2.5 Pro to generate a schema-compliant investigation.

---

## Pull Request Guidelines

1. Create a feature branch:
   ```bash
   git checkout -b feat/add-raft-case-study
   ```
2. Commit with [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(...)`: A new feature or case study
   - `fix(...)`: A bug fix
   - `docs(...)`: Documentation updates
   - `style(...)`: Formatting corrections
3. Run `npm run verify` and ensure all checks pass.
4. Push your branch and open a Pull Request against the `main` branch.
5. Fill out the PR template with a summary of changes and verification evidence.

---

## Code Style & Standards

- **Formatting**: We use Prettier. Format your code using `npm run format`.
- **TypeScript**: No `any` types; maintain strict typing throughout.
- **Styling**: Tailwind CSS utility classes; avoid inline styles except for dynamic coordinates.
- **Architecture Diagrams**: Clean Mermaid syntax compatible with dark mode themes.
