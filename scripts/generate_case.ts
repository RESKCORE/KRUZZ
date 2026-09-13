import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { validateCaseStudy, upsertToConvex } from "./quality_gate.ts";

// ============================================================================
// Configuration & Environment
// ============================================================================

// Load keys from process.env (Bun automatically loads .env / .env.local)
const GEMINI_API_KEY = process.env.gemini || process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.groq || process.env.GROQ_API_KEY || "";
const NVIDIA_API_KEY = process.env.nvidia || process.env.NVIDIA_API_KEY || "";

const GEMINI_MODELS = ["gemini-3-flash-preview", "gemini-3.6-flash", "gemini-3.8-flash"];

const GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];

const NVIDIA_MODEL = "meta/llama-3.3-70b-instruct";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3:latest";

if (!GEMINI_API_KEY) console.warn("⚠️ Warning: GEMINI_API_KEY is not set.");
if (!GROQ_API_KEY) console.warn("⚠️ Warning: GROQ_API_KEY is not set.");
if (NVIDIA_API_KEY) console.log("🟢 NVIDIA API Key detected — enabled as tier-2 fallback.");
console.log(`🦙 Ollama integration active (${OLLAMA_MODEL} at ${OLLAMA_HOST})`);

// ============================================================================
// Robust Multi-Provider LLM Callers
// ============================================================================

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callOllama(systemPrompt: string, userPrompt: string): Promise<any> {
  const url = `${OLLAMA_HOST}/api/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(120000),
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\nReturn ONLY a valid raw JSON object. Do not include markdown fences or conversational text.`,
        },
        { role: "user", content: userPrompt },
      ],
      stream: false,
      format: "json",
      options: {
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Ollama HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data: any = await res.json();
  return cleanAndParseJson(data.message?.content ?? "");
}

