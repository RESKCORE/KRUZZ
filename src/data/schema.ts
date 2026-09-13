/**
 * KRUZZ — Detailed Case Study Content & Course Schema
 * Types follow the SRS: metadata is separate from the educational body,
 * concepts and decisions are structured records, architecture is progressive.
 */

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

/** SRS §6 difficulty model — conceptual complexity, not code length. */
export type LearnerLevel = "Explorer" | "Builder" | "Engineer" | "Systems Thinker";

export type Status = "published" | "draft";

/** SRS §20 concept object schema. */
export type Concept = {
  id: string;
  name: string;
  difficulty: Difficulty;
  simpleDefinition: string;
  whyItExists: string;
  realWorldAnalogy: string;
  technicalExplanation: string;
  caseApplication: string;
  commonMistakes: string[];
  practice: string[];
};

/** SRS §9 — each component explained as What / Why / What it does. */
export type SystemComponent = {
  name: string;
  whatIsIt: string;
  whyItExists: string;
  whatItDoes: string;
};

export type Analogy = {
  title: string;
  everyday: string[];
  technical: string[];
};

/** SRS §11 — architecture revealed progressively. */
export type DiagramLevel = {
  title: string;
  description: string;
  mermaid: string;
};

/** SRS §12 — WHAT / WHY / PROBLEM / WITHOUT / ALTERNATIVES / TRADE-OFFS. */
export type Decision = {
  title: string;
  what: string;
  why: string;
  problemSolved: string;
  withoutIt: string;
  alternatives: string[];
  tradeoff: string;
};

/** SRS §13 — implementation ladder, LEVEL 0 → LEVEL 6. */
export type ImplementationLevel = {
  level: string;
  title: string;
  detail: string;
};

/** SRS §15 — every meaningful code block gets a plain-language explanation. */
export type CodeExplanation = {
  code: string;
  explanation: string;
};

export type CodeSample = {
  language: string;
  filename: string;
  code: string;
  explanations: CodeExplanation[];
};

/** SRS §17 practice model. */
export type PracticeLevel = "Understand" | "Modify" | "Build" | "Think";

export type Exercise = {
  level: PracticeLevel;
  title: string;
  brief: string;
};

export type TechNote = {
  name: string;
  kind: string;
  note: string;
};

/** SRS §24 — quick concept primer instead of forcing the learner to leave. */
export type Primer = {
  concept: string;
  minutes: number;
  definition: string;
  whyNeeded: string;
  analogy: string;
  tinyExample: string;
};

/** Code arena — the learner writes the solution and the tests judge it. */
export type CodeTest = {
  name: string;
  args: unknown[];
  expected: unknown;
};

export type LanguageVariant = {
  signature: string;
  starterCode: string;
  hints?: string[];
};

export type CodeLab = {
  title: string;
  brief: string;
  language?: "python" | "java" | "c";
  /** The function the learner must define. */
  functionName: string;
  signature: string;
  starterCode: string;
  javaSignature?: string;
  javaStarterCode?: string;
  pythonSignature?: string;
  pythonStarterCode?: string;
  cSignature?: string;
  cStarterCode?: string;
  languages?: {
    python?: LanguageVariant;
    java?: LanguageVariant;
    c?: LanguageVariant;
  };
  requiredConcepts?: string[];
  hints: string[];
  tests: CodeTest[];
  explanationPrompt: string;
  /** A simple picture of what the function has to do. */
  mermaid: string;
};

export type CaseStudy = {
  // ── Metadata (SRS §5) ──────────────────────────────────────────────
  id: string;
  slug: string;
  index: string;
  title: string;
  shortTitle: string;
  category: string;
  subcategory: string;
  difficulty: Difficulty;
  learnerLevel: LearnerLevel;
  estimatedTime: string;
  minutes: number;
  status: Status;
  summary: string;
  learningObjectives: string[];
  prerequisites: string[];
  engineeringConcepts: string[];
  technologies: string[];
  tech: string[];
  tags: string[];
  glossary?: {
    term: string;
    plainDefinition: string;
  }[];
  primers: Primer[];
  /** Access tier: 'free' or 'premium' */
  tier: "free" | "premium";
  /** RC price to unlock this case — scaled by conceptual complexity. */
  rcCost: number;
  /** Write-your-own-code arena for this case. */
  codeLab: CodeLab;

  // ── Educational body (SRS §7 — eight sections) ─────────────────────
  /** 01 — Discover the problem */
  discover: {
    situation: string;
    humanFlow: string[];
    question: string;
    whyItExists: string[];
  };
  /** 02 — Understand the system */
  understand: {
    overview: string;
    components: SystemComponent[];
    analogy: Analogy;
    flow: string[];
  };
  /** 03 — Engineering principles */
  concepts: Concept[];
  /** 04 — Architecture, revealed progressively */
  architecture: {
    caption: string;
    levels: DiagramLevel[];
  };
  /** 05 — Engineering decisions */
  decisions: Decision[];
  /** 06 — Implementation */
  implementation: {
    behaviour: string;
    algorithm: string[];
    ladder: ImplementationLevel[];
    samples: CodeSample[];
    simulationNote: string;
  };
  /** 07 — Practice */
  practice: Exercise[];
  /** 08 — Reflection */
  reflection: string[];

  /** Side rail — why this technology */
  techNotes: TechNote[];
};

export const SECTION_LABELS = [
  "Discover",
  "Understand",
  "Principles",
  "Architecture",
  "Decisions",
  "Implementation",
  "Practice",
  "Reflection",
] as const;

export const SECTION_KICKERS = [
  "Discover the problem",
  "Understand the system",
  "Engineering principles",
  "Architecture visualisation",
  "Engineering decisions",
  "Implementation",
  "Guided practice",
  "Think like an engineer",
] as const;

export const PRACTICE_PURPOSE: Record<PracticeLevel, string> = {
  Understand: "Check conceptual understanding",
  Modify: "Change an existing solution",
  Build: "Construct from requirements",
  Think: "Explore consequences",
};

/**
 * Reflection minimum thresholds — used by cases.$slug.tsx (frontend) and
 * caseProgress.ts markCaseComplete (backend). Keep both copies in sync.
 */
export const MIN_REFLECTION_CHARS = 300;
export const MIN_REFLECTION_WORDS = 50;
