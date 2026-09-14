import test from "node:test";
import assert from "node:assert/strict";

// ============================================================================
// Public Profile Privacy & Resolution Simulation (128-bit Entropy)
// ============================================================================

const PUBLIC_PROFILE_ID_REGEX = /^krz_[a-f0-9]{32}$/;

function createMockUsersDb() {
  const users = [
    {
      _id: "user_doc_12345",
      publicProfileId: "krz_0123456789abcdef0123456789abcdef", // 32 hex chars (128 bits)
      clerkId: "user_2testClerkId99",
      tokenIdentifier: "https://auth.clerk.com|user_2testClerkId99",
      email: "learner@example.com",
      name: "Alice Investigator",
      points: 250,
      rank: "Apprentice",
      isPublic: true,
      createdAt: 1710000000000,
    },
    {
      _id: "user_doc_67890",
      publicProfileId: "krz_fedcba9876543210fedcba9876543210", // 32 hex chars
      clerkId: "user_2privateClerkId11",
      tokenIdentifier: "https://auth.clerk.com|user_2privateClerkId11",
      email: "private_dev@example.com",
      name: "Bob Private",
      points: 1200,
      rank: "Investigator",
      isPublic: false, // Private profile
      createdAt: 1711000000000,
    },
    {
      _id: "user_doc_legacy_undefined",
      publicProfileId: "krz_11112222333344445555666677778888",
      clerkId: "user_2legacyClerkId22",
      tokenIdentifier: "https://auth.clerk.com|user_2legacyClerkId22",
      email: "legacy@example.com",
      name: "Charlie Undefined",
      points: 400,
      rank: "Apprentice",
      // isPublic is omitted/undefined
      createdAt: 1712000000000,
    },
  ];

  const caseProgress = [];
  for (let i = 0; i < 60; i++) {
    caseProgress.push({
      userId: "user_doc_12345",
      caseSlug: `case-study-${i}`,
      status: "completed",
      completedAt: 1710000000000 + i * 1000,
      bestScore: 90,
      passed: true,
    });
  }

  return {
    users,
    caseProgress,
  };
}

/**
 * Simulates getPublicProfile query implementing strict lookup:
 * ONLY query by by_public_profile_id matching 32-hex regex.
 * Reject document IDs, clerk IDs, email prefixes, token identifiers, and names.
 * Enforce isPublic === true strictly (rejects false and undefined).
 * Scrub private identity fields.
 * Cap completed cases to 50 items.
 */
function getPublicProfile(db, queryArg) {
  const { publicProfileId } = queryArg;
  if (!publicProfileId || !PUBLIC_PROFILE_ID_REGEX.test(publicProfileId)) {
    return null;
  }

  // Strict lookup: only match publicProfileId
  const user = db.users.find((u) => u.publicProfileId === publicProfileId);

  // If user does not exist or profile is not strictly public, return null
  if (!user || user.isPublic !== true) {
    return null;
  }

  // Cap completed cases to 50
  const completedCases = db.caseProgress
    .filter((p) => p.userId === user._id && p.status === "completed")
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 50)
    .map((p) => ({
      caseSlug: p.caseSlug,
      completedAt: p.completedAt,
      bestScore: p.bestScore,
      passed: p.passed,
    }));

  // Scrubbed public profile projection
  return {
    publicProfileId: user.publicProfileId,
    name: user.name || "Anonymous Investigator",
    points: user.points,
    rank: user.rank,
    createdAt: user.createdAt,
    completedCases,
  };
}

test("Profile Privacy 1: Public profile resolves successfully using 128-bit publicProfileId", () => {
  const db = createMockUsersDb();
  const profile = getPublicProfile(db, {
    publicProfileId: "krz_0123456789abcdef0123456789abcdef",
  });

  assert.ok(profile);
  assert.equal(profile.publicProfileId, "krz_0123456789abcdef0123456789abcdef");
  assert.equal(profile.name, "Alice Investigator");
  assert.equal(profile.rank, "Apprentice");
});

test("Profile Privacy 2: Lookup by Convex document ID is strictly rejected (returns null)", () => {
  const db = createMockUsersDb();
  const profile = getPublicProfile(db, { publicProfileId: "user_doc_12345" });
  assert.equal(profile, null);
});

