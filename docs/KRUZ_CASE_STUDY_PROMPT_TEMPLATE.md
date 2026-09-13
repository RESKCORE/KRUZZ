# KRUZZ — AI Case Study Generation Prompt & Schema Guide

This document provides the exact **System Prompt**, **JSON Schema Definition**, and **Quality Directives** to generate production-ready system architecture investigations for **KRUZZ** using frontier AI reasoning models (Claude 3.7 Sonnet, OpenAI o3-mini / GPT-4o, Google Gemini 2.5 Pro).

---

## 1. Master System Prompt for Frontier Models

Copy and paste the prompt below into your LLM:

````markdown
You are a Staff Distributed Systems Architect and Principal Technical Educator creating an in-depth engineering case study for KRUZZ (a real-world system architecture investigation platform).

Your goal is to author a complete, deeply technical, and mathematically rigorous investigation on the following assigned topic:
[INSERT CASE TOPIC, e.g.: "Case 18: Raft Consensus Protocol & Leader Election"]

### Pedagogical Philosophy & Quality Mandates:

1. **Zero Fluff & Zero Buzzword Salad**: Do not write generic introductory material. Dive immediately into production reality, failure mechanics, and architectural trade-offs.
2. **First-Principles Physics & Math**: Ground performance limits in concrete numbers (e.g. speed of light in fiber, disk IOPS, memory bandwidth, network RTT, quorum math `(N/2)+1`).
3. **8-Section Progressive Structure**: You must populate all 8 canonical KRUZZ sections:
   - 01 Discover: Real incident / crisis situation, human flow, driving question, why it exists.
   - 02 Understand: Component breakdown (What / Why / Does), everyday vs. technical analogy, step-by-step state flow.
   - 03 Concepts: 2+ core engineering principles with simple definition, technical deep-dive, case application, common mistakes, and mini practice.
   - 04 Architecture: 3 progressive Mermaid diagrams using dark theme styling (Level 1: Topology, Level 2: Component Flow, Level 3: Failure / Resiliency Path).
   - 05 Decisions: 2+ architectural trade-off matrices (What, Why, Problem Solved, Without It, Alternatives, Trade-off).
   - 06 Implementation: Behavior explanation, step-by-step algorithm, 4-level ladder (Level 0 to Level 3), fully commented code sample (TypeScript or Python), and line-by-line plain English explanations.
   - 07 Practice: 4 exercises mapped to [Understand, Modify, Build, Think].
   - 08 Reflection: 3 open engineering mental model reflection prompts.
   - CodeLab: An interactive coding challenge with title, brief, signature, starter code, hints, test cases, and explanation prompt.
4. **Valid JSON Output**: Return ONLY a valid, parseable JSON object matching the KRUZZ CaseStudy schema below. No Markdown code fences around the JSON, or wrap strictly in ```json.
````

---

## 2. Reference Schema Definition (TypeScript)

The generated JSON must satisfy the following TypeScript interface:

```typescript
export interface CaseStudy {
  id: string; // e.g. "case-18-raft-consensus"
  slug: string; // e.g. "raft-consensus-leader-election"
  index: string; // e.g. "18"
  title: string; // e.g. "How Does the Raft Consensus Protocol Work?"
  shortTitle: string; // e.g. "Raft Consensus"
  category:
    | "Web Systems"
    | "Distributed Data"
    | "Security"
    | "Realtime"
    | "Reliability"
    | "AI Infrastructure";
  subcategory: string; // e.g. "Consensus & State Machine Replication"
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  learnerLevel: "Explorer" | "Builder" | "Engineer" | "Systems Thinker";
  estimatedTime: string; // e.g. "60-75 minutes"
  minutes: number; // e.g. 60
  status: "published";
  summary: string; // 1-2 sentence compelling technical hook
  learningObjectives: string[]; // 4 bullet points
  prerequisites: string[]; // 3 bullet points
  engineeringConcepts: string[]; // 5-8 concept tags
  technologies: string[]; // e.g. ["Raft", "etcd", "gRPC", "WAL", "Go"]
  tech: string[]; // 3-4 short badge tags
  tags: string[];
  rcCost: number; // 30 (Explorer) to 120 (Systems Thinker)
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
    practice: string[];
  }[];
  architecture: {
    caption: string;
    levels: {
      title: string;
      description: string;
      mermaid: string; // Mermaid flowchart or sequenceDiagram
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
    algorithm: string[];
    ladder: {
      level: string; // "Level 0", "Level 1", etc.
      title: string;
      detail: string;
    }[];
    samples: {
      language: "typescript" | "python" | "go";
      filename: string;
      code: string;
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
    functionName: string;
    signature: string;
    starterCode: string;
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

## 3. Gold-Standard Example Reference File

Use [case-02-cdn-edge-caching.json](file:///e:/RCA/src/data/examples/case-02-cdn-edge-caching.json) as the 1:1 benchmark when prompting the model or evaluating generated case outputs.

---

## 4. How to Submit New Cases into KRUZZ

1. Generate the JSON for your desired topic using the prompt above.
2. Save the output as a `.json` file or directly paste it into our chat.
3. We validate the JSON against `schema.ts`, register the case in `src/data/caseStudies.ts`, and it immediately appears on the **KRUZZ** curriculum deck with live hand-drawn diagrams, code sandbox, and gamified reasoning credits!
