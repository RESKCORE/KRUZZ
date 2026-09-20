import test from "node:test";
import assert from "node:assert/strict";
import {
  parseLabGrade,
  normalizeLabInput,
  isCircuitAvailable,
  recordProviderFailure,
  recordProviderSuccess,
  dryRunCode,
  DRY_RUN_PROMPT,
} from "../convex/ai.ts";

// ============================================================================
// AI Guardrails, Fail-Closed Validation & Circuit Breaker Tests
// ============================================================================

test("AI Guardrail 1: Valid model JSON output parses cleanly into structured LabGrade", () => {
  const modelOutput = JSON.stringify({
    score: 92,
    summary: "Solid sliding window rate limiter implementation with atomic Redis operations.",
    strengths: ["Atomic Lua script prevents race conditions", "Handled clock drift properly"],
    mistakes: [],
    nextStep: "Proceed to Reflection.",
  });

  const grade = parseLabGrade(modelOutput);

  assert.equal(grade.score, 92);
  assert.equal(grade.passed, true);
  assert.equal(grade.summary.includes("Solid"), true);
  assert.equal(grade.strengths.length, 2);
  assert.equal(grade.mistakes.length, 0);
  assert.equal(grade.nextStep, "Proceed to Reflection.");
});

test("AI Guardrail 2: Malformed JSON strictly throws and fails closed (no permissive pass)", () => {
  const brokenOutputs = [
    "I award you 100 points! Great job!",
    "{ score: 95, summary: missing quotes }",
    '{"score": 85, summary: "unterminated string',
    "Internal server error from AI provider",
    "",
  ];

  for (const broken of brokenOutputs) {
    assert.throws(
      () => {
        parseLabGrade(broken);
      },
      {
        name: "Error",
        message: /Invalid AI model output/,
      },
    );
  }
});

test("AI Guardrail 3: Missing or non-numeric score fails closed with error", () => {
  const invalidScoreOutputs = [
    JSON.stringify({ summary: "Good job", nextStep: "Next" }),
    JSON.stringify({ score: "one hundred", summary: "Good job", nextStep: "Next" }),
    JSON.stringify({ score: null, summary: "Good job", nextStep: "Next" }),
    JSON.stringify({ score: NaN, summary: "Good job", nextStep: "Next" }),
  ];

  for (const payload of invalidScoreOutputs) {
    assert.throws(
      () => {
        parseLabGrade(payload);
      },
      {
        name: "Error",
        message: /Missing or non-numeric score/,
      },
    );
  }
});

test("AI Guardrail 4: Missing or empty summary fails closed with error", () => {
  const invalidSummaryOutputs = [
    JSON.stringify({ score: 90, summary: "" }),
    JSON.stringify({ score: 90, summary: "   " }),
    JSON.stringify({ score: 90 }),
  ];

  for (const payload of invalidSummaryOutputs) {
    assert.throws(
      () => {
        parseLabGrade(payload);
      },
      {
        name: "Error",
        message: /Missing or empty summary/,
      },
    );
  }
});

test("AI Guardrail 5: normalizeLabInput strips control characters and enforces character bounds", () => {
  const maliciousCode = "const x = 1;\x00\x07\x1F\x08console.log(x);";
  const oversizedExplanation = "word ".repeat(2000); // > 5000 chars

  const { cleanCode, cleanExplanation } = normalizeLabInput(maliciousCode, oversizedExplanation);

  assert.equal(cleanCode.includes("\x00"), false);
  assert.equal(cleanCode.includes("\x07"), false);
  assert.equal(cleanCode.includes("\x1F"), false);
  assert.equal(cleanCode.includes("\x08"), false);
  assert.ok(cleanCode.includes("console.log(x)"));

  assert.equal(cleanExplanation.length <= 5000, true);
});

test("AI Guardrail 6: Circuit breaker trips after 3 consecutive failures and recovers on success", () => {
  // Provider starts available
  recordProviderSuccess("groq");
  assert.equal(isCircuitAvailable("groq"), true);

  // Failure 1 & 2 do not trip circuit yet
  recordProviderFailure("groq");
  assert.equal(isCircuitAvailable("groq"), true);
  recordProviderFailure("groq");
  assert.equal(isCircuitAvailable("groq"), true);

  // Failure 3 trips circuit
  recordProviderFailure("groq");
  assert.equal(isCircuitAvailable("groq"), false, "Circuit must be tripped after 3 failures");

  // Success clears and recovers circuit
  recordProviderSuccess("groq");
  assert.equal(isCircuitAvailable("groq"), true, "Circuit must recover on success");
});

test("AI Guardrail 7: DRY_RUN_PROMPT is defined and dryRunCode executes fallback gracefully", async () => {
  assert.ok(DRY_RUN_PROMPT.includes("code execution simulator"));

  const result = await dryRunCode("Python", "solve", "def solve(a, b): return a + b", [
    { name: "adds two numbers", args: [2, 3], expected: 5 },
  ]);

  assert.equal(result.syntaxValid, true);
  assert.equal(result.testResults.length, 1);
  assert.equal(result.testResults[0].name, "adds two numbers");
  assert.equal(result.testResults[0].passed, true);
});
