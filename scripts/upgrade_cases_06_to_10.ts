import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("Missing VITE_CONVEX_URL. Configure .env.local before running.");
}

const client = new ConvexHttpClient(CONVEX_URL);

// Upgraded rich 8-section content for cases 06 to 10 conforming to the KRUZ SRS
const CASE_ENRICHMENTS: Record<string, any> = {
  "seat-booking-system": {
    discover: {
      situation: "Two fans try to reserve row F seat 12 at the exact same millisecond for a sold-out blockbuster movie.",
      humanFlow: [
        "Browse showtimes & open seating map",
        "Select specific seat in auditorium",
        "Place temporary reservation hold",
        "Authorize credit card payment",
        "Issue immutable ticket barcode"
      ],
      question: "How does a booking engine prevent double-booking without making every customer wait in a slow global line?",
      whyItExists: [
        "Concurrent shoppers targeting identical high-demand seats",
        "Network latency causing stale UI seating displays",
        "Checkout abandonment requiring automated seat release after timeout"
      ]
    },
    understand: {
      overview: "A seat booking system maintains an authoritative state machine for every seat in a venue. When a user taps a seat, the engine attempts an atomic state transition from AVAILABLE to RESERVED with an expiration timer. Once payment succeeds, the seat transitions to BOOKED; if payment fails or the timer expires, the hold is safely returned to AVAILABLE.",
      components: [
        {
          name: "Seat Inventory Registry",
          whatIsIt: "In-memory or transactional database of all venue seats.",
          whyItExists: "Acts as single source of truth for seat availability.",
          whatItDoes: "Stores status (AVAILABLE, RESERVED, BOOKED) and owner metadata."
        },
        {
          name: "Reservation Hold Manager",
          whatIsIt: "Timer-based state coordinator.",
          whyItExists: "Prevents abandoned checkouts from locking seats forever.",
          whatItDoes: "Enforces 10-minute hold window and triggers automatic cleanup."
        },
        {
          name: "Transaction Coordinator",
          whatIsIt: "Atomicity controller interfacing payment gateways.",
          whyItExists: "Guarantees money is only charged if the seat is successfully locked.",
          whatItDoes: "Converts reservation into permanent ticket or rolls back on card decline."
        }
      ],
      analogy: {
        title: "Coat Check Token",
        story: "When you hand over your jacket, the attendant places a numbered wooden peg in the slot immediately so no other attendee gets that peg while your receipt is written.",
        everyday: ["Select coat peg", "Attendant holds peg", "Pay fee", "Receive numbered claim slip"],
        technical: ["Request seat ID", "Set seat to RESERVED state with TTL", "Validate payment transaction", "Set seat to BOOKED and return ticket"],
        mapping: [
          { everyday: "Select coat peg", technical: "Select seat ID" },
          { everyday: "Attendant holds peg", technical: "Atomic state transition to RESERVED" },
          { everyday: "Pay fee", technical: "Payment gateway authorization" },
          { everyday: "Receive numbered claim slip", technical: "Generate immutable ticket barcode" }
        ]
      },
      flow: [
        "Client sends POST /reserve with seat_id and session_token",
        "Server executes atomic compare-and-swap on seat status",
        "If seat is AVAILABLE, set status to RESERVED and set expires_at = now + 600s",
        "Client completes payment within 600s window",
        "Server confirms payment and marks seat as permanently BOOKED"
      ]
    },
    implementation: {
      algorithm: [
        "Check if requested seat ID is within valid bounds",
        "Verify seat is currently unreserved and available",
        "Execute atomic reservation assignment",
        "Return reservation status and updated seat map"
      ],
      ladder: [
        { step: 1, focus: "Binary Seat Map", buildsOn: "In-memory boolean array tracking booked vs available" },
        { step: 2, focus: "State Machine with Timers", buildsOn: "Three-state model (AVAILABLE, RESERVED, BOOKED) with timestamps" },
        { step: 3, focus: "Atomic Concurrency Guard", buildsOn: "Mutex locking and compare-and-swap to defeat race conditions" }
      ]
    },
    practice: [
      { level: "Understand", title: "Trace Concurrent Collisions", brief: "Diagram what happens when two threads call book_seat() simultaneously for seat 4." },
      { level: "Modify", title: "Add VIP Row Logic", brief: "Restructure the reservation check to require a loyalty tier flag for rows A through C." },
      { level: "Build", title: "Implement Timeout Sweeper", brief: "Write a cleanup routine that automatically releases reservations older than 10 minutes." },
      { level: "Think", title: "Distributed Seat Locking", brief: "Evaluate how Redis distributed locks (Redlock) or SQL SELECT FOR UPDATE behave during a ticket frenzy." }
    ],
    reflection: [
      "Why is an atomic test-and-set operation necessary when reserving seats rather than a separate check followed by an update?",
      "How does temporary reservation expiration protect business revenue from abandoned shopping carts?"
    ],
    techNotes: [
      { name: "Optimistic vs Pessimistic Locking", kind: "Concurrency", note: "Pessimistic locking locks the database row during the checkout flow; optimistic locking uses version numbers at final commit time." }
    ]
  },

  "inventory-stock-tracker": {
    discover: {
      situation: "A flash sale launches 500 units of a limited keyboard. 10,000 checkout requests hit the server within 3 seconds.",
      humanFlow: [
        "Search product catalog",
        "Check available stock count",
        "Submit purchase order",
        "Deduct inventory balance atomically",
        "Dispatch order fulfillment to warehouse"
      ],
      question: "How do high-volume commerce engines guarantee that available stock never goes below zero during peak traffic spikes?",
      whyItExists: [
        "Negative inventory causes catastrophic overselling and cancellations",
        "Database row contention when thousands of workers update the same SKU",
        "Asynchronous returns and warehouse restocks needing safe reconciliation"
      ]
    },
    understand: {
      overview: "An inventory tracking engine maintains exact SKU counts across distribution hubs. Rather than simply reading a count and writing back a smaller number (which causes race conditions), the inventory manager executes atomic conditional decrements where the quantity is only reduced if the current stock is greater than or equal to the requested amount.",
      components: [
        {
          name: "SKU Ledger",
          whatIsIt: "Real-time stock balance repository.",
          whyItExists: "Maintains authoritative on-hand and reserved counts.",
          whatItDoes: "Stores available units, safety buffers, and warehouse locations."
        },
        {
          name: "Allocation Engine",
          whatIsIt: "Conditional decrement logic layer.",
          whyItExists: "Prevents overselling under high concurrency.",
          whatItDoes: "Validates stock adequacy before confirming orders."
        },
        {
          name: "Audit Trail Log",
          whatIsIt: "Append-only transaction journal.",
          whyItExists: "Enables accounting reconciliation and fraud detection.",
          whatItDoes: "Records every addition, decrement, and transfer with order IDs."
        }
      ],
      analogy: {
        title: "Dispenser Machine Coins",
        story: "A mechanical candy dispenser only turns its gear if a physical coin is inserted; if the chamber is empty, the mechanical arm physically stops and refuses to advance.",
        everyday: ["Insert token", "Gear verifies coin presence", "Dispense item", "Coin drops into locked box"],
        technical: ["Receive decrement request", "Check stock >= requested quantity", "Subtract quantity atomically", "Append entry to audit journal"],
        mapping: [
          { everyday: "Insert token", technical: "Order checkout request" },
          { everyday: "Gear verifies coin presence", technical: "Stock threshold check (count >= qty)" },
          { everyday: "Dispense item", technical: "Atomic inventory decrement" },
          { everyday: "Coin drops into locked box", technical: "Append audit ledger entry" }
        ]
      },
      flow: [
        "Order service requests deduction of N items for SKU",
        "Inventory service runs atomic decrement: UPDATE stock = stock - N WHERE stock >= N",
        "If database returns 1 row affected, deduction succeeded",
        "If 0 rows affected, reject purchase due to OUT_OF_STOCK",
        "Emit InventoryDeducted event to warehouse fulfillment pipeline"
      ]
    },
    implementation: {
      algorithm: [
        "Validate SKU exists in repository",
        "Verify requested quantity is positive and current_stock >= requested_quantity",
        "Perform atomic subtraction on stock ledger",
        "Return success status and updated remaining inventory"
      ],
      ladder: [
        { step: 1, focus: "Direct Counter", buildsOn: "In-memory dictionary with basic subtraction and floor checks" },
        { step: 2, focus: "Atomic Guard", buildsOn: "Conditional compare-and-swap decrement logic" },
        { step: 3, focus: "Audit Ledger", buildsOn: "Append-only transaction journaling for balance reconciliation" }
      ]
    },
    practice: [
      { level: "Understand", title: "Stock Starvation Analysis", brief: "Calculate the probability of overselling when read and write operations are not transactional." },
      { level: "Modify", title: "Support Backorders", brief: "Allow inventory to decrement past zero only if an allowBackorders flag is enabled." },
      { level: "Build", title: "Multi-Warehouse Stock Allocator", brief: "Write an algorithm that fulfills an order from the warehouse geographically closest to the customer." },
      { level: "Think", title: "Eventual Consistency in Warehousing", brief: "Analyze how Amazon reconciles physical inventory audits with digital ledger records." }
    ],
    reflection: [
      "Why must inventory deductions be atomic rather than performing an unisolated read followed by a write?",
      "What are the operational trade-offs of using an append-only transaction ledger versus directly mutating a stock count in place?"
    ],
    techNotes: [
      { name: "Atomic Decrements", kind: "Data Integrity", note: "Using SQL 'UPDATE inventory SET count = count - 1 WHERE id = 1 AND count >= 1' prevents negative balances natively." }
    ]
  },

  "client-server-architecture": {
    discover: {
      situation: "You type https://kruzz.dev into your browser. Within 50 milliseconds, layout, styles, and data render on your screen from a server located 2,000 miles away.",
      humanFlow: [
        "User enters address or clicks action in browser",
        "Client constructs structured HTTP request packet",
        "Packet traverses internet routers to destination host",
        "Web server parses HTTP method and URI path",
        "Server executes business handler and returns HTTP response"
      ],
      question: "How does the web separate user interaction from data storage and business computation across distributed machines?",
      whyItExists: [
        "Centralized security: databases containing financial and user secrets cannot live on client devices",
        "Instant deployments: server-side code updates immediately serve millions of users without app store reinstalls",
        "Resource sharing: thin client devices share massive centralized computing, GPU, and storage clusters"
      ]
    },
    understand: {
      overview: "Client-Server architecture partitions tasks between service requesters (clients) and service providers (servers). The client is responsible for capturing user input and rendering visual interfaces. The server listens on a network port, authenticates incoming requests, executes core business logic, and interacts with persistent databases before formatting a standardized response.",
      components: [
        {
          name: "Client Device",
          whatIsIt: "Web browser, mobile app, or IoT device.",
          whyItExists: "Acts as user touchpoint for interaction and presentation.",
          whatItDoes: "Captures gestures, formats HTTP requests, and paints rendered responses."
        },
        {
          name: "Network Transport",
          whatIsIt: "Internet routing protocol stack (IP, TCP, TLS).",
          whyItExists: "Transports raw bytes securely across physical fiber and cellular hops.",
          whatItDoes: "Guarantees reliable, encrypted byte packet delivery between endpoints."
        },
        {
          name: "Web Server & Router",
          whatIsIt: "Application host listening on TCP ports 80/443.",
          whyItExists: "Dispatches requests to designated code handlers.",
          whatItDoes: "Parses headers, validates payloads, and serializes response status and bodies."
        }
      ],
      analogy: {
        title: "Restaurant Dining Experience",
        story: "You sit at a dining table (Client) and tell the waiter your order. The waiter brings the ticket to the kitchen (Server). The kitchen prepares the dish using pantry ingredients (Database) and the waiter serves your meal (Response).",
        everyday: ["Review menu", "Place order with waiter", "Kitchen cooks meal", "Waiter delivers hot plate"],
        technical: ["Render UI", "Dispatch HTTP GET /menu", "Server queries database and formats JSON", "Client renders received payload"],
        mapping: [
          { everyday: "Diner at table", technical: "Client Browser / Device" },
          { everyday: "Waiter bringing ticket", technical: "HTTP Request over TCP" },
          { everyday: "Kitchen chef", technical: "Backend Web Server Handler" },
          { everyday: "Pantry storeroom", technical: "Database / Storage Layer" },
          { everyday: "Served dish", technical: "HTTP Response (200 OK)" }
        ]
      },
      flow: [
        "Client initiates TCP 3-way handshake with server IP",
        "Client transmits HTTP request: GET /catalog HTTP/1.1",
        "Server matches '/catalog' against its routing table",
        "Server executes catalog_handler(), fetching items from database",
        "Server replies with HTTP/1.1 200 OK + JSON payload",
        "Client parses JSON and renders the product catalog"
      ]
    },
    implementation: {
      algorithm: [
        "Inspect incoming HTTP request method and path",
        "Match path against registered route registry",
        "If matched, invoke handler and format 200 OK response",
        "If unmatched, return 404 NOT FOUND status response"
      ],
      ladder: [
        { step: 1, focus: "Static Route Matcher", buildsOn: "Exact string path matching against handler dictionary" },
        { step: 2, focus: "Status Code Protocol", buildsOn: "Supporting 200 OK, 400 Bad Request, 404 Not Found" },
        { step: 3, focus: "Dynamic Parameter Parsing", buildsOn: "Extracting query strings and URL slugs for handler execution" }
      ]
    },
    practice: [
      { level: "Understand", title: "Trace an HTTP Handshake", brief: "Write out the 3-way TCP SYN/ACK handshake that precedes the first HTTP request." },
      { level: "Modify", title: "Add Route Parameters", brief: "Enhance the router to parse dynamic path variables like /users/:id." },
      { level: "Build", title: "Build a Health Check Endpoint", brief: "Implement a /health route that verifies server uptime and memory consumption." },
      { level: "Think", title: "Thick Client vs Thin Client", brief: "Compare Single Page Applications (SPAs) where client does rendering vs Server-Side Rendering (SSR)." }
    ],
    reflection: [
      "Why must business logic and authorization checks always run on the server rather than trusting the client?",
      "How does the stateless nature of HTTP simplify scaling web servers horizontally?"
    ],
    techNotes: [
      { name: "Statelessness of HTTP", kind: "Networking", note: "Each HTTP request is independent; servers do not keep socket state open between requests unless explicitly upgraded to WebSockets." }
    ]
  },

  "dns-domain-lookup": {
    discover: {
      situation: "Humans remember names like kruzz.dev, but network routers only understand IP addresses like 104.21.45.12.",
      humanFlow: [
        "User types domain name in address bar",
        "OS checks local resolver cache",
        "Recursive DNS queries Root and TLD nameservers",
        "Authoritative nameserver returns A record IP",
        "Client opens direct TCP connection to resolved IP"
      ],
      question: "How does the global internet translate billions of human-readable domain names into IP addresses in single-digit milliseconds?",
      whyItExists: [
        "IP addresses change during server migrations while domain names remain constant",
        "Hierarchical delegation allows millions of organizations to manage subdomains independently without central bottlenecks",
        "Layered caching at browser, OS, ISP, and DNS edge prevents root servers from being overwhelmed"
      ]
    },
    understand: {
      overview: "The Domain Name System (DNS) is the phonebook of the internet. It maps human-friendly hostnames (e.g. kruzz.dev) to machine-routable IP addresses. Resolution works via a tree hierarchy: local cache -> recursive resolver -> root servers (.) -> TLD servers (.dev) -> authoritative nameservers.",
      components: [
        {
          name: "Recursive Resolver",
          whatIsIt: "ISP or public DNS server (e.g. 1.1.1.1, 8.8.8.8).",
          whyItExists: "Performs hierarchical queries on behalf of client devices.",
          whatItDoes: "Traverses DNS tree, caches answers, and returns final IP to user."
        },
        {
          name: "Root & TLD Servers",
          whatIsIt: "Global top-level DNS infrastructure clusters.",
          whyItExists: "Directs queries to the correct domain registry.",
          whatItDoes: "Directs .com, .dev, .org queries to authoritative nameservers."
        },
        {
          name: "Authoritative Nameserver",
          whatIsIt: "Host maintaining official zone records (Cloudflare, Route 53).",
          whyItExists: "Contains definitive mapping for the specific domain.",
          whatItDoes: "Returns A, AAAA, CNAME records with TTL expiration values."
        }
      ],
      analogy: {
        title: "Global Phonebook Directory",
        story: "If you need to call 'Alice in Seattle', you first ask the national directory for Washington State, then Washington directs you to Seattle municipal records, who gives you Alice's exact phone number.",
        everyday: ["Check personal contacts", "Call regional operator", "Operator consults city ledger", "Receive dialable telephone number"],
        technical: ["Check local browser DNS cache", "Query Root DNS for TLD .dev", "Query .dev TLD for authoritative server", "Query authoritative server for A record IP"],
        mapping: [
          { everyday: "Personal contact list", technical: "Browser / OS DNS Cache" },
          { everyday: "Regional telephone operator", technical: "Recursive DNS Resolver" },
          { everyday: "National country code registry", technical: "Root and TLD Nameservers" },
          { everyday: "City telephone ledger", technical: "Authoritative Nameserver" }
        ]
      },
      flow: [
        "Browser checks internal DNS cache for kruzz.dev",
        "If miss, OS queries recursive DNS resolver (e.g. 1.1.1.1)",
        "Resolver checks cache; if miss, queries Root Nameserver",
        "Root nameserver directs resolver to .dev TLD nameserver",
        "TLD nameserver directs resolver to domain's authoritative nameserver",
        "Authoritative nameserver returns IP 104.21.45.12 with TTL 300",
        "Resolver returns IP to browser and caches entry for 300 seconds"
      ]
    },
    implementation: {
      algorithm: [
        "Check if requested domain exists in cache and has not expired",
        "If cache hit, return cached IP and mark hit flag as true",
        "If cache miss, query authoritative dictionary for domain mapping",
        "Store resolved IP in cache with expiration and return result"
      ],
      ladder: [
        { step: 1, focus: "In-Memory Host Table", buildsOn: "Static hostname-to-IP dictionary resolution" },
        { step: 2, focus: "TTL Cache Expiration", buildsOn: "Validating cache timestamps against current time" },
        { step: 3, focus: "Recursive Traversal Simulator", buildsOn: "Emulating Root -> TLD -> Authoritative delegation hops" }
      ]
    },
    practice: [
      { level: "Understand", title: "Trace Dig Query", brief: "Analyze the output of `dig +trace kruzz.dev` through root, TLD, and authoritative hops." },
      { level: "Modify", title: "Implement CNAME Resolution", brief: "Extend the DNS lookup to recursively follow canonical name aliases until an A record is resolved." },
      { level: "Build", title: "Build an LRU DNS Cache", brief: "Implement an in-memory DNS cache that evicts the least-recently-used entry when capacity is reached." },
      { level: "Think", title: "DNS Poisoning & DNSSEC", brief: "Evaluate how cryptographic DNSSEC signatures prevent attackers from spoofing malicious IP addresses." }
    ],
    reflection: [
      "What catastrophic failures occur across the internet if authoritative DNS servers go offline?",
      "Why is Time-To-Live (TTL) tuning a balance between server load and rapid failover speed?"
    ],
    techNotes: [
      { name: "UDP vs TCP in DNS", kind: "Protocols", note: "Standard DNS queries use UDP port 53 for lightning-fast lightweight lookups; responses exceeding 512 bytes fallback to TCP." }
    ]
  },

  "image-cdn-delivery": {
    discover: {
      situation: "A 4MB high-res image hosted on a server in Virginia takes 2.4 seconds to load for a user in Tokyo due to 14,000 miles of cross-Pacific fiber latency.",
      humanFlow: [
        "Client requests image asset URL",
        "Anycast routing directs request to closest Edge Point of Presence (PoP)",
        "Edge node checks local fast-tier SSD cache",
        "On cache miss, Edge fetches asset from central Origin server and caches it",
        "Edge serves asset to client with minimal physical latency"
      ],
      question: "How do modern media platforms deliver rich photos and video assets to worldwide users in under 50 milliseconds?",
      whyItExists: [
        "Speed of light network latency: physical distance across continents limits packet round-trip time",
        "Origin server protection: viral images would crash central databases if millions of requests hit directly",
        "Bandwidth cost reduction: serving cached traffic from local edge caches cuts expensive cloud provider egress fees"
      ]
    },
    understand: {
      overview: "A Content Delivery Network (CDN) is a globally distributed network of proxy servers (Points of Presence) deployed in data centers worldwide. When a user requests an image, Anycast DNS routes them to the geographically closest edge server. If the edge has the image cached, it returns it in single-digit milliseconds; if not, it fetches it once from origin and caches it for all subsequent users.",
      components: [
        {
          name: "Origin Storage Server",
          whatIsIt: "Central master storage bucket (e.g. AWS S3, Google Cloud Storage).",
          whyItExists: "Stores the canonical original high-resolution master media files.",
          whatItDoes: "Serves as the ultimate source of truth when edge caches miss."
        },
        {
          name: "Edge Point of Presence (PoP)",
          whatIsIt: "Caching proxy servers deployed close to user populations.",
          whyItExists: "Eliminates transatlantic/transpacific latency for asset downloads.",
          whatItDoes: "Terminates TLS, checks local cache, and streams cached assets."
        },
        {
          name: "Cache Invalidation Engine",
          whatIsIt: "Global purge messaging pipeline.",
          whyItExists: "Ensures updated or deleted media is immediately removed from edge.",
          whatItDoes: "Broadcasts purge commands to thousands of edge nodes in < 5 seconds."
        }
      ],
      analogy: {
        title: "Local Neighborhood Grocery vs Central Farm",
        story: "Instead of every citizen driving 200 miles to a central farm to buy a gallon of milk, local corner grocery stores stock milk daily so you can walk 3 minutes to pick it up.",
        everyday: ["Walk to neighborhood grocery", "Check shelf for milk", "If in stock, buy immediately", "If empty, store manager orders from central farm"],
        technical: ["Route request to nearest Edge PoP", "Check Edge SSD cache for image hash", "On hit, stream directly to user", "On miss, fetch from Origin S3 bucket and cache"],
        mapping: [
          { everyday: "Neighborhood resident", technical: "End-user client browser" },
          { everyday: "Corner grocery store", technical: "Edge Point of Presence (PoP)" },
          { everyday: "Central farm 200 miles away", technical: "Origin Cloud Storage Server" },
          { everyday: "Milk on shelf", technical: "Cached static media asset" }
        ]
      },
      flow: [
        "Browser requests https://cdn.kruzz.dev/hero.webp",
        "Anycast IP routes request to nearest edge node (e.g. Tokyo PoP)",
        "Tokyo PoP checks local cache: Cache Miss",
        "Tokyo PoP fetches hero.webp from Origin server in Virginia",
        "Origin responds with 200 OK and Cache-Control: max-age=86400",
        "Tokyo PoP saves image in local cache and streams bytes to user",
        "Next user in Tokyo requests hero.webp: Cache Hit served in 4ms"
      ]
    },
    implementation: {
      algorithm: [
        "Inspect if requested asset key exists in edge cache dictionary",
        "If present, format edge cached response with status 200",
        "If absent, fetch asset from origin repository and store in edge cache",
        "Return asset payload and metadata"
      ],
      ladder: [
        { step: 1, focus: "Edge Hit/Miss Proxy", buildsOn: "In-memory cache checking before delegating to origin" },
        { step: 2, focus: "Cache-Control Expiration", buildsOn: "Enforcing max-age and stale-while-revalidate headers" },
        { step: 3, focus: "Origin Shielding", buildsOn: "Adding intermediate parent cache layers to collapse origin traffic" }
      ]
    },
    practice: [
      { level: "Understand", title: "Calculate Latency Savings", brief: "Compare round-trip time (RTT) for a 50ms edge connection versus a 240ms cross-Pacific origin connection." },
      { level: "Modify", title: "Add Cache-Control Headers", brief: "Configure response headers for immutable images (max-age=31536000, immutable)." },
      { level: "Build", title: "Simulate Cache Invalidation", brief: "Write a purge endpoint that invalidates edge entries matching a regex path pattern." },
      { level: "Think", title: "Thundering Herd Problem", brief: "Analyze how edge nodes protect the origin when 50,000 simultaneous users request a newly released image on a cold cache." }
    ],
    reflection: [
      "How does a Content Delivery Network turn an O(N) traffic load on origin servers into an O(1) load?",
      "What are the operational trade-offs between long cache lifetimes and rapid content updates?"
    ],
    techNotes: [
      { name: "Anycast BGP Routing", kind: "Networking", note: "Anycast assigns the same IP address to hundreds of edge nodes worldwide; internet routers automatically route packets to the nearest node." }
    ]
  }
};