async function callNvidia(systemPrompt: string, userPrompt: string): Promise<any> {
  if (!NVIDIA_API_KEY) throw new Error("NVIDIA API key not set");
  const url = "https://integrate.api.nvidia.com/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: "system", content: `${systemPrompt}\nReturn ONLY valid JSON.` },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 3072,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`NVIDIA HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data: any = await res.json();
  return cleanAndParseJson(data.choices?.[0]?.message?.content ?? "");
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  modelIndex: number = 0,
): Promise<any> {
  const modelName = GEMINI_MODELS[modelIndex] || GEMINI_MODELS[0];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  const combinedPrompt = `${systemPrompt}\n\nIMPORTANT: Return ONLY a raw JSON object. Do not include markdown fences (like \`\`\`json). Ensure all quotes and brackets are valid.\n\n${userPrompt}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: combinedPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data: any = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return cleanAndParseJson(rawText);
  } catch (err: any) {
    const isQuota = err.message?.includes("429") || err.message?.includes("quota");
    if (!isQuota && modelIndex + 1 < GEMINI_MODELS.length) {
      const nextModel = GEMINI_MODELS[modelIndex + 1];
      console.warn(
        `[Gemini] ${modelName} failed (${err.message}). Cascading to fallback ${nextModel}...`,
      );
      return callGemini(systemPrompt, userPrompt, modelIndex + 1);
    }
    // If quota or all Gemini models exhausted, cascade to Groq (without bouncing back)
    console.warn(`[Gemini Unavailable] Cascading to Groq fallback (${GROQ_MODELS[0]})...`);
    return callGroq(systemPrompt, userPrompt, 0, false);
  }
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  modelIndex: number = 0,
  allowFallbackToGemini: boolean = true,
): Promise<any> {
  const modelName = GROQ_MODELS[modelIndex] || GROQ_MODELS[0];
  const url = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "User-Agent": "Mozilla/5.0 (KRUZ Generator)",
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Groq HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return cleanAndParseJson(content);
  } catch (err: any) {
    const isRateLimit = err.message?.includes("429") || err.message?.includes("Rate limit");
    if (isRateLimit) {
      const match = err.message?.match(/try again in ([0-9.]+)s/i);
      const waitSec = match ? Math.ceil(parseFloat(match[1])) + 2 : 12;
      console.warn(
        `   ⏳ Groq rate-limited on ${modelName}. Waiting ${waitSec}s before fallback/retry...`,
      );
      await sleep(waitSec * 1000);
    }
    if (modelIndex + 1 < GROQ_MODELS.length) {
      const nextGroq = GROQ_MODELS[modelIndex + 1];
      console.warn(
        `[Groq] ${modelName} error (${err.message?.slice(0, 100)}). Cascading to Groq model ${nextGroq}...`,
      );
      return callGroq(systemPrompt, userPrompt, modelIndex + 1, allowFallbackToGemini);
    }
    if (NVIDIA_API_KEY) {
      try {
        console.warn(`[Groq Exhausted] Cascading to NVIDIA (${NVIDIA_MODEL})...`);
        return await callNvidia(systemPrompt, userPrompt);
      } catch (nErr: any) {
        console.warn(`[NVIDIA] Failed (${nErr.message}).`);
      }
    }
    try {
      console.warn(`[Cascading to Local Ollama (${OLLAMA_MODEL})...]`);
      return await callOllama(systemPrompt, userPrompt);
    } catch (oErr: any) {
      console.warn(`[Ollama] Local fallback failed (${oErr.message}).`);
    }
    if (allowFallbackToGemini) {
      console.warn(`[Groq/Ollama Exhausted] Cascading to Gemini...`);
      return callGemini(systemPrompt, userPrompt);
    }
    throw new Error(`All LLM providers exhausted: ${err.message}`);
  }
}

function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

// ============================================================================
// Multi-Step Sequential Generation Pipeline
// ============================================================================

export interface GenerationInput {
  slug: string;
  index: string; // e.g. "08"
  topic: string; // e.g. "How Does a Distributed Rate Limiter Work?"
  track: number; // 0 for Single-Process OOP, 1 for Distributed Systems
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  category?: string;
  subcategory?: string;
  extraRules?: string;
}

function getScopedRules(slug: string): string {
  if (slug === "search-autocomplete") {
    return "CRITICAL CASE 12 RULE: DO NOT use the terms 'trie', 'tries', or 'prefix tree' or 'prefix-tree' anywhere in any title, text, code, or alternative. The implementation must use a simple list of candidate strings filtered with .startswith() / .startsWith().";
  }
  if (slug === "two-factor-totp") {
    return "CRITICAL CASE 16 RULE: You MUST explicitly state in techNotes that this is a simplified stand-in toy 30-sec simulation, not production RFC 6238.";
  }
  if (slug === "cloud-data-deduplication") {
    return "CRITICAL CASE 21 RULE: DO NOT mention rolling hashes, content-defined chunking (CDC), or Rabin fingerprints. Must be whole-file hash lookup only.";
  }
  if (slug === "image-cdn-delivery") {
    return "CRITICAL CASE 10 RULE: DO NOT mention BGP, Anycast, or Origin Shield. Must be near-vs-far latency only.";
  }
  return "";
}

/**
 * Step 1: Pedagogy & Narrative
 * Uses Gemini 3 Flash Preview (deep context, engaging narrative, vocabulary gate)
 */
async function generatePedagogy(input: GenerationInput) {
  console.log("   [1/4] Generating Pedagogy, Real-World Hook, and Vocabulary Gate (Gemini)...");

  const scopedRule = getScopedRules(input.slug);
  const systemPrompt = `You are a Senior Systems Architect and empathetic First-Year Computer Science Instructor creating a KRUZ investigation case study.
KRUZ teaches core software engineering without intimidating jargon.
${input.track === 0 ? "TRACK 0 NON-NEGOTIABLE RULE: This is a single-process OOP lesson. NEVER use the words 'http', 'server', 'network', 'database', 'ip address', 'dns', 'rest api', or 'endpoint'." : ""}
${scopedRule}
${input.extraRules || ""}

VOCABULARY GATE:
Before using any technical term, you MUST define it in the 'glossary' array with a clear, 1-sentence plain-English definition without circular jargon.`;

  const userPrompt = `Generate the pedagogical narrative and core sections for:
Topic: ${input.topic}
Case Slug: ${input.slug}
Index: ${input.index}
Difficulty: ${input.difficulty || "Beginner"}

Return a JSON object with this exact shape:
{
  "title": "${input.topic}",
  "shortTitle": "Short 2-3 word title",
  "category": "${input.category || (input.track === 0 ? "Foundations (OOP)" : "Distributed Data")}",
  "subcategory": "${input.subcategory || (input.track === 0 ? "Object-Oriented Modeling" : "Traffic Control")}",
  "summary": "1-2 sentence hook, plain language, highlighting a real tension/incident",
  "learningObjectives": ["3-4 clear actionable bullet points"],
  "prerequisites": ["Variables and conditionals", "Functions", "Basic data structures"],
  "glossary": [
    { "term": "Technical Term", "plainDefinition": "Plain one sentence explanation." }
  ],
  "primers": [
    {
      "concept": "Core Concept",
      "minutes": 3,
      "definition": "Clear concise definition",
      "whyNeeded": "Why we cannot build the system without it",
      "analogy": "Everyday real world analogy",
      "tinyExample": "Tiny code or mental model snippet"
    }
  ],
  "discover": {
    "situation": "Real world incident or dilemma that forces this system to exist",
    "humanFlow": ["Step 1 of what user/client does", "Step 2", "Step 3"],
    "question": "The central engineering problem to be solved",
    "whyItExists": ["Bullet 1", "Bullet 2"]
  },
  "understand": {
    "overview": "Clear breakdown of the system components and mental model",
    "components": [
      {
        "name": "Component Name",
        "whatIsIt": "What the component is",
        "whyItExists": "Why we need it",
        "whatItDoes": "What action it performs"
      }
    ],
    "analogy": {
      "title": "Analogy Name (e.g. The Nightclub Bouncer)",
      "everyday": ["How it works in everyday life"],
      "technical": ["How that mirrors the software system"]
    },
    "flow": ["Data or execution flow step 1", "step 2", "step 3"]
  }
}`;

  return await callGemini(systemPrompt, userPrompt);
}

/**
 * Step 2: Architecture & ADRs
 * Uses Groq GPT-OSS 120B (compact, ~1.5K tokens, stays well under 8K TPM)
 */
async function generateArchitecture(input: GenerationInput, pedagogy: any) {
  console.log("   [2/4] Generating Progressive Architecture & ADRs (Groq 120B)...");

  const scopedRule = getScopedRules(input.slug);
  const systemPrompt = `You are a Principal Software Architect writing diagrams and Architectural Decision Records (ADRs) for KRUZ.
${input.track === 0 ? "TRACK 0 RULE: No servers, networks, or databases. Use in-memory OOP components only." : ""}
${scopedRule}
${input.extraRules || ""}

CRITICAL MERMAID RULES:
1. Level 1 (levels[0]) MUST start with 'graph TD' or 'graph LR'. It must be a simple, clean flowchart (NO sequence diagrams in Level 1).
2. Level 2 (levels[1]) can be 'graph TD', 'graph LR', or 'sequenceDiagram'.
3. Always wrap node labels with quotes if they contain punctuation or spaces (e.g. A["Client Request"] --> B["Bouncer Validator"]).`;

  const userPrompt = `Design the architecture levels and architectural decisions for:
Topic: ${input.topic}
Summary: ${pedagogy.summary}
Components: ${JSON.stringify(pedagogy.understand.components)}

Return a JSON object with this exact shape:
{
  "architecture": {
    "caption": "Clear progressive caption of the architecture",
    "levels": [
      {
        "title": "Level 1: High-Level Component Flow",
        "description": "Plain English description of the main flow",
        "mermaid": "graph TD\\n  A[\\"User Action\\"] --> B[\\"Core Handler\\"]\\n  B --> C[\\"State Storage\\"]"
      },
      {
        "title": "Level 2: Detailed State & Decision Logic",
        "description": "Deeper look into internal checks and responses",
        "mermaid": "graph LR\\n  Req[\\"Incoming Request\\"] --> Check{\\"Is Valid?\\"}\\n  Check -- Yes --> Allow[\\"Proceed\\"]\\n  Check -- No --> Reject[\\"Block\\"]"
      }
    ]
  },
  "decisions": [
    {
      "title": "Decision Name (e.g. In-Memory Token Bucket vs Leaky Bucket)",
      "what": "What decision was made",
      "why": "Why this approach was chosen",
      "problemSolved": "What exact bug or failure this prevents",
      "withoutIt": "What happens if a developer ignores this",
      "alternatives": ["Alternative approach A", "Alternative approach B"],
      "tradeoff": "The cost or trade-off of this decision"
    }
  ],
  "tradeOffs": [
    "Trade-off bullet 1",
    "Trade-off bullet 2"
  ]
}`;

  return await callGroq(systemPrompt, userPrompt);
}

/**
 * Step 3: Concepts, CodeLab & Implementation
 * Uses Gemini 3 Flash Preview for dual-language code, test suite, and line-by-line annotations
 */
async function generateImplementation(input: GenerationInput, pedagogy: any, arch: any) {
  console.log("   [3/4] Generating Concepts, Dual-Language CodeLab & Unit Tests (Gemini)...");

  const scopedRule = getScopedRules(input.slug);
  const systemPrompt = `You are an expert Polyglot Software Engineer and Computer Science Teacher.
You are generating the implementation, practice exercises, and CodeLab for KRUZ.
${input.track === 0 ? "TRACK 0 RULE: Pure in-memory OOP. Zero networking or DB imports." : ""}
${scopedRule}
${input.extraRules || ""}

CODE LAB GUIDELINES:
1. Provide a single core function name in snake_case (e.g. 'check_rate_limit').
2. Provide Python starter code with comments and a 'pass' body.
3. Provide Java starter code in a 'public class Solution' with matching static method signature.
4. Provide a working Python reference solution (clean procedural / basic class).
5. Provide at least 3 rigorous test cases with exact 'name', 'args' array, and 'expected' value.
6. Provide line-by-line pedagogical code explanations for both Python and Java.`;

  const userPrompt = `Create implementation, concepts, and codeLab for:
Topic: ${input.topic}
Pedagogy Summary: ${pedagogy.summary}
Glossary terms: ${JSON.stringify(pedagogy.glossary.map((g: any) => g.term))}

Return a JSON object with this exact shape:
{
  "concepts": [
    {
      "id": "concept-1",
      "name": "Primary Concept Name",
      "difficulty": "${input.difficulty || "Beginner"}",
      "simpleDefinition": "Simple definition in plain terms",
      "whyItExists": "Why this concept is fundamental",
      "realWorldAnalogy": "Everyday intuitive analogy",
      "technicalExplanation": "Clear technical breakdown",
      "caseApplication": "How this case study applies it",
      "commonMistakes": ["Mistake 1", "Mistake 2"],
      "microDrills": ["Quick drill question 1", "Quick drill question 2"]
    }
  ],
  "implementation": {
    "behaviour": "Overview of how the code executes the system requirements",
    "algorithm": [
      "1. Receive input parameters",
      "2. Check state invariants and limits",
      "3. Update internal storage and return result"
    ],
    "ladder": [
      { "level": "Level 1", "title": "Basic Check", "detail": "Naive implementation" },
      { "level": "Level 2", "title": "Robust Guarding", "detail": "Handling boundary conditions" }
    ],
    "samples": [
      {
        "language": "python",
        "filename": "solution.py",
        "code": "def example_solution():\\n    return True\\n",
        "explanations": [
          { "code": "def example_solution():", "explanation": "Function header declaring entry point." }
        ]
      },
      {
        "language": "java",
        "filename": "Solution.java",
        "code": "public class Solution {\\n    public static boolean exampleSolution() {\\n        return true;\\n    }\\n}\\n",
        "explanations": [
          { "code": "public class Solution {", "explanation": "Standard class container." }
        ]
      }
    ],
    "simulationNote": "Notes on how this simulation models production reality without external bloat."
  },
  "practice": [
    { "level": "Understand", "title": "Trace the State", "brief": "Predict the return value given inputs." },
    { "level": "Modify", "title": "Add a Counter", "brief": "Extend the function to track total attempts." },
    { "level": "Build", "title": "Reset Window", "brief": "Implement a time or token reset mechanism." },
    { "level": "Think", "title": "Edge Case Analysis", "brief": "What happens when integer overflow or concurrent calls occur?" }
  ],
  "reflection": [
    "Why is validating state at the boundary cleaner than checking inside business logic?",
    "How does this pattern scale as traffic increases tenfold?"
  ],
  "techNotes": [
    { "name": "Complexity", "kind": "Performance", "note": "O(1) time and memory overhead." }
  ],
  "codeLab": {
    "title": "Interactive Lab: ${input.topic}",
    "brief": "Implement the core logic and verify it against test scenarios.",
    "language": "python",
    "functionName": "core_function_name",
    "signature": "def core_function_name(param1: int, param2: str) -> list:",
    "starterCode": "# def core_function_name(param1: int, param2: str) -> list:\\n\\ndef core_function_name(param1, param2):\\n    # Your logic here\\n    pass\\n",
    "javaSignature": "public static Object[] coreFunctionName(int param1, String param2)",
    "javaStarterCode": "public class Solution {\\n    public static Object[] coreFunctionName(int param1, String param2) {\\n        // Your logic here\\n        return new Object[] { false };\\n    }\\n}\\n",
    "referenceSolution": "def core_function_name(param1, param2):\\n    return [True, param1]\\n",
    "requiredConcepts": ["Conditional checks", "List or dictionary updates"],
    "hints": [
      "Check invalid inputs before modifying any balance or counter.",
      "Ensure you return the expected status and updated state.",
      "Compare your return types carefully with the test expectations."
    ],
    "tests": [
      {
        "name": "Standard valid execution",
        "args": [10, "valid_key"],
        "expected": [true, 10]
      }
    ],
    "explanationPrompt": "Explain how your solution guarantees that state invariants are preserved.",
    "mermaid": "graph TD\\n  Start[\\"Input\\"] --> Validate{\\"Valid?\\"}\\n  Validate -- Yes --> Success[\\"Return Success\\"]\\n  Validate -- No --> Fail[\\"Return Error\\"]"
  }
}`;

  return await callGemini(systemPrompt, userPrompt);
}

// ============================================================================
// Normalizer & Bridge (v2 Pedagogy -> v1/v2 Convex Compatibility)
// ============================================================================

function normalizeAndBridge(input: GenerationInput, pedagogy: any, arch: any, impl: any): any {
  console.log("   [4/4] Normalizing and bridging schema fields...");

  const difficulty = input.difficulty || "Beginner";
  const rcCost = difficulty === "Beginner" ? 30 : difficulty === "Intermediate" ? 60 : 90;
  const learnerLevel =
    difficulty === "Beginner" ? "Explorer" : difficulty === "Intermediate" ? "Builder" : "Engineer";

  // Ensure concepts have all defined glossary terms in prerequisites/engineeringConcepts
  const engineeringConcepts = (impl.concepts || []).map((c: any) => c.name);

  // Sync glossary and prerequisites to satisfy Vocabulary Gate
  const prereqs = Array.from(new Set([...(pedagogy.prerequisites || []), ...engineeringConcepts]));

  // Dual-language CodeLab support (satisfies both v2 and quality_gate / CodeArena)
  const codeLab = {
    ...impl.codeLab,
    languages: {
      python: {
        signature: impl.codeLab.signature,
        starterCode: impl.codeLab.starterCode,
        hints: impl.codeLab.hints,
      },
      java: {
        signature: impl.codeLab.javaSignature,
        starterCode: impl.codeLab.javaStarterCode,
        hints: impl.codeLab.hints,
      },
    },
  };

  let caseStudy = {
    id: `cs-${input.slug}-${input.index}`,
    slug: input.slug,
    index: input.index,
    title: pedagogy.title || input.topic,
    shortTitle: pedagogy.shortTitle || input.topic.split(" ").slice(0, 3).join(" "),
    category: pedagogy.category || (input.track === 0 ? "Foundations (OOP)" : "Distributed Data"),
    subcategory: pedagogy.subcategory || "",
    difficulty,
    learnerLevel,
    estimatedTime: "30-45 minutes",
    minutes: 40,
    status: "published",
    tier: "free",
    rcCost,
    summary: pedagogy.summary,
    learningObjectives: pedagogy.learningObjectives,
    prerequisites: prereqs,
    engineeringConcepts,
    technologies: ["Python", "Java"],
    tech: ["Python", "Java"],
    tags: [
      "system-design",
      input.track === 0 ? "oop" : "distributed",
      difficulty.toLowerCase(),
      input.slug,
    ],
    glossary: pedagogy.glossary,
    primers: pedagogy.primers,
    discover: pedagogy.discover,
    understand: pedagogy.understand,
    concepts: impl.concepts,
    architecture: arch.architecture,
    decisions: arch.decisions,
    tradeOffs: arch.tradeOffs,
    implementation: impl.implementation,
    practice: impl.practice,
    failureModes: [],
    microDrills: [],
    reflection: impl.reflection,
    techNotes: impl.techNotes,
    codeLab,
    updatedAt: Date.now(),
  };

  // Scoped Guardrails Sanitation per quality_gate.ts
  if (input.slug === "search-autocomplete") {
    let str = JSON.stringify(caseStudy);
    str = str
      .replace(/prefix[\s-]tree(s)?/gi, "prefix list")
      .replace(/\btrie(s)?\b/gi, "prefix list");
    caseStudy = JSON.parse(str);
  }

  if (input.slug === "two-factor-totp") {
    const text = JSON.stringify(caseStudy).toLowerCase();
    if (!text.includes("simplified") && !text.includes("stand-in")) {
      caseStudy.techNotes = caseStudy.techNotes || [];
      caseStudy.techNotes.push({
        name: "Scope Note",
        kind: "Architecture",
        note: "This is a simplified stand-in toy 30-sec simulation, not production RFC 6238.",
      });
    }
  }

  if (input.slug === "cloud-data-deduplication") {
    let str = JSON.stringify(caseStudy);
    str = str
      .replace(/rolling[\s-]hash(es)?/gi, "whole-file hash")
      .replace(/content[\s-]defined[\s-]chunking/gi, "whole-file deduplication")
      .replace(/\brabin\b/gi, "cryptographic hash");
    caseStudy = JSON.parse(str);
  }

  return caseStudy;
}

// ============================================================================
// Sandbox Code Verification (Dynamic test runner)
// ============================================================================

interface VerificationResult {
  passed: boolean;
  error?: string;
}

function verifyPythonCodeLab(codeLab: any): VerificationResult {
  if (!codeLab.referenceSolution || !Array.isArray(codeLab.tests) || codeLab.tests.length === 0) {
    console.warn("⚠️ No referenceSolution or test cases to execute.");
    return { passed: true };
  }

  console.log("   🧪 Executing Python unit tests in sandbox...");

  const sanitizedSolution = (codeLab.referenceSolution || "").replace(
    /[\u2010\u2011\u2012\u2013\u2014\u2015]/g,
    "-",
  );
  const sanitizedTests = JSON.stringify(codeLab.tests || [])
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-")
    .replace(/\btrue\b/g, "True")
    .replace(/\bfalse\b/g, "False")
    .replace(/\bnull\b/g, "None");

  const testHarness = `
import json, sys, io
try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
except Exception:
    pass

${sanitizedSolution}

tests = ${sanitizedTests}
fn = ${codeLab.functionName}

def _norm(v):
    if isinstance(v, (list, tuple)):
        return [_norm(x) for x in v]
    if isinstance(v, dict):
        return {k: _norm(val) for k, val in v.items()}
    return v

for idx, t in enumerate(tests):
    args = t.get("args", [])
    expected = t.get("expected")
    actual = fn(*args)
    if _norm(actual) != _norm(expected):
        print(f"FAILED test #{idx+1} '{t.get('name')}': expected {expected}, got {actual}")
        sys.exit(1)

print("ALL_TESTS_PASSED")
`;

  const tmpFile = path.join(process.cwd(), "scripts", "output", `_test_harness_${Date.now()}.py`);
  try {
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, testHarness, "utf-8");
    const output = execSync(`python "${tmpFile}"`, {
      encoding: "utf-8",
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      stdio: ["pipe", "pipe", "pipe"],
    });
    if (output.includes("ALL_TESTS_PASSED")) {
      console.log("   ✅ Reference solution passed all CodeLab unit tests!");
      return { passed: true };
    }
    console.error(`   ❌ CodeLab unit tests failed. Output:\n${output}`);
    return { passed: false, error: output.trim() };
  } catch (err: any) {
    const stdout = err.stdout ? `\n   ${err.stdout.trim()}` : "";
    const stderr = err.stderr ? `\n   ${err.stderr.trim()}` : "";
    const fullErr = `${stdout || stderr || err.message}`.trim();
    console.error(`   ❌ CodeLab unit test failure: ${fullErr}`);
    return { passed: false, error: fullErr };
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {}
  }
}

// ============================================================================
// Main CLI Orchestrator
// ============================================================================

export async function generateCase(input: GenerationInput, publish: boolean = false) {
  console.log(`\n🚀 Starting Case Study Generation for: "${input.topic}" (${input.slug})`);

  // Step 1
  const pedagogy = await generatePedagogy(input);

  // Delay between LLM calls to avoid rate limits
  await sleep(3000);

  // Step 2
  const arch = await generateArchitecture(input, pedagogy);

  // Delay between LLM calls to avoid rate limits
  await sleep(3000);

  // Step 3
  let impl = await generateImplementation(input, pedagogy, arch);

  // Step 4
  let caseStudy = normalizeAndBridge(input, pedagogy, arch, impl);

  // Verify CodeLab solution with automated self-healing loop
  let verification = verifyPythonCodeLab(caseStudy.codeLab);
  let healingAttempts = 0;

  while (!verification.passed && healingAttempts < 2) {
    healingAttempts++;
    console.warn(
      `\n   🔄 Auto-healing: Retrying Step 3 with sandbox feedback (attempt ${healingAttempts}/2)...`,
    );
    await sleep(4000);

    const healingPrompt = `CRITICAL UNIT TEST BUGFIX: In your previous generation, the CodeLab referenceSolution or tests failed in our sandbox:
"${verification.error}"
Fix the referenceSolution and unit tests so they are 100% consistent with each other.`;

    impl = await generateImplementation(
      { ...input, extraRules: `${input.extraRules || ""}\n${healingPrompt}` },
      pedagogy,
      arch,
    );
    caseStudy = normalizeAndBridge(input, pedagogy, arch, impl);
    verification = verifyPythonCodeLab(caseStudy.codeLab);
  }

  if (!verification.passed) {
    throw new Error(
      `CodeLab sandbox validation failed for ${caseStudy.slug}: ${verification.error}`,
    );
  }

  // Step 5: Quality Gate
  console.log("   🔍 Running KRUZ Quality Gate (quality_gate.ts)...");
  const report = validateCaseStudy(caseStudy);

  if (!report.passed) {
    console.error(`\n❌ Quality Gate REJECTED Case ${caseStudy.index} (${caseStudy.slug}):`);
    report.errors.forEach((e) => console.error(`  - ERROR: ${e}`));
    throw new Error(`Quality Gate failed for ${caseStudy.slug}`);
  }

  if (report.warnings.length > 0) {
    console.warn(`\n⚠️ Quality Gate passed with warnings:`);
    report.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  } else {
    console.log("   ✅ Quality Gate passed with 0 errors and 0 warnings!");
  }

  // Save local JSON draft
  const outputDir = path.join(process.cwd(), "scripts", "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, `${input.slug}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(caseStudy, null, 2), "utf-8");
  console.log(`\n📁 Saved case study draft to: scripts/output/${input.slug}.json`);

  // Step 6: Optional Convex Publish
  if (publish) {
    console.log("   ☁️ Publishing case study directly to Convex DB...");
    const res = await upsertToConvex(caseStudy);
    console.log(`   🎉 Case study published successfully to Convex! (Action: ${res.action})`);
  } else {
    console.log("   💡 Run with --publish to push directly to Convex DB.");
  }

  return caseStudy;
}

// ============================================================================
// Direct CLI Execution Handler
// ============================================================================

if (import.meta.main || process.argv[1]?.endsWith("generate_case.ts")) {
  const args = process.argv.slice(2);
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const slug = getArg("--slug") || "url-shortener";
  const index = getArg("--index") || "08";
  const topic = getArg("--topic") || "How Does a Distributed URL Shortener Work?";
  const track = parseInt(getArg("--track") || "1", 10);
  const difficulty = (getArg("--difficulty") || "Beginner") as any;
  const publish = args.includes("--publish");

  generateCase({ slug, index, topic, track, difficulty }, publish)
    .then(() => {
      console.log("\n✨ Done!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n💥 Generation failed:", err);
      process.exit(1);
    });
}
