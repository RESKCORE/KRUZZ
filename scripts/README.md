# KRUZZ Database & Tooling Scripts (`scripts/`)

This directory contains standalone CLI scripts and automation tools for seeding, auditing, and maintaining the KRUZZ curriculum in the Convex database.

---

## 🛠️ Key Scripts

| Script                                | Purpose                                                                                                                                                                                                                                              |
| :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit_all_sections.ts`               | **Comprehensive Verification Tool**: Audits all 35 case studies in the Convex DB to verify that all 8 sections (Discover, Understand, Principles, Architecture, Decisions, Implementation, Practice/CodeLab, Reflection) are complete and non-empty. |
| `quality_gate.ts`                     | Complete project verification pipeline (typecheck, lint, format check, tests, build).                                                                                                                                                                |
| `seed_curriculum_all_35_languages.ts` | Canonical seed script populating multi-language (Python, Java, C) implementations across all cases.                                                                                                                                                  |
| `curriculum_translations.ts`          | Multi-language translation enrichments for CodeArena.                                                                                                                                                                                                |
| `generate_case.ts`                    | Interactive CLI tool for generating a new case study following the KRUZ SRS specification.                                                                                                                                                           |

---

## 🚀 Running Scripts

Scripts are executed using [Bun](https://bun.sh) or Node.js with the configured Convex environment:

```bash
# Run the complete 8-section database audit
bun scripts/audit_all_sections.ts

# Run the full quality gate
npm run verify
```
