/**
 * RC (Reasoning Credit) — the gamified progress currency.
 * Constants and helpers - localStorage only (no Convex).
 */

export const RC_RULES = {
  beginner: 20,
  medium: 30,
  advanced: 50,
  caseComplete: 20,
  codeLab: 20,
  section: 0,
  unlockFloor: 50,
} as const;

/**
 * Returns the completion RC yield for a given case study difficulty.
 * RC is awarded strictly upon 100% path completion.
 */
export function getCaseStudyRc(difficulty?: string): number {
  if (difficulty === "Advanced") return RC_RULES.advanced;
  if (difficulty === "Intermediate" || difficulty === "Medium") return RC_RULES.medium;
  return RC_RULES.beginner;
}

/** Award ID generators */
export const sectionAwardId = (slug: string, index: number) => `case:${slug}:section:${index}`;

export const caseAwardId = (slug: string) => `case:${slug}:complete`;

export const labAwardId = (slug: string) => `case:${slug}:lab`;

export function isCaseCompleted(awards: Record<string, number> | undefined, slug: string): boolean {
  if (!awards) return false;
  return awards[`case:${slug}:complete`] !== undefined || awards[`${slug}:complete`] !== undefined;
}

export function isLabCompleted(awards: Record<string, number> | undefined, slug: string): boolean {
  if (!awards) return false;
  return (
    awards[`case:${slug}:lab`] !== undefined ||
    awards[`${slug}:lab`] !== undefined ||
    awards[`lab:${slug}:solved`] !== undefined
  );
}

/** Check if case is unlocked based on RC points */
export function isUnlocked(points: number, rcCost: number) {
  if (rcCost <= 0) return true;
  return points >= Math.max(RC_RULES.unlockFloor, rcCost);
}

/** Get unlock threshold for a case */
export function unlockThreshold(rcCost: number) {
  return rcCost <= 0 ? 0 : Math.max(RC_RULES.unlockFloor, rcCost);
}

/** Rank ladder */
export const RANKS = [
  { at: 0, name: "Observer" },
  { at: 200, name: "Apprentice" },
  { at: 500, name: "Investigator" },
  { at: 2000, name: "Engineer" },
  { at: 5000, name: "Systems Thinker" },
] as const;

/** Calculate rank info from points */
export function rankFor(points: number) {
  let current: { at: number; name: string } = RANKS[0];
  for (const r of RANKS) if (points >= r.at) current = r;

  const next = RANKS.find((r) => r.at > points);

  return {
    name: current.name,
    next: next?.name ?? null,
    toNext: next ? next.at - points : 0,
    progress: next ? Math.round(((points - current.at) / (next.at - current.at)) * 100) : 100,
  };
}

/** Centralize the completion predicate used by every case surface. */
export function isStudyComplete(
  awards: Record<string, number> | undefined,
  progressDoc:
    { passed?: boolean; completedSections?: number[]; status?: string } | null | undefined,
  slug: string,
): boolean {
  return (
    isCaseCompleted(awards, slug) ||
    progressDoc?.status === "completed" ||
    Boolean(progressDoc?.passed && (progressDoc?.completedSections?.length ?? 0) >= 7)
  );
}

/** Local storage key for RC */
export const GUEST_RC_KEY = "kruzz:guest-rc:v1";
export const LEGACY_GUEST_RC_KEY = "rc-arena:guest-rc:v1";

/** Load RC from localStorage */
export function loadGuestRC(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GUEST_RC_KEY) || localStorage.getItem(LEGACY_GUEST_RC_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Save RC to localStorage */
export function saveGuestRC(awards: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_RC_KEY, JSON.stringify(awards));
  } catch {
    // Storage full or blocked
  }
}

/** Calculate total from awards */
export const totalRC = (awards: Record<string, number>) =>
  Object.values(awards).reduce((a, b) => a + b, 0);
