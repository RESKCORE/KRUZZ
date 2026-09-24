# KRUZZ Backend (`convex/`)

The `convex/` directory contains the complete real-time serverless backend for **KRUZZ**, powered by **Convex**. It manages data persistence, authentication, progress tracking, streaks, reward points, and the multi-provider AI grading engine.

---

## 📁 Backend Directory Structure

```
convex/
├── schema.ts            # Canonical database schema & index definitions
├── caseStudies.ts       # Public & internal queries/mutations for case studies
├── caseProgress.ts      # User progress tracking, section state, lab attempt reservations
├── ai.ts                # Multi-provider LLM grading engine (Gemini, Groq, OpenRouter)
├── streaks.ts           # Daily streak calculations, timezone boundaries, multipliers
├── awards.ts            # Reasoning Credit (RC) balance and item redemptions
├── leaderboard.ts       # Public rank queries and top-learner aggregations
├── users.ts             # User profiles, privacy controls, 128-bit public IDs
├── migrations.ts        # Database migration & schema enrichment scripts
├── rules.ts             # Static rules and curriculum progression metadata
└── auth.config.ts       # Clerk JWT authentication bridge configuration
```

---

## 🗄️ Database Tables (`schema.ts`)

| Table             | Description                                                                                                      |
| :---------------- | :--------------------------------------------------------------------------------------------------------------- |
| `caseStudies`     | The authoritative single source of truth for all 35 case studies, architecture levels, decisions, and code labs. |
| `caseProgress`    | Tracks which sections a user has completed, lab pass status, and best scores.                                    |
| `users`           | User profile data, 128-bit public ID, privacy settings, and Clerk token mappings.                                |
| `awards`          | Reasoning Credit (RC) ledger and unlocked store items.                                                           |
| `streaks`         | Consecutive-day learning streak records and timezone midnight anchors.                                           |
| `labReservations` | Short-lived locks preventing concurrent lab abuse and enforcing quotas.                                          |
| `providerHealth`  | Circuit breaker tracking for AI evaluation APIs (Gemini, Groq, OpenRouter).                                      |

---

## 🛡️ Security & Reliability Invariants

1. **Database-Driven Content**:
   - Case studies are never hardcoded in client bundles.
   - All 35 studies are served through indexed, authenticated Convex queries.

2. **Durable Provider Circuit Breaker (`caseProgress.ts`, `ai.ts`)**:
   - If an AI provider fails consecutively 3 times, the circuit trips OPEN to protect against cascading failure.
   - Automatically attempts graceful failover across alternative providers (Gemini $\rightarrow$ Groq $\rightarrow$ OpenRouter).

3. **Atomic Idempotency & Rate Limiting**:
   - Lab submissions use reservation keys and transactional locks to prevent duplicate credit awards or double charges.
   - Rate limit: 15 lab submissions per hour per user.
