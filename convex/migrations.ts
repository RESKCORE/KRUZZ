import { internalMutation, internalQuery, mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { generateUniquePublicProfileId } from "./users";
import { completeCaseInternal } from "./caseProgress";

const PUBLIC_PROFILE_ID_REGEX = /^krz_[a-f0-9]{32}$/;

/**
 * Backfill migration to ensure every existing user in the database has a unique,
 * cryptographically random 128-bit publicProfileId (`krz_[a-f0-9]{32}`).
 * Safe to execute repeatedly (idempotent).
 */
export const backfillPublicProfileIds = internalMutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const allUsers = await ctx.db.query("users").collect();
    let updatedCount = 0;
    let alreadyValidCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    const existingPublicIds = new Set<string>();

    // First pass: collect existing valid IDs to detect duplicates
    for (const user of allUsers) {
      if (user.publicProfileId && PUBLIC_PROFILE_ID_REGEX.test(user.publicProfileId)) {
        if (existingPublicIds.has(user.publicProfileId)) {
          // Collision detected among legacy or malformed records
          errors.push({
            userId: user._id,
            error: `Duplicate publicProfileId found: ${user.publicProfileId}`,
          });
        } else {
          existingPublicIds.add(user.publicProfileId);
        }
      }
    }

    // Second pass: assign new unique 128-bit publicProfileId to users needing one
    for (const user of allUsers) {
      const needsBackfill =
        !user.publicProfileId ||
        !PUBLIC_PROFILE_ID_REGEX.test(user.publicProfileId) ||
        errors.some((e) => e.userId === user._id);

      if (needsBackfill) {
        try {
          const newPublicId = await generateUniquePublicProfileId(ctx);
          await ctx.db.patch(user._id, { publicProfileId: newPublicId });
          existingPublicIds.add(newPublicId);
          updatedCount++;
        } catch (err) {
          errors.push({
            userId: user._id,
            error: (err as Error).message,
          });
        }
      } else {
        alreadyValidCount++;
      }
    }

    return {
      status: errors.length === 0 ? "SUCCESS" : "COMPLETED_WITH_WARNINGS",
      totalUsers: allUsers.length,
      updatedCount,
      alreadyValidCount,
      errors,
    };
  },
});

/**
 * Diagnostic query to verify profile ID integrity and uniqueness.
 */
export const verifyProfileIntegrity = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const seenIds = new Map<string, string>();
    const missing: string[] = [];
    const invalidFormat: string[] = [];
    const duplicates: Array<{ publicProfileId: string; userIds: string[] }> = [];

    for (const user of allUsers) {
      if (!user.publicProfileId) {
        missing.push(user._id);
        continue;
      }

      if (!PUBLIC_PROFILE_ID_REGEX.test(user.publicProfileId)) {
        invalidFormat.push(user._id);
        continue;
      }

      if (seenIds.has(user.publicProfileId)) {
        duplicates.push({
          publicProfileId: user.publicProfileId,
          userIds: [seenIds.get(user.publicProfileId)!, user._id],
        });
      } else {
        seenIds.set(user.publicProfileId, user._id);
      }
    }

    return {
      totalUsers: allUsers.length,
      validProfiles: seenIds.size,
      missingCount: missing.length,
      missingUserIds: missing,
      invalidFormatCount: invalidFormat.length,
      invalidFormatUserIds: invalidFormat,
      duplicateCount: duplicates.length,
      duplicates,
      isClean: missing.length === 0 && invalidFormat.length === 0 && duplicates.length === 0,
    };
  },
});

/**
 * Migration to ensure privacy by default for all user accounts.
 * Explicitly sets `isPublic: false` for all users where `isPublic !== true`.
 * Preserves users who have intentionally opted into public sharing (`isPublic === true`).
 * Idempotent, bounded batch execution, and reportable.
 */
