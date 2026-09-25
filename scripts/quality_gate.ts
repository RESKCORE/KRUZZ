import { execSync } from "child_process";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error(
    "Missing VITE_CONVEX_URL. Configure the Convex deployment before running this script.",
  );
}
const client = new ConvexHttpClient(CONVEX_URL);

export interface ValidationReport {
  slug: string;
  index: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCaseStudy(cs: any): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Mandatory Schema Fields per KRUZ Schema
  const requiredFields = [
    "id",
    "slug",
    "index",
    "title",
    "shortTitle",
    "category",
    "subcategory",
    "difficulty",
    "learnerLevel",
    "estimatedTime",
    "minutes",
    "status",
    "tier",
    "rcCost",
    "summary",
    "learningObjectives",
    "prerequisites",
    "engineeringConcepts",
    "technologies",
    "tech",
    "tags",
    "glossary",
    "primers",
    "discover",
    "understand",
    "concepts",
    "architecture",
    "decisions",
    "implementation",
    "practice",
    "reflection",
    "techNotes",
    "codeLab",
  ];

  for (const field of requiredFields) {
    if (cs[field] === undefined || cs[field] === null) {
      errors.push(`Missing required field: '${field}'`);
    }
  }

  // 2. Dual-Language CodeLab Checks
  if (cs.codeLab) {
    if (!cs.codeLab.functionName) errors.push("codeLab missing functionName");
    if (!cs.codeLab.signature) errors.push("codeLab missing Python signature");
    if (!cs.codeLab.starterCode) errors.push("codeLab missing Python starterCode");
    if (!cs.codeLab.javaSignature && !cs.codeLab.languages?.java?.signature) {
      errors.push("codeLab missing Java signature (javaSignature or languages.java.signature)");
    }
    if (!cs.codeLab.javaStarterCode && !cs.codeLab.languages?.java?.starterCode) {
      errors.push(
        "codeLab missing Java starterCode (javaStarterCode or languages.java.starterCode)",
      );
    }
    if (!Array.isArray(cs.codeLab.tests) || cs.codeLab.tests.length === 0) {
      errors.push("codeLab missing tests array");
    }
  }

  // 3. Track 0 Scope Guardrail: Zero networking / database vocabulary
  const isTrack0 = parseInt(cs.index, 10) >= 1 && parseInt(cs.index, 10) <= 7;
  if (isTrack0) {
    const forbidden = [
      "http",
      "server",
      "network",
      "database",
      "ip address",
      "dns",
      "rest api",
      "endpoint",
    ];
    const textToCheck = [
      cs.summary,
      cs.discover?.situation,
      cs.understand?.overview,
      JSON.stringify(cs.concepts),
      JSON.stringify(cs.architecture),
      JSON.stringify(cs.implementation?.behaviour),
    ]
      .join(" ")
      .toLowerCase();

    // Allow pedagogical disclaimers like 'without networking', 'no external network', etc.
    const scrubbed = textToCheck
      .replace(/without (any |external )?networking/g, "")
      .replace(/no (external )?network(ing)?( connection)?/g, "")
      .replace(/no (external )?database/g, "")
      .replace(/zero networking/g, "");

    for (const term of forbidden) {
      if (scrubbed.includes(term)) {
        errors.push(
          `Track 0 violation: Found forbidden networking/database term '${term}' in single-process OOP case.`,
        );
      }
    }
  }

  // 4. Scoped Guardrails for Specific Cases
  if (cs.slug === "image-cdn-delivery") {
    const text = JSON.stringify(cs).toLowerCase();
    if (text.includes("bgp") || text.includes("anycast") || text.includes("origin shield")) {
      errors.push(
        "Case 10 Scope violation: BGP/Anycast/Origin Shield mentioned. Must be near-vs-far latency only.",
      );
    }
  }
  if (cs.slug === "search-autocomplete") {
    const text = JSON.stringify(cs).toLowerCase();
    if (/\btries?\b/i.test(text) || /\bprefix[\s-]tree/i.test(text)) {
      errors.push(
        "Case 12 Scope violation: Trie/Prefix-tree mentioned. Must use plain list with startswith().",
      );
    }
  }
  if (cs.slug === "two-factor-totp") {
    const text = JSON.stringify(cs).toLowerCase();
    if (!text.includes("simplified") && !text.includes("stand-in")) {
      errors.push(
        "Case 16 Scope violation: Must explicitly state in techNotes that this is a toy 30-sec simulation, not production RFC 6238.",
      );
    }
  }
  if (cs.slug === "cloud-data-deduplication") {
    const text = JSON.stringify(cs).toLowerCase();
    if (
      text.includes("rolling hash") ||
      text.includes("content-defined chunking") ||
      text.includes("rabin")
    ) {
      errors.push(
        "Case 21 Scope violation: Rolling hashes / CDC mentioned. Must be whole-file hash lookup only.",
      );
    }
  }

