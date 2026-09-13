import { upsertToConvex, validateCaseStudy } from "./quality_gate.ts";

// ============================================================================
// Track 6: Advanced Distributed Architectures (Cases 31 - 35)
// All cases are premium-tier, difficulty "Advanced", learnerLevel "Engineer".
// Content follows the canonical full KRUZ shape rendered by cases.$slug.tsx.
// ============================================================================

export const case31_twoPhaseCommit = {
  id: "cs-two-phase-commit-031",
  slug: "two-phase-commit-transactions",
  index: "31",
  title: "How Do Distributed Transactions Stay Atomic Across Many Machines?",
  shortTitle: "Two-Phase Commit",
  category: "Distributed Data & Storage",
  subcategory: "Atomicity Across Nodes",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "A bank transfer that moves money between two accounts hosted on two different databases either completes on both machines or completes on neither. Discover how the Two-Phase Commit protocol uses a coordinator and a voting round to make distributed transactions atomic.",
  learningObjectives: [
    "Explain why a single commit decision cannot be made by any one node alone when data lives on multiple machines.",
    "Trace the prepare (voting) phase and the commit (decision) phase of Two-Phase Commit (2PC).",
    "Identify failure modes such as coordinator crashes and participant timeouts, and what happens to the transaction.",
    "Implement a vote-collection state machine that maps node votes to a COMMIT or ABORT decision.",
  ],
  prerequisites: [
    "Client-server request-response model and HTTP basics",
    "Basic database transaction concepts (commit / rollback)",
    "Networking fundamentals: TCP, messages, timeouts",
    "Working with dictionaries and lists across multiple nodes",
  ],
  engineeringConcepts: [
    "Atomicity Across Nodes",
    "Two-Phase Commit",
    "Prepare Phase",
    "Commit Decision",
    "Coordinator",
    "Participant",
  ],
  technologies: ["Transactions", "Database", "Networking", "Python", "Java"],
  tech: ["2PC", "Distributed DB", "Coordinator"],
  tags: ["distributed", "transactions", "atomicity", "2pc", "advanced"],
  glossary: [
    {
      term: "Atomicity Across Nodes",
      plainDefinition:
        "The guarantee that a transaction touching data on multiple machines is applied everywhere or nowhere, never partially.",
    },
    {
      term: "Two-Phase Commit",
      plainDefinition:
        "A protocol where a coordinator first asks every participant whether it can commit, then tells them all the final decision.",
    },
    {
      term: "Prepare Phase",
      plainDefinition:
        "The first round of 2PC where the coordinator broadcasts a prepare request and every participant votes READY or ABORT.",
    },
    {
      term: "Commit Decision",
      plainDefinition:
        "The final answer the coordinator sends after collecting votes: COMMIT only if every participant voted READY, otherwise ABORT.",
    },
    {
      term: "Coordinator",
      plainDefinition:
        "The single responsible node that drives the transaction through both phases and broadcasts the final decision.",
    },
    {
      term: "Participant",
      plainDefinition:
        "One of the machines holding a piece of the transaction's data; it votes in the prepare phase and then applies or rolls back.",
    },
  ],
  primers: [
    {
      concept: "Why One Machine Can't Decide",
      minutes: 4,
      definition:
        "When data is split across two databases, neither server knows whether the other server is ready to commit. One of them must ask first — that is the coordinator.",
      whyNeeded:
        "Without a shared decision maker, one server could commit and the other could fail, leaving the system in a half-finished state.",
      analogy:
        "Two friends want to meet for lunch but neither can just start eating; someone must call around, confirm everyone can come, and then announce the plan.",
      tinyExample:
        "votes = ['READY', 'READY']\ndecision = 'COMMIT' if all(v == 'READY' for v in votes) else 'ABORT'",
    },
    {
      concept: "The Danger of a Partial Commit",
      minutes: 4,
      definition:
        "A partial commit is when some nodes saved the change and others did not. The system has permanently inconsistent data with no clean way back.",
      whyNeeded:
        "Distributed systems crash and messages get lost all the time, so the protocol must make a partial outcome impossible by design.",
      analogy:
        "A relay race where the baton must be handed off on the track: if one runner stops short, the race is invalid for everyone.",
      tinyExample: "if any(vote == 'ABORT' for vote in votes):\n    decision = 'ABORT'",
    },
  ],
  discover: {
    situation:
      "A fintech company splits customer accounts across two independent database clusters for isolation: the savings ledger in region A and the payments wallet in region B. A transfer deducts from one and credits the other. One afternoon, the transfer service deducts the savings ledger successfully, then the region-B database times out and the credit never lands. Customers have been debited with no matching credit, and ticket volume explodes.",
    humanFlow: [
      "Customer initiates a transfer of 200 units from savings to wallet.",
      "OrderProcessor sends a debit request to the savings ledger (region A).",
      "OrderProcessor sends a credit request to the wallet database (region B).",
      "The debit succeeds; the credit request times out after 30 seconds and is lost.",
      "The customer sees the money leave savings but never arrive in their wallet.",
    ],
    question:
      "How do you make a transaction that spans two independent databases commit on both machines or roll back on both — even when networks fail mid-flight?",
    whyItExists: [
      "No single machine owns both pieces of data, so no machine can know the end-to-end outcome by itself.",
      "Network outages and crashes can interrupt a multi-step transfer at any moment, producing partial state.",
      "Customers and regulators treat money movement as all-or-nothing, so partial writes are unacceptable.",
    ],
  },
  understand: {
    overview:
      "The Two-Phase Commit (2PC) protocol adds a coordinator that orchestrates every transaction across participants. In Phase 1 (Prepare), the coordinator asks each participant whether it can commit its part. Each participant does all its local writes but holds them uncommitted, and answers READY or ABORT. If every participant votes READY, the coordinator broadcasts COMMIT in Phase 2 and each participant finalizes. If any participant votes ABORT (or the coordinator cannot reach a participant), the coordinator broadcasts ABORT and every participant rolls back its held writes.",
    components: [
      {
        name: "Coordinator",
        whatIsIt:
          "The node that owns the transaction lifecycle and broadcasts prepare and decision messages.",
        whyItExists:
          "Someone must collect votes and make the single global decision, otherwise commits would be uncoordinated.",
        whatItDoes:
          "Sends prepare requests, collects votes, decides COMMIT or ABORT, and broadcasts the final decision.",
      },
      {
        name: "Participant",
        whatIsIt:
          "A database node that holds one piece of the transaction and can commit or roll back that piece locally.",
        whyItExists:
          "The data is distributed, so each machine must manage its own local resources under the coordinator's direction.",
        whatItDoes:
          "Performs writes in a hold state, votes READY or ABORT, then applies or discards its writes on the final decision.",
      },
      {
        name: "Prepare/Vote Message",
        whatIsIt:
          "The message the coordinator sends asking each participant to make its writes durable and report readiness.",
        whyItExists:
          "Votes let the coordinator learn the willingness of every participant before locking in a decision.",
        whatItDoes: "Triggers each participant to resource-write and reply with a single vote.",
      },
      {
        name: "Decision Log",
        whatIsIt:
          "A durable record kept by the coordinator and participants of the votes given and the decision reached.",
        whyItExists:
          "If any node crashes and restarts, it needs to remember whether it voted or already committed.",
        whatItDoes:
          "Powers crash recovery so a restarted coordinator can re-broadcast the decision instead of guessing.",
      },
    ],
    analogy: {
      title: "The Group Dinner Reservation",
      everyday: [
        "A group of friends wants to book a restaurant table. Before anyone orders food, someone calls each friend to confirm they can come.",
        "Each friend checks their schedule and says 'Yes, I'm free' or 'No, I can't make it'.",
        "The organizer only finalizes the reservation if everyone said yes. If even one person can't come, the whole dinner is cancelled.",
        "Everyone who said yes waits — nobody orders anything until the organizer announces the confirmed plan.",
      ],
      technical: [
        "The Organizer is the Coordinator; each friend is a Participant.",
        "'Yes, I'm free' is the READY vote; 'I can't come' is the ABORT vote.",
        "The final reservation call is the COMMIT or ABORT decision broadcast in Phase 2.",
        "Waiting to order until the announcement is exactly how participants hold writes until the decision arrives.",
      ],
    },
    flow: [
      "Coordinator stores the transaction id and sends a prepare request to every participant.",
      "Each participant applies its local writes (uncommitted), then replies READY, or replies ABORT if it cannot.",
      "Coordinator waits for all votes (or a timeout). Any ABORT or missing vote forces an ABORT decision.",
      "Coordinator durably records the decision and broadcasts COMMIT or ABORT to all participants.",
      "Each participant applies its held writes (COMMIT) or discards them (ABORT), then acknowledges.",
      "Coordinator records the transaction as finished and releases its resources.",
    ],
  },
  concepts: [
    {
      id: "concept-atomicity",
      name: "Atomicity Across Nodes",
      difficulty: "Advanced",
      simpleDefinition:
        "The property that a transaction across several machines behaves as one indivisible step: fully applied or fully rolled back.",
      whyItExists:
        "Partial application of a multi-node operation creates data states that cannot be trusted or reasoned about.",
      realWorldAnalogy:
        "A bank wire that leaves one account but never arrives is like a letter split between two mailbags and delivered to no one.",
      technicalExplanation:
        "Atomicity is achieved by making the commit a two-round agreement: writes are held, votes are gathered, and only a unanimous READY permits the final COMMIT.",
      caseApplication:
        "The transfer between the savings ledger and the wallet must be atomic; a partial transfer is worse than a failed one.",
      commonMistakes: [
        "Committing each node's writes independently before knowing the others voted READY.",
        "Forgetting to make the decision durable, so a coordinator restart forgets the outcome.",
      ],
      practice: [
        "Explain what happens if the coordinator crashes right after broadcasting COMMIT but before a participant receives it.",
        "Why is 'commit locally, then tell others' fundamentally unsafe?",
      ],
    },
    {
      id: "concept-consensus",
      name: "Unanimous Consent Rule",
      difficulty: "Advanced",
      simpleDefinition:
        "The rule that the transaction only commits when every participant votes READY; one ABORT vetoes the transaction.",
      whyItExists:
        "If even one participant cannot guarantee its part, committing the rest would produce a partial update.",
      realWorldAnalogy:
        "A rocket launch is scrubbed if any single subsystem reports a fault during the final countdown check.",
      technicalExplanation:
        "The coordinator aggregates votes with an all() semantics: COMMIT iff every vote is READY and the set is non-empty. Any ABORT, any timeout, or an empty vote set yields ABORT.",
      caseApplication:
        "If the region-B wallet database cannot be reached during prepare, the coordinator must abort the entire transfer.",
      commonMistakes: [
        "Requiring only a majority instead of unanimity (that belongs to consensus, not 2PC).",
        "Committing when a participant is missing rather than unreachable.",
      ],
      practice: [
        "Trace the decision for votes ['READY', 'ABORT'] and for votes ['READY', 'READY'].",
        "Design the rule for 'READY' votes you never hear back from due to a timeout.",
      ],
    },
    {
      id: "concept-recovery",
      name: "Crash Recovery & Timeouts",
      difficulty: "Advanced",
      simpleDefinition:
        "The mechanisms a protocol uses to keep making progress when machines die or messages are delayed: durable logs and bounded waiting.",
      whyItExists:
        "Crashes are not rare, so the protocol must have a well-defined behavior when a node vanishes mid-transaction.",
      realWorldAnalogy:
        "If the dinner organizer's phone dies, the friends already confirmed still wait; on restart the organizer must resume from a sticky note.",
      technicalExplanation:
        "Participants block while waiting for the final decision, so 2PC trades availability for safety: a crashed coordinator can hold participants indefinitely until recovery replays the decision log.",
      caseApplication:
        "When the region-B database times out during prepare, the coordinator aborts rather than hanging, and the savings ledger rolls back.",
      commonMistakes: [
        "Assuming participants can just proceed alone after a timeout.",
        "Not persisting the decision before broadcasting it.",
      ],
      practice: [
        "Compare how 2PC and Three-Phase Commit (3PC) differ in timeout behavior.",
        "Why is a NOTHING state (some committed, some aborted) an unrecoverable bug?",
      ],
    },
  ],
  architecture: {
    caption:
      "A coordinator surrounded by participants, orchestrating prepare votes and the final commit or abort decision.",
    levels: [
      {
        title: "Level 1: Two-Phase Control Flow",
        description: "The coordinator drives every participant through Prepare and then Decision.",
        mermaid: `graph TD
    C["Coordinator"] -->|"Phase 1: prepare?"| P1["Participant A (Savings Ledger)"]
    C -->|"Phase 1: prepare?"| P2["Participant B (Wallet DB)"]
    P1 -->|"vote READY / ABORT"| C
    P2 -->|"vote READY / ABORT"| C
    C -->|"Phase 2: COMMIT / ABORT"| P1
    C -->|"Phase 2: COMMIT / ABORT"| P2
`,
      },
      {
        title: "Level 2: Full Message Sequence",
        description: "The exact message exchange across both phases, including the decision log.",
        mermaid: `sequenceDiagram
    actor App as Transfer Service
    participant C as Coordinator
    participant A as Participant A (Savings)
    participant B as Participant B (Wallet)
    App->>C: begin transfer(tx_id)
    C->>A: prepare(tx_id)
    C->>B: prepare(tx_id)
    A-->>C: READY
    B-->>C: READY
    C->>C: write decision logged = COMMIT
    C->>A: COMMIT(tx_id)
    C->>B: COMMIT(tx_id)
    A-->>C: ACK
    B-->>C: ACK
    C-->>App: transfer committed
`,
      },
      {
        title: "Level 3: Vote Aggregation Logic",
        description: "How individual votes collapse into the single final decision.",
        mermaid: `graph TD
    Collect["Wait for all votes (or timeout)"] --> Check{"Any ABORT or timeout?"}
    Check -->|"Yes"| Abort["Decision = ABORT -> everyone rolls back"]
    Check -->|"No (all READY)"| Commit["Decision = COMMIT -> everyone applies"]
    Commit --> Log["Persist decision"]
    Abort --> Log
    Log --> Broadcast["Broadcast final decision to all participants"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Coordinator-Driven Two-Phase Commit vs. Peer-to-Peer Agreement",
      what: "Designate one node as the coordinator that collects votes and issues the single global decision.",
      why: "A single coordinator gives a clear, simple point where the transaction-level decision is made and logged.",
      problemSolved:
        "Eliminates the ambiguity of who decides: without an owner, nodes can disagree about the outcome.",
      withoutIt:
        "Each node commits on its own timeline, producing split-brain partial transactions.",
      alternatives: [
        "Three-Phase Commit (3PC): adds a pre-commit phase to reduce blocking on coordinator failure.",
        "Distributed consensus (Raft/Paxos): safer under node failure but far more complex.",
        "Saga pattern: sacrifices atomicity for availability by compensating each committed step on failure.",
      ],
      tradeoff:
        "The coordinator is a single point of blocking: if it crashes after votes arrive, participants can wait indefinitely until it recovers.",
    },
    {
      title: "Durable Decision Log Before Broadcast",
      what: "Persist the final COMMIT/ABORT decision to stable storage before sending Phase 2 messages.",
      why: "If the coordinator crashes mid-broadcast, it must be able to resume the exact decision on restart.",
      problemSolved:
        "Prevents the coordinator from restarting with no memory and letting participants diverge.",
      withoutIt:
        "A restarted coordinator forgets the decision and cannot tell participants whether to commit or abort.",
      alternatives: [
        "Replicated decision log across coordinator replicas.",
        "Ask-participants-on-recovery (non-durable) heuristic, less safe.",
      ],
      tradeoff:
        "Every transaction pays a disk write latency for the log, and the fleet needs a coordinator HA story anyway.",
    },
  ],
  implementation: {
    behaviour:
      "A TwoPhaseCommitCoordinator aggregate that collects participant votes, applies the unanimous-consent rule, and returns the single final decision exactly as the protocol specifies.",
    algorithm: [
      "1. Begin the transaction: create a transaction id and initialise an empty vote list.",
      "2. Phase 1 — Prepare: broadcast a prepare request to every participant and wait for their votes (subject to a timeout).",
      "3. Collect every vote. If any vote is ABORT, or if we timed out without hearing from a participant, the decision is ABORT.",
      "4. If the vote list is empty (no participants), decide ABORT.",
      "5. If every collected vote is READY, the decision is COMMIT.",
      "6. Phase 2 — Return the decision and notify participants so they apply or roll back.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Single Local Transaction",
        detail: "One database, one commit — no coordination needed.",
      },
      {
        level: "Level 1",
        title: "Manual Two-Step Commit",
        detail: "Write node A, then node B, hoping both succeed. Fails on partial success.",
      },
      {
        level: "Level 2",
        title: "Collect Votes Then Decide",
        detail: "Prepare phase with READY/ABORT votes and an all-READY rule.",
      },
      {
        level: "Level 3",
        title: "Durable Decision + Recovery",
        detail: "Persist the decision, retransmit on restart, and handle coordinator failure.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "two_phase_commit.py",
        code: `class TwoPhaseCommitCoordinator:
    def __init__(self) -> None:
        self.votes: list[str] = []

    def prepare(self, participant_votes: list[str]) -> None:
        # Phase 1: record every participant's vote.
        for vote in participant_votes:
            self.votes.append(vote.upper())

    def decide(self) -> str:
        # Phase 2: unanimous READY commits, anything else aborts.
        if not self.votes:
            return "ABORT"
        if any(v != "READY" for v in self.votes):
            return "ABORT"
        return "COMMIT"`,
        explanations: [
          {
            code: "def prepare(self, participant_votes: list[str]) -> None:",
            explanation:
              "Starts Phase 1 by recording each participant's vote into the coordinator's vote list.",
          },
          {
            code: "self.votes.append(vote.upper())",
            explanation:
              "Normalises the vote so 'ready', 'Ready' and 'READY' all compare identically.",
          },
          {
            code: 'if not self.votes: return "ABORT"',
            explanation: "An empty vote set is unsafe to commit — nothing voted READY, so abort.",
          },
          {
            code: 'if any(v != "READY" for v in self.votes): return "ABORT"',
            explanation:
              "Implements the unanimous-consent rule: one non-READY vote vetoes the whole transaction.",
          },
        ],
      },
    ],
    simulationNote:
      "This simulation models the coordinator's state machine only. Real 2PC additionally requires durable decision logging and retransmission; here we compress the protocol to its voting and decision core to isolate the unanimity rule.",
  },
  practice: [
    {
      level: "Understand",
      title: "Role Identification",
      brief:
        "Given a message log with prepare requests, READY votes, and a final COMMIT, label which node is the coordinator and which messages belong to Phase 1 versus Phase 2.",
    },
    {
      level: "Modify",
      title: "Add a Voting Timeout",
      brief:
        "Extend the coordinator to treat a missing vote after a 30-second window as an implicit ABORT and return ABORT for the transaction.",
    },
    {
      level: "Build",
      title: "Durable Decision Log",
      brief:
        "Add a simple append-only log that records the final decision so a restarted coordinator can report the same COMMIT/ABORT instead of recomputing from partial votes.",
    },
    {
      level: "Think",
      title: "Blocking Trade-off",
      brief:
        "Explain what happens to all participants if the coordinator crashes after gathering READY votes but before broadcasting, and why 3PC or a Saga changes this behavior.",
    },
  ],
  reflection: [
    "Why does a protocol need a voting round before anyone commits, rather than each node committing and reporting back?",
    "How does the unanimous-consent rule trade availability for correctness, and when would a Saga be a better business fit?",
    "What role does a durable log play in making the decision survive coordinator crashes?",
  ],
  techNotes: [
    {
      name: "Sagas vs 2PC",
      kind: "Alternative Pattern",
      note: "Sagas split a distributed transaction into sequential local transactions with compensating rollbacks, trading atomicity for high availability across long-running business processes.",
    },
    {
      name: "XA Protocol",
      kind: "Industry Standard",
      note: "XA is the classic peak of 2PC in databases: prepare, commit, rollback as API calls understood by Oracle, Postgres, MySQL, and message brokers alike.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Decide the Two-Phase Commit Outcome",
    brief:
      "Implement the coordinator's decision rule: given the votes from all participants, return COMMIT if and only if the transaction is non-empty and every vote reads READY; otherwise return ABORT.",
    functionName: "decide_two_phase",
    signature: "def decide_two_phase(votes: list[str]) -> str:",
    starterCode: `def decide_two_phase(votes: list[str]) -> str:
    # votes is a list of participant votes, e.g. ['READY', 'READY'] or ['READY', 'ABORT'].
    # Return 'COMMIT' only if votes is non-empty and EVERY entry equals 'READY'.
    # Otherwise return 'ABORT'.
    if not votes:
        return "ABORT"
    if any(v != "READY" for v in votes):
        return "ABORT"
    return "COMMIT"
`,
    javaSignature: "public static String decideTwoPhase(String[] votes)",
    javaStarterCode: `public class Solution {
    public static String decideTwoPhase(String[] votes) {
        if (votes.length == 0) {
            return "ABORT";
        }
        for (String v : votes) {
            if (!"READY".equals(v)) {
                return "ABORT";
            }
        }
        return "COMMIT";
    }
}`,
    mermaid: `graph TD
    Start["decide_two_phase(votes)"] --> Empty{"votes empty?"}
    Empty -->|"Yes"| Abort["Return 'ABORT'"]
    Empty -->|"No"| CheckAny{"any vote != 'READY'?"}
    CheckAny -->|"Yes"| Abort
    CheckAny -->|"No"| Commit["Return 'COMMIT'"]
`,
    hints: [
      "Treat the empty list as ABORT — there is nothing to commit.",
      "Compare every vote using != so any value other than READY flips the decision.",
      "Remember Python string equality is case-sensitive; normalize votes before comparing.",
    ],
    tests: [
      {
        name: "All ready commits",
        args: [["READY", "READY", "READY"]],
        expected: "COMMIT",
      },
      {
        name: "Any abort vetoes the transaction",
        args: [["READY", "ABORT", "READY"]],
        expected: "ABORT",
      },
      {
        name: "Unknown vote aborts",
        args: [["READY", "MAYBE"]],
        expected: "ABORT",
      },
      {
        name: "Empty vote list aborts",
        args: [[]],
        expected: "ABORT",
      },
    ],
    explanationPrompt:
      "Explain how your implementation enforces atomicity across nodes using the unanimous-consent rule, and why an empty vote set must abort.",
  },
};

export const case32_eventStreamingLog = {
  id: "cs-event-streaming-032",
  slug: "event-streaming-partitioned-log",
  index: "32",
  title: "How Does a Partitioned Event Stream Keep Millions of Events Ordered?",
  shortTitle: "Partitioned Event Log",
  category: "Realtime & Communication",
  subcategory: "Ordered Event Delivery",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "Streaming platforms deliver millions of events per second while guaranteeing that related events arrive in order. Discover why an append-only log split into partitions keeps order within each partition and scales by spreading partitions across many brokers.",
  learningObjectives: [
    "Explain the append-only log as the fundamental storage model of event streaming.",
    "Understand why ordering can only be local: within a partition, not across the whole topic.",
    "Implement hash-based partition assignment that consistently routes the same key to the same partition.",
    "Trace a consumer reading events by monotonically increasing offsets.",
  ],
  prerequisites: [
    "HTTP request-response basics and message queues",
    "Dictionaries, lists, and basic hashing",
    "Understanding of message/event concepts (producer, consumer)",
    "Basic distributed systems vocabulary (node, replica, network partition)",
  ],
  engineeringConcepts: [
    "Append-Only Log",
    "Partitioning",
    "Offset",
    "Keyed Hashing",
    "Consumer Group",
    "Ordering Guarantee",
  ],
  technologies: ["Event Streaming", "Messaging", "Distributed Storage", "Python", "Java"],
  tech: ["Kafka-style Log", "Partitions", "Offsets"],
  tags: ["distributed", "streaming", "event-log", "partitioning", "advanced"],
  glossary: [
    {
      term: "Append-Only Log",
      plainDefinition:
        "A storage structure where events are only ever written to the end, preserving the exact order they arrived in.",
    },
    {
      term: "Partitioning",
      plainDefinition:
        "Splitting a topic into several independent ordered sequences so the load can be spread across brokers.",
    },
    {
      term: "Offset",
      plainDefinition:
        "A per-partition sequence number that marks an event's position in that partition's log.",
    },
    {
      term: "Keyed Hashing",
      plainDefinition:
        "Routing every event by hashing its key so that all events for one key always land on the same partition.",
    },
    {
      term: "Consumer Group",
      plainDefinition:
        "A set of consumers that split a topic's partitions among themselves so each partition is read by exactly one member.",
    },
    {
      term: "Ordering Guarantee",
      plainDefinition:
        "The contract that events sharing a key are delivered to a consumer in the exact order they were written.",
    },
  ],
  primers: [
    {
      concept: "The Coupon Ledger Analogy",
      minutes: 4,
      definition:
        "A shopkeeper keeps a numbered receipt book: every sale is written on the next line, and each receipt carries a sequential number, never rewritten.",
      whyNeeded:
        "An immutable, numbered log is what lets thousands of readers agree on exactly what happened and when.",
      analogy:
        "The receipt book is an append-only log; the numbering is the offset; splitting books across counters is partitioning.",
      tinyExample: "log = [(0, 'A'), (1, 'B'), (2, 'C')]  # offsets 0,1,2",
    },
    {
      concept: "Order Within a Partition Only",
      minutes: 5,
      definition:
        "Streams do not promise global order across a whole topic. They promise order per partition, and per key within a partition.",
      whyNeeded:
        "Global ordering across millions of events would require a single bottleneck writer; partitioning sacrifices that for horizontal scale.",
      analogy:
        "Multiple airline check-in counters: your bag is handled by one counter in order, but you cannot order every passenger's bag globally.",
      tinyExample: "partition = sum(ord(c) for c in 'user_42') % 4",
    },
  ],
  discover: {
    situation:
      "A ride-hailing company's analytics pipeline streams driver location pings. Engineers notice that position updates for the same driver sometimes arrive out of order, causing the map to flicker between old and new locations. The events are also overwhelming a single message broker, which is about to become the bottleneck for the whole company.",
    humanFlow: [
      "Each driver's phone emits a ping event every 2 seconds with a driver_id and a location.",
      "Producers write every event to a central topic named 'driver-locations'.",
      "Riders' apps subscribe to location updates and render the driver marker.",
      "One driver_id's events arrive shuffled, so the map marker jumps backwards.",
      "The single broker's disk and network saturate as the fleet grows.",
    ],
    question:
      "How do you preserve per-driver ordering for infinitely growing event volume without making the whole pipeline depend on one machine?",
    whyItExists: [
      "A single ordered log for all events is a single point of failure and a throughput ceiling.",
      "Out-of-order updates break consumers that assume monotonic progression for a key.",
      "Different keys' events are independent, so they can be safely parallelised across partitions.",
    ],
  },
  understand: {
    overview:
      "An event streaming platform stores every topic as a collection of partitions, and each partition is a strictly append-only ordered log. Producers write events to the tail of a partition, and each event gets an offset equal to its index in that partition. A producer's partition is chosen by hashing the event key (for example driver_id), which guarantees all events sharing a key go to the same partition and therefore keep their relative order. Consumers read partitions from low offset to high offset, which makes ordering within a partition automatic and scaling horizontal: partitions live on different brokers.",
    components: [
      {
        name: "Topic",
        whatIsIt:
          "The named logical stream of events, e.g. driver-locations, that holds all related events.",
        whyItExists:
          "A topic gives producers and consumers a shared, discoverable collection name.",
        whatItDoes: "Groups partitions into one logical destination that consumers subscribe to.",
      },
      {
        name: "Partition",
        whatIsIt: "A single append-only, ordered log holding a subset of the topic's events.",
        whyItExists:
          "Splitting a topic into partitions moves the throughput ceiling off any single broker.",
        whatItDoes: "Owns a contiguous range of offsets and preserves per-key order within itself.",
      },
      {
        name: "Producer",
        whatIsIt: "The client process that publishes events to a topic's partitions.",
        whyItExists:
          "Something must write the events; producers choose the partition for each event.",
        whatItDoes:
          "Computes partition = hash(key) % num_partitions and appends each event to that partition's tail.",
      },
      {
        name: "Consumer Group",
        whatIsIt: "A set of consumer processes that jointly read a topic's partitions.",
        whyItExists: "Reading all partitions with one consumer limits consumer throughput.",
        whatItDoes:
          "Assigns each partition to exactly one member so load splits across the group while order per partition is preserved.",
      },
    ],
    analogy: {
      title: "The Numbered Receipt Ledger",
      everyday: [
        "A restaurant kitchen has three order stations: pasta, pizza, and dessert. Each station writes orders in its own numbered book.",
        "All orders for table 7's pasta go into the pasta book, in arrival order, with consecutive numbers.",
        "The waiter reads the pasta book from top to bottom, so table 7's courses never arrive out of sequence.",
        "Different books can be handled by different cooks at the same time.",
      ],
      technical: [
        "The three books are partitions of a single 'orders' topic.",
        "Table 7 is the event key; it always routes to the same book (partition).",
        "The consecutive numbers are offsets.",
        "The waiter reading top-to-bottom is a consumer tracking its current offset.",
      ],
    },
    flow: [
      "Producer receives event for key driver_42 and computes partition = hash(driver_42) % num_partitions.",
      "Producer appends the event to the tail of the chosen partition with the next offset.",
      "Broker durably stores the event and advances the partition's last offset.",
      "Consumer in the group, responsible for that partition, requests events starting at its last-read offset.",
      "Broker returns events in ascending offset order within the partition.",
      "Consumer commits its new offset so a crash can resume where it left off.",
    ],
  },
  concepts: [
    {
      id: "concept-append-only",
      name: "Append-Only Log",
      difficulty: "Advanced",
      simpleDefinition:
        "A data structure where writes only ever add to the end and existing entries are never changed or deleted.",
      whyItExists:
        "Append-only writes are extremely fast (sequential disk I/O) and trivially preserve arrival order.",
      realWorldAnalogy:
        "A flight manifest printed in sequence: once a passenger is listed, the list behind them never changes.",
      technicalExplanation:
        "The log exposes three primitives: append(event) -> next offset, read(from_offset), and track last_offset. Because entries are immutable, any number of consumers can read the same offset safely.",
      caseApplication:
        "Each driver-location partition is an append-only log; positions are never edited, only superseded by later entries.",
      commonMistakes: [
        "Deleting or re-ordering entries after they are written, breaking consumer offset continuity.",
        "Allowing two writers into one partition's tail simultaneously without a lock.",
      ],
      practice: [
        "What offset does the 4th event written to an empty partition receive?",
        "Why are append-only logs a natural fit for immutable event histories?",
      ],
    },
    {
      id: "concept-partitioning",
      name: "Keyed Hashing for Partition Assignment",
      difficulty: "Advanced",
      simpleDefinition:
        "Choosing a partition deterministically from the event key so identical keys always target the identical partition.",
      whyItExists:
        "Ordering for a key only exists within one partition; a deterministic mapping makes that ordering stable.",
      realWorldAnalogy:
        "Assigning every resident of a family to the same doctor by hashing their surname, so their records stay in one file.",
      technicalExplanation:
        "partition = h(key) mod n. Since h is a pure function, the same key always maps to the same partition, and adding partitions (re-hashing) is the known cost of resharding.",
      caseApplication:
        "driver_42 always hashes to the same partition, so its location pings remain in order for the riders' app.",
      commonMistakes: [
        "Hashing on event payload instead of the stable key, dispersing a key's events unpredictably.",
        "Ignoring the module-fanout change when the partition count changes.",
      ],
      practice: [
        "Prove that the same key maps to the same partition given the same h and n.",
        "What breaks if you hash on the timestamp instead of driver_id?",
      ],
    },
    {
      id: "concept-consumer-group",
      name: "Consumer Group Load Splitting",
      difficulty: "Advanced",
      simpleDefinition:
        "A group of consumers that divides a topic's partitions among its members, with each partition processed by exactly one member.",
      whyItExists:
        "A single consumer reading every partition is a throughput and failover bottleneck.",
      realWorldAnalogy:
        "A team of reviewers splitting a pile of files, each section assigned to exactly one reviewer so no section is edited twice.",
      technicalExplanation:
        "Partitions are sharded across members (round-robin or by assignment). If a member crashes, its partitions are re-assigned to survivors, which re-reads from committed offsets.",
      caseApplication:
        "The map renderer cluster spreads driver-location partitions across workers so latency stays low as the fleet grows.",
      commonMistakes: [
        "Letting two members read the same partition, duplicating work and breaking per-key order processing.",
        "Failing to commit offsets, causing re-processing on rebalance.",
      ],
      practice: [
        "With 4 partitions and 3 consumers, can any consumer process two partitions? Which one?",
        "Why must a partition have exactly one active reader within a group?",
      ],
    },
  ],
  architecture: {
    caption:
      "Producers route by key into partitions of an append-only log while a consumer group splits partitions across workers.",
    levels: [
      {
        title: "Level 1: Topic, Partitions & Offsets",
        description:
          "One logical topic split into three ordered partitions, each storing events with ascending offsets.",
        mermaid: `graph LR
    T["Topic: driver-locations"] --> P0["Partition 0 [0,1,2,...]"]
    T --> P1["Partition 1 [0,1,2,...]"]
    T --> P2["Partition 2 [0,1,2,...]"]
`,
      },
      {
        title: "Level 2: Keyed Routing Flow",
        description: "How two different keys land on partitions deterministically.",
        mermaid: `graph TD
    Prod["Producer"] --> Hash{"hash(driver_42) % 3"}
    Hash -->|"0"| P0
    Hash -->|"1"| P1
    Hash -->|"2"| P2
    P0["Partition 0"]
    P1["Partition 1"]
    P2["Partition 2"]
`,
      },
      {
        title: "Level 3: Consumer Group Reading",
        description: "Three consumers split three partitions, each tracking its own offset.",
        mermaid: `graph LR
    P0["Partition 0"] --> C1["Consumer A"]
    P1["Partition 1"] --> C2["Consumer B"]
    P2["Partition 2"] --> C3["Consumer C"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Partition by Key Hash vs. Round-Robin Sharding",
      what: "Route each event to its partition with a deterministic keyed hash instead of round-robin distribution.",
      why: "Keyed hashing preserves per-key order (crucial for driver location timelines) while still balancing load across partitions.",
      problemSolved:
        "Eliminates out-of-order updates for the same key that round-robin assignment would allow.",
      withoutIt:
        "A driver's pings scatter across partitions and arrive out of sequence at consumers.",
      alternatives: [
        "Round-robin: even load, but no ordering contract.",
        "Two-level keying: one key for ordering, a coarser key for balance.",
      ],
      tradeoff:
        "Hot keys can still concentrate load on one partition, and changing the partition count re-hashes every key.",
    },
    {
      title: "Append-Only Log Over In-Place Message Store",
      what: "Store events as immutable sequential log entries rather than mutable message records.",
      why: "Sequential writes maximise disk throughput, and immutability lets many consumers and reprocessing pipelines safely re-read history.",
      problemSolved:
        "Removes read-modify-write contention that in-place message stores suffer under high producer fan-in.",
      withoutIt:
        "Brokers bottleneck on random writes and cannot offer simple replay semantics to new consumers.",
      alternatives: [
        "Queue with ack-and-delete: small memory, but no replay and no offset-based reproducibility.",
        "Durable message table with indexes: flexible, but costlier writes per event.",
      ],
      tradeoff:
        "Logs grow unboundedly, so retention policies and compaction or time-based deletion become necessary.",
    },
  ],
  implementation: {
    behaviour:
      "A LocalEventLog partition simulator with an append(event) that returns a monotonic offset and a read(from_offset) that yields events in exact write order, plus a keyed partitioner.",
    algorithm: [
      "1. Define h(key) as a stable function, for example the sum of character codes.",
      "2. To publish an event, compute partition_index = h(key) % num_partitions.",
      "3. Append the event to the end of that partition's list; its offset becomes the list length minus one.",
      "4. Consumers read partition[from_offset:] and observe strictly increasing offsets.",
      "5. Replay is free: any consumer may re-read any range of offsets.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "One Global Log",
        detail: "A single ordered list for all events. Correct but unscalable.",
      },
      {
        level: "Level 1",
        title: "Keyed Partitioning",
        detail: "Split events across partitions using a key hash to preserve per-key order.",
      },
      {
        level: "Level 2",
        title: "Offset-Based Reads",
        detail: "Consumers track and commit offsets per partition, enabling resume and replay.",
      },
      {
        level: "Level 3",
        title: "Cluster Distribution",
        detail: "Partitions move across brokers and consumer groups for scale and failover.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "partitioned_log.py",
        code: `def assign_partition(key: str, num_partitions: int) -> int:
    # Deterministic keyed hash: same key, same partition.
    total = sum(ord(ch) for ch in key)
    return total % num_partitions

def append(log: list[str], event: str) -> int:
    # Append-only write; offset equals current length before writing.
    log.append(event)
    return len(log) - 1

def read_from(log: list[str], offset: int) -> list[str]:
    # Strictly ordered read.
    return log[offset:]`,
        explanations: [
          {
            code: "total = sum(ord(ch) for ch in key)",
            explanation: "Turns the key string into a stable integer fingerprint used for routing.",
          },
          {
            code: "return total % num_partitions",
            explanation:
              "Maps the fingerprint into a partition index, guaranteeing the same key always lands on the same partition.",
          },
          {
            code: "log.append(event)\nreturn len(log) - 1",
            explanation:
              "Append-only write; the returned offset is the event's exact position in the partition.",
          },
          {
            code: "return log[offset:]",
            explanation: "Reads from an offset onward, preserving order for the consumer.",
          },
        ],
      },
    ],
    simulationNote:
      "This simulation captures partition routing and offset math only. Real brokers add durability, replication, retention, and rebalance protocols; here the ordering contract is isolated so it can be studied directly.",
  },
  practice: [
    {
      level: "Understand",
      title: "Trace Partition Assignment",
      brief:
        "For num_partitions = 3, compute assign_partition for keys 'driver_42' and 'driver_77' and verify a repeated call returns the same partition.",
    },
    {
      level: "Modify",
      title: "Track a Consumer Offset",
      brief:
        "Add a current_offset variable to a consumer and a commit_position function so a simulated crash can resume reading from the last committed offset.",
    },
    {
      level: "Build",
      title: "Ordered Replay Simulator",
      brief:
        "Use append and read_from to write 10 events for one key, simulate a consumer that processes them, restarts, and re-reads from its committed offset without duplication.",
    },
    {
      level: "Think",
      title: "Hot Key Analysis",
      brief:
        "If a single driver emits 90% of events, one partition saturates while others idle. Propose two mitigation strategies and their ordering trade-offs.",
    },
  ],
  reflection: [
    "Why is global ordering across a whole topic intentionally sacrificed, and what guarantee is kept instead?",
    "How does an immutable append-only log make replay, auditing, and new-consumer onboarding simpler than a mutable queue?",
    "What breaks per-key ordering if the number of partitions changes, and how do streaming systems cope?",
  ],
  techNotes: [
    {
      name: "Kafka-Style Log Segments",
      kind: "Storage Layout",
      note: "Kafka splits each partition log into segment files, using an index per segment to locate an offset without scanning from the head of the log.",
    },
    {
      name: "Log Compaction",
      kind: "Retention Policy",
      note: "Compaction keeps the most recent event per key and removes older ones, bounding log growth while preserving per-key history.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Route Events to Partitions",
    brief:
      "Implement the keyed partitioner and the append-only log primitives so that the same key always maps to the same partition and offsets advance strictly by one.",
    functionName: "assign_partition",
    signature: "def assign_partition(key: str, num_partitions: int) -> int:",
    starterCode: `def assign_partition(key: str, num_partitions: int) -> int:
    # key is a string like 'driver_42'.
    # Compute the sum of ordinal values of its characters, then mod by num_partitions.
    # Return an integer in range(num_partitions). Raise ValueError if num_partitions <= 0.
    if num_partitions <= 0:
        raise ValueError("num_partitions must be positive")
    total = sum(ord(ch) for ch in key)
    return total % num_partitions
`,
    javaSignature: "public static int assignPartition(String key, int numPartitions)",
    javaStarterCode: `public class Solution {
    public static int assignPartition(String key, int numPartitions) {
        if (numPartitions <= 0) {
            throw new IllegalArgumentException("numPartitions must be positive");
        }
        int total = 0;
        for (int i = 0; i < key.length(); i++) {
            total += key.charAt(i);
        }
        return total % numPartitions;
    }
}`,
    mermaid: `graph TD
    Start["assign_partition(key, num_partitions)"] --> Check{"num_partitions > 0?"}
    Check -->|"No"| Raise["Raise ValueError"]
    Check -->|"Yes"| Sum["total = sum(ord(ch) for ch in key)"]
    Sum --> Mod["return total % num_partitions"]
`,
    hints: [
      "Keep the hash deterministic: use only the string characters, never randomness or time.",
      "Guard against a non-positive partition count before doing modulo arithmetic.",
      "The same key with the same num_partitions must always return the same integer.",
    ],
    tests: [
      {
        name: "Same key maps to same partition repeatedly",
        args: ["driver_42", 3],
        expected: "1",
      },
      {
        name: "Partition index stays within range",
        args: ["driver_77", 3],
        expected: "1",
      },
      {
        name: "Single partition routes everything to 0",
        args: ["anything", 1],
        expected: "0",
      },
      {
        name: "Rejects non-positive partition count",
        args: ["driver_42", 0],
        expected: "ValueError",
      },
    ],
    explanationPrompt:
      "Explain why hashing on the key (rather than the payload) preserves per-key ordering, and what happens to ordering if num_partitions changes.",
  },
};

export const case33_consistentHashing = {
  id: "cs-consistent-hashing-033",
  slug: "consistent-hashing-shard-ring",
  index: "33",
  title: "How Does Consistent Hashing Keep a Cache Cluster Stable While Machines Come and Go?",
  shortTitle: "Consistent Hashing",
  category: "Distributed Data & Storage",
  subcategory: "Shard Placement",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "When a caching cluster grows from 4 to 5 machines, a naive hash(key) % n sends 80% of keys to a new machine and floods the cache with misses. Discover how consistent hashing arranges nodes on a ring so that adding or removing a machine moves only a small share of keys.",
  learningObjectives: [
    "Understand why hash(key) modulo n causes mass key movement when the node count changes.",
    "Model nodes and keys as positions on a circular hash ring.",
    "Implement the ring lookup: first node clockwise from the key's position.",
    "Explain how virtual nodes smooth load imbalance across real machines.",
  ],
  prerequisites: [
    "Dictionary and list data structures",
    "Basic hashing and modulo arithmetic",
    "In-memory caching concepts (cache hit, key-value storage)",
    "Client-server communication basics",
  ],
  engineeringConcepts: [
    "Consistent Hashing",
    "Hash Ring",
    "Key Range Ownership",
    "Virtual Nodes",
    "Rebalancing",
  ],
  technologies: ["Caching", "Distributed Systems", "Python", "Java"],
  tech: ["Hash Ring", "Sharding", "LRU Cache"],
  tags: ["distributed", "caching", "consistent-hashing", "sharding", "advanced"],
  glossary: [
    {
      term: "Consistent Hashing",
      plainDefinition:
        "A key-to-node assignment that only remaps a small fraction of keys when the set of nodes changes.",
    },
    {
      term: "Hash Ring",
      plainDefinition:
        "A conceptual circle where every node places a marker by hashing its identifier, and every key finds its node by walking clockwise.",
    },
    {
      term: "Key Range Ownership",
      plainDefinition:
        "The set of key positions a node is responsible for: the arc it owns going clockwise until the next node.",
    },
    {
      term: "Virtual Nodes",
      plainDefinition:
        "Multiple ring markers per real machine that even out how many keys each physical node receives.",
    },
    {
      term: "Rebalancing",
      plainDefinition:
        "The process of moving keys from one node to another after the node set or ownership changes.",
    },
  ],
  primers: [
    {
      concept: "Why Modulo Rehashing Hurts",
      minutes: 5,
      definition:
        "hash(key) % n assigns every key's node from the key hash and the total node count, so changing n reassigns nearly every key at once.",
      whyNeeded:
        "Mass reassignment means mass cache misses right at the moment you scale, an outage dressed up as an upgrade.",
      analogy:
        "Everyone in a city re-numbered their front door by the number of houses in town; adding one house changes everyone's number.",
      tinyExample:
        "node = key_hash % 4  # 4 nodes today\n# adding a 5th: key_hash % 5 -> majority changes",
    },
    {
      concept: "First Clockwise Neighbour",
      minutes: 4,
      definition:
        "On a ring, a key belongs to the first node marker found while walking clockwise from the key's position.",
      whyNeeded:
        "With arc ownership, removing a node lets its successor absorb exactly the dead node's arc instead of everyone's keys.",
      analogy:
        "Seats around a circular table: each guest is served by the waiter standing nearest clockwise from them.",
      tinyExample: "sorted_nodes = [2, 7, 11]\nkey_pos = 5 -> owner = 7",
    },
  ],
  discover: {
    situation:
      "An e-commerce site runs a 4-node in-memory cache cluster for product pages. Engineers add a 5th node to absorb Black Friday traffic. Immediately after the change, cache hit ratio collapses from 98% to 55% and database load spikes fourfold, because the modulo-based key assignment reshuffled almost every cached key to a different node.",
    humanFlow: [
      "Product pages are served from a 4-node cache cluster keyed by product_id.",
      "Ops adds one more cache node to handle a traffic surge.",
      "Every lookup now computes hash(product_id) % 5 instead of % 4.",
      "Roughly 80% of keys point at a new home that has never seen them.",
      "A wave of cache misses floods the database, causing latency spikes.",
    ],
    question:
      "How can a key distribution scheme keep the vast majority of cached keys in place when the set of nodes changes by one?",
    whyItExists: [
      "Modulo assignment couples every key to the total node count, so any count change rehashes most keys.",
      "Mass cache misses convert a scaling event into an availability event.",
      "Adding and removing nodes (planned and unplanned) is routine, so the cost must be proportional to the change.",
    ],
  },
  understand: {
    overview:
      "Consistent hashing places every node at a position on a circular ring by hashing the node's identifier (node_0, node_1...). Each key is also hashed to a position. The key is assigned to the first node position found moving clockwise around the ring — the key's owner. Because ownership is defined by arcs between neighbouring node markers, adding a node splits only its successor's arc, so only the keys inside that arc move. Removing a node merges its arc into its successor, so only the dead node's keys move. Virtual nodes replicate each real node several times on the ring to keep the arcs (and therefore the load) balanced.",
    components: [
      {
        name: "Ring",
        whatIsIt:
          "A circular virtual space of hash positions that every node and key is mapped onto.",
        whyItExists:
          "A circular space lets ownership be defined by adjacency rather than by a global count.",
        whatItDoes: "Defines which keys each node owns: the clockwise arc between neighbours.",
      },
      {
        name: "Node Marker",
        whatIsIt: "A hashed position on the ring representing one real machine.",
        whyItExists: "Markers are the seams between ownership arcs.",
        whatItDoes:
          "Claims ownership of every key position between itself (inclusive) and the next clockwise marker.",
      },
      {
        name: "Replica / Virtual Node",
        whatIsIt: "Multiple ring markers per physical node (e.g. node_0#0, node_0#1, node_0#2).",
        whyItExists:
          "A single marker per node gives coarse-grained, uneven arcs; replicas smooth load distribution.",
        whatItDoes:
          "Spreads a physical node's data across many small arcs, improving balance and reducing hot spots.",
      },
      {
        name: "Client Router",
        whatIsIt:
          "The process on the application side that performs ring lookups and caches the sorted node list.",
        whyItExists:
          "Fast lookups require the ring to be close, so the routing table is kept client-side and refreshed on membership change.",
        whatItDoes:
          "Hashes the key, binary-searches the sorted node positions, and dispatches to the clockwise owner.",
      },
    ],
    analogy: {
      title: "The Circular Buffet",
      everyday: [
        "Imagine a circular buffet table. Waiters stand at fixed spots around it, and each waiter serves the section of table immediately before their spot, going clockwise.",
        "A new waiter joins by standing between two others; the existing waiter on one side simply gives up the small section right before the new waiter.",
        "Every other waiter's section is untouched — nobody else moves a single plate.",
        "If a waiter leaves, the waiter behind them takes over their now-empty section.",
      ],
      technical: [
        "Waiters are node markers; the table is the hash ring.",
        "A waiter's section is its key range (arc ownership).",
        "A new waiter is a newly added node; only the successor's arc splits.",
        "A leaving waiter is a removed node; its successor absorbs the arc.",
      ],
    },
    flow: [
      "Node set is hashed into positions, sorted clockwise around the ring.",
      "A key arrives; the router hashes the key to a ring position.",
      "The router walks clockwise from that position to the first node marker — the owner.",
      "A range of keys now owned by the new node? Only if it is the successor that gained an arc.",
      "On node add: the new marker sits inside its successor's arc; keys strictly before it move to the new node.",
      "On node removal: the successor inherits the removed node's arc and its keys.",
    ],
  },
  concepts: [
    {
      id: "concept-ring",
      name: "Ring-Based Ownership",
      difficulty: "Advanced",
      simpleDefinition:
        "Assigning keys by arcs on a circle so a node owns a contiguous region instead of a modulo share.",
      whyItExists: "Contiguous arc ownership limits reshuffling to the neighbours of a change.",
      realWorldAnalogy:
        "Postal zones drawn on a map: redistricting one zone only touches that zone's boundary, not every address on earth.",
      technicalExplanation:
        "Ownership is successor-based: owner(key) = min node position >= h(key), wrapping to the smallest marker otherwise. Node add/remove only changes the arcs touching the affected markers.",
      caseApplication:
        "Product-page keys stay in place when a 5th cache node joins, because only the arcs adjacent to the new marker move.",
      commonMistakes: [
        "Forgetting the wrap-around lookup for keys after the last marker.",
        "Implementing with an unsorted scan instead of binary search, slowing the hot path.",
      ],
      practice: [
        "Given markers at 2, 7, 11, find the owners of key positions 0, 5, 9, 12.",
        "Where does the wrap-around rule matter?",
      ],
    },
    {
      id: "concept-virtual",
      name: "Virtual Nodes for Balance",
      difficulty: "Advanced",
      simpleDefinition:
        "Registering each physical machine at several distinct ring positions to reduce imbalance in arcs.",
      whyItExists:
        "Random hash positions create uneven arcs; few machines means high variance in owned-key volume.",
      realWorldAnalogy:
        "A delivery company giving each depot several smaller delivery regions instead of one giant region, smoothing workload.",
      technicalExplanation:
        "With replicas per node, expected owned-key variance drops roughly with the replica count; lookups become slightly costlier because each physical node appears multiple times in the sorted list.",
      caseApplication:
        "When only 4 cache nodes exist, each is replicated ~3 times on the ring so no single machine gets a disproportionate key share.",
      commonMistakes: [
        "Choosing too few replicas and still seeing hot nodes.",
        "Letting two replicas of the same node become adjacent, wasting a marker.",
      ],
      practice: [
        "Estimate the ownership variance with 1 vs 10 virtual nodes per physical node.",
        "Why does balance improve but never become perfect?",
      ],
    },
    {
      id: "concept-range",
      name: "Key Range Ownership & Rebalancing",
      difficulty: "Advanced",
      simpleDefinition:
        "The precise rule that a node owns the half-open arc from its marker up to (but excluding) the next clockwise marker.",
      whyItExists:
        "Defining exact arcs makes ownership unambiguous and directly readable from sorted positions.",
      realWorldAnalogy:
        "Street address ranges on a mail route: each letter carrier owns the addresses between two consecutive route points.",
      technicalExplanation:
        "The sorted ring partitions the position space into disjoint arcs. Adding a marker at position p inserts a boundary; keys in the arc (p, next) now resolve to the new node. Rebalancing therefore touches only that arc.",
      caseApplication:
        "Adding cache node 5 only migrates the keys in its successor's forward arc, not 80% of all keys.",
      commonMistakes: [
        "Moving all keys on membership change because the ring was rebuilt without care.",
        "Ignoring the inclusive/exclusive boundary, mis-homing a key right at a marker.",
      ],
      practice: [
        "Describe exactly which keys move when a new marker is inserted at position 9 into ring [2, 7, 11].",
        "Implement the inclusive boundary at the marker and the wrap at the ring start.",
      ],
    },
  ],
  architecture: {
    caption:
      "A circular hash ring where arcs of ownership determine which cache node serves each key.",
    levels: [
      {
        title: "Level 1: The Ring Model",
        description:
          "Nodes and a key mapped as positions on one circle; the key belongs to the next node clockwise.",
        mermaid: `graph TD
    R["Hash Ring (circular)"] --> N1["Node 0 at 25"]
    R --> N2["Node 1 at 62"]
    R --> N3["Node 2 at 89"]
    K["key position 40"] -->|"clockwise"| N2["Node 1 at 62"]
`,
      },
      {
        title: "Level 2: Adding a Node",
        description: "A new marker splits its successor's arc; only those keys move.",
        mermaid: `graph TD
    Before["Ring [25, 62, 89]"] --> New["Insert Node 3 at 45"]
    New --> After["Ring [25, 45, 62, 89]"]
    After --> Moved["keys in (45, 62) move 62 -> 45"]
`,
      },
      {
        title: "Level 3: Removing a Node",
        description: "A removed marker's arc is inherited by its successor.",
        mermaid: `graph TD
    Ring["Ring [25, 45, 62, 89]"] --> Remove["Remove marker 45"]
    Remove --> Merged["Ring [25, 62, 89]"]
    Merged --> Absorb["keys of 45 now owned by 62"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Consistent Hashing vs. Modulo Sharding",
      what: "Replace hash(key) % n with arc ownership on a hash ring.",
      why: "Membership changes move only adjacent arcs instead of virtually every key, keeping cache hit ratios stable during scaling.",
      problemSolved: "Prevents the mid-scaling cache-collapse caused by mass reassignment.",
      withoutIt: "Adding a node invalidates roughly (n-1)/n of cached keys, spiking database load.",
      alternatives: [
        "Range sharding: explicit key ranges, simple but requires manual range table updates.",
        "Directory-based sharding: a lookup table, flexible but adds a metadata dependency.",
      ],
      tradeoff:
        "Consistent hashing complicates lookup (binary search on a ring) and still needs virtual nodes to fight imbalance.",
    },
    {
      title: "Virtual Nodes Over Raw Node Positions",
      what: "Register each physical node multiple times on the ring to smooth load.",
      why: "Raw random positions create uneven arcs; replicas reduce expected variance without any global coordination.",
      problemSolved: "Mitigates hot nodes when the cluster is small or nodes are of unequal size.",
      withoutIt: "One unlucky node owns an oversized arc and becomes the cache hot spot.",
      alternatives: [
        "Weighted markers placed deterministically by capacity.",
        "A gossip-based rebalancing protocol that actively moves keys.",
      ],
      tradeoff:
        "More markers per node increase the sorted list size and the cost of each lookup, though it stays logarithmic.",
    },
  ],
  implementation: {
    behaviour:
      "A ConsistentHashRing that maps node identifiers to ring positions, supports sorted lookup by first clockwise marker, and can add or remove a node while keeping unrelated keys untouched.",
    algorithm: [
      "1. Hash each node identifier to an integer ring position and keep the positions sorted.",
      "2. Find owner(key): let h = hash(key); binary search for the first position >= h.",
      "3. If none exists, wrap around to the smallest position (ring[0]).",
      "4. To remove a node, drop its position from the sorted list; the successor now owns its arc.",
      "5. To add a node, insert its position; only keys with positions strictly between the predecessor and the new marker move to it.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Modulo Table",
        detail:
          "hash(key) % len(nodes). Simplest, but any membership change rehashes nearly everything.",
      },
      {
        level: "Level 1",
        title: "Single Marker Ring",
        detail: "Nodes on a ring, sorted lookup, arc ownership. Small clusters are unbalanced.",
      },
      {
        level: "Level 2",
        title: "Virtual Node Replicas",
        detail: "Replicate each node several times to balance ownership arcs.",
      },
      {
        level: "Level 3",
        title: "Membership Events",
        detail: "Add/remove handlers that migrate only the affected arcs' keys.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "consistent_ring.py",
        code: `def node_hash(name: str) -> int:
    return sum(ord(c) for c in name) % 360

def find_owner(key: str, positions: list[int]) -> int:
    h = sum(ord(c) for c in key) % 360
    for pos in positions:
        if pos >= h:
            return pos
    return positions[0]`,
        explanations: [
          {
            code: "return sum(ord(c) for c in name) % 360",
            explanation:
              "Maps identifiers to a fixed ring space (0..359), keeping positions stable and comparable.",
          },
          {
            code: "positions.sort()",
            explanation:
              "Sorted positions make ownership a simple first-clockwise scan (or binary search).",
          },
          {
            code: "for pos in positions:\n  if pos >= h: return pos",
            explanation:
              "Walks clockwise from the key's position to its first node marker — the owner.",
          },
          {
            code: "return positions[0]",
            explanation:
              "Wrap-around: keys past the last marker belong to the first marker on the ring.",
          },
        ],
      },
    ],
    simulationNote:
      "This simulation compresses the ring to a simple integer space and a linear scan. Production systems use 64-bit hashes and binary search over the sorted replica list; the ownership semantics are identical.",
  },
  practice: [
    {
      level: "Understand",
      title: "Walk the Ring",
      brief:
        "With positions [20, 60, 110], find the owner of key hash 5, 60, 100, and 300. Explain the wrap-around case.",
    },
    {
      level: "Modify",
      title: "Insert a New Node",
      brief:
        "Extend the ring to add position 50 and list exactly which key hashes migrate from the old owner.",
    },
    {
      level: "Build",
      title: "Replica Ring",
      brief:
        "Register each of 3 physical nodes with 2 virtual replicas, build the sorted position list, and verify lookups resolve to one of the 6 markers.",
    },
    {
      level: "Think",
      title: "Membership Churn",
      brief:
        "Compare cache hit ratio impact between modulo sharding and consistent hashing when 1 of 10 nodes crashes and is replaced.",
    },
  ],
  reflection: [
    "What exactly does consistent hashing optimize, and what problem does it not solve (state migration cost still exists)?",
    "How do virtual nodes trade lookup cost for balance, and when would you tune the replica count?",
    "Where does this same ring idea appear in distributed storage systems beyond caches?",
  ],
  techNotes: [
    {
      name: "Dynamo & Cassandra",
      kind: "Industry Adoption",
      note: "Consistent hashing with virtual nodes is the backbone of Amazon Dynamo and Apache Cassandra's partition placement across hash-ordered token rings.",
    },
    {
      name: "Ketama",
      kind: "Library",
      note: "Ketama is the classic consistent-hashing library used by memcached clients to map cache keys to servers with virtual node balance.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Find the Ring Owner",
    brief:
      "Implement find_node(key, ring): given a sorted list of node positions on the ring, return the first position >= hash(key), wrapping around to ring[0] if the key's hash is past the last marker.",
    functionName: "find_node",
    signature: "def find_node(key: str, ring: list[int]) -> int:",
    starterCode: `def find_node(key: str, ring: list[int]) -> int:
    # key is a string; ring is a sorted list of node positions like [20, 60, 110].
    # h = sum of ordinal values of key characters.
    # Return the first position in ring that is >= h, else ring[0] (wrap-around).
    # Raise ValueError if ring is empty.
    if not ring:
        raise ValueError("ring is empty")
    h = sum(ord(c) for c in key)
    for pos in ring:
        if pos >= h:
            return pos
    return ring[0]
`,
    javaSignature: "public static int findNode(String key, int[] ring)",
    javaStarterCode: `public class Solution {
    public static int findNode(String key, int[] ring) {
        if (ring.length == 0) {
            throw new IllegalArgumentException("ring is empty");
        }
        int h = 0;
        for (int i = 0; i < key.length(); i++) {
            h += key.charAt(i);
        }
        for (int pos : ring) {
            if (pos >= h) {
                return pos;
            }
        }
        return ring[0];
    }
}`,
    mermaid: `graph TD
    Start["find_node(key, ring)"] --> Empty{"ring empty?"}
    Empty -->|"Yes"| Raise["Raise ValueError"]
    Empty -->|"No"| Hash["h = sum(ord(ch) for ch in key)"]
    Hash --> Scan{"first pos >= h?"}
    Scan -->|"Found"| Owner["Return pos"]
    Scan -->|"None"| Wrap["Return ring[0]"]
`,
    hints: [
      "The ring is already sorted — do not re-sort tokens you reuse.",
      "Wrap-around only fires when h is larger than every marker.",
      "Guard the empty ring before any arithmetic.",
    ],
    tests: [
      {
        name: "Key between markers resolves to next node",
        args: ["alpha", [20, 60, 110]],
        expected: "60",
      },
      {
        name: "Key past last marker wraps to first",
        args: ["zeta", [20, 60, 110]],
        expected: "20",
      },
      {
        name: "Key exactly on a marker owns it",
        args: ["beta", [45]],
        expected: "45",
      },
      {
        name: "Rejects empty ring",
        args: ["alpha", []],
        expected: "ValueError",
      },
    ],
    explanationPrompt:
      "Explain why arc ownership (first clockwise node) limits reshuffling when a node joins, and where the wrap-around rule comes from.",
  },
};

export const case34_leaderElection = {
  id: "cs-leader-election-034",
  slug: "leader-election-consensus",
  index: "34",
  title: "How Do Distributed Systems Elect a Leader Nobody Can Disagree With?",
  shortTitle: "Leader Election",
  category: "Reliability & Scalability",
  subcategory: "Distributed Coordination",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "Replicated databases, queues, and coordination services need exactly one active leader at a time. Discover how distributed systems use terms, votes, and a strict majority quorum to elect a leader that every surviving node agrees on, even when machines crash and messages race.",
  learningObjectives: [
    "Explain why a cluster needs a single leader and what happens with two simultaneous leaders (split brain).",
    "Map elections to terms and votes: voting happens inside a term; a candidate wins only with a voting majority.",
    "Implement the majority decision rule and the quorum check.",
    "Understand why a majority (not unanimity) is the correct and reachable agreement threshold.",
  ],
  prerequisites: [
    "Networked request-response programming",
    "Basic statistics: counting, fractions, quorum concept",
    "Distributed systems vocabulary (node, replica, network partition)",
    "State machine and message concepts",
  ],
  engineeringConcepts: [
    "Leader Election",
    "Split Brain",
    "Term",
    "Majority Quorum",
    "Vote Granting",
    "Single Active Leader",
  ],
  technologies: ["Consensus", "Replication", "Coordination", "Python", "Java"],
  tech: ["Raft-style", "Quorum", "Leader Lease"],
  tags: ["distributed", "consensus", "leader-election", "quorum", "advanced"],
  glossary: [
    {
      term: "Leader Election",
      plainDefinition:
        "The process by which members of a cluster agree on exactly one node that will accept writes and coordinate the rest.",
    },
    {
      term: "Split Brain",
      plainDefinition:
        "The dangerous state where two nodes believe they are the leader at the same time and accept conflicting writes.",
    },
    {
      term: "Term",
      plainDefinition:
        "A monotonically increasing election round number; votes and leadership are scoped to a specific term.",
    },
    {
      term: "Majority Quorum",
      plainDefinition:
        "More than half of the voting nodes (n//2 + 1); the minimum number needed to make a decision binding.",
    },
    {
      term: "Vote Granting",
      plainDefinition:
        "A node promising to support one candidate in a term; granting a vote means not granting another candidate in the same term.",
    },
    {
      term: "Single Active Leader",
      plainDefinition:
        "The invariant that at most one node is the accepted leader for a given term at any moment.",
    },
  ],
  primers: [
    {
      concept: "Why Exactly One Leader",
      minutes: 4,
      definition:
        "If two nodes both accept writes, they diverge and clients never know which copy is authoritative — the split-brain failure.",
      whyNeeded:
        "Replicated systems preserve order and consistency by funneling all mutations through one sender at a time.",
      analogy:
        "A courtroom has one judge; two judges issuing orders for the same case produce contradictory rulings.",
      tinyExample: "active_leaders = ['node_2']  # exactly one element, never two",
    },
    {
      concept: "The Majority(Quorum) Arrow",
      minutes: 5,
      definition:
        "With n voters, a candidate wins by collecting more than n/2 votes. In a partitioned network, only one side can ever hold a majority.",
      whyNeeded:
        "A majority is the intersection guarantee: any two majorities share at least one element, so opinions cannot truly fork.",
      analogy:
        "A board of 5 directors: a resolution passes with 3 votes. Two rival camps of 3 cannot both exist simultaneously.",
      tinyExample:
        "quorum = len(voters) // 2 + 1\nleader = next(node for node, v in votes.items() if v >= quorum)",
    },
  ],
  discover: {
    situation:
      "A Redis-cluster-like deployment replicates a shared job lock. During a network blip between two datacenters, both halves of the cluster independently promote a follower to leader. Two different leaders now serve conflicting writes to the shared lock, and two deployments believe they own the same resource, corrupting their data.",
    humanFlow: [
      "A 5-node cluster runs with node_2 as leader; it replicates mutations to its followers.",
      "A network partition splits the cluster: nodes {node_0, node_1} vs {node_3, node_4}, leader node_2 is on the minority side.",
      "Both sides start elections to pick a replacement leader for their local group.",
      "The larger side (3 nodes) elects a new leader; the smaller side (2 nodes) also elects one locally.",
      "Two leaders now accept conflicting writes to the shared lock, and neither side knows it must yield.",
    ],
    question:
      "How can nodes elect a leader in a way that guarantees at most one accepted leader exists, even when the network splits the cluster in half?",
    whyItExists: [
      "Writes need an ordered single point of acceptance to keep replicas consistent.",
      "Follower takeover must be safe: a side too small to form a majority must refuse to elect a leader.",
      "Network partitions are unavoidable, so the election rule must enforce exclusivity by construction.",
    ],
  },
  understand: {
    overview:
      "Election in Raft-style systems proceeds in rounds called terms. A candidate that wants to lead first bumps the term number and asks every node for a vote. A node grants at most one vote per term, so once a candidate has a majority of votes in a term, no other candidate in that term can reach a majority too. That is the core trick: in a world of n nodes, a majority is n//2 + 1, and two different majority sets must share a member — that shared member could not have voted for both. A node only recognises a leader for a term if it has a current term number and (optionally) saw a quorum. When the cluster splits, the side with a majority elects a leader; the side without one simply cannot.",
    components: [
      {
        name: "Follower",
        whatIsIt:
          "A node that is not currently leading; it stays quiet and defers to the current leader.",
        whyItExists:
          "Followers apply replicated writes and make the cluster resilient to a leader crash.",
        whatItDoes: "Votes in elections and applies the leader's replicated log entries in order.",
      },
      {
        name: "Candidate",
        whatIsIt:
          "A follower that has entered an election by bumping the term and requesting votes.",
        whyItExists: "Elections need a trigger to replace a failed or partition-separated leader.",
        whatItDoes:
          "Requests votes from all peers; becomes leader if it wins a majority, else stays candidate or steps down.",
      },
      {
        name: "Leader",
        whatIsIt: "The single node holding the accepted write stream for the current term.",
        whyItExists: "One writer keeps the replicated log ordered and simplifies client routing.",
        whatItDoes:
          "Accepts client writes, replicates them to followers, and renews its authority with heartbeats.",
      },
      {
        name: "Term Clock",
        whatIsIt:
          "A monotonically increasing integer shared across the cluster that scopes every election and every vote.",
        whyItExists:
          "Scoping by term prevents a vote from one round leaking authority into a later round.",
        whatItDoes: "All messages carry a term; a message from an older term is rejected as stale.",
      },
    ],
    analogy: {
      title: "The Boardroom Vote",
      everyday: [
        "Five directors must agree on a chair for the fiscal year. Anyone can nominate, but each director can sign exactly one nomination.",
        "A nominee wins by collecting three signatures — a majority of five.",
        "If the board splits into a room of three and a room of two, only the room of three can collect a majority.",
        "The room of two may shout, but without three signatures it simply cannot produce a legitimate chair.",
      ],
      technical: [
        "The chair is the Leader; the fiscal year is the Term.",
        "Signing one nomination is a Vote Granting rule.",
        "Three signatures out of five is the Majority Quorum.",
        "The room of two is the partition without a quorum — it must not elect.",
      ],
    },
    flow: [
      "A node notices the leader is silent (heartbeat timeout) and starts an election.",
      "It increments the term, marks itself a candidate, and sends a vote request to every peer.",
      "Each peer grants its single vote for that term, or rejects if it has already voted or knows a higher term.",
      "The candidate counts votes; if it reaches a majority it becomes the leader for that term.",
      "The new leader sends heartbeats (empty log entries) to assert authority and suppress new elections.",
      "A node on the minority side of a partition never reaches a majority and stays follower, so split brain is structurally impossible.",
    ],
  },
  concepts: [
    {
      id: "concept-majority",
      name: "Majority Quorum",
      difficulty: "Advanced",
      simpleDefinition:
        "More than half of the voting nodes: with n voters, exactly n//2 + 1 votes.",
      whyItExists:
        "Two majority sets always intersect, so agreement is guaranteed rather than probabilistic.",
      realWorldAnalogy:
        "A 5-person committee decision requires 3 votes; two opposing coalitions of 3 cannot both exist.",
      technicalExplanation:
        "Let Q(v) be the set of nodes that voted for candidate v in a term. For two candidates a and b, if both had majorities then |Q(a) ∩ Q(b)| ≥ 1, contradicting single-vote-per-term. Therefore at most one candidate can win a term.",
      caseApplication:
        "In the 5-node cluster, only the 3-node side can form a majority and elect; the 2-node side is structurally unable to nominate a leader.",
      commonMistakes: [
        "Using 'more than half' wrongly as n/2 instead of n//2 + 1 for odd counts.",
        "Allowing a candidate to count its own vote twice.",
      ],
      practice: [
        "Compute the majority threshold for n = 3, 4, 5, and 6 voters.",
        "Prove that n greater than the max minority leaves at most one viable winner.",
      ],
    },
    {
      id: "concept-term",
      name: "Terms and Stale Messages",
      difficulty: "Advanced",
      simpleDefinition:
        "A global, increasing round number that scopes votes, and the rule that lower-term messages from a deposed leader are rejected.",
      whyItExists:
        "Without terms, votes from old elections could resurrect an obsolete leader and create split brain.",
      realWorldAnalogy:
        "A former president whose term has ended cannot issue binding orders; the new term supersedes theirs.",
      technicalExplanation:
        "Every message carries the sender's current term. A receiver with a higher term ignores the message. A candidate only accepts votes with a matching or higher term. This monotonicity keeps authority moving forward.",
      caseApplication:
        "When the old leader node_2 reconnects after the partition, its stale writes (old term) are refused by nodes now in a higher term.",
      commonMistakes: [
        "Accepting messages from a lower-term node as authoritative.",
        "Letting two different terms both claim the leadership without monotonic ordering.",
      ],
      practice: [
        "Label which messages in a simulated log are stale by term.",
        "Why must the clock only ever move forward?",
      ],
    },
    {
      id: "concept-split-brain",
      name: "Split Brain Prevention",
      difficulty: "Advanced",
      simpleDefinition:
        "The invariant that at most one leader exists per term anywhere in the system, enforced by the majority vote rule.",
      whyItExists:
        "Two simultaneous writers to shared state corrupt replicas and lose data — the worst-case distributed failure.",
      realWorldAnalogy:
        "Two captains of one ship giving simultaneous steering orders; the ship cannot obey both.",
      technicalExplanation:
        "Leadership requires a majority in a term. Because majority sets intersect, two distinct leaders for the same term are impossible. Therefore a disconnected minority can never crown its own leader.",
      caseApplication:
        "The 3-node side wins its election; the 2-node side stays leaderless and keeps serving reads only, unable to accept competing writes.",
      commonMistakes: [
        "Promoting followers to leader without requiring a quorum of votes.",
        "Ignoring the current-term check when a stale leader reconnects.",
      ],
      practice: [
        "Why is a minority-side election outright blocked, not merely discouraged?",
        "What does 'read-only' fallback do for a partition without a quorum?",
      ],
    },
  ],
  architecture: {
    caption:
      "Followers, candidates, and a single leader exchanging votes within monotonically increasing terms.",
    levels: [
      {
        title: "Level 1: Roles in a Cluster",
        description: "One leader and four followers; every write flows through the leader.",
        mermaid: `graph LR
    L["Leader (node_2)"] -->|"replicate"| F1["Follower node_0"]
    L -->|"replicate"| F2["Follower node_1"]
    L -->|"replicate"| F3["Follower node_3"]
    L -->|"replicate"| F4["Follower node_4"]
`,
      },
      {
        title: "Level 2: Election Message Flow",
        description: "A candidate bumps the term and canvasses the cluster for a majority.",
        mermaid: `sequenceDiagram
    participant C as Candidate
    participant A as Node A
    participant B as Node B
    participant D as Node D
    C->>A: vote request (term 9)
    C->>B: vote request (term 9)
    C->>D: vote request (term 9)
    A-->>C: grant (term 9)
    B-->>C: grant (term 9)
    C->>C: majority reached (3/5)
    C->>A: heartbeats as leader (term 9)
`,
      },
      {
        title: "Level 3: Majority Decision Logic",
        description: "Counting votes against the quorum threshold.",
        mermaid: `graph TD
    Count["count votes for candidate"] --> Check{"votes > total_nodes // 2?"}
    Check -->|"Yes"| Win["candidate becomes leader"]
    Check -->|"No"| Lose["no leader this term; stay follower"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Majority Vote vs. Unanimity",
      what: "Require a strict majority (more than half) of nodes for leadership.",
      why: "Two majority sets always overlap, guaranteeing a single winner; unanimity would stall whenever any single node crashes.",
      problemSolved:
        "Both avoids split brain and survives node loss — the same property a quorum gives replicated databases.",
      withoutIt:
        "Unanimous elections freeze forever on the first crash; a 50% threshold would allow two leaders.",
      alternatives: [
        "Leader lease with fencing tokens (guards against stale writes, complements quorum).",
        "Weighted votes by node capacity (advanced, complex).",
      ],
      tradeoff:
        "A leader needs a majority reachable at all times; losing the majority demotes the leader even if it is healthy.",
    },
    {
      title: "Term-Scoped Votes vs. Unbounded Elections",
      what: "Scope every vote and leadership to a monotonically increasing term number.",
      why: "Term monotonicity invalidates stale messages so a deposed or disconnected leader cannot resurrect itself.",
      problemSolved:
        "Eliminates the classic split-brain where an old leader believes it still holds authority after reconnecting.",
      withoutIt:
        "A crashed leader that returns could start accepting writes again without a fresh mandate.",
      alternatives: [
        "Timestamps instead of terms: clock skew makes them unreliable.",
        "Epoch from a central sequencer: introduces a single point of failure.",
      ],
      tradeoff:
        "Every heartbeat and message must carry the current term, adding protocol bookkeeping on the hot path.",
    },
  ],
  implementation: {
    behaviour:
      "An election tally that counts candidate votes and applies the strict majority rule, returning the winning node id or -1 when no candidate holds a quorum.",
    algorithm: [
      "1. Define the quorum as total_nodes // 2 + 1.",
      "2. Tally every vote into a map from candidate id to count.",
      "3. For each candidate with count >= quorum, that candidate is the leader.",
      "4. If several candidates exceed the threshold (should be impossible within a term), pick none — a protocol violation.",
      "5. If no candidate reaches the quorum, return -1: no leader is elected, and the term must retry.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Assumed Leader",
        detail: "A configuration file names the leader. Static, fails on crash.",
      },
      {
        level: "Level 1",
        title: "First-Vote Wins",
        detail: "A node that ever gets a vote claims leadership. Unsafe under partitions.",
      },
      {
        level: "Level 2",
        title: "Majority Tally",
        detail: "Only a strict majority elects a leader. Split brain is structurally impossible.",
      },
      {
        level: "Level 3",
        title: "Terms & Stale Rejection",
        detail: "Elections scoped to terms; low-term messages ignored.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "leader_election.py",
        code: `def elect_leader(votes: list[int], total_nodes: int) -> int:
    # Returns the node id elected leader, or -1 if none has a majority.
    if total_nodes <= 0:
        return -1
    threshold = total_nodes // 2
    counts: dict[int, int] = {}
    for node_id in votes:
        counts[node_id] = counts.get(node_id, 0) + 1
    for node_id, count in counts.items():
        if count > threshold:
            return node_id
    return -1`,
        explanations: [
          {
            code: "threshold = total_nodes // 2",
            explanation:
              "A majority means more than half; any candidate with count > n//2 has a majority.",
          },
          {
            code: "counts[node_id] = counts.get(node_id, 0) + 1",
            explanation: "Tallies cast votes per candidate id.",
          },
          {
            code: "if count > threshold: return node_id",
            explanation:
              "The strict-majority rule: first candidate to exceed half the cluster wins.",
          },
        ],
      },
    ],
    simulationNote:
      "This simulation captures the vote-counting core of leader election. Real Raft adds terms, heartbeats, randomized timeouts, and log replication; the majority rule here is the part that guarantees safety.",
  },
  practice: [
    {
      level: "Understand",
      title: "Compute Quorums",
      brief:
        "Given cluster sizes 3, 4, 5, and 7, state the majority threshold and prove a minority of the partition can never reach it.",
    },
    {
      level: "Modify",
      title: "Count Only Once Per Node",
      brief:
        "Modify the tally to ignore duplicate votes from the same node id, mirroring the single-vote-per-term rule.",
    },
    {
      level: "Build",
      title: "Two-Partition Stage",
      brief:
        "Feed the tally the votes from a simulated split (3 nodes on one side, 2 on the other) and show that only the majority side produces a leader.",
    },
    {
      level: "Think",
      title: "Stale Leader Re-entry",
      brief:
        "After a partition heals, an old leader reconnects holding term 5 while the cluster is in term 9. Design the acceptance rule that rejects its messages.",
    },
  ],
  reflection: [
    "Why is a majority of votes a stronger guarantee than 'the first node to claim leadership'?",
    "How does scoping elections to terms make stale leaders harmless after a partition heals?",
    "Where else does a majority quorum show up (database replication, quorum reads) and what does it fundamentally guarantee?",
  ],
  techNotes: [
    {
      name: "Raft and etcd/ZooKeeper",
      kind: "Industry Adoption",
      note: "Raft is the consensus algorithm powering etcd and Kubernetes; ZooKeeper implements a similar quorum voting protocol for coordination.",
    },
    {
      name: "Fencing Tokens",
      kind: "Safety Enhancement",
      note: "On partition recovery, a fencing token (monotonic epoch) proves whether a stale leader's messages are still valid, complementing the vote quorum.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Elect a Leader by Majority",
    brief:
      "Implement elect_leader(votes, total_nodes): tally the votes and return the candidate id that holds a strict majority, or -1 when no candidate reaches the quorum.",
    functionName: "elect_leader",
    signature: "def elect_leader(votes: list[int], total_nodes: int) -> int:",
    starterCode: `def elect_leader(votes: list[int], total_nodes: int) -> int:
    # votes is a list of node ids, e.g. [2, 2, 2, 0, 1] (node 2 got 3 votes).
    # total_nodes is the size of the whole cluster.
    # A candidate wins only with > total_nodes // 2 votes.
    # Return the winning candidate id, or -1 if none has a majority.
    if total_nodes <= 0:
        return -1
    threshold = total_nodes // 2
    counts: dict[int, int] = {}
    for node_id in votes:
        counts[node_id] = counts.get(node_id, 0) + 1
    for node_id, count in counts.items():
        if count > threshold:
            return node_id
    return -1
`,
    javaSignature: "public static int electLeader(int[] votes, int totalNodes)",
    javaStarterCode: `import java.util.HashMap;
import java.util.Map;

public class Solution {
    public static int electLeader(int[] votes, int totalNodes) {
        if (totalNodes <= 0) {
            return -1;
        }
        int threshold = totalNodes / 2;
        Map<Integer, Integer> counts = new HashMap<>();
        for (int nodeId : votes) {
            counts.put(nodeId, counts.getOrDefault(nodeId, 0) + 1);
        }
        for (Map.Entry<Integer, Integer> e : counts.entrySet()) {
            if (e.getValue() > threshold) {
                return e.getKey();
            }
        }
        return -1;
    }
}`,
    mermaid: `graph TD
    Start["elect_leader(votes, total_nodes)"] --> Guard{"total_nodes > 0?"}
    Guard -->|"No"| Neg["Return -1"]
    Guard -->|"Yes"| Tally["tally votes per candidate id"]
    Tally --> Check{"any count > total_nodes // 2?"}
    Check -->|"Yes"| Win["Return candidate id"]
    Check -->|"No"| Lose["Return -1"]
`,
    hints: [
      "Compute the threshold exactly as (total_nodes // 2) — a majority strictly exceeds half.",
      "Guard the degenerate total_nodes <= 0 case first.",
      "Count using a dictionary; duplicate votes from one node in this simplified lab simply add up.",
    ],
    tests: [
      {
        name: "Clear majority elects the candidate",
        args: [[2, 2, 2, 0, 1], 5],
        expected: "2",
      },
      {
        name: "No majority returns -1",
        args: [[0, 1, 2], 5],
        expected: "-1",
      },
      {
        name: "Three-node cluster majority is 2 votes",
        args: [[3, 3], 3],
        expected: "3",
      },
      {
        name: "Rejects invalid cluster size",
        args: [[0], 0],
        expected: "-1",
      },
    ],
    explanationPrompt:
      "Explain why requiring a strict majority prevents split brain, even when the network partitions the cluster into two disconnected sides.",
  },
};

export const case35_quorumReads = {
  id: "cs-quorum-reads-035",
  slug: "quorum-reads-writes",
  index: "35",
  title: "How Do Quorum Reads and Writes Balance Consistency with Availability?",
  shortTitle: "Quorum Reads",
  category: "Reliability & Scalability",
  subcategory: "Consistency Tuning",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "Distributed key-value stores replicate every key across several nodes so a disk or machine failure never loses data. Discover how reads and writes configured with quorums (R and W) keep replicas converging even while nodes lag, fail, or disagree, and why R + W > N guarantees you never read a stale value after a confirmed write.",
  learningObjectives: [
    "Model replication as N replicas per key, with W writes and R reads required for success.",
    "Understand why R + W > N guarantees at least one overlap between any read set and any write set.",
    "Resolve conflicting read values using version numbers instead of timestamps.",
    "Implement quorum read resolution that returns the freshest value present on a quorum.",
  ],
  prerequisites: [
    "Basic replication and sharding concepts",
    "Hashing and key-value store vocabulary",
    "Versioning / monotonic counters",
    "Distributed systems basics (node, replica, network partition)",
  ],
  engineeringConcepts: [
    "Replication Factor",
    "Read Quorum",
    "Write Quorum",
    "Version Stamp",
    "Read Repair",
    "Overlap Guarantee",
  ],
  technologies: ["Replication", "Distributed Storage", "Versioning", "Python", "Java"],
  tech: ["R+W Replication", "Version Clocks", "Quorum"],
  tags: ["distributed", "storage", "quorum", "replication", "advanced"],
  glossary: [
    {
      term: "Replication Factor",
      plainDefinition:
        "The number of nodes (N) that store copies of a given key, keeping the system alive if some copies die.",
    },
    {
      term: "Read Quorum",
      plainDefinition:
        "The minimum number of replicas (R) that must respond with data for a read to succeed.",
    },
    {
      term: "Write Quorum",
      plainDefinition:
        "The minimum number of replicas (W) that must acknowledge a write before it is reported successful.",
    },
    {
      term: "Version Stamp",
      plainDefinition:
        "A monotonically increasing number attached to a value so replicas can tell which copy is fresher.",
    },
    {
      term: "Read Repair",
      plainDefinition:
        "Pushing the newest value seen by a read onto stale replicas at the same time as serving it.",
    },
    {
      term: "Overlap Guarantee",
      plainDefinition:
        "The theorem that when R + W > N, every successful write and every successful read share at least one common replica.",
    },
  ],
  primers: [
    {
      concept: "N, R, W in One Line",
      minutes: 4,
      definition:
        "N copies of each key exist; you only need W acknowledgements to write and R responses to read. When R + W > N, reads always intersect writes.",
      whyNeeded:
        "The R + W > N rule is the mathematical skeleton of quorum systems — tuning it changes the consistency/availability trade-off.",
      analogy:
        "A teacher keeps N spare exam answer keys. At least W teachers must sign a change; to read the answer you need R sign-offs; overlap means someone always knows the latest.",
      tinyExample: "N = 3, W = 2, R = 2  # R + W = 4 > 3 -> overlaps guaranteed",
    },
    {
      concept: "When Writes Vanish (the Stale Read)",
      minutes: 5,
      definition:
        "With R = 1, W = 1 and N = 3, a read can hit a replica that never got the write — you read stale data that was 'successfully' written.",
      whyNeeded:
        "This is the exact failure that quorum math prevents: confirmed writes must never disappear from the system view.",
      analogy:
        "Only one of three spokespeople hears a policy change; a reporter asking a different spokesperson reports the old policy as current.",
      tinyExample: "R = 1, W = 1, N = 3 -> R + W = 2 <= 3 -> stale reads possible",
    },
  ],
  discover: {
    situation:
      "A photo-sharing app keeps user profile data replicated across 3 datacenters (N = 3) so losing one datacenter never loses data. Operators configured reads and writes to require only a single node (R = 1, W = 1) for speed. After a brief partition, one datacenter misses an update. Users then see an old profile photo (a stale read) even though the save was reported as successful. Support tickets flood in claiming edits 'didn't stick'.",
    humanFlow: [
      "A user updates her profile photo; the write is accepted by 1 of 3 datacenters and reported success (W = 1).",
      "A network partition between datacenters delays propagation of the update.",
      "Another user opens her profile; the nearest datacenter returns its old local copy (R = 1).",
      "The app displays the pre-update photo even though the edit was 'confirmed'.",
      "The team realises the read set and the write set never had to touch the same replica.",
    ],
    question:
      "What read and write configuration guarantees that a confirmed write is always visible to later reads, without forcing every read and write to touch all three replicas?",
    whyItExists: [
      "Waiting for all N replicas on every operation is slow and fails when any node is down.",
      "Small quorums (R = W = 1) maximise speed but let reads and writes miss each other entirely.",
      "Users accept eventual visibility only within bounds; random stale reads of confirmed writes are unacceptable.",
    ],
  },
  understand: {
    overview:
      "In a quorum-replicated store, every key is stored on N nodes. A write succeeds when at least W replicas acknowledge it and carry the newest version stamp. A read succeeds when at least R replicas respond; the reader returns the value carrying the highest version stamp among the responses. The overlap theorem states: whenever R + W > N, any quorum read set and any quorum write set share a replica, so a successfully written value is guaranteed to be present in every later successful read. When conflicting versions appear (concurrent updates to disjoint quorums), version stamps let the client choose the newest winning value while read repair pushes it back to stale replicas.",
    components: [
      {
        name: "Key Router / Consistency Coordinator",
        whatIsIt:
          "The component that computes the N replica nodes for a key and orchestrates R/W waits.",
        whyItExists:
          "Clients should not hand-roll quorum math; the coordinator enforces N, R, W uniformly.",
        whatItDoes:
          "Hashes the key to its replica set, fans out writes/reads, collects responses, and applies the success rule.",
      },
      {
        name: "Replica",
        whatIsIt: "One of the N nodes storing a versioned copy of the key.",
        whyItExists: "N copies create fault tolerance against node or datacenter loss.",
        whatItDoes:
          "Stores (version, value) pairs, acknowledges writes, and answers reads with its current copy.",
      },
      {
        name: "Version Stamp",
        whatIsIt: "A per-key monotonic counter incremented on every successful write.",
        whyItExists:
          "Replicas diverge in time; versions let readers pick the newest value without trusting wall clocks.",
        whatItDoes:
          "Piggies along on every write and read so the freshest winner can be identified deterministically.",
      },
      {
        name: "Read Repairer",
        whatIsIt:
          "A background or in-path mechanism that overwrites stale replicas with the freshly read value.",
        whyItExists:
          "Eventually the replicas must converge; repair makes that convergence happen as a side effect of reads.",
        whatItDoes:
          "Writes the winning high-version value back to replicas that returned older versions.",
      },
    ],
    analogy: {
      title: "Three Librarians, One Reference Work",
      everyday: [
        "Three librarians each keep a copy of the meeting room schedule book (N = 3).",
        "A change is a success once at least two librarians log it (W = 2).",
        "To answer a question, a librarian needs to see at least two books (R = 2).",
        "Because R + W = 4 > 3, any two logged books and any two read books share a shelf, so the newest change can never hide from a reader.",
      ],
      technical: [
        "The three books are replicas of the key.",
        "Two log entries is the write quorum W.",
        "Reading two books is the read quorum R.",
        "The shared shelf is the guaranteed overlap replica.",
      ],
    },
    flow: [
      "Coordinator hashes key to its N = 3 replica set.",
      "A write with (new_version, value) is sent to all 3 replicas.",
      "Coordinator awaits W = 2 acknowledgements; then reports success to the client.",
      "A read later arrives; the coordinator queries all 3 replicas and waits for R = 2 responses.",
      "The reader compares returned version stamps and returns the value with the highest version.",
      "Read repair pushes the winner back to any replica holding a lower version.",
    ],
  },
  concepts: [
    {
      id: "concept-overlap",
      name: "The R + W > N Overlap Guarantee",
      difficulty: "Advanced",
      simpleDefinition:
        "The theorem that when the read quorum R plus the write quorum W exceeds the replica count N, every successful read overlaps every successful write on at least one replica.",
      whyItExists:
        "The overlap is what converts 'eventually consistent' into 'confirmed writes are always visible'.",
      realWorldAnalogy:
        "Two committees that each need 3 members to act from a 5-person board must share a member — a unanimous-consent-free version of intersection.",
      technicalExplanation:
        "A successful write touches |W| >= W replicas; a successful read touches |R| >= R. If every read and write were disjoint, they would use R + W > N distinct replicas, impossible. Therefore a later read with the quorum is guaranteed to see the newest version.",
      caseApplication:
        "With N = 3, R = 2, W = 2, the profile photo update is guaranteed visible on any later quorum read.",
      commonMistakes: [
        "Believing R + W = N is enough — you need strictly greater than N.",
        "Imagining the guarantee holds when replicas are read/written with fewer than R or W responses.",
      ],
      practice: [
        "For N = 3 list all (R, W) pairs satisfying R + W > 3.",
        "Show a concrete stale-read counterexample for R = 1, W = 1.",
      ],
    },
    {
      id: "concept-version",
      name: "Version Stamps, Not Wall Clocks",
      difficulty: "Advanced",
      simpleDefinition:
        "A per-key monotonically increasing integer assigned on each write so any reader can identify the freshest copy without trusting clock time.",
      whyItExists:
        "Wall clocks skew across machines; a timestamped write could appear 'older' at a lagging replica and wrongly lose.",
      realWorldAnalogy:
        "A versioned manuscript: the editor stamps each revision with a revision number, so no one confuses the printed draft with the latest edit.",
      technicalExplanation:
        "Writes carry version = max_seen_version + 1. A read selects the value with the maximum version among responses; ties or disjoint concurrent versions are resolved by the client (e.g. choose max, or merge using CRDTs).",
      caseApplication:
        "The photo's version 7 beats version 6 on any replica, so even a lagging datacenter's 6 cannot win a quorum read.",
      commonMistakes: [
        "Comparing timestamps instead of versions, which breaks under clock skew.",
        "Allowing two writes to produce the same version number at different replicas.",
      ],
      practice: [
        "Under concurrent writes to disjoint quorums, two versions exist. Which should the app present, and why is a merge sometimes needed?",
        "Why is version = max_seen + 1 unsafe without a shared counter?",
      ],
    },
    {
      id: "concept-repair",
      name: "Read Repair & Lazy Convergence",
      difficulty: "Advanced",
      simpleDefinition:
        "Pushing the winning high-version value from a read onto replicas that returned stale copies, repairing divergence as a side effect.",
      whyItExists:
        "Quorum guarantees visibility of confirmed writes, but replicas outside recent quorums can stay stale indefinitely — repair restores them.",
      realWorldAnalogy:
        "A clerk who notices one library's book is out of date corrects it on the spot during the lookup.",
      technicalExplanation:
        "On each read, every replica that answered with a version below the winner gets a background write of the winner. This bounds divergence and limits the number of divergent copies under normal operation.",
      caseApplication:
        "When a quorum read sees the datacenter holding version 6 lagging behind version 7, read repair updates it to version 7 immediately.",
      commonMistakes: [
        "Repairing on every read without batching, flooding the network for hot keys.",
        "Treating read repair as a substitute for satisfying R + W > N.",
      ],
      practice: [
        "When is a stale replica dangerous even with read repair in place?",
        "How would write-ahead repair on the write path change the R + W > N requirement?",
      ],
    },
  ],
  architecture: {
    caption:
      "N replicas per key, writes acknowledged by W, reads satisfied by R, with version-stamp arbitration and read repair.",
    levels: [
      {
        title: "Level 1: Replica Set for One Key",
        description: "A key K lives on 3 nodes; clients reach them through one coordinator.",
        mermaid: `graph LR
    Coord["Coordinator"] --> R1[(Replica A)]
    Coord --> R2[(Replica B)]
    Coord --> R3[(Replica C)]
    R1 --> Data["key K: (v=6, value)"]
    R2 --> Data
    R3 --> Data
`,
      },
      {
        title: "Level 2: Write Path (W = 2)",
        description: "A write succeeds once 2 of 3 replicas acknowledge it.",
        mermaid: `graph TD
    Coord["Coordinator"] -->|"write v=7"| A["Replica A: ack"]
    Coord -->|"write v=7"| B["Replica B: ack"]
    Coord -->|"write v=7"| C["Replica C: no ack"]
    A --> Ok["W=2 satisfied -> Success"]
    B --> Ok
`,
      },
      {
        title: "Level 3: Read Path + Repair (R = 2)",
        description:
          "A read waits for 2 responses, picks the highest version, and repairs the stale replica.",
        mermaid: `graph TD
    Read["Read key K"] --> A["A returns v=7"]
    Read --> B["B returns v=7"]
    Read --> C["C returns v=6 (stale)"]
    A --> Pick["winner = v=7"]
    B --> Pick
    Pick --> Repair["read repair -> C gets v=7"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Quorum Tuning R + W > N vs. Strong Consistency",
      what: "Choose quorum sizes such that every successful read overlaps every successful write (R + W > N) rather than touching all N replicas.",
      why: "Overlapping quorums give read-your-writes for confirmed writes at a fraction of the latency and failure exposure of full replication waits.",
      problemSolved:
        "Kills the stale-profile-photo class of bugs without making reads and writes all-node operations.",
      withoutIt:
        "R = W = 1 makes writes invisible across partitions, silently producing stale confirmed data.",
      alternatives: [
        "Linearizable quorum + ordered writes (heavier protocol, stronger guarantee).",
        "Single-leader replication (simple, but one writer to coordinate).",
        "No quorum: read any, write all (fast reads, fragile writes).",
      ],
      tradeoff:
        "With R + W > N, operations tolerate fewer node failures than full replication, and hot keys still concentrate coordinator work.",
    },
    {
      title: "Version Stamps Over Timestamps",
      what: "Arbitrate read winners by a per-key version counter rather than wall-clock timestamps.",
      why: "Distributed clocks drift; a newer write can arrive at a replica with an apparently older timestamp and wrongly lose.",
      problemSolved:
        "Removes clock-skew from the freshness decision, keeping arbitration deterministic.",
      withoutIt:
        "Lagging replicas echo stale timestamps and distort which copy is considered newest.",
      alternatives: [
        "Hybrid logical clocks (better, but more complex).",
        "Lamport clocks (generic, need client mediation).",
      ],
      tradeoff:
        "Concurrent updates from disjoint quorums can still produce siblings; the client must pick or merge.",
    },
  ],
  implementation: {
    behaviour:
      "A quorum resolver that captures the N = 3, W = 2, R = 2 contract: writes require W acknowledgements, reads require R responses and return the highest-version value present on the read quorum.",
    algorithm: [
      "1. Define N, W, R and enforce R + W > N as a design invariant.",
      "2. On write: record version = max_seen + 1, and only report success after W replicas acknowledged that exact version.",
      "3. On read: gather up to R responses and pick the entry with the highest version.",
      "4. If fewer than R replicas responded, the read fails (no quorum).",
      "5. Return the winner and schedule read repair for any responder that held a lower version.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "R = W = N",
        detail:
          "Every node must answer. Safest, but neither node faults nor latency are tolerated.",
      },
      {
        level: "Level 1",
        title: "R = W = 1",
        detail: "Any node answers. Fastest, but confirmed writes can be invisible (stale reads).",
      },
      {
        level: "Level 2",
        title: "R + W > N",
        detail: "Overlapping quorums guarantee visible writes with partial replication tolerance.",
      },
      {
        level: "Level 3",
        title: "Versioning + Read Repair",
        detail: "Deterministic freshness arbitration and background convergence of stale replicas.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "quorum_resolver.py",
        code: `def read_value(node_values: list[dict], read_quorum: int) -> int:
    # node_values: responses like [{'version': 7, 'value': 42}].
    # read_quorum: the R threshold.
    if len(node_values) < read_quorum:
        raise ValueError("insufficient read quorum")
    best = node_values[0]
    for entry in node_values[1:]:
        if entry["version"] > best["version"]:
            best = entry
    return best["value"]`,
        explanations: [
          {
            code: "if len(node_values) < read_quorum: raise ValueError",
            explanation:
              "Enforces the R threshold: fewer than R responders means the read must fail rather than return a guess.",
          },
          {
            code: "best = node_values[0]",
            explanation: "Seeds the winner with the first response.",
          },
          {
            code: "if entry['version'] > best['version']: best = entry",
            explanation:
              "Picks the highest version stamp across the quorum — the freshest confirmed value.",
          },
        ],
      },
    ],
    simulationNote:
      "This simulation compresses the read path to vote counting and version arbitration. Real systems add clock coordination, sibling handling, and durable confirmation, but the R + W > N overlap rule above is exactly what operates in production.",
  },
  practice: [
    {
      level: "Understand",
      title: "Overlap Math",
      brief:
        "For N = 5, list all pairs (R, W) with R + W > 5 and explain the stale-read risk when W + R = 5.",
    },
    {
      level: "Modify",
      title: "Return the Whole Version",
      brief:
        "Extend read_value to return (value, version) so the caller can run read repair with the winning version.",
    },
    {
      level: "Build",
      title: "Write Acknowledge Rule",
      brief:
        "Implement a write-side check that the number of replicas acknowledging version v is >= W before reporting success.",
    },
    {
      level: "Think",
      title: "Failure Budget",
      brief:
        "With N = 3, R = 2, W = 2, how many node failures can a write tolerate while still succeeding? A read? Where does the trade-off pinch?",
    },
  ],
  reflection: [
    "How does the R + W > N guarantee convert 'eventually consistent' into 'confirmed writes are always visible'?",
    "Why are version stamps superior to timestamps for picking the freshest replica copy?",
    "What does read repair buy you beyond the quorum guarantee, and what does it cost on hot keys?",
  ],
  techNotes: [
    {
      name: "Dynamo & Cassandra",
      kind: "Industry Adoption",
      note: "Amazon Dynamo and Apache Cassandra make N/R/W per-request tunable knobs, letting operators trade consistency for latency per operation.",
    },
    {
      name: "Vector Clocks",
      kind: "Advanced Versioning",
      note: "Vector clocks track causality between replicas so concurrent updates can be detected and merged, going beyond a single integer version.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Resolve a Quorum Read",
    brief:
      "Implement read_value(node_values, read_quorum): fail if fewer replicas responded than the read quorum requires, otherwise return the value with the highest version stamp among them.",
    functionName: "read_value",
    signature: "def read_value(node_values: list[dict], read_quorum: int) -> int:",
    starterCode: `def read_value(node_values: list[dict], read_quorum: int) -> int:
    # node_values is a list like [{'version': 7, 'value': 42}, {'version': 6, 'value': 40}].
    # read_quorum is the R threshold for this read.
    # If len(node_values) < read_quorum, raise ValueError('insufficient read quorum').
    # Otherwise return the value whose entry has the greatest 'version'.
    if len(node_values) < read_quorum:
        raise ValueError("insufficient read quorum")
    best = node_values[0]
    for entry in node_values[1:]:
        if entry["version"] > best["version"]:
            best = entry
    return best["value"]
`,
    javaSignature: "public static int readValue(Map<String, Integer>[] nodeValues, int readQuorum)",
    javaStarterCode: `import java.util.Map;

public class Solution {
    public static int readValue(Map<String, Integer>[] nodeValues, int readQuorum) {
        if (nodeValues.length < readQuorum) {
            throw new IllegalArgumentException("insufficient read quorum");
        }
        Map<String, Integer> best = nodeValues[0];
        for (int i = 1; i < nodeValues.length; i++) {
            if (nodeValues[i].get("version") > best.get("version")) {
                best = nodeValues[i];
            }
        }
        return best.get("value");
    }
}`,
    mermaid: `graph TD
    Start["read_value(node_values, read_quorum)"] --> Quorum{"len(node_values) < read_quorum?"}
    Quorum -->|"Yes"| Raise["Raise ValueError"]
    Quorum -->|"No"| Seed["best = node_values[0]"]
    Seed --> Scan{"higher 'version' found?"}
    Scan -->|"Yes"| Update["best = that entry"]
    Scan -->|"No"| Done["Return best['value']"]
    Update --> Done
`,
    hints: [
      "Enforce the read quorum threshold before doing any freshness work.",
      "Use the 'version' key to compare entries; ignore any value fields until selecting the winner.",
      "Remember node_values is already the successful read set — do not drop entries inside the loop.",
    ],
    tests: [
      {
        name: "Returns highest version across quorum",
        args: [
          [
            { version: 6, value: 40 },
            { version: 7, value: 42 },
          ],
          2,
        ],
        expected: "42",
      },
      {
        name: "Single node satisfying R=1 returns its value",
        args: [[{ version: 3, value: 9 }], 1],
        expected: "9",
      },
      {
        name: "Fails when read quorum not satisfied",
        args: [[{ version: 5, value: 1 }], 2],
        expected: "ValueError",
      },
      {
        name: "Equal versions choose the first",
        args: [
          [
            { version: 4, value: 2 },
            { version: 4, value: 7 },
          ],
          2,
        ],
        expected: "2",
      },
    ],
    explanationPrompt:
      "Explain how requiring a read quorum of R responses and picking the highest version guarantees you can never miss a confirmed write when R + W > N.",
  },
};

export const batch3Cases = [
  case31_twoPhaseCommit,
  case32_eventStreamingLog,
  case33_consistentHashing,
  case34_leaderElection,
  case35_quorumReads,
];

async function run() {
  let allPassed = true;
  console.log("=== Validating & Upserting Batch 3 (Advanced Cases 31 - 35) ===");
  for (const cs of batch3Cases) {
    console.log(`\nValidating Case ${cs.index}: ${cs.slug}...`);
    const report = validateCaseStudy(cs);
    if (!report.passed) {
      allPassed = false;
      console.error(`Quality Gate FAILED for ${cs.slug}:`);
      report.errors.forEach((e) => console.error(`  - ERROR: ${e}`));
      continue;
    }
    console.log(`Quality Gate PASSED for ${cs.slug}. Upserting to Convex DB...`);
    await upsertToConvex(cs);
  }
  console.log(
    allPassed
      ? "\n=== Batch 3 Successfully Seeded to Convex DB! ==="
      : "\n=== Batch 3 FAILED — see errors above ===",
  );
  if (!allPassed) process.exit(1);
}

if (import.meta.main) {
  run().catch((err) => {
    console.error("Batch 3 Error:", err);
    process.exit(1);
  });
}
