/**
 * Single authoritative server-owned definition of reward rules, rank thresholds,
 * curriculum section structure, AI quotas & budgets, and verified store catalog for KRUZZ.
 */

export const REWARD_RULES = {
  sectionComplete: 1,
  labPass: 10,
  caseComplete: 20,
} as const;

export const RANKS = [
  { at: 0, name: "Observer" },
  { at: 200, name: "Apprentice" },
  { at: 500, name: "Investigator" },
  { at: 2000, name: "Engineer" },
  { at: 5000, name: "Systems Thinker" },
] as const;

export function rankForPoints(points: number): string {
  let current = "Observer";
  for (const r of RANKS) {
    if (points >= r.at) current = r.name;
  }
  return current;
}

/**
 * Canonical 8-Section Curriculum Specification.
 * Sections 0-5 and 7 are reading sections that award 1 RC upon first view.
 * Section 6 is the Practice / Code Lab evaluated exclusively by the AI grading engine (awards 10 RC upon pass).
 * Section 6 CANNOT be self-credited by client calls to saveCaseProgress.
 */
export const CANONICAL_SECTIONS = [
  {
    index: 0,
    id: "discover",
    title: "Discover",
    type: "reading",
    rewardPoints: 1,
    required: true,
  },
  {
    index: 1,
    id: "understand",
    title: "Understand",
    type: "reading",
    rewardPoints: 1,
    required: true,
  },
  {
    index: 2,
    id: "concepts",
    title: "Concepts",
    type: "reading",
    rewardPoints: 1,
    required: true,
  },
  {
    index: 3,
    id: "architecture",
    title: "Architecture",
    type: "reading",
    rewardPoints: 1,
    required: true,
  },
  {
    index: 4,
    id: "decisions",
    title: "Decisions",
    type: "reading",
    rewardPoints: 1,
    required: true,
  },
  {
    index: 5,
    id: "implementation",
    title: "Implementation",
    type: "reading",
    rewardPoints: 1,
    required: true,
  },
  {
    index: 6,
    id: "practice",
    title: "Practice (Code Lab)",
    type: "lab",
    rewardPoints: 10,
    required: true,
  },
  {
    index: 7,
    id: "reflection",
    title: "Reflection",
    type: "reading",
    rewardPoints: 1,
    required: true,
  },
] as const;

export const VALID_READING_SECTION_INDICES = new Set([0, 1, 2, 3, 4, 5, 7]);
export const ALL_CASE_SECTION_INDICES = [0, 1, 2, 3, 4, 5, 6, 7];

export type StoreItemType = "one_time_ownership" | "repeatable_consumable" | "cosmetic_equipable";

export type StoreItemDefinition = {
  id: string;
  name: string;
  cost: number;
  description: string;
  type: StoreItemType;
};

export const STORE_CATALOG: Record<string, StoreItemDefinition> = {
  "pdf-architecture-blueprints": {
    id: "pdf-architecture-blueprints",
    name: "System Architecture Blueprint Guide",
    cost: 150,
    description: "Production architectural reference guide & cheat sheet.",
    type: "one_time_ownership",
  },
  "pack-terminal-themes": {
    id: "pack-terminal-themes",
    name: "Investigator Terminal Color Suite",
    cost: 100,
    description: "Dark Neumorphic & Electric Acid themes for your CLI.",
    type: "one_time_ownership",
  },
  "badge-verified-thinker": {
    id: "badge-verified-thinker",
    name: "Verified Systems Thinker Certificate",
    cost: 250,
    description: "Cryptographically stamped portfolio dossier badge.",
    type: "one_time_ownership",
  },
};

/**
 * AI Budget, Quota, and Pricing Governance.
 * Distinguishes:
 * 1. Attempt Quotas (frequency caps)
 * 2. Token Quotas (payload and throughput caps)
 * 3. Provider Cost Budgets (USD ceilings)
 */
export const AI_LIMITS = {
  // 1. Attempt Quotas & Lifecycles
  COOLDOWN_SECONDS: 5,
  MAX_ATTEMPTS_PER_HOUR: 15,
  MAX_ATTEMPTS_PER_DAY: 30,
  RESERVATION_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes reservation timeout

  // 2. Token Quotas & Ceilings (Estimated 1 token ≈ 4 characters)
  MAX_INPUT_CODE_BYTES: 20000,
  MAX_INPUT_EXPLANATION_BYTES: 5000,
  MAX_ESTIMATED_INPUT_TOKENS_PER_ATTEMPT: 6500,
  MAX_TOTAL_PROMPT_TOKENS: 8000, // Enforces full prompt budget (system instructions + context + rubric + code + explanation)
  MAX_OUTPUT_TOKENS_PER_ATTEMPT: 1024,
  DAILY_USER_TOKEN_CEILING: 100_000, // 100k tokens/user/day

  // 3. Provider Cost Budgets (USD)
  DAILY_USER_SPEND_CEILING_USD: 0.5, // $0.50 max user daily estimated spend
  DAILY_SYSTEM_SPEND_CEILING_USD: 25.0, // $25.00 max aggregate system spend per 24 hours
} as const;

export const IMAGE_LIMITS = {
  MAX_WIDTH: 4096,
  MAX_HEIGHT: 4096,
  MAX_PIXELS: 16_777_216, // 16 megapixels (prevents decompression bombs)
} as const;