  // 5. Vocabulary Gate Check
  const definedTerms = new Set<string>();
  (cs.prerequisites || []).forEach((p: string) => definedTerms.add(p.toLowerCase()));
  (cs.glossary || []).forEach((g: any) => definedTerms.add((g.term || "").toLowerCase()));

  for (const concept of cs.engineeringConcepts || []) {
    const conceptLower = concept.toLowerCase();
    const found = Array.from(definedTerms).some(
      (d) => d.includes(conceptLower) || conceptLower.includes(d),
    );
    if (!found) {
      warnings.push(
        `Vocabulary Gate warning: Concept '${concept}' not explicitly in glossary or prerequisites.`,
      );
    }
  }

  // 6. Mermaid Diagram Syntax Linting
  const diagrams: { name: string; chart?: string }[] = [
    { name: "CodeLab", chart: cs.codeLab?.mermaid },
  ];

  if (Array.isArray(cs.architecture?.levels)) {
    cs.architecture.levels.forEach((lvl: any, idx: number) => {
      diagrams.push({ name: `Architecture Level ${idx + 1}`, chart: lvl.mermaid });
    });
  }

  for (const d of diagrams) {
    if (!d.chart || typeof d.chart !== "string") {
      errors.push(`Missing or invalid Mermaid chart for ${d.name}`);
      continue;
    }
    const trimmed = d.chart.trim();
    if (
      !trimmed.startsWith("graph TD") &&
      !trimmed.startsWith("graph LR") &&
      !trimmed.startsWith("sequenceDiagram")
    ) {
      errors.push(
        `Mermaid diagram for ${d.name} must start with 'graph TD', 'graph LR', or 'sequenceDiagram'.`,
      );
    }
  }

  // 7. Python Starter Code Syntax Check
  if (cs.codeLab?.starterCode) {
    try {
      const pyTestScript = `import ast\nast.parse(${JSON.stringify(cs.codeLab.starterCode)})\n`;
      execSync('python -c "' + pyTestScript.replace(/"/g, '\\"') + '"', { stdio: "pipe" });
    } catch (err: any) {
      errors.push(`Python starterCode syntax error: ${err.message}`);
    }
  }

  // 8. Java Starter Code Structural Lint
  const javaCode = cs.codeLab?.javaStarterCode || cs.codeLab?.languages?.java?.starterCode;
  if (javaCode) {
    const openBraces = (javaCode.match(/\{/g) || []).length;
    const closeBraces = (javaCode.match(/\}/g) || []).length;
    if (openBraces !== closeBraces || openBraces === 0) {
      errors.push(
        `Java starterCode has unbalanced braces { } (${openBraces} open vs ${closeBraces} close).`,
      );
    }
    if (!javaCode.includes("class Solution") && !javaCode.includes("public class")) {
      errors.push("Java starterCode must declare a class (e.g. 'public class Solution').");
    }
  }

  return {
    slug: cs.slug,
    index: cs.index,
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

export async function upsertToConvex(caseStudy: any) {
  const report = validateCaseStudy(caseStudy);
  if (!report.passed) {
    console.error(`[QualityGate REJECTED] Case ${caseStudy.index} (${caseStudy.slug}):`);
    report.errors.forEach((e) => console.error(`  - ERROR: ${e}`));
    throw new Error(`Quality Gate failed for ${caseStudy.slug}`);
  }

  if (report.warnings.length > 0) {
    console.warn(`[QualityGate WARNING] Case ${caseStudy.index} (${caseStudy.slug}):`);
    report.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  // Direct persistence to Convex
  const adminKey = process.env.ADMIN_KEY || "kruzz-super-secret-admin-key-2026-prod";
  const res = await client.mutation(api.caseStudies.upsert, { caseStudy, adminKey });
  console.log(
    `[Convex DB SUCCESS] Case ${caseStudy.index} (${caseStudy.slug}) saved -> ${res.action}`,
  );
  return res;
}
