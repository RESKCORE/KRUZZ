import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { loadGuestRC, saveGuestRC, totalRC, rankFor } from "@/lib/rc";

/**
 * Account hook — Clerk authentication + Convex user profile.
 */
export function useAccount() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);
  const cloudUser = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (isSignedIn && isAuthenticated) {
      const tz =
        typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
      storeUser(tz ? { timezone: tz } : {}).catch(() => {});
    }
  }, [isSignedIn, isAuthenticated, storeUser]);

  return {
    user: user ?? null,
    profile: cloudUser ?? null,
    isLoading: !isLoaded || isConvexLoading,
    isAuthenticated: Boolean(isSignedIn && isAuthenticated),
  };
}

/**
 * Wallet hook — Convex cloud sync when authenticated, localStorage fallback for guests.
 */
export function useWallet() {
  const { isAuthenticated } = useConvexAuth();
  const [guestAwards, setGuestAwards] = useState<Record<string, number>>({});
  const cloudAwards = useQuery(api.awards.getUserAwards, isAuthenticated ? {} : "skip");
  const cloudAward = useMutation(api.awards.awardPoints);
  const syncGuestData = useMutation(api.users.syncGuestData);
  const [synced, setSynced] = useState(false);

  // Load guest awards on mount
  useEffect(() => {
    setGuestAwards(loadGuestRC());
  }, []);

  // When user logs in, automatically sync guest awards and streak to cloud once
  useEffect(() => {
    if (isAuthenticated && !synced) {
      const local = loadGuestRC();
      const localStreakStr =
        localStorage.getItem("kruzz:streak") || localStorage.getItem("rc-arena:streak");
      let localStreak = {
        current: 0,
        longest: 0,
        lastActive: undefined as string | undefined,
      };
      if (localStreakStr) {
        try {
          const parsed = JSON.parse(localStreakStr);
          localStreak = {
            current: parsed.current || 0,
            longest: parsed.longest || 0,
            lastActive: parsed.lastActive || undefined,
          };
        } catch {
          // Invalid JSON
        }
      }

      const streakPayload: { current: number; longest: number; lastActive?: string } = {
        current: localStreak.current,
        longest: localStreak.longest,
      };
      if (localStreak.lastActive) {
        streakPayload.lastActive = localStreak.lastActive;
      }

      if (Object.keys(local).length > 0 || localStreak.current > 0) {
        syncGuestData({
          awards: local,
          streak: streakPayload,
        })
          .then(() => {
            setSynced(true);
          })
          .catch(() => {});
      } else {
        setSynced(true);
      }
    }
  }, [isAuthenticated, synced, syncGuestData]);

  // Active awards: cloud if authenticated, guest otherwise
  const activeAwards: Record<string, number> = isAuthenticated
    ? (cloudAwards ?? guestAwards)
    : guestAwards;

  const points = totalRC(activeAwards);

  // Award RC
  const award = useCallback(
    async (awardId: string, amount: number) => {
      if (isAuthenticated) {
        try {
          return await cloudAward({ awardId, points: amount });
        } catch {
          return false;
        }
      }

      // Guest mode
      if (guestAwards[awardId]) return false;
      const newAwards = { ...guestAwards, [awardId]: amount };
      setGuestAwards(newAwards);
      saveGuestRC(newAwards);
      return true;
    },
    [isAuthenticated, cloudAward, guestAwards],
  );

  // Check if award exists (supports both case: prefixed and unprefixed formats)
  const has = useCallback(
    (awardId: string) => {
      if (activeAwards[awardId]) return true;
      if (awardId.startsWith("case:")) {
        const stripped = awardId.slice(5);
        if (activeAwards[stripped]) return true;
      } else {
        const prefixed = `case:${awardId}`;
        if (activeAwards[prefixed]) return true;
      }
      return false;
    },
    [activeAwards],
  );

  return {
    points,
    awards: activeAwards,
    award,
    has,
    rank: rankFor(points),
    isAuthenticated,
  };
}

/**
 * Streak hook — Convex cloud sync when authenticated, localStorage fallback for guests.
 */
export function useStreak() {
  const { isAuthenticated } = useConvexAuth();
  const [localCurrent, setLocalCurrent] = useState(0);
  const [localLongest, setLocalLongest] = useState(0);
  const [localLastActive, setLocalLastActive] = useState<string | null>(null);

  const cloudStreak = useQuery(api.streaks.getUserStreak, isAuthenticated ? {} : "skip");
  const cloudTouch = useMutation(api.streaks.touchStreak);

  useEffect(() => {
    const data = localStorage.getItem("kruzz:streak") || localStorage.getItem("rc-arena:streak");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setLocalCurrent(parsed.current || 0);
        setLocalLongest(parsed.longest || 0);
        setLocalLastActive(parsed.lastActive || null);
      } catch {
        // Invalid data
      }
    }
  }, []);

  // Auto-touch daily streak on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const tz =
        typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
      cloudTouch(tz ? { timezone: tz } : {}).catch(() => {});
    }
  }, [isAuthenticated, cloudTouch]);

  const touch = useCallback(async () => {
    const tz =
      typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
    if (isAuthenticated) {
      try {
        const res = await cloudTouch(tz ? { timezone: tz } : {});
        return res;
      } catch {
        // Fallback to local touch
      }
    }

    const today = new Date().toISOString().slice(0, 10);

    if (localLastActive === today) {
      return { streakCurrent: localCurrent, updated: false };
    }

    let newStreak = 1;
    if (localLastActive) {
      const lastDate = new Date(localLastActive);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        newStreak = localCurrent + 1;
      }
    }

    const newLongest = Math.max(localLongest, newStreak);

    setLocalCurrent(newStreak);
    setLocalLongest(newLongest);
    setLocalLastActive(today);

    localStorage.setItem(
      "kruzz:streak",
      JSON.stringify({
        current: newStreak,
        longest: newLongest,
        lastActive: today,
      }),
    );

    return {
      streakCurrent: newStreak,
      streakLongest: newLongest,
      updated: true,
      previousStreak: localCurrent,
    };
  }, [isAuthenticated, cloudTouch, localLastActive, localCurrent, localLongest]);

  const current = isAuthenticated ? (cloudStreak?.current ?? localCurrent) : localCurrent;
  const longest = isAuthenticated ? (cloudStreak?.longest ?? localLongest) : localLongest;
  const lastActive = isAuthenticated
    ? (cloudStreak?.lastActive ?? localLastActive)
    : localLastActive;

  return {
    current,
    longest,
    lastActive,
    touch,
  };
}
