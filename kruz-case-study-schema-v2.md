# KRUZZ — Beginner-First Case Study Schema & Generation Prompt (v2)

This is a revised version of the KRUZZ case-study system: same 8-section pedagogy,
but rebuilt so every case actually matches a first-year student who only knows
variables, if/else, loops, and functions. Two structural changes from v1:

1. **Vocabulary is gated.** A case cannot use a term in `discover`/`understand`
   that isn't either in `prerequisites` or defined in the new `glossary` field.
2. **Code samples are Python, Java, or C — never TypeScript.** Async/Promise/Map-heavy
   implementations are replaced with plain procedural or basic-OOP code a first-year
   can actually read.

---

## 1. Master System Prompt

```markdown
You are a Senior Software Engineer and Patient First-Year Instructor writing a
KRUZZ case study for a student who knows ONLY: variables, if/else, loops,
functions, and (at most) very basic classes. They have NOT been taught HTTP,
APIs, databases, caching, concurrency, or OOP design patterns unless a prior
case in the same learning path already introduced it.

TOPIC: [INSERT CASE TOPIC, e.g. "Case 03: How Does a URL Shortener Work?"]
LEARNER'S KNOWN LANGUAGE: [Python | Java | C — insert one]
PRIOR CASES COMPLETED (concepts already known): [list, or "none — this is Case 01"]

### Non-Negotiable Rules

1. **Vocabulary gate**: before using any technical term (e.g. "cache", "hash",
   "socket", "mutex"), check — is it in `prerequisites`, already taught in a
   prior completed case, or does it appear in `glossary` with a plain-English
   definition? If none of those, either define it inline in `glossary` or cut it.
2. **No hidden complexity in code**: `implementation.samples` and `codeLab`
   must be written in the learner's known language (Python, Java, or C only —
   never TypeScript/JavaScript). Do not use async/await, Promises, threads,
   or advanced stdlib collections unless a prior case explicitly taught them.
   Prefer plain functions, simple loops, dictionaries/maps, and basic classes.
3. **One new "big idea" per concept**: each entry in `concepts[]` should teach
   exactly one core idea. Do not stack three unfamiliar ideas into one concept.
4. **Diagram progression**: `architecture.levels[0]` (Level 1) must always be a
   plain `graph TD`/`graph LR` flowchart — no sequence diagrams, no alt/else
   branches. Save `sequenceDiagram` with branching logic for Level 2 or later,
   and only after the student has seen at least one prior case's sequence
   diagram.
5. **Zero fluff**: no generic filler intros. Start from the real incident.
6. **8-Section Structure** (unchanged from v1): Discover → Understand →
   Concepts → Architecture → Decisions → Implementation → Practice → Reflection,
   plus `primers`, `glossary`, and a `codeLab`.
7. **Valid JSON only**: return one JSON object matching the schema below.
   No markdown fences, no commentary outside the JSON.
```

---

## 2. Schema Definition (reference types — the JSON itself is language-agnostic)