export const enforcePrivateProfileDefault = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const limit = args.batchSize ?? 200;
    const allUsers = await ctx.db.query("users").take(limit);
    let scannedCount = 0;
    let updatedCount = 0;
    let preservedPublicCount = 0;
    let alreadyPrivateCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const user of allUsers) {
      scannedCount++;
      if (user.isPublic === true) {
        preservedPublicCount++;
        continue;
      }

      if (user.isPublic === false) {
        alreadyPrivateCount++;
        continue;
      }

      // user.isPublic is undefined / missing -> patch explicitly to false
      try {
        await ctx.db.patch(user._id, { isPublic: false });
        updatedCount++;
      } catch (err) {
        // Log only document ID, strictly avoiding personal data (name, email)
        errors.push({
          userId: user._id,
          error: (err as Error).message,
        });
      }
    }

    return {
      status: errors.length === 0 ? "SUCCESS" : "COMPLETED_WITH_ERRORS",
      batchSize: limit,
      scannedCount,
      updatedCount,
      preservedPublicCount,
      alreadyPrivateCount,
      hasMore: allUsers.length === limit,
      errors,
    };
  },
});

/**
 * Rollback / recovery helper for private profile migration.
 * Allows restoring user profile privacy states from an audited snapshot of IDs.
 */
export const rollbackPrivateProfileDefault = internalMutation({
  args: {
    userIdsToRestorePublic: v.array(v.id("users")),
  },
  handler: async (ctx: MutationCtx, args) => {
    let restoredCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const userId of args.userIdsToRestorePublic) {
      try {
        await ctx.db.patch(userId, { isPublic: true });
        restoredCount++;
      } catch (err) {
        errors.push({ userId, error: (err as Error).message });
      }
    }

    return {
      status: errors.length === 0 ? "SUCCESS" : "COMPLETED_WITH_ERRORS",
      restoredCount,
      errors,
    };
  },
});

/**
 * Diagnostic query to inspect user case study progress and awards.
 */
export const inspectTodayCaseCompletions = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const progressList = await ctx.db.query("caseProgress").collect();
    const awards = await ctx.db.query("awards").collect();
    const caseStudies = await ctx.db.query("caseStudies").collect();

    const caseMap = new Map(caseStudies.map((c) => [c.slug, c]));

    const records = progressList.map((p) => {
      const user = users.find((u) => u._id === p.userId);
      const study = caseMap.get(p.caseSlug);
      const userAwards = awards.filter((a) => a.userId === p.userId);
      const hasCompleteAward = userAwards.some(
        (a) =>
          a.awardId === `case:${p.caseSlug}:complete` || a.awardId === `${p.caseSlug}:complete`,
      );
      const hasLabAward = userAwards.some(
        (a) => a.awardId === `case:${p.caseSlug}:lab` || a.awardId === `${p.caseSlug}:lab`,
      );

      return {
        userId: p.userId,
        userName: user?.name,
        userEmail: user?.email,
        userPoints: user?.points,
        caseSlug: p.caseSlug,
        caseTitle: study?.title,
        difficulty: study?.difficulty,
        passed: p.passed,
        bestScore: p.bestScore,
        status: p.status,
        completedSectionsCount: p.completedSections?.length ?? 0,
        completedSections: p.completedSections,
        reflectionLength: p.reflection?.length ?? 0,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
        completedAt: p.completedAt ? new Date(p.completedAt).toISOString() : null,
        hasCompleteAward,
        hasLabAward,
      };
    });

    return {
      totalUsers: users.length,
      totalProgress: progressList.length,
      totalAwards: awards.length,
      records,
    };
  },
});

/**
 * Mutation to award RC points and complete case studies for users who completed
 * case studies today (2026-09-14) but haven't received their RC points yet.
 */
