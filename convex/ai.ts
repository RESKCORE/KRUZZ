/**
 * Free-tier AI provider routing for KRUZZ.
 * Supports Gemini Flash, OpenRouter (free models) and Groq (llama/mixtral),
 * with automatic fallback in order. Keys live in Convex environment variables
 * (set via `npx convex env set`), never in the client bundle.
 *
 * npx convex env set GROQ_API_KEY <key>
 * npx convex env set OPENROUTER_API_KEY <key>
 * npx convex env set GEMINI_API_KEY <key>
 */

export type ProviderName = "gemini" | "openrouter" | "groq";

type ProviderConfig = {
  name: ProviderName;
  keyEnv: string;
  url: string;
  model: string;
};

const PROVIDERS: ProviderConfig[] = [
  {
    name: "groq",
    keyEnv: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "openai/gpt-oss-20b",
  },
  {
    name: "gemini",
    keyEnv: "gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    model: "gemini-3.6-flash",
  },
  {
    name: "openrouter",
    keyEnv: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "liquid/lfm-2.5-2.6b:free",
  },
];

function getProviderKey(cfg: ProviderConfig): string {
  const env = process.env as Record<string, string | undefined>;
  return (
    env[cfg.keyEnv] ||
    env[`${cfg.name.toUpperCase()}_API_KEY`] ||
    env[cfg.name.toUpperCase()] ||
    ""
  ).trim();
}

function availableProviders(): ProviderConfig[] {
  return PROVIDERS.filter((p) => getProviderKey(p).length > 0);
}

type ChatMessage = { role: "system" | "user"; content: string };

const circuitBreakers: Record<ProviderName, { failures: number; trippedUntil: number }> = {
  gemini: { failures: 0, trippedUntil: 0 },
  groq: { failures: 0, trippedUntil: 0 },
  openrouter: { failures: 0, trippedUntil: 0 },
};

export function isCircuitAvailable(name: ProviderName): boolean {
  const cb = circuitBreakers[name];
  if (!cb) return true;
  return Date.now() >= cb.trippedUntil;
}

export function recordProviderSuccess(name: ProviderName): void {
  const cb = circuitBreakers[name];
  if (cb) {
    cb.failures = 0;
    cb.trippedUntil = 0;
  }
}

export function recordProviderFailure(name: ProviderName): void {
  const cb = circuitBreakers[name];
  if (cb) {
    cb.failures++;
    if (cb.failures >= 3) {
      cb.trippedUntil = Date.now() + 60_000; // Trip circuit for 60s
    }
  }
}

/**
 * Normalizes and strips control characters from student input before prompt synthesis.
 */
/* eslint-disable no-control-regex */
export function normalizeLabInput(
  code: string,
  explanation: string,
): { cleanCode: string; cleanExplanation: string } {
  const cleanCode = (code || "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 20000);
  const cleanExplanation = (explanation || "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .slice(0, 5000);
  return { cleanCode, cleanExplanation };
}
/* eslint-enable no-control-regex */

async function callOpenAILike(
  cfg: ProviderConfig,
  messages: ChatMessage[],
  jsonMode: boolean,
): Promise<{ text: string; promptTokens?: number; completionTokens?: number }> {
  const key = getProviderKey(cfg);
  const payload: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature: 0.2,
    max_tokens: 2048,
  };
  if (jsonMode) payload["response_format"] = { type: "json_object" };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    ...(cfg.name === "openrouter"
      ? {
          "HTTP-Referer": "https://kruzz.indevs.in",
          "X-Title": "KRUZZ",
        }
      : {}),
  };

  const res = await fetch(cfg.url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000), // 15s request abort timeout
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${cfg.name} HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${cfg.name}: empty response`);
  return {
    text: content,
    ...(data.usage?.prompt_tokens !== undefined ? { promptTokens: data.usage.prompt_tokens } : {}),
    ...(data.usage?.completion_tokens !== undefined
      ? { completionTokens: data.usage.completion_tokens }
      : {}),
  };
}

async function callGemini(
  cfg: ProviderConfig,
  messages: ChatMessage[],
): Promise<{
  text: string;
  promptTokens?: number | undefined;
  completionTokens?: number | undefined;
}> {
  const key = getProviderKey(cfg);
  const url = `${cfg.url}/${cfg.model}:generateContent?key=${key}`;

  // Combine system and user messages for Gemini
  const combinedContent = messages.map((m) => m.content).join("\n\n");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: combinedContent }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(20000), // 20s request abort timeout
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`gemini HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  if (!text) throw new Error("gemini: empty response");
  return {
    text,
    ...(data.usageMetadata?.promptTokenCount !== undefined
      ? { promptTokens: data.usageMetadata.promptTokenCount }
      : {}),
    ...(data.usageMetadata?.candidatesTokenCount !== undefined
      ? { completionTokens: data.usageMetadata.candidatesTokenCount }
      : {}),
  };
}