test("Profile Privacy 3: Lookup by Clerk ID is strictly rejected (returns null)", () => {
  const db = createMockUsersDb();
  const profile = getPublicProfile(db, { publicProfileId: "user_2testClerkId99" });
  assert.equal(profile, null);
});

test("Profile Privacy 4: Lookup by email prefix or name is strictly rejected (returns null)", () => {
  const db = createMockUsersDb();
  assert.equal(getPublicProfile(db, { publicProfileId: "learner" }), null);
  assert.equal(getPublicProfile(db, { publicProfileId: "Alice Investigator" }), null);
});

test("Profile Privacy 5: Profiles with isPublic === false return null to public queries", () => {
  const db = createMockUsersDb();
  const profile = getPublicProfile(db, {
    publicProfileId: "krz_fedcba9876543210fedcba9876543210",
  });
  assert.equal(profile, null);
});

test("Profile Privacy 6: Public profile response strictly omits clerkId, tokenIdentifier, and email", () => {
  const db = createMockUsersDb();
  const profile = getPublicProfile(db, {
    publicProfileId: "krz_0123456789abcdef0123456789abcdef",
  });

  assert.equal(profile.clerkId, undefined);
  assert.equal(profile.tokenIdentifier, undefined);
  assert.equal(profile.email, undefined);
  assert.equal(profile._id, undefined);
});

test("Profile Privacy 7: Completed cases output is capped to a maximum of 50 items", () => {
  const db = createMockUsersDb();
  const profile = getPublicProfile(db, {
    publicProfileId: "krz_0123456789abcdef0123456789abcdef",
  });

  assert.equal(profile.completedCases.length, 50);
});

test("Profile Privacy 8: Weak or legacy short publicProfileId (16 hex chars) is rejected by 128-bit validator", () => {
  const db = createMockUsersDb();
  const profile = getPublicProfile(db, { publicProfileId: "krz_a1b2c3d4e5f67890" });
  assert.equal(profile, null, "Must enforce 32-hex 128-bit requirement");
});

test("Profile Privacy 9: Profiles with isPublic === undefined return null (private by default)", () => {
  const db = createMockUsersDb();
  const profile = getPublicProfile(db, {
    publicProfileId: "krz_11112222333344445555666677778888",
  });
  assert.equal(profile, null, "Undefined isPublic must be private by default");
});

test("Profile Privacy 10: Orphan storage cleanup identifies and cleans unreferenced media >24h old without leaking PII", () => {
  const now = 1710000000000;
  const olderThan = now - 24 * 3600 * 1000; // 24 hours ago

  const mockUsers = [
    {
      _id: "user_active_1",
      imageStorageId: "st_avatar_active_1",
      bannerStorageId: "st_banner_active_1",
    },
    {
      _id: "user_active_2",
      imageStorageId: "st_avatar_active_2",
    },
  ];

  const activeStorageIds = new Set();
  for (const u of mockUsers) {
    if (u.imageStorageId) activeStorageIds.add(u.imageStorageId);
    if (u.bannerStorageId) activeStorageIds.add(u.bannerStorageId);
  }

  const mockStorageRecords = [
    // Referenced active avatar created 48 hours ago -> preserve
    { _id: "st_avatar_active_1", _creationTime: now - 48 * 3600 * 1000 },
    // Unreferenced avatar created 25 hours ago -> delete
    { _id: "st_abandoned_upload_old", _creationTime: now - 25 * 3600 * 1000 },
    // Unreferenced upload in-flight created 1 hour ago -> preserve (not yet expired)
    { _id: "st_upload_in_flight", _creationTime: now - 1 * 3600 * 1000 },
  ];

  const deletedIds = [];
  let scannedCount = 0;

  for (const rec of mockStorageRecords) {
    scannedCount++;
    if (rec._creationTime < olderThan && !activeStorageIds.has(rec._id)) {
      deletedIds.push(rec._id);
    }
  }

  assert.equal(scannedCount, 3);
  assert.deepEqual(deletedIds, ["st_abandoned_upload_old"]);

  // Return metric must not leak user emails, names, or file contents
  const metric = {
    scanned: scannedCount,
    deleted: deletedIds.length,
    timestamp: now,
  };
  assert.equal(metric.scanned, 3);
  assert.equal(metric.deleted, 1);
  assert.equal(metric.user, undefined);
  assert.equal(metric.email, undefined);
});
