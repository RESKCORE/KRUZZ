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
    name: "gemini",
    keyEnv: "gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    model: "gemini-3.6-flash",
  },
  {
    name: "groq",
    keyEnv: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "openai/gpt-oss-20b",
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

async function callOpenAILike(
  cfg: ProviderConfig,
  messages: ChatMessage[],
  jsonMode: boolean,
): Promise<string> {
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
          "HTTP-Referer": "https://kruzz.app",
          "X-Title": "KRUZZ",
        }
      : {}),
  };

  const res = await fetch(cfg.url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${cfg.name} HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${cfg.name}: empty response`);
  return content;
}

async function callGemini(cfg: ProviderConfig, messages: ChatMessage[]): Promise<string> {
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
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`gemini HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  if (!text) throw new Error("gemini: empty response");
  return text;
}

/** Call the first available provider, falling back through the rest. */
async function tryProviders(
  messages: ChatMessage[],
  jsonMode: boolean,
): Promise<{ text: string; provider: ProviderName }> {
  let lastErr: unknown = null;
  for (const cfg of availableProviders()) {
    try {
      const text =
        cfg.name === "gemini"
          ? await callGemini(cfg, messages)
          : await callOpenAILike(cfg, messages, jsonMode);
      return { text, provider: cfg.name };
    } catch (e) {
      lastErr = e;
      // try next provider
    }
  }
  throw lastErr ?? new Error("No AI provider configured");
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
};

const SCORE_PROMPT = `You are a supportive, high-standards senior software engineering instructor grading a student's coding lab and conceptual explanation for a system architecture course.

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
  const userContent = [
    `Lab: ${labTitle}`,
    `Requirement: ${prompt}`,
    `Language chosen by student: ${language}`,
    ``,
    `Student's code:\n\`\`\`${language}\n${code}\n\`\`\``,
    ``,
    `Student's explanation:\n${explanation}`,
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: SCORE_PROMPT },
    { role: "user", content: userContent },
  ];

  const { text } = await tryProviders(messages, true);

  return parseLabGrade(text);
}

function parseLabGrade(text: string): LabGrade {
  try {
    // Strip markdown fences / leading noise
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("no object found");
    const obj = JSON.parse(cleaned.slice(start, end + 1)) as {
      score?: unknown;
      summary?: unknown;
      strengths?: unknown;
      mistakes?: unknown;
      nextStep?: unknown;
    };

    const score = clampScore(typeof obj.score === "number" ? obj.score : Number(obj.score));
    const passed = score >= 80;
    const summary =
      typeof obj.summary === "string" ? obj.summary : passed ? "Good work." : "Keep going.";
    const strengths = Array.isArray(obj.strengths)
      ? obj.strengths.filter((s): s is string => typeof s === "string")
      : [];
    const mistakes = Array.isArray(obj.mistakes)
      ? obj.mistakes
          .filter(
            (m): m is { area?: unknown; problem?: unknown; suggestion?: unknown } =>
              m !== null && typeof m === "object",
          )
          .map((m) => ({
            area: typeof m.area === "string" ? m.area : "General",
            problem: typeof m.problem === "string" ? m.problem : "",
            suggestion: typeof m.suggestion === "string" ? m.suggestion : "",
          }))
      : [];
    const nextStep =
      typeof obj.nextStep === "string"
        ? obj.nextStep
        : passed
          ? "Proceed to Reflection."
          : "Fix the issues above and resubmit.";

    return { score, passed, summary, strengths, mistakes, nextStep };
  } catch {
    // Fallback: extract score from text and return minimal shape
    const m = text.match(/(\d{1,3})/);
    const score = clampScore(m ? Number(m[1]) : 0);
    const passed = score >= 80;
    return {
      score,
      passed,
      summary: passed ? "Submission looks good." : "Some issues found — review and retry.",
      strengths: passed ? ["Correct implementation"] : [],
      mistakes: passed
        ? []
        : [
            {
              area: "General",
              problem: "Unable to parse detailed feedback.",
              suggestion: "Check your code logic and resubmit.",
            },
          ],
      nextStep: passed ? "Proceed to Reflection." : "Fix the issues above and resubmit.",
    };
  }
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