/**
 * Call the first available provider, falling back at most once to prevent cascading cost spikes.
 * Checks provider circuit breakers.
 */
async function tryProviders(
  messages: ChatMessage[],
  jsonMode: boolean,
): Promise<{
  text: string;
  provider: ProviderName;
  model: string;
  promptTokens?: number | undefined;
  completionTokens?: number | undefined;
}> {
  let lastErr: unknown = null;
  const eligible = availableProviders().filter((p) => isCircuitAvailable(p.name));

  // Cap total provider attempts to 2 (primary + max 1 fallback)
  const attemptsToTry = eligible.slice(0, 2);

  for (const cfg of attemptsToTry) {
    try {
      const res =
        cfg.name === "gemini"
          ? await callGemini(cfg, messages)
          : await callOpenAILike(cfg, messages, jsonMode);
      recordProviderSuccess(cfg.name);
      return {
        text: res.text,
        provider: cfg.name,
        model: cfg.model,
        ...(res.promptTokens !== undefined ? { promptTokens: res.promptTokens } : {}),
        ...(res.completionTokens !== undefined ? { completionTokens: res.completionTokens } : {}),
      };
    } catch (e) {
      recordProviderFailure(cfg.name);
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("No AI provider currently available");
}

/**
 * Rich structured grade returned to the client.
 * Only score + passed are persisted in DB. The rest is display-only.
 * Keep in sync with CodeArena.tsx LabGrade type.
 */
export type LabGrade = {
  score: number; // 0-100
  passed: boolean; // score >= 80
  summary: string; // one-sentence overall verdict
  strengths: string[];
  mistakes: {
    area: string; // e.g. "Balance validation"
    problem: string; // what's wrong
    suggestion: string; // how to fix it
  }[];
  nextStep: string; // single actionable next step
  provider?: string | undefined;
  model?: string | undefined;
  actualPromptTokens?: number | undefined;
  actualOutputTokens?: number | undefined;
};

export const SCORE_PROMPT = `You are a supportive, high-standards senior software engineering instructor grading a student's coding lab and conceptual explanation for a system architecture course.

CRITICAL REQUIREMENTS:
1. The student MUST provide actual working code — not just comments, pseudocode, or placeholders.
2. The code MUST implement the core logic described in the lab prompt (the function name, inputs, outputs, and rules stated).
3. The explanation MUST be at least 20 words and demonstrate conceptual understanding.
4. MINIMUM PASSING SCORE IS 80/100.

PEDAGOGICAL GUIDELINES:
- Allow reasonable style variations (different variable names, different but equivalent logic).
- If the student's code is functional, correctly handles the required scenarios, and the explanation is thoughtful (>20 words), AWARD 85-100 POINTS.
- Only award below 80 if the student: did not write real code, has fatal logic errors, fails required outcomes, or wrote a shallow explanation (<20 words).
- Strengths should be specific and encouraging — name what the student did right.
- Mistakes must reference the exact area in the student's code that is wrong and give a concrete fix.

Return ONLY valid JSON with EXACTLY this shape (no extra keys, no markdown fences):
{
  "score": <integer 0-100>,
  "summary": "<one sentence verdict about the overall submission>",
  "strengths": ["<specific thing done correctly>", "..."],
  "mistakes": [
    {
      "area": "<short label, e.g. PIN validation>",
      "problem": "<what is wrong in their code>",
      "suggestion": "<concrete fix to apply>"
    }
  ],
  "nextStep": "<single most important next action for the student>"
}

If everything is solid, "mistakes" should be an empty array [] and "nextStep" should affirm they are ready to move on.`;

/**
 * Grade a student's lab attempt. Returns a LabGrade with structured feedback.
 * Called from a Convex action — the code and explanation are sent to the
 * model and then discarded; they are never written to the database.
 */
export async function gradeLabAttempt(
  labTitle: string,
  prompt: string,
  language: string,
  code: string,
  explanation: string,
): Promise<LabGrade> {
  const { cleanCode, cleanExplanation } = normalizeLabInput(code, explanation);

  const userContent = [
    `Lab: ${labTitle}`,
    `Requirement: ${prompt}`,
    `Language chosen by student: ${language}`,
    ``,
    `Student's code:\n\`\`\`${language}\n${cleanCode}\n\`\`\``,
    ``,
    `Student's explanation:\n${cleanExplanation}`,
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: SCORE_PROMPT },
    { role: "user", content: userContent },
  ];

  const { text, provider, model, promptTokens, completionTokens } = await tryProviders(
    messages,
    true,
  );

  return {
    ...parseLabGrade(text),
    provider,
    model,
    ...(promptTokens !== undefined ? { actualPromptTokens: promptTokens } : {}),
    ...(completionTokens !== undefined ? { actualOutputTokens: completionTokens } : {}),
  };
}

export function parseLabGrade(text: string): LabGrade {
  // Strip markdown fences / leading noise
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Invalid AI model output: No JSON object found in response");
  }

  let obj: {
    score?: unknown;
    summary?: unknown;
    strengths?: unknown;
    mistakes?: unknown;
    nextStep?: unknown;
  };

  try {
    obj = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("Invalid AI model output: Failed to parse JSON response");
  }

  if (typeof obj.score !== "number" || !Number.isFinite(obj.score)) {
    throw new Error("Invalid AI model output: Missing or non-numeric score");
  }

  const score = clampScore(obj.score);
  const passed = score >= 80;

  if (typeof obj.summary !== "string" || obj.summary.trim().length === 0) {
    throw new Error("Invalid AI model output: Missing or empty summary");
  }
  const summary = obj.summary.trim().slice(0, 500);

  const strengths = Array.isArray(obj.strengths)
    ? obj.strengths
        .filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 300))
        .slice(0, 10)
    : [];

  const mistakes = Array.isArray(obj.mistakes)
    ? obj.mistakes
        .filter(
          (m: unknown): m is { area?: unknown; problem?: unknown; suggestion?: unknown } =>
            m !== null && typeof m === "object",
        )
        .map((m) => ({
          area: typeof m.area === "string" ? m.area.trim().slice(0, 100) : "General",
          problem: typeof m.problem === "string" ? m.problem.trim().slice(0, 300) : "",
          suggestion: typeof m.suggestion === "string" ? m.suggestion.trim().slice(0, 300) : "",
        }))
        .slice(0, 10)
    : [];

  const nextStep =
    typeof obj.nextStep === "string" && obj.nextStep.trim().length > 0
      ? obj.nextStep.trim().slice(0, 300)
      : passed
        ? "Proceed to Reflection."
        : "Fix the issues above and resubmit.";

  return { score, passed, summary, strengths, mistakes, nextStep };
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