```typescript
export interface CaseStudy {
  id: string;
  slug: string;
  index: string;
  title: string;
  shortTitle: string;
  category:
    | "Web Systems"
    | "Distributed Data"
    | "Security"
    | "Realtime"
    | "Reliability"
    | "AI Infrastructure";
  subcategory: string;

  // Single source of truth for difficulty — do NOT duplicate with a separate
  // "learnerLevel" field. rcCost is computed programmatically from difficulty
  // after generation (Beginner=30, Intermediate=60, Advanced=90), not authored.
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  rcCost: number;

  estimatedTime: string;
  minutes: number;
  status: "published";

  summary: string; // 1-2 sentence hook, plain language, no jargon
  learningObjectives: string[]; // 3-4 bullets
  prerequisites: string[]; // every term used later must trace back here or to glossary

  // Single flat tag list — replaces v1's overlapping engineeringConcepts/technologies/tech/tags
  tags: string[];

  // NEW in v2: any term used in discover/understand that a first-year hasn't
  // seen yet gets defined here in one plain sentence.
  glossary: {
    term: string;
    plainDefinition: string; // one sentence, no circular jargon
  }[];

  primers: {
    concept: string;
    minutes: number;
    definition: string;
    whyNeeded: string;
    analogy: string;
    tinyExample: string;
  }[];

  discover: {
    situation: string;
    humanFlow: string[];
    question: string;
    whyItExists: string[];
  };

  understand: {
    overview: string;
    components: {
      name: string;
      whatIsIt: string;
      whyItExists: string;
      whatItDoes: string;
    }[];
    analogy: {
      title: string;
      everyday: string[];
      technical: string[];
    };
    flow: string[];
  };

  concepts: {
    id: string;
    name: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    simpleDefinition: string;
    whyItExists: string;
    realWorldAnalogy: string;
    technicalExplanation: string;
    caseApplication: string;
    commonMistakes: string[];
    microDrills: string[]; // renamed from v1's "practice" to avoid clashing with top-level practice[]
  }[];

  architecture: {
    caption: string;
    levels: {
      title: string;
      description: string;
      // Level 1 MUST be "graph TD" or "graph LR" (plain flowchart, no branching).
      // sequenceDiagram / alt-else only allowed from Level 2 onward.
      mermaid: string;
    }[];
  };

  decisions: {
    title: string;
    what: string;
    why: string;
    problemSolved: string;
    withoutIt: string;
    alternatives: string[];
    tradeoff: string;
  }[];

  implementation: {
    behaviour: string;
    algorithm: string[]; // plain-English steps, language-independent
    ladder: {
      level: string;
      title: string;
      detail: string;
    }[];
    samples: {
      language: "python" | "java" | "c"; // TypeScript is not permitted
      filename: string;
      code: string; // plain procedural / basic-class style — no async, no Promises
      explanations: {
        code: string;
        explanation: string;
      }[];
    }[];
    simulationNote: string;
  };

  practice: {
    level: "Understand" | "Modify" | "Build" | "Think";
    title: string;
    brief: string;
  }[];

  reflection: string[];

  techNotes: {
    name: string;
    kind: string;
    note: string;
  }[];

  codeLab: {
    title: string;
    brief: string;
    language: "python" | "java" | "c";
    functionName: string;
    signature: string; // written in the target language's own style, not TS syntax
    starterCode: string;
    // NEW in v2: what the student must already know to attempt this lab —
    // lets the UI warn/block if they haven't completed the prerequisite case.
    requiredConcepts: string[];
    hints: string[];
    tests: {
      name: string;
      args: unknown[];
      expected: unknown;
    }[];
    explanationPrompt: string;
    mermaid: string;
  };
}
```

---

## 3. Worked Example — Same Idea, Beginner-Appropriate (Python)

This shows the v1→v2 downgrade in practice. v1's CDN case used a
Promise/Map-based single-flight cache in TypeScript. Here's the same
core idea — "don't fetch the same thing twice while it's already loading" —
written for a first-year in plain Python, with no concurrency primitives.

```python
# simple_cache.py
# A beginner-friendly cache with a time limit (TTL), no threads, no async.

cache = {}  # key -> {"value": ..., "saved_at": ...}

def get_from_cache_or_fetch(key, fetch_function, max_age_seconds, current_time):
    """
    Returns cached data if it's still fresh.
    Otherwise calls fetch_function() to get new data and stores it.
    """
    if key in cache:
        age = current_time - cache[key]["saved_at"]
        if age <= max_age_seconds:
            return cache[key]["value"], "HIT"

    # Cache miss or expired — fetch fresh data
    value = fetch_function()
    cache[key] = {"value": value, "saved_at": current_time}
    return value, "MISS"
```

`explanations` for this snippet would read:

- `if key in cache:` → "First we check: have we already saved this before?"
- `age = current_time - cache[key]["saved_at"]` → "We measure how long ago we saved it."
- `value = fetch_function()` → "If it's missing or too old, we go get a fresh copy — this is the one 'expensive' step we're trying to avoid repeating."

No `Promise`, no `Map`, no `async` — just a dictionary and an if-statement, which
is exactly the toolkit a first-year already has. The _engineering idea_ (avoid
redundant expensive fetches) survives; the unfamiliar syntax doesn't.

---

## 4. Submission Workflow (unchanged from v1)

1. Fill in the system prompt with topic, learner's known language, and prior
   completed cases.
2. Generate the JSON with your frontier model of choice.
3. Validate against `schema.ts` (this file's Section 2).
4. Spot-check: does every term in `discover`/`understand` appear in
   `prerequisites` or `glossary`? Does `implementation.samples[].language`
   equal `"python"`, `"java"`, or `"c"`? Is `architecture.levels[0].mermaid`
   a plain flowchart?
5. Register the case in `caseStudies.ts` and publish.
