import test from "node:test";
import assert from "node:assert/strict";

// ============================================================================
// 1. Core Streak & Timezone Logic
// ============================================================================

function getCalendarDate(date = new Date(), timeZone) {
  if (timeZone) {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    } catch {
      // fallback
    }
  }
  return date.toISOString().slice(0, 10);
}

function calendarDayDiff(fromDateStr, toDateStr) {
  const [y1, m1, d1] = fromDateStr.split("-").map(Number);
  const [y2, m2, d2] = toDateStr.split("-").map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

function computeNextStreak(currentStreak, longestStreak, lastActiveDateStr, todayDateStr) {
  if (!lastActiveDateStr) {
    return {
      current: 1,
      longest: Math.max(longestStreak, 1),
      lastActive: todayDateStr,
      updated: true,
    };
  }

  const diffDays = calendarDayDiff(lastActiveDateStr, todayDateStr);

  if (diffDays === 0) {
    // Same calendar day: no increment
    return {
      current: currentStreak,
      longest: longestStreak,
      lastActive: lastActiveDateStr,
      updated: false,
    };
  }

  let newStreak = 1;
  if (diffDays === 1) {
    // Consecutive day
    newStreak = currentStreak + 1;
  } else if (diffDays > 1) {
    // Missed 1 or more calendar days: reset to 1
    newStreak = 1;
  } else {
    // Clock skew / earlier date
    newStreak = Math.max(1, currentStreak);
  }

  const newLongest = Math.max(longestStreak, newStreak);
  return { current: newStreak, longest: newLongest, lastActive: todayDateStr, updated: true };
}

// ============================================================================
// 2. Case Study Progression Logic
// ============================================================================

const CASE_STUDY_SEQUENCE = [
  { slug: "atm-machine", order: 1, tier: "free", title: "ATM Machine" },
  { slug: "library-management", order: 2, tier: "free", title: "Library Management" },
  { slug: "banking-system-transfers", order: 3, tier: "free", title: "Banking System Transfers" },
  { slug: "parking-lot-allocation", order: 4, tier: "premium", title: "Parking Lot Allocation" },
  { slug: "vending-machine-states", order: 5, tier: "premium", title: "Vending Machine States" },
];

function checkCaseAccess(caseSlug, completedSlugs, unlockedSlugs) {
  const meta = CASE_STUDY_SEQUENCE.find((c) => c.slug === caseSlug);
  if (!meta) return { accessible: false, reason: "Case not found" };

  // Initial case is always accessible
  if (caseSlug === CASE_STUDY_SEQUENCE[0].slug) {
    return { accessible: true, tier: meta.tier };
  }

  // Check explicit or progression unlocked
  if (unlockedSlugs.has(caseSlug) || completedSlugs.has(caseSlug)) {
    return { accessible: true, tier: meta.tier };
  }

  if (meta.tier === "premium") {
    return {
      accessible: false,
      reason: "Premium Case Study — Requires Premium Membership",
      tier: "premium",
    };
  }

  return {
    accessible: false,
    reason: "Complete previous case study to unlock this free-tier case",
    tier: "free",
  };
}

function processCaseCompletion(completedSlug, userProgress, completedSlugs, unlockedSlugs) {
  const meta = CASE_STUDY_SEQUENCE.find((c) => c.slug === completedSlug);
  if (!meta) throw new Error("Unknown case study");

  const progress = userProgress[completedSlug];
  if (!progress || !progress.passed) {
    throw new Error("Lab must be passed before marking case complete");
  }

  const allSections = [0, 1, 2, 3, 4, 5, 6, 7];
  const hasAll = allSections.every(
    (sec) => (progress.completedSections || []).includes(sec) || sec === 6,
  );
  if (!hasAll) {
    throw new Error("All sections must be viewed before marking case complete");
  }

  completedSlugs.add(completedSlug);

  // Release next free case
  const idx = CASE_STUDY_SEQUENCE.findIndex((c) => c.slug === completedSlug);
  let nextUnlocked = null;
  if (idx !== -1 && idx + 1 < CASE_STUDY_SEQUENCE.length) {
    const nextCase = CASE_STUDY_SEQUENCE[idx + 1];
    if (nextCase.tier === "free") {
      unlockedSlugs.add(nextCase.slug);
      nextUnlocked = nextCase.slug;
    }
  }

  return { success: true, nextUnlocked };
}

// ============================================================================
// STREAK TEST SUITE
// ============================================================================

test("Streak Rule 1: First login sets streak to 1 and longest to 1", () => {
  const result = computeNextStreak(0, 0, null, "2026-09-01");
  assert.equal(result.current, 1);
  assert.equal(result.longest, 1);
  assert.equal(result.lastActive, "2026-09-01");
  assert.equal(result.updated, true);
});

test("Streak Rule 2: Same-day second login leaves streak unchanged", () => {
  const result = computeNextStreak(1, 1, "2026-09-01", "2026-09-01");
  assert.equal(result.current, 1);
  assert.equal(result.longest, 1);
  assert.equal(result.updated, false);
});

test("Streak Rule 3: Consecutive-day login increments streak", () => {
  const day2 = computeNextStreak(1, 1, "2026-09-01", "2026-09-02");
  assert.equal(day2.current, 2);
  assert.equal(day2.longest, 2);
  assert.equal(day2.updated, true);
});

test("Streak Rule 4: Missing one calendar day resets streak to 1", () => {
  const missedOne = computeNextStreak(5, 5, "2026-09-01", "2026-09-03");
  assert.equal(missedOne.current, 1);
  assert.equal(missedOne.longest, 5);
  assert.equal(missedOne.lastActive, "2026-09-03");
  assert.equal(missedOne.updated, true);
});

test("Streak Rule 5: Missing multiple calendar days resets streak to 1", () => {
  const missedMany = computeNextStreak(10, 10, "2026-09-01", "2026-09-10");
  assert.equal(missedMany.current, 1);
  assert.equal(missedMany.longest, 10);
  assert.equal(missedMany.lastActive, "2026-09-10");
  assert.equal(missedMany.updated, true);
});

test("Streak Rule 6: Longest streak updates correctly when current exceeds longest", () => {
  const result = computeNextStreak(5, 5, "2026-09-01", "2026-09-02");
  assert.equal(result.current, 6);
  assert.equal(result.longest, 6);
});

test("Streak Rule 7: Timezone and midnight boundary (11:59 PM to 12:01 AM)", () => {
  const diff = calendarDayDiff("2026-08-31", "2026-09-01");
  assert.equal(diff, 1);
  const result = computeNextStreak(3, 5, "2026-08-31", "2026-09-01");
  assert.equal(result.current, 4);
  assert.equal(result.longest, 5);
});

test("Streak Rule 8: Simultaneous duplicate login does not double increment", () => {
  const login1 = computeNextStreak(2, 5, "2026-09-01", "2026-09-02");
  assert.equal(login1.current, 3);
  assert.equal(login1.updated, true);
  const login2 = computeNextStreak(login1.current, login1.longest, login1.lastActive, "2026-09-02");
  assert.equal(login2.current, 3);
  assert.equal(login2.updated, false);
});

// ============================================================================
// CASE PROGRESSION TEST SUITE
// ============================================================================

test("Case Progression 1: Case 1 starts unlocked, Case 2 starts locked", () => {
  const completed = new Set();
  const unlocked = new Set(["atm-machine"]);

  const access1 = checkCaseAccess("atm-machine", completed, unlocked);
  assert.equal(access1.accessible, true);

  const access2 = checkCaseAccess("library-management", completed, unlocked);
  assert.equal(access2.accessible, false);
});

test("Case Progression 2: Completing Case 1 unlocks Case 2 (free tier)", () => {
  const completed = new Set();
  const unlocked = new Set(["atm-machine"]);
  const userProgress = {
    "atm-machine": {
      passed: true,
      completedSections: [0, 1, 2, 3, 4, 5, 6, 7],
    },
  };

  const res = processCaseCompletion("atm-machine", userProgress, completed, unlocked);
  assert.equal(res.success, true);
  assert.equal(res.nextUnlocked, "library-management");
  assert.equal(unlocked.has("library-management"), true);

  const access2 = checkCaseAccess("library-management", completed, unlocked);
  assert.equal(access2.accessible, true);
});

test("Case Progression 3: Completing Case 2 unlocks Case 3 (free tier)", () => {
  const completed = new Set(["atm-machine"]);
  const unlocked = new Set(["atm-machine", "library-management"]);
  const userProgress = {
    "library-management": {
      passed: true,
      completedSections: [0, 1, 2, 3, 4, 5, 6, 7],
    },
  };

  const res = processCaseCompletion("library-management", userProgress, completed, unlocked);
  assert.equal(res.success, true);
  assert.equal(res.nextUnlocked, "banking-system-transfers");
  assert.equal(unlocked.has("banking-system-transfers"), true);
});

test("Case Progression 4: Completing Case 3 does NOT unlock Case 4 (premium boundary)", () => {
  const completed = new Set(["atm-machine", "library-management"]);
  const unlocked = new Set(["atm-machine", "library-management", "banking-system-transfers"]);
  const userProgress = {
    "banking-system-transfers": {
      passed: true,
      completedSections: [0, 1, 2, 3, 4, 5, 6, 7],
    },
  };

  const res = processCaseCompletion("banking-system-transfers", userProgress, completed, unlocked);
  assert.equal(res.success, true);
  // Next is parking-lot-allocation (premium), so free progression does NOT unlock it!
  assert.equal(res.nextUnlocked, null);
  assert.equal(unlocked.has("parking-lot-allocation"), false);

  const accessPremium = checkCaseAccess("parking-lot-allocation", completed, unlocked);
  assert.equal(accessPremium.accessible, false);
  assert.equal(accessPremium.tier, "premium");
});

test("Case Progression 5: Completing Case 1 twice is idempotent and does not corrupt", () => {
  const completed = new Set();
  const unlocked = new Set(["atm-machine"]);
  const userProgress = {
    "atm-machine": {
      passed: true,
      completedSections: [0, 1, 2, 3, 4, 5, 6, 7],
    },
  };

  processCaseCompletion("atm-machine", userProgress, completed, unlocked);
  assert.equal(unlocked.size, 2);

  // Call again
  processCaseCompletion("atm-machine", userProgress, completed, unlocked);
  assert.equal(unlocked.size, 2);
  assert.equal(completed.size, 1);
});

test("Case Progression 6: Incomplete case study cannot be marked complete", () => {
  const completed = new Set();
  const unlocked = new Set(["atm-machine"]);
  const userProgress = {
    "atm-machine": {
      passed: false, // Lab not passed
      completedSections: [0, 1, 2, 3, 4, 5, 7],
    },
  };

  assert.throws(
    () => processCaseCompletion("atm-machine", userProgress, completed, unlocked),
    /Lab must be passed/,
  );
});