export const awardTodayCompletedCases = internalMutation({
  args: {
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Midnight IST on 2026-09-14 is 2026-09-13T18:30:00.000Z
    const defaultSince = new Date("2026-09-13T18:30:00.000Z").getTime();
    const sinceTimestamp = args.sinceMs ?? defaultSince;

    const allProgress = await ctx.db.query("caseProgress").collect();
    const allUsers = await ctx.db.query("users").collect();
    const userMap = new Map(allUsers.map((u) => [u._id, u]));

    const awarded: Array<{
      userId: string;
      userEmail?: string | undefined;
      userName?: string | undefined;
      caseSlug: string;
      bestScore: number;
      awardedAt: string;
    }> = [];

    for (const p of allProgress) {
      // Must be from today
      const progressTime = p.updatedAt ?? p.completedAt ?? 0;
      if (progressTime < sinceTimestamp) {
        continue;
      }

      // Must have passed the practice lab
      if (!p.passed) {
        continue;
      }

      const user = userMap.get(p.userId);
      if (!user) continue;

      // Check if user already has the completion award
      const awardKey = `case:${p.caseSlug}:complete`;
      const existingAward = await ctx.db
        .query("awards")
        .withIndex("by_user_award", (q) => q.eq("userId", user._id).eq("awardId", awardKey))
        .unique();

      if (!existingAward) {
        // Ensure all sections are marked complete
        await ctx.db.patch(p._id, {
          completedSections: [0, 1, 2, 3, 4, 5, 6, 7],
          status: "completed",
          completedAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Award completion bonus and unlock next case
        await completeCaseInternal(ctx, user, p.caseSlug, p._id);

        awarded.push({
          userId: user._id,
          userEmail: user.email,
          userName: user.name,
          caseSlug: p.caseSlug,
          bestScore: p.bestScore ?? 100,
          awardedAt: new Date().toISOString(),
        });
      }
    }

    return {
      status: "SUCCESS",
      since: new Date(sinceTimestamp).toISOString(),
      awardedCount: awarded.length,
      awarded,
    };
  },
});

/**
 * Reset all tripped provider circuits in the database.
 */
export const resetProviderCircuit = mutation({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("providerHealth").collect();
    for (const rec of records) {
      await ctx.db.patch(rec._id, {
        consecutiveFailures: 0,
        circuitOpenUntil: 0,
        updatedAt: Date.now(),
      });
    }
    return {
      status: "SUCCESS",
      resetCount: records.length,
    };
  },
});

/**
 * Standardize and enrich curriculum architecture decisions across cases 01 to 10.
 * Ensures consistent canonical schema with title, what, why, problemSolved, withoutIt, alternatives, and tradeoff,
 * while preserving backward-compatible fields.
 */
export const enrichCurriculumDecisions = internalMutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const CANONICAL_DECISIONS: Record<string, any[]> = {
      "atm-machine": [
        {
          title: "Guard Balance Inside Domain Method vs. UI Layer",
          what: "Enforce balance checks inside the Account class method.",
          why: "Always place invariant checks inside the domain class (Account). UI checks can be skipped or bypassed by bugs.",
          problemSolved: "Bypassing balance checks through alternate caller paths or UI bugs.",
          withoutIt: "Overdrafts and negative balance corruption if callers forget validation.",
          alternatives: ["Trust caller/UI to check balance before calling withdraw"],
          tradeoff: "Slightly less flexible caller customization in exchange for ironclad invariants.",
          choiceA: "Enforce balance checks inside the Account class method",
          choiceB: "Trust the caller/UI to check balance before calling withdraw",
          decision: "Guard balance inside Account.withdraw() vs in ATM UI code",
          verdict: "Always place invariant checks inside the domain class (Account). UI checks can be skipped or bypassed by bugs.",
        },
      ],
      "library-management": [
        {
          title: "Object References vs. String Titles for Book Storage",
          what: "Store Book instances inside Member collections rather than primitive title strings.",
          why: "Storing object references allows checking author, publication year, and status methods directly on the book.",
          problemSolved: "Stale copies and desynchronization when book metadata changes.",
          withoutIt: "Redundant lookups in a central catalog on every operation.",
          alternatives: ["Store only strings (e.g. 'Dune') and query central catalog"],
          tradeoff: "Memory references keep books in memory; requires serialization hooks.",
          choiceA: "Store actual Book class references",
          choiceB: "Store only strings (e.g. 'Dune')",
          decision: "Store Book instances in Member vs storing title strings",
          verdict: "Storing object references allows checking author, publication year, and status methods directly on the book.",
        },
      ],
      "banking-system-transfers": [
        {
          title: "Integer Cents vs. Floating-Point Numbers",
          what: "Store all financial amounts as integer cents (e.g. 5000 = $50.00).",
          why: "Integer cents prevent IEEE-754 floating point rounding inaccuracies (like 0.1 + 0.2 = 0.30000000000000004).",
          problemSolved: "Discrepancies in balance audits caused by binary float approximations.",
          withoutIt: "Fractional cent drift that compounds across millions of transactions.",
          alternatives: ["Store amounts as float (50.00)", "Use arbitrary-precision Decimal libraries"],
          tradeoff: "Requires explicit formatting on display and division truncation rules.",
          choiceA: "Store amounts in cents as integers (e.g. 5000 = $50.00)",
          choiceB: "Store amounts as float (50.00)",
          decision: "Integer cents vs floating-point numbers",
          verdict: "Integer cents prevent floating point rounding inaccuracies (like 0.1 + 0.2 = 0.30000000000000004).",
        },
      ],
      "parking-lot-allocation": [
        {
          title: "First-Available vs. Random Slot Allocation",
          what: "Allocate the lowest-numbered available slot closest to entrance.",
          why: "First-available is predictable, deterministic, and places cars closest to the entrance.",
          problemSolved: "Driver confusion and excessive vehicle circulation searching for random spots.",
          withoutIt: "Scattered vehicle clustering far from pedestrian gates.",
          alternatives: ["Random slot assignment", "Proximity-weighted geometric scoring"],
          tradeoff: "Concentrates wear and tear on front parking rows.",
          choiceA: "Linear search: pick lowest numbered available slot",
          choiceB: "Random slot assignment",
          decision: "First-available slot allocation vs random slot allocation",
          verdict: "First-available is predictable, deterministic, and places cars closest to the entrance.",
        },
      ],
      "vending-machine-states": [
        {
          title: "String State Representation vs. Enum Hierarchy",
          what: "Use well-defined string state tags ('IDLE', 'PAID', 'DISPENSING').",
          why: "Plain strings are immediately understandable to beginner learners without needing Python Enum imports.",
          problemSolved: "Boilerplate and cognitive overhead when introducing basic finite state machines.",
          withoutIt: "Complex class hierarchies for simple single-file machines.",
          alternatives: ["Class-based Enum (enum.Enum)", "State pattern with polymorphic subclasses"],
          tradeoff: "Lack of compile-time typographical checking on state strings.",
          choiceA: "Plain strings ('IDLE', 'PAID')",
          choiceB: "Class-based Enum",
          decision: "String state ('IDLE', 'PAID') vs enum",
          verdict: "Plain strings are immediately understandable to beginner learners without needing Python Enum imports.",
        },
      ],
      "seat-booking-system": [
        {
          title: "Dictionary Keys vs. Nested 2D Lists for Seat Allocation",
          what: "Use string coordinate keys (e.g. 'A1', 'F12') in an associative dictionary.",
          why: "Using `{'A1': 'AVAILABLE'}` allows direct key access in one step, whereas `grid[row][col]` requires converting letters to numeric row indexes.",
          problemSolved: "Eliminates multi-level array index validation and prevents out-of-bounds indexing bugs.",
          withoutIt: "Array bounds errors and fragile nested list operations when seat matrices are irregular.",
          alternatives: ["2D nested array grid[row][col]", "Sparse matrix with coordinate tuples"],
          tradeoff: "Slightly higher memory overhead per key compared to a packed bitmask.",
          choice: "Use a Dictionary with String Keys instead of Nested Lists",
          rationale: "Using `{'A1': 'AVAILABLE'}` allows direct key access in one step, whereas `grid[row][col]` requires converting letters to numeric row indexes.",
        },
        {
          title: "All-or-Nothing Atomic Multi-Seat Validation",
          what: "Validate all requested seats before modifying the state of any single seat.",
          why: "Validating all requested seats before modifying any of them prevents partial bookings where a customer gets 2 out of 3 desired tickets.",
          problemSolved: "Race conditions and partial lock contention during concurrent group checkouts.",
          withoutIt: "Incomplete reservations requiring manual cancellation and refund logic.",
          alternatives: ["Optimistic reservation with rollback compensation", "Pessimistic row-level locking"],
          tradeoff: "Requires scanning the entire requested batch before executing state mutations.",
          choice: "Atomic Multi-Seat Validation",
          rationale: "Validating all requested seats before modifying any of them prevents partial bookings where a customer gets 2 out of 3 desired tickets.",
        },
      ],
      "inventory-stock-tracker": [
        {
          title: "Dictionary Key-Value Storage vs. Object Array for SKU Inventory",
          what: "Store Stock as Integer Values in a Dictionary mapping SKU to count.",
          why: "A dictionary mapping SKU string to integer count gives instant O(1) lookup and simple arithmetic without overhead.",
          problemSolved: "Linear search O(N) bottlenecks when querying stock levels across thousands of SKUs.",
          withoutIt: "Lagging inventory responses under flash-sale traffic.",
          alternatives: ["List of Product instances searched linearly", "Relational SQL table lookup on every cart event"],
          tradeoff: "Does not automatically track product metadata (name, price) without separate lookup.",
          choice: "Store Stock as Integer Values in a Dictionary",
          rationale: "A dictionary mapping SKU string to integer count gives instant O(1) lookup and simple arithmetic without overhead.",
        },
        {
          title: "Strict Positive Validation on Restock Quantities",
          what: "Reject any restock request where the quantity is less than or equal to 0.",
          why: "Restocking with a negative number is an error or fraud attempt. Restock values must be strictly greater than 0.",
          problemSolved: "Accidental inventory decreases or unauthorized stock tampering through restock endpoints.",
          withoutIt: "Negative inventory anomalies or undetected supply chain leakage.",
          alternatives: ["Clamp negative numbers to zero", "Allow negative numbers as return adjustments"],
          tradeoff: "Return processing requires a separate dedicated decrement/return endpoint.",
          choice: "Reject Negative Restock Values",
          rationale: "Restocking with a negative number is an error or fraud attempt. Restock values must be strictly greater than 0.",
        },
      ],
      "client-server-architecture": [
        {
          title: "Separation of Client UI and Server Authority",
          what: "Separate Client from Server Responsibilities across a clean network boundary.",
          why: "Clients focus on rendering user interfaces; servers focus on security, business rules, and persistent storage.",
          problemSolved: "Tampering with client-side state to forge balances or bypass permissions.",
          withoutIt: "Client-side code having direct database access, exposing secrets and credentials.",
          alternatives: ["Thick client directly accessing shared SQL database", "Peer-to-peer state synchronization"],
          tradeoff: "Requires serialization, API documentation, and network latency over HTTP.",
          choice: "Separate Client from Server Responsibilities",
          rationale: "Clients focus on rendering user interfaces; servers focus on security, business rules, and persistent storage.",
        },
        {
          title: "Standardized HTTP Status Codes for Semantic Responses",
          what: "Use standard HTTP status codes (200, 400, 404, 500) to communicate outcome.",
          why: "Using 200, 404, and 500 avoids every application inventing its own custom error signaling format.",
          problemSolved: "Inconsistent client error handling and silent failures when parsing error payloads.",
          withoutIt: "Clients having to inspect arbitrary custom error JSON shapes on every response.",
          alternatives: ["Always return HTTP 200 OK with status field inside JSON", "Custom protocol header error codes"],
          tradeoff: "HTTP status codes are coarse-grained and still require sub-codes for domain errors.",
          choice: "Standardized HTTP Status Codes",
          rationale: "Using 200, 404, and 500 avoids every application inventing its own custom error signaling format.",
        },
      ],
      "dns-domain-lookup": [
        {
          title: "Multi-Tier Local DNS Caching with TTL",
          what: "Cache DNS Records locally and at recursive resolvers with Time-To-Live.",
          why: "Caching eliminates 95%+ of outbound DNS queries, dramatically accelerating page load times.",
          problemSolved: "Every single web request stalling on 100ms+ hierarchical root server lookups.",
          withoutIt: "Global root DNS servers crashing under trillions of queries per second.",
          alternatives: ["Zero caching (always query authoritative nameserver)", "Hosts file with static IP mappings"],
          tradeoff: "DNS propagation delays when changing an IP address before TTL expires.",
          choice: "Cache DNS Records Locally with TTL",
          rationale: "Caching eliminates 95%+ of outbound DNS queries, dramatically accelerating page load times.",
        },
        {
          title: "Hierarchical Domain Delegation (.root to .tld to .auth)",
          what: "Distribute domain lookup authority across root, TLD (.com), and domain-specific nameservers.",
          why: "No single computer in the world could handle all global DNS queries. Distributing by TLD (.com, .org) allows massive scaling.",
          problemSolved: "Single point of failure and bottleneck of centralized internet domain naming.",
          withoutIt: "Monolithic DNS registry that cannot scale horizontally or survive localized outages.",
          alternatives: ["Flat decentralized DHT (Distributed Hash Table)", "Centralized global directory server"],
          tradeoff: "Cache invalidation is eventual, and resolution requires traversing multiple network hops.",
          choice: "Hierarchical Delegation",
          rationale: "No single computer in the world could handle all global DNS queries. Distributing by TLD (.com, .org) allows massive scaling.",
        },
      ],
      "image-cdn-delivery": [
        {
          title: "Geographic Edge Caching vs. Origin Server Scaling",
          what: "Cache static media at Points of Presence (PoPs) close to end users.",
          why: "No amount of server CPU or network bandwidth at the origin in Virginia can shorten the physical distance between North America and Japan.",
          problemSolved: "Speed-of-light propagation latency causing multi-second image download delays across continents.",
          withoutIt: "Slow global page loads and origin bandwidth saturation.",
          alternatives: ["Upgrade origin server CPU and pipe bandwidth", "Deploy origin database replicas globally"],
          tradeoff: "Cache invalidation (purge) takes time to propagate across hundreds of edge locations.",
          choice: "Cache at Geographic Edge instead of Upgrading Origin Bandwidth",
          rationale: "No amount of server CPU or network bandwidth at the origin in Virginia can shorten the physical distance between North America and Japan.",
        },
        {
          title: "Immutable Static Asset Hashing with Long Expiration",
          what: "Store Static Media with Content-Hashed Filenames and 1-Year Cache-Control.",
          why: "Images rarely change once uploaded. Setting long cache times ensures edge servers maximize cache hit rates.",
          problemSolved: "Edge servers repeatedly revalidating unchanged images with HTTP 304 checks.",
          withoutIt: "High origin revalidation traffic and sub-optimal edge hit ratios.",
          alternatives: ["Short TTL (e.g. 5 minutes) with frequent revalidation", "Query string versioning (?v=2)"],
          tradeoff: "Replacing an image requires generating a new URL / filename.",
          choice: "Store Static Media with High Expiration Times",
          rationale: "Images rarely change once uploaded. Setting long cache times ensures edge servers maximize cache hit rates.",
        },
      ],
    };

    let updatedCount = 0;
    const results: Array<{ slug: string; decisionsCount: number }> = [];

    for (const [slug, decisions] of Object.entries(CANONICAL_DECISIONS)) {
      const existing = await ctx.db
        .query("caseStudies")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          decisions,
          updatedAt: Date.now(),
        });
        updatedCount++;
        results.push({ slug, decisionsCount: decisions.length });
      }
    }

    return {
      status: "SUCCESS",
      updatedCount,
      results,
    };
  },
});

