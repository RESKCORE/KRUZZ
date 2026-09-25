/**
 * KRUZZ — Interview & Company Badges Dataset
 * Maps all 35 real-world case studies to their typical interview rounds,
 * high-frequency hiring companies (FAANG, Tier-1 Tech, Fintech), and campus placement targets.
 */

export interface CaseInterviewMeta {
  slug: string;
  index: string;
  companies: string[];
  roundType:
    | "Machine Coding (LLD)"
    | "System Design"
    | "Distributed Systems"
    | "Security & Auth"
    | "Concurrency & State";
  frequency: "Very High" | "High" | "Core Classic";
  interviewPrompt: string;
  targetRole: "Campus / Intern / SDE 1" | "SDE 1 & SDE 2" | "SDE 2 & Senior Systems";
  corePatterns: string[];
}

export const CASE_INTERVIEW_MAP: Record<string, CaseInterviewMeta> = {
  // ── Track 0: Foundations & Machine Coding (LLD) ─────────────────────────
  "atm-machine": {
    slug: "atm-machine",
    index: "01",
    companies: ["Amazon", "Bloomberg", "Goldman Sachs"],
    roundType: "Machine Coding (LLD)",
    frequency: "Very High",
    interviewPrompt:
      "Design an ATM controller with state transitions, PIN validation, and atomic cash dispense.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["State Pattern", "Transaction Atomicity", "Hardware Abstraction"],
  },
  "library-management": {
    slug: "library-management",
    index: "02",
    companies: ["Microsoft", "Amazon", "Cisco"],
    roundType: "Machine Coding (LLD)",
    frequency: "High",
    interviewPrompt:
      "Design a Library Management System handling book reservations, fine calculation, and inventory references.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["Relational References", "Observer Pattern", "Strategy Pattern"],
  },
  "banking-system-transfers": {
    slug: "banking-system-transfers",
    index: "03",
    companies: ["Stripe", "JPMorgan Chase", "PayPal"],
    roundType: "Concurrency & State",
    frequency: "Very High",
    interviewPrompt:
      "Implement an account transfer service enforcing double-entry ledger invariants and deadlock-free mutex locks.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["Double-Entry Bookkeeping", "Lock Ordering", "ACID Invariants"],
  },
  "parking-lot-allocation": {
    slug: "parking-lot-allocation",
    index: "04",
    companies: ["Amazon", "Uber", "Swiggy", "Google"],
    roundType: "Machine Coding (LLD)",
    frequency: "Very High",
    interviewPrompt:
      "Design an automated multi-floor Parking Lot system with spot allocation algorithms and dynamic hourly ticketing.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["Strategy Pattern", "Optimistic Concurrency", "Factory Pattern"],
  },
  "vending-machine-states": {
    slug: "vending-machine-states",
    index: "05",
    companies: ["Google", "Microsoft", "Adobe"],
    roundType: "Machine Coding (LLD)",
    frequency: "High",
    interviewPrompt:
      "Design a Vending Machine using Finite State Machines with coin validation, change return, and out-of-stock rollbacks.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["Finite State Machine", "Chain of Responsibility", "Transactional Rollback"],
  },
  "seat-booking-system": {
    slug: "seat-booking-system",
    index: "06",
    companies: ["Uber", "Booking.com", "Swiggy", "Ticketmaster"],
    roundType: "Concurrency & State",
    frequency: "Very High",
    interviewPrompt:
      "Design a movie/train seat booking system preventing race conditions, double-bookings, and managing 10-minute cart holds.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["Optimistic Concurrency", "TTL Reservation Locks", "Idempotency"],
  },
  "inventory-stock-tracker": {
    slug: "inventory-stock-tracker",
    index: "07",
    companies: ["Amazon", "Shopify", "Walmart Labs"],
    roundType: "Machine Coding (LLD)",
    frequency: "High",
    interviewPrompt:
      "Design an inventory decrement counter for a flash-sale item handling 100k concurrent requests without overselling.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["Atomic Decrement", "Event Notification", "Threshold Restock Triggers"],
  },

  // ── Track 1: Web Systems & Edge Delivery ────────────────────────────────
  "client-server-architecture": {
    slug: "client-server-architecture",
    index: "08",
    companies: ["Google", "Meta", "Apple"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Explain what happens when you type a URL into a browser: HTTP lifecycles, TCP handshakes, TLS, and response parsing.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["HTTP/2 & HTTP/3", "REST Idempotency", "Connection Pooling"],
  },
  "dns-domain-lookup": {
    slug: "dns-domain-lookup",
    index: "09",
    companies: ["Cloudflare", "Akamai", "Google"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Design a distributed DNS recursive resolver with caching, TTL invalidation, and Anycast routing.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Recursive Resolution", "Hierarchical Caching", "Anycast Geo-Routing"],
  },
  "image-cdn-delivery": {
    slug: "image-cdn-delivery",
    index: "10",
    companies: ["Netflix", "Pinterest", "Instagram"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design a global Content Delivery Network (CDN) for media assets with edge Points of Presence and origin shields.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Edge Caching", "Origin Shielding", "Cache Hit Optimization"],
  },
  "ecommerce-cart-checkout": {
    slug: "ecommerce-cart-checkout",
    index: "11",
    companies: ["Amazon", "Shopify", "DoorDash"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design an e-commerce checkout pipeline ensuring payment idempotency and stock reservations during network retries.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Idempotency Keys", "Two-Phase Reservation", "Session Affinity"],
  },
  "search-autocomplete": {
    slug: "search-autocomplete",
    index: "12",
    companies: ["Google", "Amazon", "Twitter/X"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design a search autocomplete (Typeahead) service returning top 5 suggestions under 50ms for 1 billion daily searches.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Trie Prefix Tree", "Edge Debouncing", "Frequency Invalidation"],
  },

  // ── Track 2: Security & Cryptographic Identity ───────────────────────────
  "authentication-workings": {
    slug: "authentication-workings",
    index: "13",
    companies: ["Okta", "Auth0", "Microsoft"],
    roundType: "Security & Auth",
    frequency: "High",
    interviewPrompt:
      "Design a centralized Single Sign-On (SSO) and RBAC authorization service using cryptographically signed tokens.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Bearer Token Claims", "Role-Based Access Control", "Token Revocation"],
  },
  "password-hashing-salts": {
    slug: "password-hashing-salts",
    index: "14",
    companies: ["Apple", "1Password", "CrowdStrike"],
    roundType: "Security & Auth",
    frequency: "High",
    interviewPrompt:
      "How do you securely store passwords against rainbow table lookups, GPU clusters, and side-channel timing attacks?",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Argon2id / bcrypt", "Cryptographic Salt", "Constant-Time Comparison"],
  },
  "api-key-auth": {
    slug: "api-key-auth",
    index: "15",
    companies: ["Stripe", "Twilio", "GitHub"],
    roundType: "Security & Auth",
    frequency: "High",
    interviewPrompt:
      "Design an API Key issuance and high-throughput validation gateway with fast cryptographic lookup and rate scopes.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["High-Entropy Secrets", "SHA-256 Key Prefixing", "Constant-Time Auth"],
  },
  "two-factor-totp": {
    slug: "two-factor-totp",
    index: "16",
    companies: ["Google", "Twilio", "Duo Security"],
    roundType: "Security & Auth",
    frequency: "High",
    interviewPrompt:
      "Implement a Time-based One-Time Password (TOTP) authenticator following RFC 6238 with clock drift compensation.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["HMAC Algorithm (HOTP)", "RFC 6238 Time Slices", "Clock Drift Window"],
  },
  "session-tokens-cookies": {
    slug: "session-tokens-cookies",
    index: "17",
    companies: ["Meta", "Netflix", "Amazon"],
    roundType: "Security & Auth",
    frequency: "High",
    interviewPrompt:
      "Compare stateful server sessions in Redis vs. stateless JWTs: trade-offs in revocation, CSRF/XSS defense, and scale.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: [
      "HttpOnly & SameSite Flags",
      "JWT Signature Verification",
      "Session Invalidation",
    ],
  },

  // ── Track 3: Distributed Data & Storage ─────────────────────────────────
  "url-shortener": {
    slug: "url-shortener",
    index: "18",
    companies: ["Google", "Meta", "Microsoft", "Amazon"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design TinyURL / Bitly: generate short URLs for 500 million links/month with low latency 301 vs 302 redirects.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Base62 Encoding", "Snowflake ID Generation", "HTTP Redirect Semantics"],
  },
  "key-value-caching": {
    slug: "key-value-caching",
    index: "19",
    companies: ["Redis", "Amazon", "Meta", "Twitter/X"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design an in-memory key-value cache (like Redis) with LRU eviction, TTL expiration, and cache stampede protection.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["LRU Eviction with Doubly Linked List", "Thundering Herd Mutex", "Cache-Aside"],
  },
  "database-indexing": {
    slug: "database-indexing",
    index: "20",
    companies: ["Oracle", "MongoDB", "Snowflake"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Explain how B+ Trees enable logarithmic range queries in databases, and the write amplification penalties of secondary indexes.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["B+ Tree Node Splitting", "Clustered vs Non-Clustered", "Index Cardinality"],
  },
  "cloud-data-deduplication": {
    slug: "cloud-data-deduplication",
    index: "21",
    companies: ["Dropbox", "Google Drive", "Box"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Design a cloud backup system (like Dropbox) that deduplicates identical multi-gigabyte file chunks globally.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: [
      "Content-Addressable Storage",
      "Cryptographic Chunking (SHA-256)",
      "Rabin Fingerprints",
    ],
  },

  // ── Track 4: Realtime Systems & Streaming ───────────────────────────────
  "realtime-chat-websocket": {
    slug: "realtime-chat-websocket",
    index: "22",
    companies: ["Meta (WhatsApp)", "Discord", "Slack"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design a real-time messaging system supporting 50 million concurrent connected users, group chat, and offline queues.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Full-Duplex WebSockets", "Redis Pub/Sub Fanout", "Heartbeat Liveness"],
  },
  "push-notification-service": {
    slug: "push-notification-service",
    index: "23",
    companies: ["Uber", "Apple", "Airbnb"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Design a high-volume notification service routing 100k pushes/sec across Apple APNs, Firebase FCM, and SMS gateways.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Gateway Multiplexing", "Backpressure Buffering", "Device Token Invalidation"],
  },
  "gaming-live-leaderboard": {
    slug: "gaming-live-leaderboard",
    index: "24",
    companies: ["Roblox", "Riot Games", "Epic Games"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design a real-time global leaderboard for 10 million players displaying exact ranks and top-100 snapshots within 100ms.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Redis Sorted Sets (ZSET)", "Skiplist Data Structure", "Rank Pagination"],
  },
  "webhook-event-delivery": {
    slug: "webhook-event-delivery",
    index: "25",
    companies: ["Stripe", "Shopify", "GitHub"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Design a reliable webhook delivery system with at-least-once guarantees, exponential backoff retries, and dead-letter queues.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: [
      "At-Least-Once Delivery",
      "Exponential Backoff with Jitter",
      "Dead-Letter Queue (DLQ)",
    ],
  },

  // ── Track 5: Reliability, Resiliency & Scale ─────────────────────────────
  "api-rate-limiting": {
    slug: "api-rate-limiting",
    index: "26",
    companies: ["Stripe", "Cloudflare", "Uber"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "Design a distributed API rate limiter enforcing 10,000 req/sec limits across a cluster using Redis and atomic Lua scripts.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: ["Sliding Window Counter", "Token Bucket Algorithm", "Redis Atomic Lua"],
  },
  "background-job-queue": {
    slug: "background-job-queue",
    index: "27",
    companies: ["Uber", "Airbnb", "DoorDash"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "Design a resilient asynchronous task processing system with delayed execution, worker pools, and poison-pill isolation.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: ["Worker Pool Concurrency", "Visibility Timeouts", "Poison Pill Dead-Lettering"],
  },
  "circuit-breaker-pattern": {
    slug: "circuit-breaker-pattern",
    index: "28",
    companies: ["Netflix", "Amazon", "Uber"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "Implement a microservice Circuit Breaker with Closed, Open, and Half-Open states to prevent cascading system outages.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: ["State Machine Trip Logic", "Exponential Probing", "Fail-Fast Semantics"],
  },
  "server-health-monitoring": {
    slug: "server-health-monitoring",
    index: "29",
    companies: ["AWS", "Cloudflare", "Datadog"],
    roundType: "Distributed Systems",
    frequency: "High",
    interviewPrompt:
      "Design an active and passive health-checking system that orchestrates DNS and load balancer failovers without split-brain.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: ["Heartbeat Probing", "Split-Brain Mitigation", "Quorum Health Voting"],
  },
  "idempotent-payment-processing": {
    slug: "idempotent-payment-processing",
    index: "30",
    companies: ["Stripe", "PayPal", "Square / Block"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "How do you guarantee that network timeouts never cause double charges when executing credit card transactions?",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: ["Distributed Mutex Lock", "Idempotency Ledger", "Replay Attack Defense"],
  },

  // ── Track 6: Advanced Distributed Architectures & Consensus ──────────────
  "two-phase-commit-transactions": {
    slug: "two-phase-commit-transactions",
    index: "31",
    companies: ["Google (Spanner)", "CockroachDB", "AWS"],
    roundType: "Distributed Systems",
    frequency: "High",
    interviewPrompt:
      "Design a distributed transaction coordinator using Two-Phase Commit (2PC) and handle coordinator crash recovery.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "Prepare & Commit Phases",
      "Coordinator Write-Ahead Log",
      "Blocking Lock Recovery",
    ],
  },
  "event-streaming-partitioned-log": {
    slug: "event-streaming-partitioned-log",
    index: "32",
    companies: ["LinkedIn", "Uber", "Netflix (Kafka)"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "Design an append-only distributed commit log (like Apache Kafka) with partition key hashing and consumer group offsets.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: ["Sequential Append Log", "Zero-Copy Disk Read", "Partition Offset Tracking"],
  },
  "consistent-hashing-shard-ring": {
    slug: "consistent-hashing-shard-ring",
    index: "33",
    companies: ["Amazon (DynamoDB)", "Discord", "Vimeo"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "Design a consistent hashing ring with virtual nodes to minimize key remapping when adding or removing storage nodes.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: ["Virtual Token Nodes", "Ring Binary Search", "Node Churn Rebalancing"],
  },
  "leader-election-consensus": {
    slug: "leader-election-consensus",
    index: "34",
    companies: ["HashiCorp (Consul)", "etcd", "Kubernetes"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "Explain the Raft consensus leader election protocol: randomized election timers, term numbers, and split-vote resolution.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: ["Randomized Heartbeat Timer", "Term Monotonicity", "Majority Quorum Grant"],
  },
  "quorum-reads-writes": {
    slug: "quorum-reads-writes",
    index: "35",
    companies: ["Amazon (Dynamo)", "Apple", "Netflix (Cassandra)"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "Design a leaderless replicated datastore (Dynamo model) with tunable consistency R + W > N, read repair, and hinted handoffs.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: ["Tunable Consistency Math", "Vector Clocks & Read Repair", "Hinted Handoff"],
  },

  // ── Track 0B: Campus Systems & Machine Coding (LLD) ──────────────────────
  "campus-attendance-timetable": {
    slug: "campus-attendance-timetable",
    index: "36",
    companies: ["Microsoft", "Oracle", "Workday"],
    roundType: "Machine Coding (LLD)",
    frequency: "High",
    interviewPrompt:
      "Design an Attendance, Timetable & Grade Tracker calculating GPA, credit weights, and threshold shortage alerts.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: [
      "Entity-Relationship Model",
      "Weighted Aggregations",
      "Threshold Shortage Alerts",
    ],
  },
  "campus-placement-drive-portal": {
    slug: "campus-placement-drive-portal",
    index: "37",
    companies: ["Amazon", "Cisco", "Infosys"],
    roundType: "Machine Coding (LLD)",
    frequency: "Very High",
    interviewPrompt:
      "Design a Campus Placement Portal with multi-tier eligibility filtering, slot booking, and offer acceptance workflows.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["Filter Specification Pattern", "Slot Reservation Locks", "State Transition"],
  },
  "splitwise-expense-splitter": {
    slug: "splitwise-expense-splitter",
    index: "38",
    companies: ["Uber", "Swiggy", "Cred"],
    roundType: "Machine Coding (LLD)",
    frequency: "Very High",
    interviewPrompt:
      "Design an Expense Sharing system (Splitwise) supporting equal/exact splits and greedy debt minimization.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["Debt Simplification (Greedy Heap)", "Split Strategy Pattern", "Ledger Graph"],
  },
  "online-chess-game-engine": {
    slug: "online-chess-game-engine",
    index: "39",
    companies: ["Google", "Bloomberg", "Riot Games"],
    roundType: "Machine Coding (LLD)",
    frequency: "High",
    interviewPrompt:
      "Design an Object-Oriented Chess Engine validating piece moves, turn state machine, and check/checkmate rules.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: [
      "Polymorphic Move Validation",
      "Turn-Based State Machine",
      "Board Representation",
    ],
  },
  "support-ticket-routing-queue": {
    slug: "support-ticket-routing-queue",
    index: "40",
    companies: ["Zendesk", "Salesforce", "Atlassian"],
    roundType: "Machine Coding (LLD)",
    frequency: "High",
    interviewPrompt:
      "Design an Automated Support Ticket Router dispatching issues to available agents based on skill tags and priority.",
    targetRole: "Campus / Intern / SDE 1",
    corePatterns: ["Priority Queue (Min-Heap)", "Skill Tag Matching", "Agent Capacity Tracker"],
  },

  // ── Track 7: Scalable Web & Edge Platform Services ──────────────────────
  "online-mcq-proctoring-system": {
    slug: "online-mcq-proctoring-system",
    index: "41",
    companies: ["TCS", "HackerRank", "Mercer Mettl"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Design a High-Concurrency Online MCQ Examination Platform handling simultaneous submits and automated cheat-flagging.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Buffered Batch Submission", "Time-Window Validation", "Anomaly Detection"],
  },
  "tinder-geospatial-matchmaker": {
    slug: "tinder-geospatial-matchmaker",
    index: "42",
    companies: ["Tinder", "Uber", "Bumble"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design a Geospatial Matchmaking Engine (Tinder swipe deck) using Geo-Hashing, Redis sets, and mutual match notifications.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["GeoHash / QuadTrees", "Two-Way Swipe Inverted Index", "Transient Deck Caching"],
  },
  "slack-channels-threads": {
    slug: "slack-channels-threads",
    index: "43",
    companies: ["Slack", "Discord", "Meta"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design a Team Communication Workspace (Slack) supporting public/private channels, thread hierarchies, and unread counts.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: [
      "WebSocket Channel Subscriptions",
      "Parent-Child Thread Model",
      "Read Pointer Watermarks",
    ],
  },
  "realtime-live-location-fleet": {
    slug: "realtime-live-location-fleet",
    index: "44",
    companies: ["Uber", "DoorDash", "Zomato"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design a Fleet Telemetry Service processing millions of GPS pings per minute with geofence proximity alerts.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Spatial Pub/Sub", "Trajectory Compression", "Polygon Geofence Intersection"],
  },
  "anycast-vpn-reverse-proxy": {
    slug: "anycast-vpn-reverse-proxy",
    index: "45",
    companies: ["Cloudflare", "Fastly", "AWS"],
    roundType: "Distributed Systems",
    frequency: "High",
    interviewPrompt:
      "Design an Anycast BGP Global Reverse Proxy that terminates TLS near users and accelerates traffic over private backbones.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "BGP Anycast Routing",
      "Connection Draining & Health Checks",
      "Layer 4/7 Proxying",
    ],
  },
  "captcha-bot-defense-engine": {
    slug: "captcha-bot-defense-engine",
    index: "46",
    companies: ["Cloudflare", "Akamai", "Datadog"],
    roundType: "Security & Auth",
    frequency: "High",
    interviewPrompt:
      "Design an Adaptive Bot Mitigation Engine with sliding-window behavioral scoring and Proof-of-Work cryptographic challenges.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: [
      "Sliding Window Rate Limiting",
      "Proof-of-Work Challenges",
      "Fingerprint Risk Engine",
    ],
  },
  "feature-flags-canary-engine": {
    slug: "feature-flags-canary-engine",
    index: "47",
    companies: ["LaunchDarkly", "Meta", "Netflix"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Design a Dynamic Feature Flag and Canary Deployment System evaluating millions of flag rules in sub-millisecond time.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: [
      "MurmurHash Consistent Bucketing",
      "Rule Evaluation Engine",
      "Streaming Config Sync",
    ],
  },
  "news-aggregator-simhash-dedup": {
    slug: "news-aggregator-simhash-dedup",
    index: "48",
    companies: ["Google", "Twitter", "ByteDance"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Design a Real-Time News Aggregator clustering identical articles across thousands of RSS feeds using 64-bit SimHash.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: [
      "SimHash Locality-Sensitive Hashing",
      "Hamming Distance Lookup",
      "Inverted Index Sharding",
    ],
  },
  "smart-notification-digest-service": {
    slug: "smart-notification-digest-service",
    index: "49",
    companies: ["LinkedIn", "Meta", "Pinterest"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Design an Intelligent Notification Digest Engine bundling high-frequency activity updates respecting user quiet hours.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Time-Bucket Aggregation", "Timezone Quiet Hours Windows", "Idempotent Fanout"],
  },
  "async-video-transcoding-pipeline": {
    slug: "async-video-transcoding-pipeline",
    index: "50",
    companies: ["YouTube", "Netflix", "TikTok"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design an Asynchronous Video Transcoding and HLS Packaging Pipeline with chunked parallel encoding and CDN distribution.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "Chunked Parallel Transcoding",
      "HLS/DASH Playlist Generation",
      "Queue-Worker DAG Orchestration",
    ],
  },

  // ── Track 8: Advanced Distributed AI, Ledgers & CRDTs ───────────────────
  "llm-chatbot-streaming-guardrails": {
    slug: "llm-chatbot-streaming-guardrails",
    index: "51",
    companies: ["OpenAI", "Anthropic", "Google"],
    roundType: "System Design",
    frequency: "Very High",
    interviewPrompt:
      "Design a High-Throughput LLM Inference Gateway with streaming Server-Sent Events (SSE) and token-by-token safety moderation.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "Server-Sent Events (SSE)",
      "Token Sliding Window Filter",
      "Circuit Breaker Fallback",
    ],
  },
  "distributed-vector-database-rag": {
    slug: "distributed-vector-database-rag",
    index: "52",
    companies: ["Pinecone", "OpenAI", "Meta"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "Design a Distributed Vector Database with HNSW Approximate Nearest Neighbor indexing and hybrid keyword-semantic search.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: ["HNSW Graph Indexing", "Cosine Similarity Search", "Segment-Based Compaction"],
  },
  "google-sheets-crdt-collaboration": {
    slug: "google-sheets-crdt-collaboration",
    index: "53",
    companies: ["Google", "Figma", "Canva"],
    roundType: "Concurrency & State",
    frequency: "Very High",
    interviewPrompt:
      "Design a Collaborative Real-Time Spreadsheet supporting concurrent formula edits using Conflict-Free Replicated Data Types.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "LWW-Element-Set CRDT",
      "Fractional Indexing for Rows/Cols",
      "State-Based Convergence",
    ],
  },
  "notion-offline-first-sync": {
    slug: "notion-offline-first-sync",
    index: "54",
    companies: ["Notion", "Linear", "Apple"],
    roundType: "Concurrency & State",
    frequency: "Very High",
    interviewPrompt:
      "Design an Offline-First Block-Based Document Editor with local SQLite mutations, vector clocks, and Merkle tree sync.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "Merkle Tree Diff Sync",
      "Vector Clocks / Lamport Timestamps",
      "Optimistic Local Mutations",
    ],
  },
  "distributed-tracing-apm-collector": {
    slug: "distributed-tracing-apm-collector",
    index: "55",
    companies: ["Datadog", "Uber", "Dynatrace"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "Design an APM Distributed Tracing Ingestion Pipeline (Jaeger/OpenTelemetry) parsing billions of spans with tail-based sampling.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "Trace Context Propagation (W3C)",
      "Tail-Based Sampling",
      "Span DAG Reconstruction",
    ],
  },
  "high-scale-git-virtual-monorepo": {
    slug: "high-scale-git-virtual-monorepo",
    index: "56",
    companies: ["Microsoft", "Google", "GitHub"],
    roundType: "Distributed Systems",
    frequency: "High",
    interviewPrompt:
      "Design a Virtualized Git Monorepo System (VFS for Git) projecting petabytes of source tree on-demand without full clone.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "Git Tree Object Directed Graph",
      "Sparse Checkout Virtualization",
      "Content-Addressable Blob Store",
    ],
  },
  "subscription-billing-dunning-engine": {
    slug: "subscription-billing-dunning-engine",
    index: "57",
    companies: ["Stripe", "Paddle", "Chargebee"],
    roundType: "Concurrency & State",
    frequency: "Very High",
    interviewPrompt:
      "Design a Recurring Billing & Dunning Engine handling mid-cycle plan upgrades, second-precision proration, and payment retries.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "Second-Precision Proration",
      "Exponential Backoff Dunning",
      "Two-Phase Billing Invariants",
    ],
  },
  "distributed-etl-dag-scheduler": {
    slug: "distributed-etl-dag-scheduler",
    index: "58",
    companies: ["Airflow", "Databricks", "Snowflake"],
    roundType: "Distributed Systems",
    frequency: "Very High",
    interviewPrompt:
      "Design a Fault-Tolerant Distributed DAG Task Scheduler orchestrating dependency graphs with failure retries and concurrency limits.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "Topological Sort (Kahn's Algorithm)",
      "Distributed Lock Lease",
      "Worker Heartbeat & Task Reassignment",
    ],
  },
  "event-sourced-payment-ledger": {
    slug: "event-sourced-payment-ledger",
    index: "59",
    companies: ["Stripe", "Revolut", "Square"],
    roundType: "Concurrency & State",
    frequency: "Very High",
    interviewPrompt:
      "Design an Immutable Event-Sourced Double-Entry Financial Ledger with point-in-time balance reconstruction and audit proofs.",
    targetRole: "SDE 2 & Senior Systems",
    corePatterns: [
      "Append-Only Event Store",
      "Double-Entry Zero-Sum Invariant",
      "Snapshot Projection",
    ],
  },
};

/** Index-to-slug helper map */
const INDEX_TO_SLUG: Record<string, string> = {};
for (const [slug, item] of Object.entries(CASE_INTERVIEW_MAP)) {
  INDEX_TO_SLUG[item.index] = slug;
  INDEX_TO_SLUG[String(parseInt(item.index, 10))] = slug;
}

/**
 * Returns interview badge metadata for any case study by slug or numeric index.
 */
export function getCaseInterviewBadges(slugOrIndex: string): CaseInterviewMeta {
  const normalized = slugOrIndex.toLowerCase().trim();
  if (CASE_INTERVIEW_MAP[normalized]) {
    return CASE_INTERVIEW_MAP[normalized];
  }
  const slugFromIndex = INDEX_TO_SLUG[normalized];
  if (slugFromIndex && CASE_INTERVIEW_MAP[slugFromIndex]) {
    return CASE_INTERVIEW_MAP[slugFromIndex];
  }

  // Graceful fallback for any custom or new cases
  return {
    slug: normalized,
    index: "00",
    companies: ["FAANG", "Top Tech"],
    roundType: "System Design",
    frequency: "High",
    interviewPrompt:
      "Analyze the architectural trade-offs, state flows, and production edge cases for this system.",
    targetRole: "SDE 1 & SDE 2",
    corePatterns: ["Modular Design", "Fault Tolerance"],
  };
}

/**
 * Curated list of top hiring companies featured across all KRUZZ cases.
 */
export const FEATURED_COMPANIES = [
  "All",
  "Amazon",
  "Google",
  "Meta",
  "Uber",
  "Stripe",
  "OpenAI",
  "Slack",
  "Discord",
  "Datadog",
  "GitHub",
  "Pinecone",
  "Netflix",
  "Microsoft",
  "Bloomberg",
  "Cloudflare",
  "Shopify",
] as const;

/**
 * Curated list of interview round categories.
 */
export const INTERVIEW_ROUND_CATEGORIES = [
  "All Rounds",
  "Machine Coding (LLD)",
  "System Design",
  "Distributed Systems",
  "Security & Auth",
  "Concurrency & State",
] as const;

/**
 * Convenience helper to get the 7 Track 0 LLD cases for campus hiring.
 */
export function getTrack0MachineCodingCases(): CaseInterviewMeta[] {
  const slugs = [
    "atm-machine",
    "library-management",
    "banking-system-transfers",
    "parking-lot-allocation",
    "vending-machine-states",
    "seat-booking-system",
    "inventory-stock-tracker",
  ];
  return slugs.map((s) => CASE_INTERVIEW_MAP[s]).filter((c): c is CaseInterviewMeta => Boolean(c));
}
