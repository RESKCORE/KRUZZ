import type { CodeLab, CaseStudy, CodeTest } from "@/data/schema";

/**
 * Resolves a complete, guaranteed CodeLab from the database-backed case study.
 * Case studies and their code labs are stored exclusively in Convex DB.
 * The frontend code renders the DB record directly without storing case study content in the codebase.
 */
export function resolveCodeLab(study: CaseStudy | any | undefined | null): CodeLab {
  const dbLab = study?.codeLab;

  if (dbLab && dbLab.functionName && dbLab.signature) {
    const rawTests: CodeTest[] = Array.isArray(dbLab.tests) ? dbLab.tests : [];
    const rawHints: string[] = Array.isArray(dbLab.hints) ? dbLab.hints : [];

    const res: CodeLab = {
      title: dbLab.title || `${study?.title || "Case"} Lab`,
      brief: dbLab.brief || study?.summary || "Implement the solution to pass all unit tests.",
      language: (dbLab.language as any) || "python",
      functionName: dbLab.functionName,
      signature: dbLab.signature,
      starterCode:
        dbLab.starterCode ||
        `def ${dbLab.functionName}(*args):\n    # Write your solution here\n    pass\n`,
      hints: rawHints,
      tests: rawTests,
      explanationPrompt:
        dbLab.explanationPrompt ||
        `Explain your implementation approach and trade-offs for ${study?.title || "this case"}.`,
      mermaid: dbLab.mermaid || "",
    };

    if (dbLab.javaSignature) res.javaSignature = dbLab.javaSignature;
    if (dbLab.javaStarterCode) res.javaStarterCode = dbLab.javaStarterCode;
    if (dbLab.pythonSignature) res.pythonSignature = dbLab.pythonSignature;
    if (dbLab.pythonStarterCode) res.pythonStarterCode = dbLab.pythonStarterCode;
    if (dbLab.cSignature) res.cSignature = dbLab.cSignature;
    if (dbLab.cStarterCode) res.cStarterCode = dbLab.cStarterCode;
    if (dbLab.languages) res.languages = dbLab.languages;
    if (dbLab.requiredConcepts) res.requiredConcepts = dbLab.requiredConcepts;

    return res;
  }

  // Generic dynamic fallback only if DB record is temporarily unavailable or loading
  const title = study?.title || "System Implementation Lab";
  const slug = study?.slug || "system-lab";
  const funcName = slug.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() || "solution";

  const fallback: CodeLab = {
    title,
    brief: study?.summary || `Implement the core architectural function for ${title}.`,
    language: "python",
    functionName: funcName,
    signature: `def ${funcName}(payload: dict) -> tuple:`,
    starterCode: `def ${funcName}(payload):\n    """Implementation Lab for ${title}"""\n    if not payload:\n        return (False, "INVALID_PAYLOAD")\n    return (True, "SUCCESS")\n`,
    javaSignature: `public static Object[] ${funcName}(java.util.Map<String, Object> payload)`,
    javaStarterCode: `import java.util.Map;\n\npublic class Solution {\n    public static Object[] ${funcName}(Map<String, Object> payload) {\n        if (payload == null || payload.isEmpty()) return new Object[]{false, "INVALID_PAYLOAD"};\n        return new Object[]{true, "SUCCESS"};\n    }\n}\n`,
    cSignature: `bool ${funcName}(const char *request_json, char *response_out)`,
    cStarterCode: `// C Implementation\n#include <stdbool.h>\n#include <string.h>\n\nbool ${funcName}(const char *request_json, char *response_out) {\n    if (!request_json || strlen(request_json) == 0) return false;\n    strcpy(response_out, "SUCCESS");\n    return true;\n}\n`,
    hints: [
      "Validate input boundary conditions and null checks.",
      "Implement the core domain state transition.",
      "Return the verified operational result tuple.",
    ],
    tests: [
      {
        name: "Standard request execution",
        args: [{ action: "PROCESS" }],
        expected: [true, "SUCCESS"],
      },
      {
        name: "Reject empty or invalid input",
        args: [{}],
        expected: [false, "INVALID_PAYLOAD"],
      },
    ],
    explanationPrompt: `Explain your implementation for ${title}.`,
    mermaid: `graph TD\n    A[Client Request] --> B{Valid?}\n    B -- Yes --> C[Process]\n    B -- No --> D[Error]`,
  };

  return fallback;
}
