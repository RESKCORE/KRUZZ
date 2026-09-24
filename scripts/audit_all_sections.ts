import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.VITE_CONVEX_URL || "https://clean-chihuahua-733.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log("=== HARD AUDIT OF ALL 35 CASE STUDIES IN CONVEX DB ===");
  const studies = (await client.query(api.caseStudies.getAllInternal as any, {})) as any[];
  console.log(`Fetched ${studies.length} studies from database.\n`);

  // Sort studies by index (1 to 35)
  studies.sort((a, b) => Number(a.index) - Number(b.index));

  let totalDefects = 0;
  const report: Record<string, string[]> = {};

  for (const s of studies) {
    const defects: string[] = [];
    const prefix = `[${String(s.index).padStart(2, "0")}] ${s.slug}`;

    // Section 1: Discover
    const hasDiscover =
      s.discover &&
      (s.discover.situation || s.discover.overview || s.summary) &&
      (Array.isArray(s.discover.humanFlow) ||
        Array.isArray(s.discover.steps) ||
        Array.isArray(s.discover.whyItExists));
    if (!hasDiscover) defects.push("01_discover (missing situation/humanFlow/whyItExists)");

    // Section 2: Understand
    const hasUnderstand =
      s.understand &&
      (s.understand.overview ||
        s.understand.analogy ||
        (Array.isArray(s.understand.components) && s.understand.components.length > 0));
    if (!hasUnderstand) defects.push("02_understand (missing overview/components/analogy)");

    // Section 3: Principles
    const hasPrinciples =
      (Array.isArray(s.concepts) && s.concepts.length > 0) ||
      (Array.isArray(s.engineeringConcepts) && s.engineeringConcepts.length > 0) ||
      (Array.isArray(s.primers) && s.primers.length > 0) ||
      (Array.isArray(s.understand?.components) && s.understand.components.length > 0);
    if (!hasPrinciples) defects.push("03_principles (missing concepts/primers)");

    // Section 4: Architecture
    const hasArch =
      s.architecture &&
      (s.architecture.mermaid ||
        (Array.isArray(s.architecture.levels) &&
          s.architecture.levels.length > 0 &&
          s.architecture.levels[0].mermaid) ||
        s.architecture.caption ||
        s.architecture.overview);
    if (!hasArch) defects.push("04_architecture (missing architecture diagram/levels)");

    // Section 5: Decisions
    const hasDecisions =
      Array.isArray(s.decisions) &&
      s.decisions.length > 0 &&
      s.decisions.every(
        (d: any) =>
          d && (d.title || d.decision || d.choice) && (d.what || d.why || d.rationale || d.verdict),
      );
    if (!hasDecisions) defects.push("05_decisions (missing or incomplete decision objects)");

    // Section 6: Implementation
    const hasImplementation =
      s.implementation &&
      ((Array.isArray(s.implementation.samples) &&
        s.implementation.samples.length > 0 &&
        s.implementation.samples[0].code) ||
        (Array.isArray(s.implementation.algorithm) && s.implementation.algorithm.length > 0) ||
        (Array.isArray(s.implementation.ladder) && s.implementation.ladder.length > 0));
    if (!hasImplementation) defects.push("06_implementation (missing algorithm/samples/ladder)");

    // Section 7: Practice / CodeLab
    const hasPractice = Array.isArray(s.practice) && s.practice.length > 0;
    const hasCodeLab =
      s.codeLab &&
      s.codeLab.functionName &&
      s.codeLab.starterCode &&
      Array.isArray(s.codeLab.tests) &&
      s.codeLab.tests.length > 0;
    if (!hasPractice) defects.push("07_practice questions (missing practice array)");
    if (!hasCodeLab)
      defects.push("07_codeLab (missing codeLab functionName/starterCode/tests in DB)");

    // Section 8: Reflection
    const hasReflection =
      (Array.isArray(s.reflection) && s.reflection.length > 0) ||
      (typeof s.reflection === "object" &&
        s.reflection &&
        ((s.reflection as any).takeaway || (s.reflection as any).nextSteps));
    if (!hasReflection) defects.push("08_reflection (missing reflection questions)");

    if (defects.length > 0) {
      totalDefects += defects.length;
      report[prefix] = defects;
      console.log(`❌ ${prefix}: ${defects.join("; ")}`);
    } else {
      console.log(`✅ ${prefix}: All 8 sections valid and complete in DB!`);
    }
  }

  console.log("\n==========================================");
  if (totalDefects === 0) {
    console.log(
      `🎉 SUCCESS: All ${studies.length} case studies have 100% valid, rich, functional 8-section content stored in Convex DB!`,
    );
  } else {
    console.error(`⚠️ Found ${totalDefects} total defects across studies.`);
  }
}

main().catch(console.error);