export const AI_MODEL_PRICING = {
  version: "v1.0",
  // Standard pricing per 1M tokens (Llama-3.3-70b / DeepSeek-R1 / Gemini 2.5 flash tier)
  default: {
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
  },
} as const;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  const { inputPricePerMillion, outputPricePerMillion } = AI_MODEL_PRICING.default;
  const inputCost = (inputTokens / 1_000_000) * inputPricePerMillion;
  const outputCost = (outputTokens / 1_000_000) * outputPricePerMillion;
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Calculates total estimated prompt tokens including system prompt,
 * case requirements, rubric, learner code, and learner explanation.
 */
export function calculateFullPromptTokens(
  systemPrompt: string,
  labTitle: string,
  labPrompt: string,
  language: string,
  code: string,
  explanation: string,
  rubricVersion = "v1.0",
): number {
  const fullPromptText = [
    systemPrompt,
    `Lab: ${labTitle}`,
    `Requirement: ${labPrompt}`,
    `Rubric: ${rubricVersion}`,
    `Language chosen by student: ${language}`,
    ``,
    `Student's code:\n\`\`\`${language}\n${code}\n\`\`\``,
    ``,
    `Student's explanation:\n${explanation}`,
  ].join("\n");

  return estimateTokens(fullPromptText);
}

/**
 * Validates image header magic bytes (JPEG, PNG, or WebP with RIFF and WEBP markers).
 */
export function validateImageSignatureBytes(
  header: Uint8Array,
): "image/jpeg" | "image/png" | "image/webp" {
  if (header.length < 3) {
    throw new Error("Invalid image header: Header buffer too small");
  }

  // JPEG: FF D8 FF
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (isJpeg) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (header.length >= 8) {
    const isPng =
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47 &&
      header[4] === 0x0d &&
      header[5] === 0x0a &&
      header[6] === 0x1a &&
      header[7] === 0x0a;
    if (isPng) return "image/png";
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (header.length >= 12) {
    const isWebp =
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 && // RIFF
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50; // WEBP
    if (isWebp) return "image/webp";
  }

  throw new Error(
    "Invalid image file signature. Object header must match JPEG, PNG, or WebP magic bytes",
  );
}

/**
 * Parses dimensions from image buffer and enforces decompression-bomb protection.
 */
export function parseImageDimensionsAndValidate(buffer: Uint8Array): {
  format: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
} {
  const format = validateImageSignatureBytes(buffer);
  let width = 0;
  let height = 0;

  if (format === "image/png") {
    if (buffer.length < 24) throw new Error("Truncated PNG header");
    // IHDR chunk: width at 16..19, height at 20..23 (Big-Endian)
    width = ((buffer[16]! << 24) | (buffer[17]! << 16) | (buffer[18]! << 8) | buffer[19]!) >>> 0;
    height = ((buffer[20]! << 24) | (buffer[21]! << 16) | (buffer[22]! << 8) | buffer[23]!) >>> 0;
  } else if (format === "image/jpeg") {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1]!;
      // SOF markers (SOF0 to SOF3, SOF5 to SOF7, SOF9 to SOF11, SOF13 to SOF15)
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        height = (buffer[offset + 5]! << 8) | buffer[offset + 6]!;
        width = (buffer[offset + 7]! << 8) | buffer[offset + 8]!;
        break;
      }
      const len = (buffer[offset + 2]! << 8) | buffer[offset + 3]!;
      offset += 2 + len;
    }
  } else if (format === "image/webp") {
    if (buffer.length >= 30) {
      const chunk = String.fromCharCode(buffer[12]!, buffer[13]!, buffer[14]!, buffer[15]!);
      if (chunk === "VP8 " && buffer.length >= 30) {
        // Lossy VP8
        width = (buffer[26]! | (buffer[27]! << 8)) & 0x3fff;
        height = (buffer[28]! | (buffer[29]! << 8)) & 0x3fff;
      } else if (chunk === "VP8L" && buffer.length >= 25) {
        // Lossless VP8L
        const b0 = buffer[21]!;
        const b1 = buffer[22]!;
        const b2 = buffer[23]!;
        const b3 = buffer[24]!;
        width = 1 + (((b1 & 0x3f) << 8) | b0);
        height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      } else if (chunk === "VP8X" && buffer.length >= 30) {
        // Extended VP8X
        width = 1 + (buffer[24]! | (buffer[25]! << 8) | (buffer[26]! << 16));
        height = 1 + (buffer[27]! | (buffer[28]! << 8) | (buffer[29]! << 16));
      }
    }
  }

  if (width <= 0 || height <= 0) {
    // If dimension parsing could not decode valid frame, reject corrupt or unreadable image
    throw new Error("Unable to parse image dimensions. File may be corrupt or truncated.");
  }

  // Decompression-bomb guard: check total pixel capacity first
  const totalPixels = width * height;
  if (totalPixels > IMAGE_LIMITS.MAX_PIXELS) {
    throw new Error(
      `Image pixel count (${totalPixels.toLocaleString()} pixels) exceeds safety limit (decompression bomb guard)`,
    );
  }

  // Dimension constraints
  if (width > IMAGE_LIMITS.MAX_WIDTH || height > IMAGE_LIMITS.MAX_HEIGHT) {
    throw new Error(
      `Image dimensions (${width}x${height}) exceed maximum allowed (${IMAGE_LIMITS.MAX_WIDTH}x${IMAGE_LIMITS.MAX_HEIGHT})`,
    );
  }

  return { format, width, height };
}
