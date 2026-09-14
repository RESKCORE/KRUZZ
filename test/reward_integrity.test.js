import test from "node:test";
import assert from "node:assert/strict";
import { REWARD_RULES, STORE_CATALOG, rankForPoints } from "../convex/rules.ts";

// ============================================================================
// Reward Engine Simulation & Invariants Testing
// ============================================================================

function createMockDb() {
  const users = new Map();
  const awards = new Map();

  return {
    users,
    awards,
    getUser(id) {
      return users.get(id);
    },
    insertUser(id, user) {
      users.set(id, { ...user, _id: id });
      return id;
    },
    patchUser(id, updates) {
      const u = users.get(id);
      if (!u) throw new Error("User not found");
      const updated = { ...u, ...updates };
      users.set(id, updated);
      return updated;
    },
    findAward(userId, awardId) {
      return Array.from(awards.values()).find((a) => a.userId === userId && a.awardId === awardId);
    },
    insertAward(award) {
      const id = `award_${awards.size + 1}`;
      awards.set(id, { ...award, _id: id });
      return id;
    },
  };
}

/** Server-owned internal award primitive */
function awardPointsInternal(db, user, awardId, points) {
  const existing = db.findAward(user._id, awardId);
  if (existing) {
    return false; // Idempotent no-op
  }

  db.insertAward({
    userId: user._id,
    awardId,
    points,
    awardedAt: Date.now(),
  });

  const newPoints = user.points + points;
  db.patchUser(user._id, {
    points: newPoints,
    rank: rankForPoints(newPoints),
  });

  return true;
}

/** Server-owned store purchase redemption */
function redeemStoreItem(db, identity, itemId) {
  if (!identity) {
    throw new Error("Must be signed in to redeem store items");
  }

  const item = STORE_CATALOG[itemId];
  if (!item) {
    throw new Error(`Unknown store item: ${itemId}`);
  }

  const user = db.getUser(identity.userId);
  if (!user) throw new Error("User not found");

  const awardId = `store:${item.id}`;
  const existing = db.findAward(user._id, awardId);
  if (existing) {
    return { success: true, alreadyOwned: true, item };
  }

  if (user.points < item.cost) {
    throw new Error(
      `Insufficient RC balance. Requires ${item.cost} RC, current balance is ${user.points} RC.`,
    );
  }

  db.insertAward({
    userId: user._id,
    awardId,
    points: -item.cost,
    awardedAt: Date.now(),
  });

  const newPoints = user.points - item.cost;
  db.patchUser(user._id, {
    points: newPoints,
    rank: rankForPoints(newPoints),
  });

  return { success: true, alreadyOwned: false, item, remainingPoints: newPoints };
}

test("Reward Rule 1: Canonical reward point values are strictly server-owned", () => {
  assert.equal(REWARD_RULES.sectionComplete, 0);
  assert.equal(REWARD_RULES.labPass, 0);
  assert.equal(REWARD_RULES.beginnerComplete, 20);
  assert.equal(REWARD_RULES.mediumComplete, 30);
  assert.equal(REWARD_RULES.advancedComplete, 50);
});

test("Reward Rule 2: Unauthenticated store redemption is strictly rejected", () => {
  const db = createMockDb();
  assert.throws(
    () => redeemStoreItem(db, null, "pdf-architecture-blueprints"),
    /Must be signed in to redeem store items/,
  );
});

test("Reward Rule 3: Replaying identical awardId is idempotent and adds 0 extra points", () => {
  const db = createMockDb();
  const userId = db.insertUser("u1", { points: 0, rank: "Observer" });
  let user = db.getUser(userId);

  const first = awardPointsInternal(
    db,
    user,
    "case:client-server:complete",
    REWARD_RULES.beginnerComplete,
  );
  assert.equal(first, true);
  user = db.getUser(userId);
  assert.equal(user.points, 20);

  // Duplicate award call (replay)
  const second = awardPointsInternal(
    db,
    user,
    "case:client-server:complete",
    REWARD_RULES.beginnerComplete,
  );
  assert.equal(second, false);
  user = db.getUser(userId);
  assert.equal(user.points, 20); // Unchanged!
});

test("Reward Rule 4: Store purchase validates catalog and rejects unknown items", () => {
  const db = createMockDb();
  db.insertUser("u1", { points: 500, rank: "Investigator" });
  const identity = { userId: "u1" };

  assert.throws(() => redeemStoreItem(db, identity, "non-existent-item"), /Unknown store item/);
});

test("Reward Rule 5: Store purchase rejects when balance is insufficient (no negative balance)", () => {
  const db = createMockDb();
  db.insertUser("u1", { points: 50, rank: "Observer" });
  const identity = { userId: "u1" };

  // Item costs 150 RC, user has 50 RC
  assert.throws(
    () => redeemStoreItem(db, identity, "pdf-architecture-blueprints"),
    /Insufficient RC balance/,
  );

  const user = db.getUser("u1");
  assert.equal(user.points, 50); // Untouched
});

test("Reward Rule 6: Store purchase successfully deducts cost and is idempotent on repeat", () => {
  const db = createMockDb();
  db.insertUser("u1", { points: 200, rank: "Apprentice" });
  const identity = { userId: "u1" };

  const purchase = redeemStoreItem(db, identity, "pdf-architecture-blueprints");
  assert.equal(purchase.success, true);
  assert.equal(purchase.alreadyOwned, false);
  assert.equal(purchase.remainingPoints, 50);

  let user = db.getUser("u1");
  assert.equal(user.points, 50);

  // Repeat purchase attempt
  const repeat = redeemStoreItem(db, identity, "pdf-architecture-blueprints");
  assert.equal(repeat.success, true);
  assert.equal(repeat.alreadyOwned, true);

  user = db.getUser("u1");
  assert.equal(user.points, 50); // Not deducted twice!
});