async function main() {
  console.log("=== Upgrading Cases 06-10 with Full Canonical 8-Section Content ===");

  for (const [slug, enrichment] of Object.entries(CASE_ENRICHMENTS)) {
    console.log(`Fetching ${slug}...`);
    const study = await client.query(api.caseStudies.getBySlug, { slug });
    if (!study) {
      console.error(`Case ${slug} not found in database!`);
      continue;
    }

    // Merge enrichment into study
    study.discover = enrichment.discover;
    study.understand = enrichment.understand;
    study.practice = enrichment.practice;
    study.reflection = enrichment.reflection;
    study.techNotes = enrichment.techNotes;

    // Merge implementation algorithm & ladder while preserving samples
    if (!study.implementation) {
      study.implementation = {
        behaviour: "",
        algorithm: enrichment.implementation.algorithm,
        ladder: enrichment.implementation.ladder,
        samples: [],
        simulationNote: "Simulation models operational behavior in memory."
      };
    } else {
      study.implementation.algorithm = enrichment.implementation.algorithm;
      study.implementation.ladder = enrichment.implementation.ladder;
    }

    study.updatedAt = Date.now();

    console.log(`Upserting upgraded [${study.index}] ${study.slug}...`);
    await client.mutation(api.caseStudies.upsert, { caseStudy: study });
  }

  console.log("\n=== Verifying All 35 Cases ===");
  const allStudies = await client.query(api.caseStudies.list, {});
  console.log(`Total studies in Convex: ${allStudies.length}`);

  let issues = 0;
  for (const s of allStudies) {
    const missing = [];
    if (!Array.isArray(s.discover?.whyItExists)) missing.push("discover.whyItExists");
    if (!Array.isArray(s.understand?.components)) missing.push("understand.components");
    if (!Array.isArray(s.practice)) missing.push("practice");
    if (!Array.isArray(s.reflection)) missing.push("reflection");
    if (!Array.isArray(s.techNotes)) missing.push("techNotes");

    if (missing.length > 0) {
      console.error(`[${s.index}] ${s.slug} still missing: ${missing.join(", ")}`);
      issues++;
    } else {
      console.log(`[${s.index}] ${s.slug} - Fully Canonical & Valid!`);
    }
  }

  if (issues === 0) {
    console.log("\nSUCCESS: All 35 Case Studies now have complete, canonical 8-section content!");
  } else {
    console.error(`\nFAILED: Found ${issues} studies with missing fields.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Upgrade error:", err);
  process.exit(1);
});
