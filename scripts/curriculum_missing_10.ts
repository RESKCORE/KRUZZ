// ============================================================================
// The 10 Curriculum Cases (Cases 11, 22-30) Completing the 35-Case Sequence
// Each case includes complete 8-section educational content and
// implementations in Python, Java, and C language.
// ============================================================================

export const MISSING_10_CASES: any[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // Case 11: E-Commerce Cart & Checkout
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cs-ecommerce-cart-checkout-011",
    slug: "ecommerce-cart-checkout",
    index: "11",
    title: "How Does an E-Commerce Cart Lock Inventory and Complete Checkout?",
    shortTitle: "Cart & Checkout",
    category: "Web Systems",
    subcategory: "Stateful Transactions",
    difficulty: "Intermediate",
    learnerLevel: "Builder",
    estimatedTime: "45-60 minutes",
    minutes: 50,
    status: "published",
    tier: "premium",
    rcCost: 50,
    summary:
      "When thousands of shoppers add the same scarce sneaker to their cart, how does a store ensure it is never sold twice without locking out paying customers? Discover how reservation holds, expiration timers, and inventory state machines make checkout reliable.",
    learningObjectives: [
      "Understand the difference between a soft cart hold and a permanent inventory decrement.",
      "Trace the life cycle of a checkout session: Active -> Reserved -> Purchased or Expired.",
      "Implement inventory reservations with automated hold timeouts.",
    ],
    prerequisites: ["Dictionaries / Maps", "Timeouts and Epoch Timestamps", "State Machines"],
    engineeringConcepts: [
      "Inventory Reservation",
      "Session Timeout",
      "Soft Locking",
      "Checkout State Machine",
    ],
    technologies: ["Web Systems", "State Machines", "Python", "Java", "C"],
    tech: ["Cart Hold", "Inventory Lock", "Timeouts"],
    tags: ["ecommerce", "cart", "inventory", "checkout"],
    glossary: [
      {
        term: "Soft Hold",
        plainDefinition:
          "Temporarily reserving an item for a customer during checkout with an automatic expiry.",
      },
      {
        term: "Hard Decrement",
        plainDefinition: "Permanently deducting item count after payment is authorized.",
      },
    ],
    primers: [
      {
        concept: "Why You Can't Just Decrement on Add-To-Cart",
        minutes: 4,
        definition:
          "If you deduct stock when someone adds to cart, abandoned carts would cause items to show out of stock forever.",
        whyNeeded:
          "A temporary reservation with a 10-minute hold window balances shopper intent with business stock availability.",
        analogy:
          "A concert ticket seat is held for 8 minutes while you enter your credit card; if you walk away, it goes back on sale.",
        tinyExample: "hold_expiry = current_time + 600",
      },
    ],
    discover: {
      situation: "Shoppers add items to carts, but only a fraction actually purchase.",
      humanFlow: [
        "Browse item",
        "Add to cart",
        "Proceed to payment",
        "Authorize funds",
        "Fulfill order",
      ],
      question:
        "How do we hold inventory during checkout without letting abandoned carts starve the store?",
      whyItExists: [
        "Concurrent buyers competing for the last item",
        "Payment gateways taking up to 60 seconds to respond",
        "Shoppers abandoning browsers mid-session",
      ],
    },
    understand: {
      overview:
        "An e-commerce checkout engine uses a 2-stage commit model for inventory: soft reservations during the checkout window, converted to hard decrements only when payment confirmation arrives.",
      components: [
        {
          name: "Inventory Ledger",
          whatIsIt: "The authoritative stock record",
          whyItExists: "Tracks available and reserved counts",
          whatItDoes: "Answers stock checks",
        },
        {
          name: "Reservation Timer",
          whatIsIt: "Hold expiration tracker",
          whyItExists: "Frees held stock if user abandons",
          whatItDoes: "Releases unpurchased items",
        },
      ],
      analogy: {
        title: "Movie Ticket Hold",
        everyday: [
          "You click a seat on the screen.",
          "The app holds it for 5 minutes.",
          "If you don't pay in time, someone else can book it.",
        ],
        technical: [
          "Click is soft reserve.",
          "Timer is TTL lock.",
          "Payment completes transition to BOOKED.",
        ],
      },
      flow: [
        "Check available stock",
        "Create reservation with expiry timestamp",
        "Await payment authorization",
        "Finalize purchase or release hold on timeout",
      ],
    },
    concepts: [
      {
        id: "soft-hold",
        name: "Soft Reservation",
        difficulty: "Intermediate",
        simpleDefinition: "A temporary claim on an item that expires automatically.",
        whyItExists: "To stop double-selling while avoiding dead stock from abandoned carts.",
        realWorldAnalogy: "Holding a table at a restaurant for 15 minutes past reservation time.",
        technicalExplanation:
          "Stores an item with an expiration timestamp; available stock equals total minus active unexpired reservations.",
        caseApplication: "Used in `reserve_item` before initiating payment processing.",
        commonMistakes: ["Permanently decrementing stock before payment is charged."],
        practice: ["Calculate available stock given 10 total items and 3 active reservations."],
      },
    ],
    architecture: {
      caption: "Checkout reservation state flow from cart to purchase",
      levels: [
        {
          title: "Reservation Flow",
          description: "Transitioning items from Available to Reserved to Sold",
          mermaid: `graph LR
    A[Available Stock] -->|Reserve Hold 10m| B[Reserved Hold]
    B -->|Payment Success| C[Sold Out]
    B -->|Timer Expired| A`,
        },
      ],
    },
    decisions: [
      {
        title: "Soft Reservation vs Instant Decrement",
        what: "Soft hold with TTL",
        why: "Prevents abandoned cart stock lockup",
        problemSolved: "Shoppers abandoning carts don't deplete warehouse inventory",
        withoutIt: "A competitor could put all inventory in carts and freeze the store",
        alternatives: ["Hard decrement on cart addition", "First to pay wins (overselling risk)"],
        tradeoff: "Requires background reaper or on-read expiration check for holds",
      },
    ],
    implementation: {
      behaviour: "Maintains available stock and active reservations with expiration checks.",
      algorithm: [
        "1. Check if available stock > active unexpired holds.",
        "2. If available, generate reservation ID with expiry timestamp.",
        "3. Upon payment, verify reservation is still unexpired and convert to confirmed purchase.",
      ],
      ladder: [
        { level: "LEVEL 0", title: "Direct Stock Count", detail: "Single integer stock counter." },
        {
          level: "LEVEL 1",
          title: "Reservation Queue",
          detail: "Separates available vs reserved.",
        },
        {
          level: "LEVEL 2",
          title: "TTL Hold Expiry",
          detail: "Frees expired holds automatically.",
        },
      ],
      samples: [
        {
          language: "python",
          filename: "cart_checkout.py",
          code: `import time

class CartCheckout:
    def __init__(self, stock: int, hold_seconds: int = 600):
        self.stock = stock
        self.hold_seconds = hold_seconds
        self.reservations = {} # cart_id -> expiry_timestamp

    def reserve(self, cart_id: str, now: int) -> bool:
        self.clean_expired(now)
        active_holds = len(self.reservations)
        if self.stock - active_holds <= 0:
            return False
        self.reservations[cart_id] = now + self.hold_seconds
        return True

    def checkout(self, cart_id: str, now: int) -> bool:
        self.clean_expired(now)
        if cart_id not in self.reservations:
            return False
        del self.reservations[cart_id]
        self.stock -= 1
        return True

    def clean_expired(self, now: int):
        expired = [cid for cid, exp in self.reservations.items() if now >= exp]
        for cid in expired:
            del self.reservations[cid]`,
          explanations: [
            {
              code: "if self.stock - active_holds <= 0: return False",
              explanation: "Checks available stock taking unexpired reservations into account.",
            },
            {
              code: "self.reservations[cart_id] = now + self.hold_seconds",
              explanation: "Sets expiration window for the reservation.",
            },
            {
              code: "self.stock -= 1",
              explanation:
                "Converts soft reservation into permanent deduction upon verified checkout.",
            },
          ],
        },
        {
          language: "java",
          filename: "CartCheckout.java",
          code: `import java.util.HashMap;
import java.util.Map;

public class CartCheckout {
    private int stock;
    private final int holdSeconds;
    private final Map<String, Long> reservations = new HashMap<>();

    public CartCheckout(int stock, int holdSeconds) {
        this.stock = stock;
        this.holdSeconds = holdSeconds;
    }

    public synchronized boolean reserve(String cartId, long now) {
        cleanExpired(now);
        if (stock - reservations.size() <= 0) return false;
        reservations.put(cartId, now + holdSeconds);
        return true;
    }

    public synchronized boolean checkout(String cartId, long now) {
        cleanExpired(now);
        if (!reservations.containsKey(cartId)) return false;
        reservations.remove(cartId);
        stock--;
        return true;
    }

    private void cleanExpired(long now) {
        reservations.entrySet().removeIf(entry -> now >= entry.getValue());
    }

    public int getStock() { return stock; }
}`,
          explanations: [
            {
              code: "reservations.entrySet().removeIf(entry -> now >= entry.getValue());",
              explanation: "Purges timed-out reservations before stock calculations.",
            },
            {
              code: "stock--;",
              explanation: "Permanently deducts inventory after checkout succeeds.",
            },
          ],
        },
        {
          language: "c",
          filename: "cart_checkout.c",
          code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_RESERVATIONS 64

typedef struct {
    char cart_id[32];
    long expiry;
    bool active;
} Reservation;

typedef struct {
    int stock;
    int hold_seconds;
    Reservation reservations[MAX_RESERVATIONS];
} CartCheckout;

void init_cart(CartCheckout *cc, int stock, int hold_seconds) {
    cc->stock = stock;
    cc->hold_seconds = hold_seconds;
    for (int i = 0; i < MAX_RESERVATIONS; i++) cc->reservations[i].active = false;
}

static void clean_expired(CartCheckout *cc, long now) {
    for (int i = 0; i < MAX_RESERVATIONS; i++) {
        if (cc->reservations[i].active && now >= cc->reservations[i].expiry) {
            cc->reservations[i].active = false;
        }
    }
}

bool reserve_item(CartCheckout *cc, const char *cart_id, long now) {
    clean_expired(cc, now);
    int active_holds = 0;
    int free_slot = -1;
    for (int i = 0; i < MAX_RESERVATIONS; i++) {
        if (cc->reservations[i].active) active_holds++;
        else if (free_slot == -1) free_slot = i;
    }
    if (cc->stock - active_holds <= 0 || free_slot == -1) return false;
    strncpy(cc->reservations[free_slot].cart_id, cart_id, 31);
    cc->reservations[free_slot].expiry = now + cc->hold_seconds;
    cc->reservations[free_slot].active = true;
    return true;
}

bool complete_checkout(CartCheckout *cc, const char *cart_id, long now) {
    clean_expired(cc, now);
    for (int i = 0; i < MAX_RESERVATIONS; i++) {
        if (cc->reservations[i].active && strcmp(cc->reservations[i].cart_id, cart_id) == 0) {
            cc->reservations[i].active = false;
            cc->stock--;
            return true;
        }
    }
    return false;
}`,
          explanations: [
            {
              code: "if (cc->stock - active_holds <= 0) return false;",
              explanation: "Validates available inventory against current active reservations.",
            },
            {
              code: "cc->stock--;",
              explanation: "Commits inventory deduction upon payment confirmation.",
            },
          ],
        },
      ],
      simulationNote:
        "Simulates in-memory reservation holds. Real platforms combine Redis TTL keys with database row versioning.",
    },
    practice: [
      {
        level: "Understand",
        title: "Trace Reservation",
        brief: "Trace stock when 2 carts reserve an item with initial stock of 1.",
      },
      {
        level: "Modify",
        title: "Extend Hold Window",
        brief: "Add an API to extend a user's reservation window by 3 minutes.",
      },
      {
        level: "Build",
        title: "Multi-Item Cart",
        brief: "Support reserving lists of SKU items with atomic all-or-nothing hold.",
      },
      {
        level: "Think",
        title: "Flash Sale Thundering Herd",
        brief:
          "How would you handle 10,000 reservation requests arriving in the exact same second?",
      },
    ],
    reflection: [
      "Why is a soft reservation superior to either immediate decrement or checkout-time check?",
      "What happens if payment succeeds after the reservation timer has already expired?",
    ],
    techNotes: [
      {
        name: "Redis Key Expiration",
        kind: "Pattern",
        note: "Modern architectures use Redis SET NX EX to atomically create temporary item locks with automated expiration.",
      },
    ],
    codeLab: {
      title: "Cart Reservation Validator",
      brief:
        "Write a function process_reservation(stock, active_holds, cart_id, is_checkout, now, expiry). If checking out: return [True, stock - 1, 'CHECKOUT_SUCCESS'] if now < expiry, else [False, stock, 'HOLD_EXPIRED']. If reserving: return [True, active_holds + 1, 'RESERVED'] if stock > active_holds, else [False, active_holds, 'OUT_OF_STOCK'].",
      functionName: "process_reservation",
      signature:
        "def process_reservation(stock: int, active_holds: int, cart_id: str, is_checkout: bool, now: int, expiry: int) -> tuple:",
      starterCode: `def process_reservation(stock, active_holds, cart_id, is_checkout, now, expiry):
    # 1. If is_checkout: check now < expiry
    # 2. If reserving: check stock > active_holds
    pass
`,
      javaSignature:
        "public static Object[] processReservation(int stock, int activeHolds, String cartId, boolean isCheckout, int now, int expiry)",
      javaStarterCode: `public class Solution {
    public static Object[] processReservation(int stock, int activeHolds, String cartId, boolean isCheckout, int now, int expiry) {
        if (isCheckout) {
            if (now < expiry) return new Object[]{true, stock - 1, "CHECKOUT_SUCCESS"};
            return new Object[]{false, stock, "HOLD_EXPIRED"};
        }
        if (stock > activeHolds) return new Object[]{true, activeHolds + 1, "RESERVED"};
        return new Object[]{false, activeHolds, "OUT_OF_STOCK"};
    }
}
`,
      cSignature:
        "bool process_reservation(int stock, int active_holds, const char *cart_id, bool is_checkout, int now, int expiry, int *out_val, char *msg)",
      cStarterCode: `// Cart reservation validator in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool process_reservation(int stock, int active_holds, const char *cart_id, bool is_checkout, int now, int expiry, int *out_val, char *msg) {
    if (is_checkout) {
        if (now < expiry) {
            *out_val = stock - 1;
            strcpy(msg, "CHECKOUT_SUCCESS");
            return true;
        }
        *out_val = stock;
        strcpy(msg, "HOLD_EXPIRED");
        return false;
    }
    if (stock > active_holds) {
        *out_val = active_holds + 1;
        strcpy(msg, "RESERVED");
        return true;
    }
    *out_val = active_holds;
    strcpy(msg, "OUT_OF_STOCK");
    return false;
}
`,
      hints: [
        "Handle checkout path first by comparing now vs expiry.",
        "Handle reservation path by checking if available capacity (stock - active_holds) > 0.",
      ],
      tests: [
        {
          name: "Successful hold",
          args: [5, 2, "c1", false, 100, 0],
          expected: [true, 3, "RESERVED"],
        },
        {
          name: "Out of stock hold",
          args: [2, 2, "c2", false, 100, 0],
          expected: [false, 2, "OUT_OF_STOCK"],
        },
        {
          name: "Valid checkout",
          args: [5, 2, "c1", true, 150, 200],
          expected: [true, 4, "CHECKOUT_SUCCESS"],
        },
        {
          name: "Expired checkout",
          args: [5, 2, "c1", true, 250, 200],
          expected: [false, 5, "HOLD_EXPIRED"],
        },
      ],
      explanationPrompt:
        "Explain why checking `now < expiry` on checkout is critical to prevent fulfilling orders whose inventory may have already been released to someone else.",
      mermaid: `graph TD
    A[Request] --> B{Is Checkout?}
    B -- Yes --> C{Now < Expiry?}
    C -- Yes --> D[Deduct Stock -> CHECKOUT_SUCCESS]
    C -- No --> E[Reject -> HOLD_EXPIRED]
    B -- No --> F{Stock > Holds?}
    F -- Yes --> G[Add Hold -> RESERVED]
    F -- No --> H[Reject -> OUT_OF_STOCK]`,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Case 22: Real-Time Chat & WebSockets
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cs-realtime-chat-websocket-022",
    slug: "realtime-chat-websocket",
    index: "22",
    title: "How Does a Real-Time Chat App Deliver Messages Instantly?",
    shortTitle: "Real-Time Chat",
    category: "Realtime & Communication",
    subcategory: "Full-Duplex WebSockets",
    difficulty: "Intermediate",
    learnerLevel: "Builder",
    estimatedTime: "50-65 minutes",
    minutes: 55,
    status: "published",
    tier: "premium",
    rcCost: 50,
    summary:
      "Unlike HTTP where the client must repeatedly ask 'any new messages?', WebSockets keep a single persistent TCP connection open so the server can push messages instantly. Discover bidirectional socket communication, connection registries, and room broadcasts.",
    learningObjectives: [
      "Compare HTTP polling vs persistent WebSocket connections for real-time delivery.",
      "Understand socket handshake upgrading from HTTP to ws://.",
      "Implement a room-based message fanout broadcaster.",
    ],
    prerequisites: [
      "Client-Server model",
      "HTTP headers and status codes",
      "Event loops / callbacks",
    ],
    engineeringConcepts: [
      "Full-Duplex Communication",
      "WebSocket Handshake",
      "Connection Registry",
      "Fan-out Broadcasting",
    ],
    technologies: ["WebSockets", "Networking", "Python", "Java", "C"],
    tech: ["ws://", "Handshake", "Room Registry"],
    tags: ["chat", "realtime", "websocket", "fanout"],
    glossary: [
      {
        term: "Full-Duplex",
        plainDefinition:
          "Both sides can send and receive messages simultaneously over the same wire.",
      },
      {
        term: "Connection Registry",
        plainDefinition: "In-memory mapping of active connected client sockets by room or user ID.",
      },
    ],
    primers: [
      {
        concept: "Why HTTP Polling Burns Servers",
        minutes: 4,
        definition:
          "Polling asks 'Got data?' every second. 99% of responses are empty 304s, wasting CPU and battery.",
        whyNeeded:
          "WebSockets open once and stay idle with zero bandwidth overhead until an actual message arrives.",
        analogy:
          "Calling your friend every 10 seconds to ask if they called you, vs picking up an open telephone line.",
        tinyExample: "ws = new WebSocket('wss://chat.kruzz.app/room/1')",
      },
    ],
    discover: {
      situation: "Messaging apps require instant message receipt without 2-second polling delays.",
      humanFlow: [
        "Alice types 'Hello'",
        "Alice clicks send",
        "Bob's screen displays 'Hello' in 20ms",
      ],
      question:
        "How can a server push data to a client when HTTP is designed as a client-pull protocol?",
      whyItExists: [
        "Low-latency collaboration",
        "Elimination of wasteful polling headers",
        "Bidirectional streaming",
      ],
    },
    understand: {
      overview:
        "WebSockets start as an HTTP request with an 'Upgrade: websocket' header. Once the server accepts, the socket switches to a persistent framing protocol where either party can push bytes anytime.",
      components: [
        {
          name: "Socket Connection",
          whatIsIt: "Open TCP tunnel",
          whyItExists: "Enables instant bidirectional byte stream",
          whatItDoes: "Carries text frames",
        },
        {
          name: "Room Broadcaster",
          whatIsIt: "Registry of active sockets",
          whyItExists: "Knows who should receive a message",
          whatItDoes: "Fans out message to members",
        },
      ],
      analogy: {
        title: "Walkie-Talkie Channel",
        everyday: [
          "Everyone tunes to channel 4.",
          "When you hold the button and speak, everyone listening on channel 4 hears it instantly.",
        ],
        technical: [
          "Channel 4 is the room ID.",
          "Walkie-talkie speaker is the open WebSocket handle.",
          "Talking is fan-out broadcast.",
        ],
      },
      flow: [
        "Client initiates HTTP upgrade",
        "Server verifies and responds with 101 Switching Protocols",
        "Client joins room",
        "Publisher sends message",
        "Server fans out to all sockets in room",
      ],
    },
    concepts: [
      {
        id: "connection-registry",
        name: "Connection Registry",
        difficulty: "Intermediate",
        simpleDefinition: "A dictionary tracking active open sockets by room.",
        whyItExists: "The server must know which sockets are alive to send messages.",
        realWorldAnalogy:
          "An attendance roll-sheet of who is currently sitting in the conference room.",
        technicalExplanation:
          "Maps `room_id -> Set[Socket]`. When a client disconnects, its socket is pruned.",
        caseApplication: "Used to iterate and broadcast incoming chat messages.",
        commonMistakes: ["Failing to clean up disconnected sockets causing memory leaks."],
        practice: ["Write a disconnect handler that removes dead socket IDs from a room."],
      },
    ],
    architecture: {
      caption: "WebSocket persistent connection and message fanout",
      levels: [
        {
          title: "Message Fanout",
          description: "One client sends, server broadcasts to all connected peer sockets",
          mermaid: `graph TD
    Alice[Client Alice] -->|Send message| Srv[Chat Server]
    Srv -->|Push frame| Bob[Client Bob]
    Srv -->|Push frame| Charlie[Client Charlie]`,
        },
      ],
    },
    decisions: [
      {
        title: "WebSockets vs Long-Polling",
        what: "Persistent WebSocket connection",
        why: "Sub-50ms latency with minimal header overhead",
        problemSolved: "Eliminates redundant HTTP request/response headers on every chat message",
        withoutIt: "Servers waste thousands of requests per minute per user on empty polls",
        alternatives: ["HTTP Long-Polling", "Server-Sent Events (SSE - unidirectional only)"],
        tradeoff: "Stateful server connections require sticky sessions or pub/sub backplanes",
      },
    ],
    implementation: {
      behaviour:
        "Maintains rooms and broadcasts messages to all joined participants except the sender.",
      algorithm: [
        "1. Store room memberships as room_id -> set of client_ids.",
        "2. When message arrives, find all client_ids in the specified room.",
        "3. Broadcast message to all recipients except the sender.",
      ],
      ladder: [
        {
          level: "LEVEL 0",
          title: "Single Client Echo",
          detail: "Server reflects message back to same socket.",
        },
        {
          level: "LEVEL 1",
          title: "Global Broadcast",
          detail: "Sends message to all connected clients.",
        },
        {
          level: "LEVEL 2",
          title: "Room-Based Fanout",
          detail: "Scopes delivery to matching room channel.",
        },
      ],
      samples: [
        {
          language: "python",
          filename: "chat_server.py",
          code: `class ChatRoomManager:
    def __init__(self):
        self.rooms = {} # room_id -> set of client_ids

    def join_room(self, room_id: str, client_id: str):
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(client_id)

    def leave_room(self, room_id: str, client_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].discard(client_id)

    def broadcast(self, room_id: str, sender_id: str, message: str) -> list[str]:
        if room_id not in self.rooms:
            return []
        recipients = [cid for cid in self.rooms[room_id] if cid != sender_id]
        return recipients`,
          explanations: [
            {
              code: "self.rooms[room_id].add(client_id)",
              explanation: "Registers client socket ID into the room channel.",
            },
            {
              code: "recipients = [cid for cid in self.rooms[room_id] if cid != sender_id]",
              explanation:
                "Filters out the sender so they do not receive an echo of their own message.",
            },
          ],
        },
        {
          language: "java",
          filename: "ChatRoomManager.java",
          code: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ChatRoomManager {
    private final Map<String, Set<String>> rooms = new HashMap<>();

    public synchronized void joinRoom(String roomId, String clientId) {
        rooms.computeIfAbsent(roomId, k -> new HashSet<>()).add(clientId);
    }

    public synchronized void leaveRoom(String roomId, String clientId) {
        if (rooms.containsKey(roomId)) {
            rooms.get(roomId).remove(clientId);
        }
    }

    public synchronized List<String> broadcast(String roomId, String senderId) {
        List<String> recipients = new ArrayList<>();
        if (!rooms.containsKey(roomId)) return recipients;
        for (String cid : rooms.get(roomId)) {
            if (!cid.equals(senderId)) recipients.add(cid);
        }
        return recipients;
    }
}`,
          explanations: [
            {
              code: "rooms.computeIfAbsent(roomId, k -> new HashSet<>()).add(clientId);",
              explanation: "Creates room bucket lazily and tracks client ID.",
            },
            {
              code: "if (!cid.equals(senderId)) recipients.add(cid);",
              explanation: "Calculates recipient targets for fan-out dispatch.",
            },
          ],
        },
        {
          language: "c",
          filename: "chat_server.c",
          code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_MEMBERS 32
#define MAX_ROOM_NAME 32

typedef struct {
    char room_id[MAX_ROOM_NAME];
    char members[MAX_MEMBERS][32];
    int member_count;
} ChatRoom;

void init_room(ChatRoom *r, const char *room_id) {
    strncpy(r->room_id, room_id, MAX_ROOM_NAME - 1);
    r->member_count = 0;
}

bool join_room(ChatRoom *r, const char *client_id) {
    for (int i = 0; i < r->member_count; i++) {
        if (strcmp(r->members[i], client_id) == 0) return true;
    }
    if (r->member_count >= MAX_MEMBERS) return false;
    strncpy(r->members[r->member_count], client_id, 31);
    r->member_count++;
    return true;
}

int broadcast(const ChatRoom *r, const char *sender_id, char recipients[][32]) {
    int count = 0;
    for (int i = 0; i < r->member_count; i++) {
        if (strcmp(r->members[i], sender_id) != 0) {
            strncpy(recipients[count], r->members[i], 31);
            count++;
        }
    }
    return count;
}`,
          explanations: [
            {
              code: "if (strcmp(r->members[i], sender_id) != 0)",
              explanation: "Collects all peers in the room excluding the author.",
            },
          ],
        },
      ],
      simulationNote:
        "Models room subscription and fanout targets. Production chat servers wire this to socket file descriptors via Redis Pub/Sub.",
    },
    practice: [
      {
        level: "Understand",
        title: "Trace Handshake",
        brief: "List the 3 key HTTP headers required to upgrade to a WebSocket.",
      },
      {
        level: "Modify",
        title: "Add Direct Messages",
        brief: "Modify broadcaster to support sending to a single recipient.",
      },
      {
        level: "Build",
        title: "Typing Indicator",
        brief: "Implement a lightweight ephemeral event for user typing notifications.",
      },
      {
        level: "Think",
        title: "Horizontal Scale",
        brief: "If Alice and Bob are connected to two different web servers, how do they talk?",
      },
    ],
    reflection: [
      "Why does a persistent TCP connection fundamentally outperform polling for low-latency messaging?",
      "How do distributed chat systems handle delivering messages when users are connected across 100 different machines?",
    ],
    techNotes: [
      {
        name: "Redis Pub/Sub",
        kind: "Backplane",
        note: "When chat servers scale horizontally, Redis pub/sub bridges messages between disparate server instances.",
      },
    ],
    codeLab: {
      title: "Chat Fanout Engine",
      brief:
        "Write a function get_broadcast_recipients(members, sender_id). Return array of member IDs who should receive the message (all members except sender_id). If sender is not in members or members is empty, return empty array.",
      functionName: "get_broadcast_recipients",
      signature: "def get_broadcast_recipients(members: list, sender_id: str) -> list:",
      starterCode: `def get_broadcast_recipients(members, sender_id):
    # Return all members excluding sender_id
    pass
`,
      javaSignature:
        "public static String[] getBroadcastRecipients(String[] members, String senderId)",
      javaStarterCode: `import java.util.ArrayList;
import java.util.List;

public class Solution {
    public static String[] getBroadcastRecipients(String[] members, String senderId) {
        boolean found = false;
        for (String m : members) if (m.equals(senderId)) found = true;
        if (!found) return new String[0];

        List<String> result = new ArrayList<>();
        for (String m : members) {
            if (!m.equals(senderId)) result.add(m);
        }
        return result.toArray(new String[0]);
    }
}
`,
      cSignature:
        "int get_broadcast_recipients(const char *members[], int count, const char *sender_id, char out[][32])",
      cStarterCode: `// Chat fanout engine in C
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

int get_broadcast_recipients(const char *members[], int count, const char *sender_id, char out[][32]) {
    bool found = false;
    for (int i = 0; i < count; i++) {
        if (strcmp(members[i], sender_id) == 0) found = true;
    }
    if (!found) return 0;

    int matched = 0;
    for (int i = 0; i < count; i++) {
        if (strcmp(members[i], sender_id) != 0) {
            strncpy(out[matched], members[i], 31);
            matched++;
        }
    }
    return matched;
}
`,
      hints: [
        "Verify sender_id exists in members first.",
        "Filter out sender_id so clients do not receive their own echoes.",
      ],
      tests: [
        {
          name: "3 members broadcast",
          args: [["alice", "bob", "charlie"], "alice"],
          expected: ["bob", "charlie"],
        },
        { name: "Sender not in room", args: [["alice", "bob"], "dave"], expected: [] },
        { name: "Single member room", args: [["alice"], "alice"], expected: [] },
      ],
      explanationPrompt:
        "Explain why the message sender is excluded from the fanout recipient list in chat architectures.",
      mermaid: `graph LR
    A[Sender: Alice] --> B{In room?}
    B -- No --> C[Return Empty]
    B -- Yes --> D[Filter out Alice]
    D --> E[Deliver to Bob, Charlie]`,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Case 23: Push Notifications Service
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cs-push-notification-service-023",
    slug: "push-notification-service",
    index: "23",
    title: "How Does a Push Notification Service Reach Millions of Mobile Devices?",
    shortTitle: "Push Notifications",
    category: "Realtime & Communication",
    subcategory: "Device Token Routing",
    difficulty: "Intermediate",
    learnerLevel: "Builder",
    estimatedTime: "45-60 minutes",
    minutes: 50,
    status: "published",
    tier: "premium",
    rcCost: 50,
    summary:
      "When your phone is locked and apps are closed, how does a breaking news notification appear on your lock screen in seconds? Learn how device tokens, gateway providers (APNs / FCM), and payload queues coordinate background delivery.",
    learningObjectives: [
      "Understand the role of OS gateway providers (Apple APNs / Google FCM).",
      "Trace device token registration from mobile device to backend registry.",
      "Implement payload batching and invalid token pruning.",
    ],
    prerequisites: ["REST APIs", "Tokens & Unique IDs", "Queue fundamentals"],
    engineeringConcepts: [
      "Device Tokens",
      "Gateway Delivery",
      "Token Invalidation",
      "Payload Batching",
    ],
    technologies: ["APNs", "FCM", "Python", "Java", "C"],
    tech: ["Device Tokens", "Gateway Dispatch", "Invalidation"],
    tags: ["notifications", "push", "mobile", "fcm"],
    glossary: [
      {
        term: "Device Token",
        plainDefinition:
          "A cryptographic address assigned by iOS/Android representing a specific app installation on a device.",
      },
      {
        term: "Gateway Provider",
        plainDefinition:
          "Operating system cloud infrastructure (APNs/FCM) holding the persistent radio connection to phones.",
      },
    ],
    primers: [
      {
        concept: "Why Apps Can't Stay Open In The Background",
        minutes: 4,
        definition:
          "Mobile operating systems kill idle background apps to save battery. The OS maintains only ONE shared connection for all apps.",
        whyNeeded:
          "Instead of 50 apps holding 50 open connections, Apple and Google run one shared tunnel for push packets.",
        analogy:
          "One postal delivery person visiting an apartment building rather than 50 separate couriers for each tenant.",
        tinyExample: "fcm_gateway.send(token, payload)",
      },
    ],
    discover: {
      situation:
        "Users need timely alerts (messages, ride arrivals, alerts) even when their phones are locked.",
      humanFlow: [
        "Driver arrives",
        "Backend dispatches push",
        "Lock screen displays notification banner in 1 second",
      ],
      question: "How do servers reach a phone that has closed the app and turned its screen off?",
      whyItExists: [
        "Zero battery drain for background apps",
        "Unified OS delivery pipeline",
        "Reliable delivery guarantees",
      ],
    },
    understand: {
      overview:
        "When an app installs, the mobile OS grants it a device token. The backend registers this token. To send an alert, the backend sends the payload to APNs/FCM, which delivers it over the phone's single persistent system socket.",
      components: [
        {
          name: "Token Registry",
          whatIsIt: "Database of user -> device token mappings",
          whyItExists: "Knows which phone belongs to whom",
          whatItDoes: "Stores active tokens",
        },
        {
          name: "Gateway Dispatcher",
          whatIsIt: "HTTP/2 client communicating with Apple/Google",
          whyItExists: "Transfers alerts to mobile OS clouds",
          whatItDoes: "Sends batches",
        },
      ],
      analogy: {
        title: "The Building Mailroom",
        everyday: [
          "You register your apartment number.",
          "Packages go to the front desk.",
          "Front desk rings your buzzer.",
        ],
        technical: [
          "Apartment number is Device Token.",
          "Front desk is FCM / APNs.",
          "Buzzer is the lock-screen banner.",
        ],
      },
      flow: [
        "Device sends token to backend",
        "Backend stores token",
        "Event occurs",
        "Backend dispatches payload to APNs/FCM",
        "Phone receives packet and wakes banner",
      ],
    },
    concepts: [
      {
        id: "token-invalidation",
        name: "Token Invalidation",
        difficulty: "Intermediate",
        simpleDefinition: "Removing tokens when a user uninstalls the app.",
        whyItExists: "Prevents wasting network requests on devices that no longer have the app.",
        realWorldAnalogy: "Marking mail 'Return to Sender - Address Unknown'.",
        technicalExplanation:
          "Gateways return HTTP 410 Gone or Unregistered errors; backends must delete invalid tokens.",
        caseApplication: "Prunes inactive tokens from the user's notification list.",
        commonMistakes: [
          "Repeatedly hammering gateway APIs with dead tokens, resulting in rate limits.",
        ],
        practice: ["Filter out tokens marked invalid by gateway responses."],
      },
    ],
    architecture: {
      caption: "Push notification routing from backend through OS gateway to mobile device",
      levels: [
        {
          title: "Gateway Architecture",
          description: "Backend -> FCM/APNs -> Mobile OS -> App Banner",
          mermaid: `graph LR
    Backend[App Backend] -->|HTTP/2 Payload| Gateway[APNs / FCM Gateway]
    Gateway -->|System Socket| OS[Mobile OS]
    OS -->|Render Banner| Screen[Lock Screen UI]`,
        },
      ],
    },
    decisions: [
      {
        title: "APNs/FCM Gateway vs Custom Sockets",
        what: "Use OS-native push gateways",
        why: "Preserves mobile battery and works when screen is locked",
        problemSolved: "Apps cannot hold custom background connections without killing battery",
        withoutIt: "Phone battery would drain in 3 hours with 30 apps holding TCP connections",
        alternatives: ["Background polling (banned by OS stores)", "SMS alerts (expensive)"],
        tradeoff: "Payload size is restricted (typically 4KB max)",
      },
    ],
    implementation: {
      behaviour:
        "Dispatches push alerts to registered tokens and handles uninstalled token feedback.",
      algorithm: [
        "1. Store mapping of user_id -> list of device tokens.",
        "2. When dispatching alert, collect all active tokens for target user.",
        "3. Prune tokens reported invalid or expired by gateway feedback.",
      ],
      ladder: [
        {
          level: "LEVEL 0",
          title: "Single Token Delivery",
          detail: "Direct dispatch to one device.",
        },
        {
          level: "LEVEL 1",
          title: "Multi-Device Registry",
          detail: "Fans out to user's phone + tablet.",
        },
        {
          level: "LEVEL 2",
          title: "Invalidation Pruning",
          detail: "Cleans up uninstalled device tokens.",
        },
      ],
      samples: [
        {
          language: "python",
          filename: "push_service.py",
          code: `class PushNotificationRouter:
    def __init__(self):
        self.user_tokens = {} # user_id -> set of tokens

    def register_device(self, user_id: str, token: str):
        if user_id not in self.user_tokens:
            self.user_tokens[user_id] = set()
        self.user_tokens[user_id].add(token)

    def dispatch(self, user_id: str, invalid_tokens: set = None) -> list[str]:
        if user_id not in self.user_tokens:
            return []
        if invalid_tokens:
            self.user_tokens[user_id] -= invalid_tokens
        return list(self.user_tokens[user_id])`,
          explanations: [
            {
              code: "self.user_tokens[user_id].add(token)",
              explanation: "Associates physical device installation token with user account.",
            },
            {
              code: "self.user_tokens[user_id] -= invalid_tokens",
              explanation: "Prunes dead or uninstalled device tokens based on gateway feedback.",
            },
          ],
        },
        {
          language: "java",
          filename: "PushNotificationRouter.java",
          code: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class PushNotificationRouter {
    private final Map<String, Set<String>> userTokens = new HashMap<>();

    public synchronized void registerDevice(String userId, String token) {
        userTokens.computeIfAbsent(userId, k -> new HashSet<>()).add(token);
    }

    public synchronized List<String> dispatch(String userId, Set<String> invalidTokens) {
        if (!userTokens.containsKey(userId)) return new ArrayList<>();
        Set<String> tokens = userTokens.get(userId);
        if (invalidTokens != null) {
            tokens.removeAll(invalidTokens);
        }
        return new ArrayList<>(tokens);
    }
}`,
          explanations: [
            {
              code: "tokens.removeAll(invalidTokens);",
              explanation: "Cleans up expired device tokens returned by APNs/FCM.",
            },
          ],
        },
        {
          language: "c",
          filename: "push_service.c",
          code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_TOKENS 16

typedef struct {
    char user_id[32];
    char tokens[MAX_TOKENS][64];
    int token_count;
} UserDevices;

void init_user(UserDevices *u, const char *user_id) {
    strncpy(u->user_id, user_id, 31);
    u->token_count = 0;
}

bool register_token(UserDevices *u, const char *token) {
    if (u->token_count >= MAX_TOKENS) return false;
    strncpy(u->tokens[u->token_count], token, 63);
    u->token_count++;
    return true;
}

int filter_active_tokens(UserDevices *u, const char *invalid_token, char valid_out[][64]) {
    int valid_count = 0;
    for (int i = 0; i < u->token_count; i++) {
        if (strcmp(u->tokens[i], invalid_token) != 0) {
            strncpy(valid_out[valid_count], u->tokens[i], 63);
            valid_count++;
        }
    }
    return valid_count;
}`,
          explanations: [
            {
              code: "if (strcmp(u->tokens[i], invalid_token) != 0)",
              explanation: "Filters out inactive device tokens before batch transmission.",
            },
          ],
        },
      ],
      simulationNote: "Models device token registration and invalidation pruning.",
    },
    practice: [
      {
        level: "Understand",
        title: "Trace APNs Token",
        brief: "Why does an app receive a new token when restored from an iCloud backup?",
      },
      {
        level: "Modify",
        title: "Badge Counter",
        brief: "Add badge number calculation to the notification payload.",
      },
      {
        level: "Build",
        title: "Batching Pipeline",
        brief: "Group 500 tokens into chunks of 100 for gateway API compliance.",
      },
      {
        level: "Think",
        title: "Silent Push vs Alert",
        brief: "What is the difference between a silent data push and an alert banner?",
      },
    ],
    reflection: [
      "Why must push notification delivery rely on operating system gateways rather than direct server-to-app connections?",
      "How does token invalidation protect backend services from wasting network bandwidth?",
    ],
    techNotes: [
      {
        name: "HTTP/2 Multiplexing",
        kind: "Transport",
        note: "APNs uses HTTP/2 multiplexed streams so a single backend TCP socket can transmit thousands of push frames per second.",
      },
    ],
    codeLab: {
      title: "Push Token Dispatcher",
      brief:
        "Write a function get_valid_push_tokens(tokens, invalid_token). Return list of tokens excluding the invalid_token. If tokens is empty or all are invalid, return empty list.",
      functionName: "get_valid_push_tokens",
      signature: "def get_valid_push_tokens(tokens: list, invalid_token: str) -> list:",
      starterCode: `def get_valid_push_tokens(tokens, invalid_token):
    # Filter out invalid_token from tokens
    pass
`,
      javaSignature:
        "public static String[] getValidPushTokens(String[] tokens, String invalidToken)",
      javaStarterCode: `import java.util.ArrayList;
import java.util.List;

public class Solution {
    public static String[] getValidPushTokens(String[] tokens, String invalidToken) {
        List<String> res = new ArrayList<>();
        for (String t : tokens) {
            if (!t.equals(invalidToken)) res.add(t);
        }
        return res.toArray(new String[0]);
    }
}
`,
      cSignature:
        "int get_valid_push_tokens(const char *tokens[], int count, const char *invalid_token, char out[][64])",
      cStarterCode: `// Push token filter in C
#include <stdio.h>
#include <string.h>

int get_valid_push_tokens(const char *tokens[], int count, const char *invalid_token, char out[][64]) {
    int valid = 0;
    for (int i = 0; i < count; i++) {
        if (strcmp(tokens[i], invalid_token) != 0) {
            strncpy(out[valid], tokens[i], 63);
            valid++;
        }
    }
    return valid;
}
`,
      hints: [
        "Filter out any token matching invalid_token.",
        "Return empty array if no valid tokens remain.",
      ],
      tests: [
        {
          name: "Filter one invalid",
          args: [["tok_a", "tok_b", "tok_c"], "tok_b"],
          expected: ["tok_a", "tok_c"],
        },
        {
          name: "No invalid match",
          args: [["tok_a", "tok_b"], "tok_z"],
          expected: ["tok_a", "tok_b"],
        },
        { name: "All invalid", args: [["tok_bad"], "tok_bad"], expected: [] },
      ],
      explanationPrompt:
        "Explain how gateway feedback informs the backend when a user uninstalls an app to avoid ghost notification traffic.",
      mermaid: `graph LR
    A[Tokens: A, B, C] --> B{Token == Invalid?}
    B -- Yes --> C[Prune Token B]
    B -- No --> D[Keep Tokens A, C]`,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Case 24: Gaming Live Leaderboard
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cs-gaming-live-leaderboard-024",
    slug: "gaming-live-leaderboard",
    index: "24",
    title: "How Does a Gaming Leaderboard Rank 10 Million Players in Real Time?",
    shortTitle: "Live Leaderboard",
    category: "Realtime & Communication",
    subcategory: "Rank Sorting & Sorted Sets",
    difficulty: "Intermediate",
    learnerLevel: "Builder",
    estimatedTime: "50-65 minutes",
    minutes: 55,
    status: "published",
    tier: "premium",
    rcCost: 50,
    summary:
      "When 50,000 game scores arrive every second, executing SQL `ORDER BY score DESC LIMIT 10` takes 4 seconds and crashes the database. Discover how Skip Lists and Redis Sorted Sets maintain sub-millisecond real-time ranks across millions of competitors.",
    learningObjectives: [
      "Understand why relational sorting fails at high-frequency write velocity.",
      "Explore logarithmic rank lookup using sorted sets (ZSETs).",
      "Implement top-K score aggregation with rank positioning.",
    ],
    prerequisites: ["Binary Search", "Hash Tables", "Time Complexity O(log N)"],
    engineeringConcepts: ["Sorted Sets", "Skip Lists", "Top-K Queries", "Rank Calculation"],
    technologies: ["Redis", "Skip Lists", "Python", "Java", "C"],
    tech: ["ZADD", "ZRANK", "Sorted Sets"],
    tags: ["gaming", "leaderboard", "redis", "skip-list"],
    glossary: [
      {
        term: "Sorted Set",
        plainDefinition:
          "A collection of unique members ordered by a floating-point score, providing O(log N) insertion and lookup.",
      },
      {
        term: "Skip List",
        plainDefinition:
          "A probabilistic linked list with multiple tiers of pointers enabling binary-search speed on linked elements.",
      },
    ],
    primers: [
      {
        concept: "Why Relational ORDER BY Crumbles Under Gaming Scale",
        minutes: 4,
        definition:
          "A database table with 10M rows must re-sort or rebuild an index on every score update, creating catastrophic disk lock contention.",
        whyNeeded:
          "In-memory skip lists update player positions in O(log N) (~23 CPU operations for 10M players).",
        analogy:
          "An express elevator stopping only at every 10th floor to skip directly to your target tier.",
        tinyExample: "ZADD leaderboard 4500 player_789",
      },
    ],
    discover: {
      situation:
        "Players finish battle royale matches and expect to see their global rank change instantly.",
      humanFlow: [
        "Match ends",
        "Score reported: +150 pts",
        "Player views global rank: #4,129 (up 312 positions)",
      ],
      question:
        "How can a system compute the exact rank of any player among 10 million contenders in under 2 milliseconds?",
      whyItExists: [
        "Instant player dopamine feedback",
        "Competitive ranking tiers",
        "Cheater-resistant score ingestion",
      ],
    },
    understand: {
      overview:
        "Leaderboard engines maintain players inside an in-memory sorted set. Adding or updating a score takes O(log N) time. Querying the Top 10 or finding an arbitrary player's rank takes O(log N) time.",
      components: [
        {
          name: "Score Index",
          whatIsIt: "Skip-list sorted data structure",
          whyItExists: "Keeps elements sorted as they are written",
          whatItDoes: "Answers rank and range queries",
        },
        {
          name: "Player Table",
          whatIsIt: "Hash map of player_id -> score",
          whyItExists: "Enables O(1) player score lookups",
          whatItDoes: "Holds current score values",
        },
      ],
      analogy: {
        title: "Marathon Finish Line Board",
        everyday: [
          "Runners cross the line.",
          "Their chip updates the digital board.",
          "The board shows both the Top 10 runners and where your friend finished.",
        ],
        technical: [
          "Chip signal is score write.",
          "Board is the sorted set.",
          "Friend's rank is ZREVRANK lookup.",
        ],
      },
      flow: [
        "Receive score update",
        "Update score in hash table",
        "Re-position player in sorted set",
        "Return updated rank to player",
      ],
    },
    concepts: [
      {
        id: "sorted-sets",
        name: "Sorted Sets (ZSET)",
        difficulty: "Intermediate",
        simpleDefinition:
          "A data structure combining a hash table (O(1) lookup) with a skip list (O(log N) ordered traversal).",
        whyItExists: "Provides instant top-K reads and individual rank lookups.",
        realWorldAnalogy:
          "An alphabetical phone book that also has page bookmarks for every score tier.",
        technicalExplanation:
          "Maintains unique member keys with ordered score values. Supports range extraction in O(log N + M).",
        caseApplication: "Used to store player gaming scores and compute global standings.",
        commonMistakes: [
          "Querying an unindexed SQL database with ORDER BY for live gaming leaderboards.",
        ],
        practice: [
          "Calculate the number of operations required to insert into a 1-million node skip list.",
        ],
      },
    ],
    architecture: {
      caption: "High-throughput leaderboard ranking pipeline",
      levels: [
        {
          title: "In-Memory Sorted Set",
          description: "Incoming scores update the skip list in O(log N) time",
          mermaid: `graph TD
    Score[Score Update: Player 42 = 850] --> ZSET[Redis Sorted Set / Skip List]
    ZSET -->|O log N| Rank[Computed Rank: #3]
    ZSET -->|Range 0..9| Top10[Global Top 10 Dashboard]`,
        },
      ],
    },
    decisions: [
      {
        title: "In-Memory Skip List vs SQL B-Tree",
        what: "In-memory sorted set data structure",
        why: "Supports 100,000 writes/sec with sub-millisecond rank lookups",
        problemSolved: "Relational database lock contention and slow full-table re-sorting",
        withoutIt: "Leaderboard updates would lag by 30+ seconds or crash under gaming surges",
        alternatives: [
          "Periodic batch cron jobs (not real time)",
          "Redis ZSET (industry standard)",
        ],
        tradeoff: "Data must fit in RAM; requires snapshotting to disk for durability",
      },
    ],
    implementation: {
      behaviour: "Maintains player scores, computes exact rank, and extracts top-K leaderboards.",
      algorithm: [
        "1. Store scores in hash table: player_id -> score.",
        "2. To get rank: count how many players have a higher score + 1.",
        "3. To get top-K: sort players by score descending and take first K elements.",
      ],
      ladder: [
        { level: "LEVEL 0", title: "Array Sort", detail: "Full array sort on every query." },
        {
          level: "LEVEL 1",
          title: "Hash + Linear Rank",
          detail: "O(1) lookup with linear rank count.",
        },
        {
          level: "LEVEL 2",
          title: "Top-K Range Extraction",
          detail: "Fast bounded extraction of leading players.",
        },
      ],
      samples: [
        {
          language: "python",
          filename: "leaderboard.py",
          code: `class LiveLeaderboard:
    def __init__(self):
        self.scores = {} # player_id -> score

    def update_score(self, player_id: str, score: int):
        self.scores[player_id] = score

    def get_rank(self, player_id: str) -> int:
        if player_id not in self.scores:
            return -1
        my_score = self.scores[player_id]
        higher = sum(1 for s in self.scores.values() if s > my_score)
        return higher + 1

    def get_top_k(self, k: int) -> list[tuple[str, int]]:
        sorted_players = sorted(self.scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_players[:k]`,
          explanations: [
            {
              code: "higher = sum(1 for s in self.scores.values() if s > my_score)",
              explanation:
                "Computes 1-based rank by counting players with strictly greater scores.",
            },
            {
              code: "return sorted_players[:k]",
              explanation: "Extracts top-K winners for the leaderboard display.",
            },
          ],
        },
        {
          language: "java",
          filename: "LiveLeaderboard.java",
          code: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LiveLeaderboard {
    private final Map<String, Integer> scores = new HashMap<>();

    public synchronized void updateScore(String playerId, int score) {
        scores.put(playerId, score);
    }

    public synchronized int getRank(String playerId) {
        if (!scores.containsKey(playerId)) return -1;
        int myScore = scores.get(playerId);
        int higher = 0;
        for (int s : scores.values()) {
            if (s > myScore) higher++;
        }
        return higher + 1;
    }

    public synchronized List<Map.Entry<String, Integer>> getTopK(int k) {
        List<Map.Entry<String, Integer>> list = new ArrayList<>(scores.entrySet());
        list.sort((a, b) -> b.getValue().compareTo(a.getValue()));
        return list.subList(0, Math.min(k, list.size()));
    }
}`,
          explanations: [
            {
              code: "for (int s : scores.values()) if (s > myScore) higher++;",
              explanation: "Calculates player rank position.",
            },
          ],
        },
        {
          language: "c",
          filename: "leaderboard.c",
          code: `#include <stdio.h>
#include <string.h>

#define MAX_PLAYERS 64

typedef struct {
    char player_id[32];
    int score;
} PlayerScore;

typedef struct {
    PlayerScore players[MAX_PLAYERS];
    int count;
} Leaderboard;

void init_board(Leaderboard *lb) { lb->count = 0; }

void update_score(Leaderboard *lb, const char *id, int score) {
    for (int i = 0; i < lb->count; i++) {
        if (strcmp(lb->players[i].player_id, id) == 0) {
            lb->players[i].score = score;
            return;
        }
    }
    if (lb->count < MAX_PLAYERS) {
        strncpy(lb->players[lb->count].player_id, id, 31);
        lb->players[lb->count].score = score;
        lb->count++;
    }
}

int get_player_rank(const Leaderboard *lb, const char *id) {
    int target_score = -1;
    for (int i = 0; i < lb->count; i++) {
        if (strcmp(lb->players[i].player_id, id) == 0) {
            target_score = lb->players[i].score;
            break;
        }
    }
    if (target_score == -1) return -1;
    int higher = 0;
    for (int i = 0; i < lb->count; i++) {
        if (lb->players[i].score > target_score) higher++;
    }
    return higher + 1;
}`,
          explanations: [
            {
              code: "if (lb->players[i].score > target_score) higher++;",
              explanation: "Computes rank as (number of higher scores + 1).",
            },
          ],
        },
      ],
      simulationNote:
        "Models live rank queries. Real systems use Redis ZREVRANGE and ZREVRANK powered by skip-lists.",
    },
    practice: [
      {
        level: "Understand",
        title: "Time Complexity",
        brief: "Why is a skip-list search O(log N) while a linked list is O(N)?",
      },
      {
        level: "Modify",
        title: "Tie Breaking",
        brief: "Add earlier timestamp tie-breaking when two players have identical scores.",
      },
      {
        level: "Build",
        title: "Surrounding Rank Window",
        brief: "Return the 5 players immediately above and below the user.",
      },
      {
        level: "Think",
        title: "Seasonal Reset",
        brief: "How would you archive and reset the leaderboard every Monday without downtime?",
      },
    ],
    reflection: [
      "Why is calculating live ranks across millions of rows fundamentally challenging for relational SQL engines?",
      "How do sorted sets solve both rank position lookups and top-K range extractions simultaneously?",
    ],
    techNotes: [
      {
        name: "Redis ZSET",
        kind: "Standard",
        note: "Used by virtually all top multiplayer games including Fortnite, PUBG, and Chess.com for instant ratings.",
      },
    ],
    codeLab: {
      title: "Rank Calculator",
      brief:
        "Write a function compute_player_rank(scores, target_player). Scores is a dict of {player: score}. Return the 1-based rank of target_player (1 is highest). If player not found, return -1.",
      functionName: "compute_player_rank",
      signature: "def compute_player_rank(scores: dict, target_player: str) -> int:",
      starterCode: `def compute_player_rank(scores, target_player):
    # Return 1-based rank, or -1 if not found
    pass
`,
      javaSignature:
        "public static int computePlayerRank(String[] players, int[] scores, String targetPlayer)",
      javaStarterCode: `public class Solution {
    public static int computePlayerRank(String[] players, int[] scores, String targetPlayer) {
        int targetScore = -1;
        for (int i = 0; i < players.length; i++) {
            if (players[i].equals(targetPlayer)) {
                targetScore = scores[i];
                break;
            }
        }
        if (targetScore == -1) return -1;
        int rank = 1;
        for (int s : scores) {
            if (s > targetScore) rank++;
        }
        return rank;
    }
}
`,
      cSignature:
        "int compute_player_rank(const char *players[], const int scores[], int count, const char *target_player)",
      cStarterCode: `// Player rank calculation in C
#include <stdio.h>
#include <string.h>

int compute_player_rank(const char *players[], const int scores[], int count, const char *target_player) {
    int target_score = -1;
    for (int i = 0; i < count; i++) {
        if (strcmp(players[i], target_player) == 0) {
            target_score = scores[i];
            break;
        }
    }
    if (target_score == -1) return -1;
    int rank = 1;
    for (int i = 0; i < count; i++) {
        if (scores[i] > target_score) rank++;
    }
    return rank;
}
`,
      hints: [
        "Find target_player's score first.",
        "Count how many players have a score strictly greater than target_score.",
        "Rank = 1 + higher_scores.",
      ],
      tests: [
        {
          name: "Top score is rank 1",
          args: [{ alice: 100, bob: 80, charlie: 50 }, "alice"],
          expected: 1,
        },
        {
          name: "Middle score is rank 2",
          args: [{ alice: 100, bob: 80, charlie: 50 }, "bob"],
          expected: 2,
        },
        {
          name: "Lowest score is rank 3",
          args: [{ alice: 100, bob: 80, charlie: 50 }, "charlie"],
          expected: 3,
        },
        { name: "Player not found", args: [{ alice: 100 }, "dave"], expected: -1 },
      ],
      explanationPrompt:
        "Explain how 1-based rank is derived by counting strictly superior scores.",
      mermaid: `graph TD
    A[Target Player: Bob] --> B{Found in Scores?}
    B -- No --> C[Return -1]
    B -- Yes --> D[Score = 80]
    D --> E[Count scores > 80: Alice=100 -> Count=1]
    E --> F[Rank = Count + 1 = 2]`,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Case 25: Webhook Event Delivery
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cs-webhook-event-delivery-025",
    slug: "webhook-event-delivery",
    index: "25",
    title: "How Do Webhooks Guarantee Reliable Event Delivery with Exponential Backoff?",
    shortTitle: "Webhook Delivery",
    category: "Realtime & Communication",
    subcategory: "Retry & Backoff Delivery",
    difficulty: "Intermediate",
    learnerLevel: "Builder",
    estimatedTime: "50-65 minutes",
    minutes: 55,
    status: "published",
    tier: "premium",
    rcCost: 50,
    summary:
      "When Stripe finishes charging a credit card, it notifies your server by sending an HTTP POST webhook. What happens if your server is temporarily restarting? Discover HMAC signatures, idempotent retry queues, and exponential backoff.",
    learningObjectives: [
      "Understand why webhooks are user-configured reverse APIs.",
      "Verify payload authenticity using HMAC cryptographic signatures.",
      "Implement exponential backoff retry schedules to handle transient network outages.",
    ],
    prerequisites: ["HTTP POST requests", "HMAC / Cryptographic Hashes", "Retry logic"],
    engineeringConcepts: [
      "Webhook Delivery",
      "HMAC Signature Verification",
      "Exponential Backoff",
      "Idempotent Retry Queue",
    ],
    technologies: ["Webhooks", "HMAC", "Python", "Java", "C"],
    tech: ["HMAC-SHA256", "Backoff", "Retry Queue"],
    tags: ["webhooks", "retries", "hmac", "reliability"],
    glossary: [
      {
        term: "Webhook",
        plainDefinition:
          "An HTTP callback where a service pushes event notifications to a destination URL provided by the subscriber.",
      },
      {
        term: "Exponential Backoff",
        plainDefinition:
          "A retry strategy that doubles the wait time after each failure (e.g. 1s, 2s, 4s, 8s) to avoid crashing a recovering server.",
      },
    ],
    primers: [
      {
        concept: "The Danger of Linear Retries",
        minutes: 4,
        definition:
          "Retrying immediately when a server is down acts as a denial-of-service attack that prevents the server from ever recovering.",
        whyNeeded:
          "Exponential backoff with jitter relieves server congestion and gives the target breathing room to heal.",
        analogy:
          "If a door is jammed, knocking twice as softly and waiting longer between attempts rather than kicking it down.",
        tinyExample: "wait_seconds = 2 ** attempt_count",
      },
    ],
    discover: {
      situation:
        "Payment gateways and GitHub push events notify third-party servers via HTTP POST calls.",
      humanFlow: [
        "Customer pays",
        "Stripe signs payload with HMAC",
        "Stripe sends POST to customer URL",
        "Customer URL responds 200 OK",
      ],
      question:
        "How does the webhook sender ensure the payload isn't tampered with and arrives even if the destination is temporarily down?",
      whyItExists: [
        "Asynchronous event integration",
        "Cross-company microservice coordination",
        "Tamper-proof payload verification",
      ],
    },
    understand: {
      overview:
        "A reliable webhook pipeline computes an HMAC-SHA256 signature header so the receiver can verify authenticity. If the receiver fails to return HTTP 2xx, the event is re-queued with exponentially increasing delay.",
      components: [
        {
          name: "HMAC Signer",
          whatIsIt: "Cryptographic hash builder",
          whyItExists: "Proves message integrity",
          whatItDoes: "Computes signature",
        },
        {
          name: "Retry Scheduler",
          whatIsIt: "Queue with delay timestamps",
          whyItExists: "Handles receiver downtime",
          whatItDoes: "Schedules retries",
        },
      ],
      analogy: {
        title: "Certified Mail with Re-Delivery",
        everyday: [
          "The mail carrier requires a signature.",
          "If you are not home, they leave a notice and return tomorrow, then 3 days later.",
        ],
        technical: [
          "Signature is HMAC verification.",
          "Re-delivery attempts is exponential backoff retry queue.",
        ],
      },
      flow: [
        "Event triggers payload",
        "Compute HMAC signature",
        "HTTP POST to target URL",
        "If status != 200, compute next retry delay",
        "Re-attempt up to max retries",
      ],
    },
    concepts: [
      {
        id: "exponential-backoff",
        name: "Exponential Backoff",
        difficulty: "Intermediate",
        simpleDefinition: "A strategy where delay time doubles after each successive failure.",
        whyItExists: "Prevents thundering herd load on recovering web servers.",
        realWorldAnalogy: "Giving someone more space the more overwhelmed they seem.",
        technicalExplanation:
          "Calculates `delay = base * (2 ^ attempt)`. Caps at a maximum duration.",
        caseApplication: "Used to schedule the next delivery timestamp for failed webhooks.",
        commonMistakes: ["Retrying instantly in a while-true loop, exhausting network sockets."],
        practice: ["Calculate delays for attempts 0, 1, 2, 3 with base 2 seconds."],
      },
    ],
    architecture: {
      caption: "Webhook dispatch, HMAC signing, and exponential retry loop",
      levels: [
        {
          title: "Retry Pipeline",
          description: "Dispatcher sends payload; failures enter exponential backoff queue",
          mermaid: `graph LR
    Sender[Event Trigger] --> Sign[Sign with HMAC]
    Sign --> POST[HTTP POST]
    POST -->|200 OK| Success[Completed]
    POST -->|500 / Timeout| Queue[Retry Queue: 2^attempt delay]
    Queue -->|Timer fires| POST`,
        },
      ],
    },
    decisions: [
      {
        title: "Exponential Backoff vs Constant Delay",
        what: "Exponential backoff with jitter",
        why: "Protects failing destination endpoints from overload",
        problemSolved:
          "Avoids knocking out a recovering service with repeated simultaneous retries",
        withoutIt:
          "Thousands of pending failed retries would DDoS the receiver the moment it turns back on",
        alternatives: ["Immediate retries (harmful)", "Constant 10-second retry"],
        tradeoff: "Events take longer to be delivered when outages occur",
      },
    ],
    implementation: {
      behaviour:
        "Calculates HMAC signature match and schedules retry intervals using exponential backoff.",
      algorithm: [
        "1. Calculate expected signature = hash(payload + secret).",
        "2. If signature does not match, reject as untrusted.",
        "3. On dispatch failure, calculate next_delay = base_delay * (2 ^ attempt).",
      ],
      ladder: [
        { level: "LEVEL 0", title: "Single Attempt", detail: "Sends POST with zero retries." },
        { level: "LEVEL 1", title: "Constant Retry", detail: "Retries every 5 seconds." },
        {
          level: "LEVEL 2",
          title: "Exponential Backoff",
          detail: "Doubles wait time per attempt up to max limit.",
        },
      ],
      samples: [
        {
          language: "python",
          filename: "webhook_dispatcher.py",
          code: `class WebhookDispatcher:
    def __init__(self, base_delay: int = 2, max_attempts: int = 5):
        self.base_delay = base_delay
        self.max_attempts = max_attempts

    def compute_next_retry(self, attempt: int) -> int:
        # attempt 0 -> base_delay * 1, attempt 1 -> base_delay * 2, etc.
        if attempt >= self.max_attempts:
            return -1 # Drop or dead-letter queue
        return self.base_delay * (2 ** attempt)

    def verify_signature(self, payload: str, secret: str, signature: str) -> bool:
        expected = f"sig_{len(payload)}_{secret}"
        return expected == signature`,
          explanations: [
            {
              code: "return self.base_delay * (2 ** attempt)",
              explanation: "Computes exponential delay growing by powers of 2.",
            },
            {
              code: "if attempt >= self.max_attempts: return -1",
              explanation: "Terminates retry loop after maximum attempt budget is exhausted.",
            },
          ],
        },
        {
          language: "java",
          filename: "WebhookDispatcher.java",
          code: `public class WebhookDispatcher {
    private final int baseDelay;
    private final int maxAttempts;

    public WebhookDispatcher(int baseDelay, int maxAttempts) {
        this.baseDelay = baseDelay;
        this.maxAttempts = maxAttempts;
    }

    public int computeNextRetry(int attempt) {
        if (attempt >= maxAttempts) return -1;
        return (int) (baseDelay * Math.pow(2, attempt));
    }

    public boolean verifySignature(String payload, String secret, String signature) {
        String expected = "sig_" + payload.length() + "_" + secret;
        return expected.equals(signature);
    }
}`,
          explanations: [
            {
              code: "return (int) (baseDelay * Math.pow(2, attempt));",
              explanation: "Calculates exponential backoff delay in seconds.",
            },
          ],
        },
        {
          language: "c",
          filename: "webhook_dispatcher.c",
          code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

int compute_next_retry(int base_delay, int max_attempts, int attempt) {
    if (attempt >= max_attempts) return -1;
    int multiplier = 1;
    for (int i = 0; i < attempt; i++) multiplier *= 2;
    return base_delay * multiplier;
}

bool verify_signature(const char *payload, const char *secret, const char *sig) {
    char expected[128];
    sprintf(expected, "sig_%lu_%s", strlen(payload), secret);
    return strcmp(expected, sig) == 0;
}`,
          explanations: [
            {
              code: "for (int i = 0; i < attempt; i++) multiplier *= 2;",
              explanation: "Calculates power-of-two multiplier for backoff.",
            },
          ],
        },
      ],
      simulationNote: "Models exponential retry delays and signature checks.",
    },
    practice: [
      {
        level: "Understand",
        title: "Calculate Delays",
        brief: "List delays for attempts 0 through 4 with base delay of 3 seconds.",
      },
      {
        level: "Modify",
        title: "Add Jitter",
        brief: "Add random jitter (+/- 20%) to avoid synchronized retry waves.",
      },
      {
        level: "Build",
        title: "Dead Letter Queue",
        brief: "Route payloads that failed all attempts into an inspection queue.",
      },
      {
        level: "Think",
        title: "At-Least-Once Delivery",
        brief: "Why must webhook receivers be idempotent?",
      },
    ],
    reflection: [
      "Why must webhook endpoints always be designed to handle duplicate deliveries gracefully?",
      "How does exponential backoff prevent cascading failures on recovering downstream servers?",
    ],
    techNotes: [
      {
        name: "Dead Letter Queue (DLQ)",
        kind: "Architecture",
        note: "Failed webhooks that exceed maximum retries are moved to a DLQ so developers can inspect and replay them manually.",
      },
    ],
    codeLab: {
      title: "Exponential Backoff Calculator",
      brief:
        "Write a function get_retry_delay(base_delay, max_attempts, attempt). If attempt >= max_attempts, return -1 (give up). Otherwise return base_delay * (2 ** attempt).",
      functionName: "get_retry_delay",
      signature: "def get_retry_delay(base_delay: int, max_attempts: int, attempt: int) -> int:",
      starterCode: `def get_retry_delay(base_delay, max_attempts, attempt):
    # Return delay in seconds or -1 if attempt >= max_attempts
    pass
`,
      javaSignature: "public static int getRetryDelay(int baseDelay, int maxAttempts, int attempt)",
      javaStarterCode: `public class Solution {
    public static int getRetryDelay(int baseDelay, int maxAttempts, int attempt) {
        if (attempt >= maxAttempts) return -1;
        return (int) (baseDelay * Math.pow(2, attempt));
    }
}
`,
      cSignature: "int get_retry_delay(int base_delay, int max_attempts, int attempt)",
      cStarterCode: `// Exponential backoff in C
#include <stdio.h>

int get_retry_delay(int base_delay, int max_attempts, int attempt) {
    if (attempt >= max_attempts) return -1;
    int multiplier = 1;
    for (int i = 0; i < attempt; i++) multiplier *= 2;
    return base_delay * multiplier;
}
`,
      hints: [
        "Check attempt >= max_attempts first and return -1.",
        "Multiply base_delay by 2 raised to the power of attempt.",
      ],
      tests: [
        { name: "Attempt 0 is base", args: [2, 4, 0], expected: 2 },
        { name: "Attempt 1 is 2x", args: [2, 4, 1], expected: 4 },
        { name: "Attempt 2 is 4x", args: [2, 4, 2], expected: 8 },
        { name: "Attempt 3 is 8x", args: [2, 4, 3], expected: 16 },
        { name: "Attempt 4 exceeds max", args: [2, 4, 4], expected: -1 },
      ],
      explanationPrompt:
        "Explain how doubling delay time after each attempt gives failing downstream servers breathing room to recover.",
      mermaid: `graph TD
    A[Attempt Count] --> B{Attempt >= Max?}
    B -- Yes --> C[Return -1: Give Up / Send to DLQ]
    B -- No --> D[Delay = Base * 2^Attempt]`,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Case 26: Distributed API Rate Limiting
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cs-api-rate-limiting-026",
    slug: "api-rate-limiting",
    index: "26",
    title: "How Does Distributed API Rate Limiting Prevent Server Abuse?",
    shortTitle: "API Rate Limiting",
    category: "Reliability & Scalability",
    subcategory: "Traffic Shaping & Quotas",
    difficulty: "Advanced",
    learnerLevel: "Engineer",
    estimatedTime: "55-70 minutes",
    minutes: 60,
    status: "published",
    tier: "premium",
    rcCost: 60,
    summary:
      "When malicious bots or runaway loops send 10,000 requests per second to an API, how does the system reject abusers while serving legitimate users smoothly? Discover the Token Bucket and Sliding Window algorithms that protect production APIs.",
    learningObjectives: [
      "Understand the trade-offs between Fixed Window, Token Bucket, and Sliding Log algorithms.",
      "Calculate burst capacity vs sustained throughput in token bucket models.",
      "Implement a sliding-window rate limiter returning HTTP 429 Too Many Requests.",
    ],
    prerequisites: ["Timeouts & Epoch Timestamps", "HTTP Status 429", "Hash Maps"],
    engineeringConcepts: [
      "Token Bucket",
      "Sliding Window",
      "Traffic Shaping",
      "Rate Limit Headers",
    ],
    technologies: ["Rate Limiting", "Redis", "Python", "Java", "C"],
    tech: ["Token Bucket", "429 Too Many Requests", "Sliding Window"],
    tags: ["rate-limiting", "security", "scalability", "resilience"],
    glossary: [
      {
        term: "Token Bucket",
        plainDefinition:
          "An algorithm where tokens refill at a steady rate; each request consumes one token, allowing bursts up to bucket capacity.",
      },
      {
        term: "HTTP 429",
        plainDefinition:
          "Standard status code indicating the user has sent too many requests in a given amount of time.",
      },
    ],
    primers: [
      {
        concept: "Fixed Window Reset Spikes",
        minutes: 4,
        definition:
          "A fixed 1-minute window counter resets at :00. A user sending 100 requests at :59 and 100 at :01 achieves double the quota in 2 seconds.",
        whyNeeded: "Sliding window algorithms prevent reset-boundary traffic surges.",
        analogy:
          "A toll booth allowing 5 cars per hour: if 5 arrive at 1:59 and 5 arrive at 2:01, 10 cars squeeze through in 2 minutes unless a sliding window is used.",
        tinyExample: "allow = (current_tokens >= 1)",
      },
    ],
    discover: {
      situation:
        "Public APIs face scraping, credential stuffing, and unintentional infinite loops from client code.",
      humanFlow: [
        "Client sends requests 1..100 -> HTTP 200",
        "Client sends request 101 -> HTTP 429 Too Many Requests (Retry-After: 30)",
      ],
      question:
        "How can API gateways measure and enforce per-client request limits across thousands of concurrent servers?",
      whyItExists: [
        "Denial-of-Service mitigation",
        "Monetization tiers (Free vs Pro)",
        "Fair resource allocation",
      ],
    },
    understand: {
      overview:
        "A Token Bucket rate limiter tracks token count and last refill timestamp. When a request arrives, elapsed time adds newly generated tokens. If tokens >= 1, the request proceeds; otherwise, HTTP 429 is returned.",
      components: [
        {
          name: "Bucket State",
          whatIsIt: "(tokens, last_refill_time)",
          whyItExists: "Tracks available quota without storing every request timestamp",
          whatItDoes: "Answers allow/deny",
        },
        {
          name: "Refill Engine",
          whatIsIt: "Time-based replenishment logic",
          whyItExists: "Restores quota smoothly over time",
          whatItDoes: "Adds tokens",
        },
      ],
      analogy: {
        title: "Arcade Token Dispenser",
        everyday: [
          "The machine drops 1 token into your bowl every 2 seconds.",
          "Your bowl holds at most 10 tokens.",
          "Each arcade play costs 1 token. If the bowl is empty, you must wait.",
        ],
        technical: [
          "Bowl is capacity.",
          "Drop rate is refill rate.",
          "Playing is consuming a token.",
        ],
      },
      flow: [
        "Request arrives with API key",
        "Calculate tokens added since last request",
        "Clamp tokens to maximum capacity",
        "If tokens >= 1, decrement and return True; else return False",
      ],
    },
    concepts: [
      {
        id: "token-bucket",
        name: "Token Bucket Algorithm",
        difficulty: "Advanced",
        simpleDefinition:
          "An algorithm that allows bursty traffic up to bucket capacity while enforcing a strict long-term rate.",
        whyItExists:
          "Accommodates real-world bursty browsing while capping maximum sustained throughput.",
        realWorldAnalogy: "A water tank with a steady drip inflow and a tap for quick cup refills.",
        technicalExplanation:
          "Computes `new_tokens = elapsed * rate`. `current = min(capacity, current + new_tokens)`. If `current >= 1`, decrement and allow.",
        caseApplication: "Used to protect sensitive login and checkout API endpoints.",
        commonMistakes: [
          "Using background threads to refill buckets instead of lazy on-read math.",
        ],
        practice: [
          "Calculate tokens available after 5 seconds with capacity 10 and rate 2 tokens/sec.",
        ],
      },
    ],
    architecture: {
      caption: "Token bucket admission control architecture",
      levels: [
        {
          title: "Token Admission",
          description: "Lazy token refill and admission guard",
          mermaid: `graph TD
    Req[Incoming API Request] --> Calc[Compute Lazy Refill from Elapsed Time]
    Calc --> Check{Tokens >= 1?}
    Check -- Yes --> Allow[Consume 1 Token -> HTTP 200]
    Check -- No --> Deny[Reject -> HTTP 429 Too Many Requests]`,
        },
      ],
    },
    decisions: [
      {
        title: "Token Bucket vs Fixed Window",
        what: "Lazy Token Bucket",
        why: "Smooth traffic shaping without boundary spike anomalies",
        problemSolved: "Prevents 2x burst traffic around window boundary resets",
        withoutIt: "Servers experience traffic doubling at every clock-minute turnover",
        alternatives: ["Fixed Window Counter", "Leaky Bucket (constant rate, no bursts)"],
        tradeoff: "Requires storing both token count and timestamp per client",
      },
    ],
    implementation: {
      behaviour: "Implements lazy on-demand token bucket calculations per client key.",
      algorithm: [
        "1. Retrieve client's (tokens, last_refill_time).",
        "2. Calculate elapsed = now - last_refill_time.",
        "3. Add elapsed * refill_rate to tokens, capped at max_capacity.",
        "4. If tokens >= 1, decrement 1 token and return True; else return False.",
      ],
      ladder: [
        { level: "LEVEL 0", title: "Fixed Window", detail: "Counter resets every 60 seconds." },
        {
          level: "LEVEL 1",
          title: "Lazy Token Bucket",
          detail: "Mathematical refill on arrival without background jobs.",
        },
        {
          level: "LEVEL 2",
          title: "Distributed Redis Script",
          detail: "Atomic Lua script evaluation in Redis.",
        },
      ],
      samples: [
        {
          language: "python",
          filename: "rate_limiter.py",
          code: `class TokenBucketRateLimiter:
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        self.capacity = capacity
        self.rate = refill_rate_per_sec
        self.clients = {} # client_id -> (tokens, last_time)

    def allow_request(self, client_id: str, now: float) -> bool:
        if client_id not in self.clients:
            self.clients[client_id] = (self.capacity - 1, now)
            return True

        tokens, last_time = self.clients[client_id]
        elapsed = max(0.0, now - last_time)
        refilled = min(self.capacity, tokens + (elapsed * self.rate))

        if refilled >= 1.0:
            self.clients[client_id] = (refilled - 1.0, now)
            return True
        else:
            self.clients[client_id] = (refilled, now)
            return False`,
          explanations: [
            {
              code: "refilled = min(self.capacity, tokens + (elapsed * self.rate))",
              explanation:
                "Refills tokens lazily based on elapsed seconds without a background worker.",
            },
            {
              code: "if refilled >= 1.0: self.clients[client_id] = (refilled - 1.0, now); return True",
              explanation: "Admits request and consumes 1 token from the available bucket.",
            },
          ],
        },
        {
          language: "java",
          filename: "TokenBucketRateLimiter.java",
          code: `import java.util.HashMap;
import java.util.Map;

public class TokenBucketRateLimiter {
    private final double capacity;
    private final double ratePerSec;

    private static class State {
        double tokens;
        double lastTime;
        State(double tokens, double lastTime) {
            this.tokens = tokens;
            this.lastTime = lastTime;
        }
    }

    private final Map<String, State> clients = new HashMap<>();

    public TokenBucketRateLimiter(double capacity, double ratePerSec) {
        this.capacity = capacity;
        this.ratePerSec = ratePerSec;
    }

    public synchronized boolean allowRequest(String clientId, double now) {
        if (!clients.containsKey(clientId)) {
            clients.put(clientId, new State(capacity - 1.0, now));
            return true;
        }
        State st = clients.get(clientId);
        double elapsed = Math.max(0.0, now - st.lastTime);
        double refilled = Math.min(capacity, st.tokens + (elapsed * ratePerSec));
        st.lastTime = now;

        if (refilled >= 1.0) {
            st.tokens = refilled - 1.0;
            return true;
        } else {
            st.tokens = refilled;
            return false;
        }
    }
}`,
          explanations: [
            {
              code: "double refilled = Math.min(capacity, st.tokens + (elapsed * ratePerSec));",
              explanation: "Computes available quota using lazy elapsed-time calculation.",
            },
          ],
        },
        {
          language: "c",
          filename: "rate_limiter.c",
          code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_CLIENTS 64

typedef struct {
    char client_id[32];
    double tokens;
    double last_time;
    bool active;
} ClientBucket;

typedef struct {
    double capacity;
    double rate;
    ClientBucket buckets[MAX_CLIENTS];
} RateLimiter;

void init_limiter(RateLimiter *rl, double capacity, double rate) {
    rl->capacity = capacity;
    rl->rate = rate;
    for (int i = 0; i < MAX_CLIENTS; i++) rl->buckets[i].active = false;
}

bool allow_request(RateLimiter *rl, const char *client_id, double now) {
    int free_slot = -1;
    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (rl->buckets[i].active && strcmp(rl->buckets[i].client_id, client_id) == 0) {
            double elapsed = now - rl->buckets[i].last_time;
            if (elapsed < 0) elapsed = 0;
            double refilled = rl->buckets[i].tokens + (elapsed * rl->rate);
            if (refilled > rl->capacity) refilled = rl->capacity;
            rl->buckets[i].last_time = now;
            if (refilled >= 1.0) {
                rl->buckets[i].tokens = refilled - 1.0;
                return true;
            }
            rl->buckets[i].tokens = refilled;
            return false;
        } else if (!rl->buckets[i].active && free_slot == -1) {
            free_slot = i;
        }
    }
    if (free_slot != -1) {
        strncpy(rl->buckets[free_slot].client_id, client_id, 31);
        rl->buckets[free_slot].tokens = rl->capacity - 1.0;
        rl->buckets[free_slot].last_time = now;
        rl->buckets[free_slot].active = true;
        return true;
    }
    return false;
}`,
          explanations: [
            {
              code: "if (refilled >= 1.0) { rl->buckets[i].tokens = refilled - 1.0; return true; }",
              explanation: "Consumes 1 token and permits API access.",
            },
          ],
        },
      ],
      simulationNote: "Models in-memory lazy token bucket evaluation.",
    },
    practice: [
      {
        level: "Understand",
        title: "Burst vs Sustained",
        brief:
          "With capacity 10 and rate 2/sec, how many requests can arrive in the first second? Over 10 seconds?",
      },
      {
        level: "Modify",
        title: "Cost per Endpoint",
        brief: "Support expensive API endpoints consuming 5 tokens per call instead of 1.",
      },
      {
        level: "Build",
        title: "Headers Generator",
        brief: "Return X-RateLimit-Remaining and Retry-After headers.",
      },
      {
        level: "Think",
        title: "Distributed Race Condition",
        brief:
          "If 10 web servers read and write the token count in Redis simultaneously, what race condition occurs?",
      },
    ],
    reflection: [
      "Why is lazy on-read replenishment drastically more scalable than running background timers for every user?",
      "How do Token Buckets protect servers from sustained denial of service while allowing natural bursty browsing behavior?",
    ],
    techNotes: [
      {
        name: "Redis Lua Scripts",
        kind: "Atomicity",
        note: "Distributed rate limiters evaluate the token bucket inside a single atomic Redis Lua script to eliminate read-modify-write race conditions.",
      },
    ],
    codeLab: {
      title: "Token Bucket Evaluator",
      brief:
        "Write a function evaluate_token_bucket(capacity, rate, current_tokens, elapsed). Add (elapsed * rate) to current_tokens (capped at capacity). If updated >= 1, return [True, updated - 1, 'ALLOWED']. Otherwise return [False, updated, 'RATE_LIMITED']. Round tokens to 1 decimal place.",
      functionName: "evaluate_token_bucket",
      signature:
        "def evaluate_token_bucket(capacity: float, rate: float, current_tokens: float, elapsed: float) -> list:",
      starterCode: `def evaluate_token_bucket(capacity, rate, current_tokens, elapsed):
    # 1. Refill tokens = min(capacity, current_tokens + elapsed * rate)
    # 2. Check if refilled >= 1.0
    pass
`,
      javaSignature:
        "public static Object[] evaluateTokenBucket(double capacity, double rate, double currentTokens, double elapsed)",
      javaStarterCode: `public class Solution {
    public static Object[] evaluateTokenBucket(double capacity, double rate, double currentTokens, double elapsed) {
        double refilled = Math.min(capacity, currentTokens + (elapsed * rate));
        if (refilled >= 1.0) {
            return new Object[]{true, Math.round((refilled - 1.0) * 10.0) / 10.0, "ALLOWED"};
        }
        return new Object[]{false, Math.round(refilled * 10.0) / 10.0, "RATE_LIMITED"};
    }
}
`,
      cSignature:
        "bool evaluate_token_bucket(double capacity, double rate, double current_tokens, double elapsed, double *out_tokens, char *msg)",
      cStarterCode: `// Token bucket evaluator in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool evaluate_token_bucket(double capacity, double rate, double current_tokens, double elapsed, double *out_tokens, char *msg) {
    double refilled = current_tokens + (elapsed * rate);
    if (refilled > capacity) refilled = capacity;
    if (refilled >= 1.0) {
        *out_tokens = refilled - 1.0;
        strcpy(msg, "ALLOWED");
        return true;
    }
    *out_tokens = refilled;
    strcpy(msg, "RATE_LIMITED");
    return false;
}
`,
      hints: [
        "Calculate refilled = min(capacity, current_tokens + elapsed * rate).",
        "If refilled >= 1.0, deduct 1 and return ALLOWED.",
        "Otherwise preserve refilled and return RATE_LIMITED.",
      ],
      tests: [
        {
          name: "Full capacity allows",
          args: [5.0, 1.0, 5.0, 0.0],
          expected: [true, 4.0, "ALLOWED"],
        },
        {
          name: "Empty bucket rate limited",
          args: [5.0, 1.0, 0.2, 0.0],
          expected: [false, 0.2, "RATE_LIMITED"],
        },
        {
          name: "Refill permits request",
          args: [5.0, 1.0, 0.2, 1.0],
          expected: [true, 0.2, "ALLOWED"],
        },
      ],
      explanationPrompt:
        "Explain how lazy token recalculation avoids needing a background timer thread for every active user.",
      mermaid: `graph TD
    A[Start] --> B[Refill = Min Cap, Tokens + Elapsed*Rate]
    B --> C{Refill >= 1.0?}
    C -- Yes --> D[Tokens = Refill - 1 -> ALLOWED]
    C -- No --> E[Tokens = Refill -> RATE_LIMITED]`,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Cases 27 to 30 (Background Job Queue, Circuit Breaker, Health Monitoring, Idempotent Payments)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cs-background-job-queue-027",
    slug: "background-job-queue",
    index: "27",
    title: "How Does an Asynchronous Job Queue Process Heavy Tasks in the Background?",
    shortTitle: "Job Queue",
    category: "Reliability & Scalability",
    subcategory: "Decoupled Processing",
    difficulty: "Advanced",
    learnerLevel: "Engineer",
    estimatedTime: "50-65 minutes",
    minutes: 55,
    status: "published",
    tier: "premium",
    rcCost: 60,
    summary:
      "When a user uploads a video or generates an invoice PDF, doing it inside the HTTP request freezes the browser for 30 seconds. Discover how message queues, background worker pools, and polling status endpoints make web applications instantaneous.",
    learningObjectives: [
      "Decouple synchronous HTTP request handling from asynchronous background work.",
      "Understand message visibility timeouts and at-least-once processing.",
      "Implement a job enqueue, process, and status check worker pipeline.",
    ],
    prerequisites: ["HTTP 202 Accepted", "Queues / FIFO", "Asynchronous execution"],
    engineeringConcepts: ["Job Queue", "Worker Pool", "Visibility Timeout", "Status Polling"],
    technologies: ["Celery", "RabbitMQ", "Python", "Java", "C"],
    tech: ["Job Queue", "Worker", "Visibility Timeout"],
    tags: ["queue", "async", "worker", "background-jobs"],
    glossary: [
      {
        term: "Visibility Timeout",
        plainDefinition:
          "A timer where a job leased by a worker becomes invisible to others; if the worker crashes before completion, the job reappears.",
      },
    ],
    primers: [
      {
        concept: "The 30-Second Web Request Timeout",
        minutes: 4,
        definition:
          "Web servers and proxies (Cloudflare/Nginx) abort HTTP requests that take more than 15-30 seconds to answer.",
        whyNeeded:
          "Heavy jobs (video encoding, report generation) must immediately return an ID and run in background workers.",
        analogy:
          "Getting a claim ticket at the dry cleaner and coming back later instead of standing at the counter for 3 hours while they wash your coat.",
        tinyExample: "return { 'status': 'QUEUED', 'job_id': 'job_123' }",
      },
    ],
    discover: {
      situation:
        "Users submit long operations (video transcode, batch emails) that cannot finish in 200ms.",
      humanFlow: [
        "Upload video",
        "Server responds in 50ms with 'Processing'",
        "Background worker encodes video",
        "Notification signals completion",
      ],
      question:
        "How do web services return immediate HTTP responses while reliable worker machines process heavy computations in the background?",
      whyItExists: [
        "Zero HTTP timeouts",
        "Independent worker autoscaling",
        "Crash-safe retry queues",
      ],
    },
    understand: {
      overview:
        "Web servers enqueue job specifications into a broker. Independent worker processes pull jobs, process them, and update a status store. The frontend polls `GET /jobs/:id` until complete.",
      components: [
        {
          name: "Message Broker",
          whatIsIt: "FIFO queue",
          whyItExists: "Buffers jobs safely",
          whatItDoes: "Stores task messages",
        },
        {
          name: "Worker Process",
          whatIsIt: "Background computation loop",
          whyItExists: "Executes heavy workload",
          whatItDoes: "Pulls and executes tasks",
        },
      ],
      analogy: {
        title: "Restaurant Kitchen Order Wheel",
        everyday: [
          "Waiter clips order ticket to the wheel.",
          "Waiter returns to customer immediately.",
          "Chefs take tickets in order and cook.",
        ],
        technical: [
          "Waiter is Web Server.",
          "Ticket wheel is Message Queue.",
          "Chefs are Background Workers.",
        ],
      },
      flow: [
        "Web server enqueues job",
        "Returns HTTP 202 Accepted with job_id",
        "Worker pulls job from queue",
        "Worker executes and saves result",
        "Client polls or receives webhook",
      ],
    },
    concepts: [
      {
        id: "visibility-timeout",
        name: "Visibility Timeout",
        difficulty: "Advanced",
        simpleDefinition:
          "A period during which a task leased by a worker is hidden from other workers.",
        whyItExists:
          "If a worker crashes mid-job, the job automatically reappears on the queue so another worker can complete it.",
        realWorldAnalogy:
          "Giving someone a library book for 2 weeks; if they never return it, the library flags it as lost and reorders it.",
        technicalExplanation:
          "Prevents duplicate concurrent execution while guaranteeing crash recovery without lost tasks.",
        caseApplication: "Used by Amazon SQS and RabbitMQ for safe message delivery.",
        commonMistakes: [
          "Setting visibility timeout shorter than average job execution time, causing duplicates.",
        ],
        practice: ["Calculate safe visibility timeout for a job averaging 45 seconds."],
      },
    ],
    architecture: {
      caption: "Decoupled asynchronous worker queue architecture",
      levels: [
        {
          title: "Producer-Consumer Pipeline",
          description: "Web server enqueues job; worker executes asynchronously",
          mermaid: `graph LR
    User[Web Client] -->|POST /jobs| Web[Web Server]
    Web -->|HTTP 202 job_id| User
    Web -->|Enqueue| Queue[Message Queue]
    Queue -->|De-queue| Worker[Background Worker]
    Worker -->|Write Result| DB[(Job Results Store)]`,
        },
      ],
    },
    decisions: [
      {
        title: "Asynchronous Queue vs Synchronous Blocking",
        what: "Job Queue with Background Workers",
        why: "Guarantees sub-100ms HTTP responses and prevents request timeouts",
        problemSolved: "Slow tasks blocking web server threads from answering other users",
        withoutIt:
          "A few heavy uploads would exhaust web server thread pools and freeze the whole site",
        alternatives: ["Synchronous execution with long timeout", "Cron polling"],
        tradeoff: "Requires managing broker infrastructure and async status tracking",
      },
    ],
    implementation: {
      behaviour: "Enqueues tasks, assigns unique job IDs, and manages worker completion states.",
      algorithm: [
        "1. When job is submitted, create record with status='QUEUED'.",
        "2. Push job_id to FIFO task queue.",
        "3. Worker pops job, transitions status='RUNNING', processes, and updates status='COMPLETED'.",
      ],
      ladder: [
        { level: "LEVEL 0", title: "Single Queue Array", detail: "In-memory list with push/pop." },
        {
          level: "LEVEL 1",
          title: "Status Tracking",
          detail: "State transitions: Queued -> Running -> Done.",
        },
        { level: "LEVEL 2", title: "Lease Timeout", detail: "Recovers dead worker jobs." },
      ],
      samples: [
        {
          language: "python",
          filename: "job_queue.py",
          code: `class BackgroundJobQueue:
    def __init__(self):
        self.queue = []
        self.jobs = {} # job_id -> status

    def enqueue(self, job_id: str, payload: str):
        self.jobs[job_id] = "QUEUED"
        self.queue.append(job_id)

    def process_next(self) -> str:
        if not self.queue:
            return "NO_JOBS"
        job_id = self.queue.pop(0)
        self.jobs[job_id] = "RUNNING"
        # Simulate work
        self.jobs[job_id] = "COMPLETED"
        return job_id

    def get_status(self, job_id: str) -> str:
        return self.jobs.get(job_id, "NOT_FOUND")`,
          explanations: [
            {
              code: "self.queue.append(job_id)",
              explanation: "Buffers task ID into FIFO processing queue.",
            },
            {
              code: "self.jobs[job_id] = 'COMPLETED'",
              explanation: "Updates task status so client polling gets confirmation.",
            },
          ],
        },
        {
          language: "java",
          filename: "BackgroundJobQueue.java",
          code: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BackgroundJobQueue {
    private final List<String> queue = new ArrayList<>();
    private final Map<String, String> jobs = new HashMap<>();

    public synchronized void enqueue(String jobId) {
        jobs.put(jobId, "QUEUED");
        queue.add(jobId);
    }

    public synchronized String processNext() {
        if (queue.isEmpty()) return "NO_JOBS";
        String jobId = queue.remove(0);
        jobs.put(jobId, "RUNNING");
        jobs.put(jobId, "COMPLETED");
        return jobId;
    }

    public synchronized String getStatus(String jobId) {
        return jobs.getOrDefault(jobId, "NOT_FOUND");
    }
}`,
          explanations: [
            {
              code: "String jobId = queue.remove(0);",
              explanation: "De-queues oldest task in FIFO order for execution.",
            },
          ],
        },
        {
          language: "c",
          filename: "job_queue.c",
          code: `#include <stdio.h>
#include <string.h>

#define MAX_JOBS 32

typedef struct {
    char id[32];
    char status[16];
} Job;

typedef struct {
    Job jobs[MAX_JOBS];
    int count;
} JobQueue;

void init_queue(JobQueue *q) { q->count = 0; }

bool enqueue_job(JobQueue *q, const char *id) {
    if (q->count >= MAX_JOBS) return false;
    strncpy(q->jobs[q->count].id, id, 31);
    strcpy(q->jobs[q->count].status, "QUEUED");
    q->count++;
    return true;
}

const char* process_job(JobQueue *q) {
    for (int i = 0; i < q->count; i++) {
        if (strcmp(q->jobs[i].status, "QUEUED") == 0) {
            strcpy(q->jobs[i].status, "COMPLETED");
            return q->jobs[i].id;
        }
    }
    return "NO_JOBS";
}`,
          explanations: [
            {
              code: 'strcpy(q->jobs[i].status, "COMPLETED");',
              explanation: "Transitions first queued job to completed state.",
            },
          ],
        },
      ],
      simulationNote: "Models asynchronous worker queue transitions.",
    },
    practice: [
      {
        level: "Understand",
        title: "Trace Polling",
        brief: "Why does the client poll GET /jobs/:id instead of keeping the connection open?",
      },
      {
        level: "Modify",
        title: "Failed State",
        brief:
          "Add a FAILED status and error message string when processing encounters an exception.",
      },
      {
        level: "Build",
        title: "Priority Queue",
        brief: "Support HIGH and LOW priority job queues.",
      },
      {
        level: "Think",
        title: "Poison Pill",
        brief: "What happens if a job has a bug that crashes every worker that touches it?",
      },
    ],
    reflection: [
      "Why is decoupling request acceptance from task execution the core architecture of scalable web systems?",
      "How does a visibility timeout guarantee at-least-once execution when worker nodes experience sudden power failure?",
    ],
    techNotes: [
      {
        name: "BullMQ & Celery",
        kind: "Standard",
        note: "BullMQ (Node/Redis) and Celery (Python/RabbitMQ) are the primary background task engines in modern web platforms.",
      },
    ],
    codeLab: {
      title: "Job State Transitioner",
      brief:
        "Write a function transition_job(current_state, event). Events can be 'START' or 'FINISH'. If state is 'QUEUED' and event is 'START', return 'RUNNING'. If state is 'RUNNING' and event is 'FINISH', return 'COMPLETED'. Any other combination is invalid, return 'INVALID_TRANSITION'.",
      functionName: "transition_job",
      signature: "def transition_job(current_state: str, event: str) -> str:",
      starterCode: `def transition_job(current_state, event):
    # Enforce state machine transitions
    pass
`,
      javaSignature: "public static String transitionJob(String currentState, String event)",
      javaStarterCode: `public class Solution {
    public static String transitionJob(String currentState, String event) {
        if ("QUEUED".equals(currentState) && "START".equals(event)) return "RUNNING";
        if ("RUNNING".equals(currentState) && "FINISH".equals(event)) return "COMPLETED";
        return "INVALID_TRANSITION";
    }
}
`,
      cSignature: "const char* transition_job(const char *current_state, const char *event)",
      cStarterCode: `// Job transition in C
#include <stdio.h>
#include <string.h>

const char* transition_job(const char *current_state, const char *event) {
    if (strcmp(current_state, "QUEUED") == 0 && strcmp(event, "START") == 0) return "RUNNING";
    if (strcmp(current_state, "RUNNING") == 0 && strcmp(event, "FINISH") == 0) return "COMPLETED";
    return "INVALID_TRANSITION";
}
`,
      hints: [
        "QUEUED + START -> RUNNING.",
        "RUNNING + FINISH -> COMPLETED.",
        "All other transitions return INVALID_TRANSITION.",
      ],
      tests: [
        { name: "Start queued job", args: ["QUEUED", "START"], expected: "RUNNING" },
        { name: "Finish running job", args: ["RUNNING", "FINISH"], expected: "COMPLETED" },
        {
          name: "Cannot finish queued job",
          args: ["QUEUED", "FINISH"],
          expected: "INVALID_TRANSITION",
        },
        {
          name: "Cannot start running job",
          args: ["RUNNING", "START"],
          expected: "INVALID_TRANSITION",
        },
      ],
      explanationPrompt:
        "Explain how strict state transitions prevent workers from executing or completing the same job more than once.",
      mermaid: `graph LR
    A[QUEUED] -->|START| B[RUNNING]
    B -->|FINISH| C[COMPLETED]`,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Case 28: Circuit Breaker Pattern
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cs-circuit-breaker-pattern-028",
    slug: "circuit-breaker-pattern",
    index: "28",
    title: "How Does a Circuit Breaker Stop Cascading Failures in Microservices?",
    shortTitle: "Circuit Breaker",
    category: "Reliability & Scalability",
    subcategory: "Fault Tolerance",
    difficulty: "Advanced",
    learnerLevel: "Engineer",
    estimatedTime: "50-65 minutes",
    minutes: 55,
    status: "published",
    tier: "premium",
    rcCost: 60,
    summary:
      "When a payment partner or database starts crashing and timing out, continuing to send requests exhausts all server threads and brings down the entire application. Discover how Circuit Breakers trip OPEN to fail fast and self-heal with HALF-OPEN probes.",
    learningObjectives: [
      "Understand how slow downstream dependencies cause thread pool exhaustion.",
      "Trace the 3 states: CLOSED (normal), OPEN (fail fast), and HALF-OPEN (testing recovery).",
      "Implement failure threshold trip logic with recovery cooldown timers.",
    ],
    prerequisites: ["Timeouts", "Microservice RPCs", "State machines"],
    engineeringConcepts: [
      "Circuit Breaker",
      "Fail-Fast",
      "Half-Open Probe",
      "Cascading Failure Mitigation",
    ],
    technologies: ["Resilience4j", "Microservices", "Python", "Java", "C"],
    tech: ["Circuit Breaker", "Fail Fast", "Half-Open"],
    tags: ["circuit-breaker", "resilience", "microservices", "fault-tolerance"],
    glossary: [
      {
        term: "Circuit Breaker",
        plainDefinition:
          "A design pattern that detects failures and encapsulates the logic of preventing a failure from constantly recurring.",
      },
      {
        term: "Fail Fast",
        plainDefinition:
          "Immediately returning an error or cached fallback without wasting time attempting an operation known to be failing.",
      },
    ],
    primers: [
      {
        concept: "The Anatomy of a Cascading Outage",
        minutes: 4,
        definition:
          "If Service A calls Service B with a 10s timeout, and Service B hangs, Service A's 100 worker threads freeze waiting for B. Soon Service A runs out of threads and crashes too.",
        whyNeeded:
          "Failing fast in 1ms preserves your server's health while downstream services reboot.",
        analogy:
          "An electrical circuit breaker in your home tripping to cut current before overheating wires start an electrical fire.",
        tinyExample: "if breaker.is_open(): return fallback_response()",
      },
    ],
    discover: {
      situation: "An external recommendation service begins timing out under heavy traffic.",
      humanFlow: [
        "User opens home page",
        "Recommendation engine is down",
        "Circuit breaker trips",
        "Home page loads in 50ms with default products instead of freezing for 30s",
      ],
      question:
        "How do we prevent one failing dependency from dragging down the entire microservice ecosystem?",
      whyItExists: [
        "Thread pool protection",
        "Degraded graceful mode operation",
        "Automated dependency recovery detection",
      ],
    },
    understand: {
      overview:
        "A circuit breaker monitors calls. In CLOSED state, calls pass through. When failures exceed a threshold, it trips to OPEN, rejecting all calls immediately. After a cooldown, it enters HALF-OPEN to send test probes.",
      components: [
        {
          name: "Failure Counter",
          whatIsIt: "Sliding failure window tracker",
          whyItExists: "Detects persistent failure rate",
          whatItDoes: "Trips breaker when threshold met",
        },
        {
          name: "Cooldown Timer",
          whatIsIt: "Recovery countdown",
          whyItExists: "Gives downstream service time to reboot",
          whatItDoes: "Transitions to HALF-OPEN",
        },
      ],
      analogy: {
        title: "Electrical Breaker",
        everyday: [
          "Too many appliances overload the wire.",
          "The switch flips off.",
          "You unplug appliances, wait, and cautiously flip the switch back on.",
        ],
        technical: [
          "Overload is downstream failure.",
          "Switch flip is OPEN state.",
          "Cautiously testing is HALF-OPEN probe.",
        ],
      },
      flow: [
        "Calls succeed (CLOSED)",
        "5 consecutive failures occur",
        "Breaker trips to OPEN (fail fast)",
        "Wait 30 seconds cooldown",
        "Send 1 trial call (HALF-OPEN)",
        "If trial succeeds -> CLOSED; else -> OPEN",
      ],
    },
    concepts: [
      {
        id: "three-breaker-states",
        name: "The 3 Circuit States",
        difficulty: "Advanced",
        simpleDefinition:
          "CLOSED (operating normally), OPEN (failing fast immediately), and HALF-OPEN (testing trial request).",
        whyItExists: "Provides graceful degradation and automated self-healing.",
        realWorldAnalogy:
          "Green light (go), Red light (stop), Yellow blinking light (proceed with caution).",
        technicalExplanation:
          "State transitions are triggered by failure ratios and cooldown expiration timestamps.",
        caseApplication: "Wraps external credit card processing and downstream database RPC calls.",
        commonMistakes: ["Failing to set a cooldown timer, leaving the circuit OPEN forever."],
        practice: ["Draw the state transition table between CLOSED, OPEN, and HALF-OPEN."],
      },
    ],
    architecture: {
      caption: "Circuit breaker 3-state transition state machine",
      levels: [
        {
          title: "State Machine",
          description: "CLOSED -> OPEN -> HALF-OPEN -> CLOSED",
          mermaid: `graph TD
    Closed[CLOSED: Normal Traffic] -->|Failures >= Threshold| Open[OPEN: Fail Fast]
    Open -->|Cooldown Elapsed| Half[HALF-OPEN: Test Probe]
    Half -->|Probe Success| Closed
    Half -->|Probe Failure| Open`,
        },
      ],
    },
    decisions: [
      {
        title: "Circuit Breaker vs Infinite Retries",
        what: "Circuit Breaker with Fast Fallback",
        why: "Preserves server thread pool and protects failing services",
        problemSolved: "Preventing thread exhaustion and cascading distributed system failure",
        withoutIt: "A single slow dependency takes down every service in the company",
        alternatives: ["Blind retry with timeout", "Manual feature flagging"],
        tradeoff: "Users receive degraded or fallback data while circuit is OPEN",
      },
    ],
    implementation: {
      behaviour:
        "Tracks consecutive failures and enforces state transitions between CLOSED, OPEN, and HALF-OPEN.",
      algorithm: [
        "1. If state == OPEN and now >= open_until, transition to HALF-OPEN.",
        "2. If state == OPEN, return False (fail fast).",
        "3. On success: if HALF-OPEN, reset to CLOSED and failures=0.",
        "4. On failure: increment failures. If failures >= threshold, state=OPEN and open_until=now+cooldown.",
      ],
      ladder: [
        { level: "LEVEL 0", title: "Failure Counter", detail: "Count failures and alert." },
        {
          level: "LEVEL 1",
          title: "Binary Open/Close",
          detail: "Trips open when threshold reached.",
        },
        {
          level: "LEVEL 2",
          title: "Half-Open Recovery",
          detail: "Probes downstream service to automatically heal.",
        },
      ],
      samples: [
        {
          language: "python",
          filename: "circuit_breaker.py",
          code: `class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, cooldown_seconds: int = 30):
        self.threshold = failure_threshold
        self.cooldown = cooldown_seconds
        self.state = "CLOSED"
        self.failures = 0
        self.open_until = 0

    def can_attempt(self, now: int) -> bool:
        if self.state == "OPEN":
            if now >= self.open_until:
                self.state = "HALF_OPEN"
                return True
            return False # Fail fast
        return True

    def record_result(self, success: bool, now: int):
        if success:
            self.state = "CLOSED"
            self.failures = 0
        else:
            self.failures += 1
            if self.failures >= self.threshold or self.state == "HALF_OPEN":
                self.state = "OPEN"
                self.open_until = now + self.cooldown`,
          explanations: [
            {
              code: "if now >= self.open_until: self.state = 'HALF_OPEN'; return True",
              explanation: "Allows a single probe request after cooldown expires.",
            },
            {
              code: "return False # Fail fast",
              explanation: "Immediately rejects request without waiting on the failing dependency.",
            },
          ],
        },
        {
          language: "java",
          filename: "CircuitBreaker.java",
          code: `public class CircuitBreaker {
    private final int threshold;
    private final int cooldown;
    private String state = "CLOSED";
    private int failures = 0;
    private long openUntil = 0;

    public CircuitBreaker(int threshold, int cooldown) {
        this.threshold = threshold;
        this.cooldown = cooldown;
    }

    public synchronized boolean canAttempt(long now) {
        if ("OPEN".equals(state)) {
            if (now >= openUntil) {
                state = "HALF_OPEN";
                return true;
            }
            return false;
        }
        return true;
    }

    public synchronized void recordResult(boolean success, long now) {
        if (success) {
            state = "CLOSED";
            failures = 0;
        } else {
            failures++;
            if (failures >= threshold || "HALF_OPEN".equals(state)) {
                state = "OPEN";
                openUntil = now + cooldown;
            }
        }
    }

    public String getState() { return state; }
}`,
          explanations: [
            {
              code: 'if (failures >= threshold || "HALF_OPEN".equals(state))',
              explanation: "Trips to OPEN if threshold exceeded or test probe fails.",
            },
          ],
        },
        {
          language: "c",
          filename: "circuit_breaker.c",
          code: `#include <stdio.h>
#include <stdbool.h>

typedef enum { CB_CLOSED, CB_OPEN, CB_HALF_OPEN } CBState;

typedef struct {
    int threshold;
    int cooldown;
    CBState state;
    int failures;
    long open_until;
} CircuitBreaker;

void init_breaker(CircuitBreaker *cb, int threshold, int cooldown) {
    cb->threshold = threshold;
    cb->cooldown = cooldown;
    cb->state = CB_CLOSED;
    cb->failures = 0;
    cb->open_until = 0;
}

bool can_attempt(CircuitBreaker *cb, long now) {
    if (cb->state == CB_OPEN) {
        if (now >= cb->open_until) {
            cb->state = CB_HALF_OPEN;
            return true;
        }
        return false;
    }
    return true;
}

void record_result(CircuitBreaker *cb, bool success, long now) {
    if (success) {
        cb->state = CB_CLOSED;
        cb->failures = 0;
    } else {
        cb->failures++;
        if (cb->failures >= cb->threshold || cb->state == CB_HALF_OPEN) {
            cb->state = CB_OPEN;
            cb->open_until = now + cb->cooldown;
        }
    }
}`,
          explanations: [
            {
              code: "if (cb->state == CB_OPEN && now < cb->open_until) return false;",
              explanation: "Enforces immediate fail-fast error rejection.",
            },
          ],
        },
      ],
      simulationNote: "Models the 3-state circuit breaker state machine.",
    },
    practice: [
      {
        level: "Understand",
        title: "Trace Transitions",
        brief: "What state does the breaker enter after 3 consecutive failures? After cooldown?",
      },
      {
        level: "Modify",
        title: "Fallback Value",
        brief: "Return cached stale data when can_attempt() returns false.",
      },
      {
        level: "Build",
        title: "Percentage Threshold",
        brief: "Trip when failure rate exceeds 50% over a 100-request window.",
      },
      {
        level: "Think",
        title: "Cascading Cascade",
        brief: "What happens if the fallback service itself fails?",
      },
    ],
    reflection: [
      "Why is failing fast in 1ms drastically better for server health than timing out in 10 seconds?",
      "How does the HALF-OPEN state safely probe recovery without overwhelming a fragile downstream service?",
    ],
    techNotes: [
      {
        name: "Resilience4j & Envoy",
        kind: "Standard",
        note: "Resilience4j in Java and Envoy Service Mesh proxies implement Circuit Breaking at the network layer transparently.",
      },
    ],
    codeLab: {
      title: "Circuit Breaker State Machine",
      brief:
        "Write a function evaluate_breaker(state, failures, threshold, is_success, now, open_until). Return [new_state, new_failures, new_open_until]. If is_success is True, reset to ['CLOSED', 0, 0]. If is_success is False, increment failures. If failures + 1 >= threshold, trip to ['OPEN', failures + 1, now + 30]. Otherwise return [state, failures + 1, open_until].",
      functionName: "evaluate_breaker",
      signature:
        "def evaluate_breaker(state: str, failures: int, threshold: int, is_success: bool, now: int, open_until: int) -> list:",
      starterCode: `def evaluate_breaker(state, failures, threshold, is_success, now, open_until):
    # Enforce circuit breaker transitions
    pass
`,
      javaSignature:
        "public static Object[] evaluateBreaker(String state, int failures, int threshold, boolean isSuccess, int now, int openUntil)",
      javaStarterCode: `public class Solution {
    public static Object[] evaluateBreaker(String state, int failures, int threshold, boolean isSuccess, int now, int openUntil) {
        if (isSuccess) return new Object[]{"CLOSED", 0, 0};
        int newFailures = failures + 1;
        if (newFailures >= threshold) {
            return new Object[]{"OPEN", newFailures, now + 30};
        }
        return new Object[]{state, newFailures, openUntil};
    }
}
`,
      cSignature:
        "bool evaluate_breaker(const char *state, int failures, int threshold, bool is_success, int now, int open_until, char *out_state, int *out_fail, int *out_until)",
      cStarterCode: `// Circuit breaker evaluator in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool evaluate_breaker(const char *state, int failures, int threshold, bool is_success, int now, int open_until, char *out_state, int *out_fail, int *out_until) {
    if (is_success) {
        strcpy(out_state, "CLOSED");
        *out_fail = 0;
        *out_until = 0;
        return true;
    }
    int new_failures = failures + 1;
    if (new_failures >= threshold) {
        strcpy(out_state, "OPEN");
        *out_fail = new_failures;
        *out_until = now + 30;
        return false;
    }
    strcpy(out_state, state);
    *out_fail = new_failures;
    *out_until = open_until;
    return false;
}
`,
      hints: [
        "If is_success: return CLOSED with 0 failures.",
        "If not is_success: check if failures + 1 >= threshold to trip OPEN.",
      ],
      tests: [
        {
          name: "Success resets to closed",
          args: ["OPEN", 3, 3, true, 100, 130],
          expected: ["CLOSED", 0, 0],
        },
        {
          name: "Failure trips open",
          args: ["CLOSED", 2, 3, false, 100, 0],
          expected: ["OPEN", 3, 130],
        },
        {
          name: "Failure below threshold",
          args: ["CLOSED", 0, 3, false, 100, 0],
          expected: ["CLOSED", 1, 0],
        },
      ],
      explanationPrompt:
        "Explain how resetting failures to 0 on success allows the circuit breaker to recover cleanly.",
      mermaid: `graph TD
    A[Call Result] --> B{Success?}
    B -- Yes --> C[Reset: CLOSED, Failures=0]
    B -- No --> D{Failures + 1 >= Threshold?}
    D -- Yes --> E[Trip: OPEN, Cooldown=30s]
    D -- No --> F[Remain: Failures + 1]`,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Case 29: Server Health Checks & Failover
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cs-server-health-monitoring-029",
    slug: "server-health-monitoring",
    index: "29",
    title: "How Do Health Checks and Active Failover Remove Dead Servers from Traffic?",
    shortTitle: "Health & Failover",
    category: "Reliability & Scalability",
    subcategory: "High Availability",
    difficulty: "Advanced",
    learnerLevel: "Engineer",
    estimatedTime: "50-65 minutes",
    minutes: 55,
    status: "published",
    tier: "premium",
    rcCost: 60,
    summary:
      "When a cloud server experiences a kernel panic or out-of-memory crash, user traffic directed to it fails completely. Learn how synthetic heartbeat probes, consecutive failure thresholds, and dynamic load balancer pools route traffic around dead nodes seamlessly.",
    learningObjectives: [
      "Distinguish between liveness probes ('Is the process alive?') and readiness probes ('Can it serve traffic?').",
      "Understand why single-probe failures must not trigger panic failovers (dampening with thresholds).",
      "Implement an active server pool health tracker with automatic pruning and re-admission.",
    ],
    prerequisites: ["Load Balancer fundamentals", "HTTP status codes (200 vs 503)", "Timers"],
    engineeringConcepts: [
      "Liveness Probes",
      "Readiness Probes",
      "Flap Dampening",
      "Dynamic Pool Failover",
    ],
    technologies: ["Kubernetes", "HAProxy", "Python", "Java", "C"],
    tech: ["Liveness Probe", "Failover", "Readiness"],
    tags: ["health-checks", "failover", "high-availability", "infrastructure"],
    glossary: [
      {
        term: "Liveness Probe",
        plainDefinition:
          "A check that tests whether an application process has locked up and needs to be restarted.",
      },
      {
        term: "Readiness Probe",
        plainDefinition:
          "A check that tests whether an application is fully loaded (database connected, cache warm) and ready to receive customer traffic.",
      },
    ],
    primers: [
      {
        concept: "The Flapping Server Problem",
        minutes: 4,
        definition:
          "If a single packet drop marks a server dead, and the next packet marks it alive, the load balancer 'flaps' routing tables continuously.",
        whyNeeded:
          "Requiring 3 consecutive failures to evict and 2 consecutive successes to admit stabilizes routing.",
        analogy:
          "A doctor taking your pulse three times to be sure, rather than declaring an emergency because of one missed beat.",
        tinyExample: "if consecutive_failures >= 3: pool.remove(server)",
      },
    ],
    discover: {
      situation: "Cloud instances crash without warning due to hardware faults or memory leaks.",
      humanFlow: [
        "Server 3 crashes",
        "Health checker detects 3 missed probes in 6 seconds",
        "Load balancer removes Server 3 from routing table",
        "0% of users experience broken pages",
      ],
      question:
        "How do load balancers detect and remove dead servers before customers notice broken requests?",
      whyItExists: [
        "99.99% uptime guarantees",
        "Zero-downtime rolling deployments",
        "Automated cluster self-healing",
      ],
    },
    understand: {
      overview:
        "Health monitors ping `/healthz` on each backend server every 2 seconds. Counters track consecutive results. When a server fails 3 consecutive checks, it is removed from the active pool. When it passes 2 in a row, it is restored.",
      components: [
        {
          name: "Health Prober",
          whatIsIt: "Synthetic heartbeat pinger",
          whyItExists: "Tests instance responsiveness",
          whatItDoes: "Sends HTTP GET /healthz",
        },
        {
          name: "Routing Pool",
          whatIsIt: "List of vetted live instances",
          whyItExists: "Directs customer requests safely",
          whatItDoes: "Distributes web traffic",
        },
      ],
      analogy: {
        title: "Airport Runway Inspector",
        everyday: [
          "An inspector drives down the runway checking for debris.",
          "If debris is spotted, flights are diverted to runway 2 immediately.",
        ],
        technical: [
          "Inspector is Health Prober.",
          "Diverting flights is Load Balancer Pool Failover.",
        ],
      },
      flow: [
        "Prober pings server",
        "Server returns HTTP 200 -> reset failure count",
        "Server returns 500 or times out -> increment failure count",
        "If failures >= 3, evict from active pool",
      ],
    },
    concepts: [
      {
        id: "flap-dampening",
        name: "Flap Dampening Thresholds",
        difficulty: "Advanced",
        simpleDefinition: "Requiring multiple consecutive results before changing routing status.",
        whyItExists:
          "Prevents transient network blips from constantly churn-rebuilding load balancer tables.",
        realWorldAnalogy: "Requiring three strikes before an umpire calls an out in baseball.",
        technicalExplanation:
          "Enforces hysteresis: `unhealthy_threshold = 3`, `healthy_threshold = 2`.",
        caseApplication: "Used in Kubernetes, AWS ELB, and HAProxy backend configurations.",
        commonMistakes: [
          "Failing over immediately on 1 failed ping during a temporary network switch blip.",
        ],
        practice: ["Calculate the state of a server after results: [FAIL, OK, FAIL, FAIL, OK]."],
      },
    ],
    architecture: {
      caption: "Active health monitoring and automatic pool pruning",
      levels: [
        {
          title: "Dynamic Pool Failover",
          description: "Dead nodes are evicted from the active traffic rotation",
          mermaid: `graph TD
    Monitor[Health Monitor Probe] --> S1[Server 1: 200 OK]
    Monitor --> S2[Server 2: Timeout x3]
    S1 --> Pool[Active Traffic Pool: Server 1]
    S2 -.->|Evicted| Pool`,
        },
      ],
    },
    decisions: [
      {
        title: "Active Probing vs Passive Error Sniffing",
        what: "Active synthetic HTTP health probes",
        why: "Detects dead servers before real customers send requests to them",
        problemSolved:
          "Passive sniffing requires users to experience broken requests before errors are detected",
        withoutIt: "The first several customers hitting a dead node would suffer failed page loads",
        alternatives: ["Passive error rate monitoring", "Manual operator intervention"],
        tradeoff: "Generates continuous synthetic network traffic between monitor and backends",
      },
    ],
    implementation: {
      behaviour: "Tracks consecutive probe outcomes and manages active server pool membership.",
      algorithm: [
        "1. On probe failure: increment consecutive_fails, reset consecutive_passes to 0.",
        "2. If consecutive_fails >= 3: mark server UNHEALTHY and remove from active pool.",
        "3. On probe success: increment consecutive_passes, reset consecutive_fails to 0.",
        "4. If consecutive_passes >= 2: mark server HEALTHY and restore to active pool.",
      ],
      ladder: [
        { level: "LEVEL 0", title: "Single Ping Check", detail: "Removes on single failure." },
        {
          level: "LEVEL 1",
          title: "Consecutive Thresholds",
          detail: "Dampens flapping with fail/pass counts.",
        },
        {
          level: "LEVEL 2",
          title: "Readiness vs Liveness",
          detail: "Separates traffic drain from container restart.",
        },
      ],
      samples: [
        {
          language: "python",
          filename: "health_monitor.py",
          code: `class ServerHealthTracker:
    def __init__(self, fail_threshold: int = 3, pass_threshold: int = 2):
        self.fail_threshold = fail_threshold
        self.pass_threshold = pass_threshold
        self.servers = {} # server_id -> {"status": "HEALTHY", "fails": 0, "passes": 0}

    def register(self, server_id: str):
        self.servers[server_id] = {"status": "HEALTHY", "fails": 0, "passes": 0}

    def record_probe(self, server_id: str, is_up: bool):
        s = self.servers[server_id]
        if is_up:
            s["passes"] += 1
            s["fails"] = 0
            if s["passes"] >= self.pass_threshold:
                s["status"] = "HEALTHY"
        else:
            s["fails"] += 1
            s["passes"] = 0
            if s["fails"] >= self.fail_threshold:
                s["status"] = "UNHEALTHY"

    def get_active_pool(self) -> list[str]:
        return [sid for sid, s in self.servers.items() if s["status"] == "HEALTHY"]`,
          explanations: [
            {
              code: "if s['fails'] >= self.fail_threshold: s['status'] = 'UNHEALTHY'",
              explanation: "Evicts server from active routing pool after 3 consecutive failures.",
            },
            {
              code: "if s['passes'] >= self.pass_threshold: s['status'] = 'HEALTHY'",
              explanation:
                "Restores server to active pool only after 2 consecutive clean health checks.",
            },
          ],
        },
        {
          language: "java",
          filename: "ServerHealthTracker.java",
          code: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ServerHealthTracker {
    private static class Node {
        String status = "HEALTHY";
        int fails = 0;
        int passes = 0;
    }

    private final Map<String, Node> servers = new HashMap<>();

    public synchronized void register(String id) {
        servers.put(id, new Node());
    }

    public synchronized void recordProbe(String id, boolean isUp) {
        if (!servers.containsKey(id)) return;
        Node n = servers.get(id);
        if (isUp) {
            n.passes++;
            n.fails = 0;
            if (n.passes >= 2) n.status = "HEALTHY";
        } else {
            n.fails++;
            n.passes = 0;
            if (n.fails >= 3) n.status = "UNHEALTHY";
        }
    }

    public synchronized List<String> getActivePool() {
        List<String> pool = new ArrayList<>();
        for (Map.Entry<String, Node> e : servers.entrySet()) {
            if ("HEALTHY".equals(e.getValue().status)) pool.add(e.getKey());
        }
        return pool;
    }
}`,
          explanations: [
            {
              code: 'if (n.fails >= 3) n.status = "UNHEALTHY";',
              explanation: "Prunes unhealthy node to protect customer traffic.",
            },
          ],
        },
        {
          language: "c",
          filename: "health_monitor.c",
          code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_SERVERS 16

typedef struct {
    char id[32];
    bool is_healthy;
    int fails;
    int passes;
} ServerNode;

typedef struct {
    ServerNode nodes[MAX_SERVERS];
    int count;
} HealthTracker;

void init_tracker(HealthTracker *ht) { ht->count = 0; }

void add_server(HealthTracker *ht, const char *id) {
    if (ht->count >= MAX_SERVERS) return;
    strncpy(ht->nodes[ht->count].id, id, 31);
    ht->nodes[ht->count].is_healthy = true;
    ht->nodes[ht->count].fails = 0;
    ht->nodes[ht->count].passes = 0;
    ht->count++;
}

void record_probe(HealthTracker *ht, const char *id, bool is_up) {
    for (int i = 0; i < ht->count; i++) {
        if (strcmp(ht->nodes[i].id, id) == 0) {
            if (is_up) {
                ht->nodes[i].passes++;
                ht->nodes[i].fails = 0;
                if (ht->nodes[i].passes >= 2) ht->nodes[i].is_healthy = true;
            } else {
                ht->nodes[i].fails++;
                ht->nodes[i].passes = 0;
                if (ht->nodes[i].fails >= 3) ht->nodes[i].is_healthy = false;
            }
            return;
        }
    }
}`,
          explanations: [
            {
              code: "if (ht->nodes[i].fails >= 3) ht->nodes[i].is_healthy = false;",
              explanation: "Updates health status with hysteresis threshold.",
            },
          ],
        },
      ],
      simulationNote: "Models heartbeat probe accumulation and pool failover.",
    },
    practice: [
      {
        level: "Understand",
        title: "Flapping Prevention",
        brief:
          "Why is requiring 2 consecutive passes better than immediate re-admission on 1 pass?",
      },
      {
        level: "Modify",
        title: "Dynamic Weights",
        brief: "Reduce server traffic weight by 50% on first failure before complete eviction.",
      },
      {
        level: "Build",
        title: "Deep Health Check",
        brief:
          "Verify database read/write capability inside /healthz rather than just process ping.",
      },
      {
        level: "Think",
        title: "Cascading Eviction",
        brief:
          "If 4 out of 5 servers fail, should the load balancer evict all 4 and crash the 5th?",
      },
    ],
    reflection: [
      "Why must automated failover systems implement flap dampening to survive real-world cloud network jitter?",
      "How do Kubernetes liveness probes and readiness probes prevent sending traffic to booting containers?",
    ],
    techNotes: [
      {
        name: "Kubernetes Probes",
        kind: "Standard",
        note: "Kubelet queries livenessProbe (restart on failure) and readinessProbe (route traffic only on success) independently.",
      },
    ],
    codeLab: {
      title: "Failover Status Evaluator",
      brief:
        "Write a function update_node_health(status, fails, passes, is_probe_ok). If is_probe_ok: passes = passes + 1, fails = 0, status = 'HEALTHY' if passes >= 2 else status. If not is_probe_ok: fails = fails + 1, passes = 0, status = 'UNHEALTHY' if fails >= 3 else status. Return [status, fails, passes].",
      functionName: "update_node_health",
      signature:
        "def update_node_health(status: str, fails: int, passes: int, is_probe_ok: bool) -> list:",
      starterCode: `def update_node_health(status, fails, passes, is_probe_ok):
    # Enforce hysteresis failover rules
    pass
`,
      javaSignature:
        "public static Object[] updateNodeHealth(String status, int fails, int passes, boolean isProbeOk)",
      javaStarterCode: `public class Solution {
    public static Object[] updateNodeHealth(String status, int fails, int passes, boolean isProbeOk) {
        if (isProbeOk) {
            int newPasses = passes + 1;
            String newStatus = (newPasses >= 2) ? "HEALTHY" : status;
            return new Object[]{newStatus, 0, newPasses};
        } else {
            int newFails = fails + 1;
            String newStatus = (newFails >= 3) ? "UNHEALTHY" : status;
            return new Object[]{newStatus, newFails, 0};
        }
    }
}
`,
      cSignature:
        "bool update_node_health(const char *status, int fails, int passes, bool is_probe_ok, char *out_status, int *out_fails, int *out_passes)",
      cStarterCode: `// Health check updater in C
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

bool update_node_health(const char *status, int fails, int passes, bool is_probe_ok, char *out_status, int *out_fails, int *out_passes) {
    if (is_probe_ok) {
        int np = passes + 1;
        *out_passes = np;
        *out_fails = 0;
        if (np >= 2) strcpy(out_status, "HEALTHY");
        else strcpy(out_status, status);
        return true;
    } else {
        int nf = fails + 1;
        *out_fails = nf;
        *out_passes = 0;
        if (nf >= 3) strcpy(out_status, "UNHEALTHY");
        else strcpy(out_status, status);
        return false;
    }
}
`,
      hints: [
        "If probe ok: reset fails=0, check if passes >= 2 to restore HEALTHY.",
        "If probe failed: reset passes=0, check if fails >= 3 to evict UNHEALTHY.",
      ],
      tests: [
        {
          name: "3rd failure evicts node",
          args: ["HEALTHY", 2, 0, false],
          expected: ["UNHEALTHY", 3, 0],
        },
        {
          name: "1st failure keeps healthy",
          args: ["HEALTHY", 0, 0, false],
          expected: ["HEALTHY", 1, 0],
        },
        {
          name: "2nd pass restores healthy",
          args: ["UNHEALTHY", 0, 1, true],
          expected: ["HEALTHY", 0, 2],
        },
        {
          name: "1st pass remains unhealthy",
          args: ["UNHEALTHY", 0, 0, true],
          expected: ["UNHEALTHY", 0, 1],
        },
      ],
      explanationPrompt:
        "Explain why resetting the opposite counter to 0 on every probe result prevents lingering stale counts from corrupting threshold decisions.",
      mermaid: `graph TD
    A[Probe Result] --> B{Probe OK?}
    B -- Yes --> C[Passes + 1, Fails = 0]
    C --> D{Passes >= 2?}
    D -- Yes --> E[Status = HEALTHY]
    D -- No --> F[Retain Status]
    B -- No --> G[Fails + 1, Passes = 0]
    G --> H{Fails >= 3?}
    H -- Yes --> I[Status = UNHEALTHY]
    H -- No --> J[Retain Status]`,
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Case 30: Idempotent Payment Processing
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cs-idempotent-payment-processing-030",
    slug: "idempotent-payment-processing",
    index: "30",
    title: "How Does Idempotent Payment Processing Prevent Double Charges?",
    shortTitle: "Idempotent Payments",
    category: "Reliability & Scalability",
    subcategory: "Financial Consistency",
    difficulty: "Advanced",
    learnerLevel: "Engineer",
    estimatedTime: "55-70 minutes",
    minutes: 60,
    status: "published",
    tier: "premium",
    rcCost: 60,
    summary:
      "When a shopper clicks 'Pay $100' and their mobile network cuts out before the response arrives, they click the button again. How does Stripe ensure the customer's credit card is charged exactly once? Discover Idempotency Keys and atomic transaction locks.",
    learningObjectives: [
      "Understand the definition of idempotency: f(f(x)) = f(x).",
      "Trace how idempotency keys convert network retry duplicates into cached response returns.",
      "Implement atomic transaction locking to prevent race conditions during duplicate payment submissions.",
    ],
    prerequisites: ["HTTP POST methods", "Database Transactions", "UUID generation"],
    engineeringConcepts: [
      "Idempotency Keys",
      "Duplicate Request Deduplication",
      "Race Condition Locking",
      "Replay Response Caching",
    ],
    technologies: ["Stripe-style API", "PostgreSQL Locks", "Python", "Java", "C"],
    tech: ["Idempotency-Key", "Atomic Locks", "Deduplication"],
    tags: ["payments", "idempotency", "fintech", "consistency"],
    glossary: [
      {
        term: "Idempotency",
        plainDefinition:
          "A property of an API request where making the exact same call multiple times produces the exact same result as making it once.",
      },
      {
        term: "Idempotency Key",
        plainDefinition:
          "A unique client-generated UUID sent in headers (Idempotency-Key: xxx) identifying a single intended transaction.",
      },
    ],
    primers: [
      {
        concept: "The Two-Generals Network Dilemma in Billing",
        minutes: 4,
        definition:
          "If you send $100 to the bank and the internet drops, you do not know if the bank received your money or if the connection dropped before arrival.",
        whyNeeded: "Without idempotency keys, resending the request risks billing the user twice.",
        analogy:
          "Writing a check number on a payment; the bank cashes check #1042 once, and rejects any second attempt to cash #1042.",
        tinyExample: "headers = {'Idempotency-Key': 'order_789_uuid'}",
      },
    ],
    discover: {
      situation:
        "Shoppers on cellular connections experience intermittent signal drops while clicking 'Confirm Order'.",
      humanFlow: [
        "User clicks 'Pay $100'",
        "Server charges card",
        "WiFi disconnects before response reaches phone",
        "User clicks 'Pay $100' again in panic",
        "User is charged only once",
      ],
      question:
        "How can payment APIs guarantee that duplicate submissions from flaky networks never double-charge customer credit cards?",
      whyItExists: [
        "Financial compliance",
        "Consumer trust and chargeback prevention",
        "Network resilience across mobile networks",
      ],
    },
    understand: {
      overview:
        "When a payment request arrives with `Idempotency-Key`, the server checks if that key has been seen. If already processed, it returns the cached receipt immediately. If currently processing, it locks. If new, it executes and stores the response.",
      components: [
        {
          name: "Idempotency Store",
          whatIsIt: "Key-value ledger of key -> response",
          whyItExists: "Caches confirmed payment receipts",
          whatItDoes: "Answers replays",
        },
        {
          name: "Transaction Lock",
          whatIsIt: "Mutual exclusion lock per key",
          whyItExists: "Prevents concurrent double-clicks from running in parallel",
          whatItDoes: "Serializes duplicate requests",
        },
      ],
      analogy: {
        title: "Unique Invoice Number",
        everyday: [
          "Your landlord gives you invoice #901.",
          "You pay it.",
          "If your roommate brings another check for invoice #901, the landlord says 'Already paid!'",
        ],
        technical: [
          "Invoice #901 is the Idempotency Key.",
          "Landlord checking the ledger is response replay.",
        ],
      },
      flow: [
        "Client generates unique UUID",
        "Sends POST /charge with Idempotency-Key",
        "Server checks ledger: if seen, return cached receipt",
        "If unseen, acquire lock, charge bank, save receipt, return response",
      ],
    },
    concepts: [
      {
        id: "idempotency-keys",
        name: "Idempotency Keys",
        difficulty: "Advanced",
        simpleDefinition:
          "A unique token sent by the client that allows the server to recognize retried requests.",
        whyItExists: "Makes non-idempotent HTTP POST operations safely retryable.",
        realWorldAnalogy:
          "A passport number: having 2 copies of your passport does not make you 2 different citizens.",
        technicalExplanation:
          "The server stores `(idempotency_key, payload_hash, response_status, response_body)`. Identical keys replay the stored response.",
        caseApplication: "Used on all Stripe, PayPal, and Adyen charge creation endpoints.",
        commonMistakes: ["Using timestamps instead of client-generated UUIDs as idempotency keys."],
        practice: [
          "Design what response to return if the same key is reused with a different dollar amount.",
        ],
      },
    ],
    architecture: {
      caption: "Idempotent transaction deduplication and response cache",
      levels: [
        {
          title: "Idempotent Gateway Pipeline",
          description: "Unseen keys execute payment; duplicate keys replay cached receipt",
          mermaid: `graph TD
    Req[POST /charges + Idempotency-Key] --> Check{Key Exists in Store?}
    Check -- Yes: Completed --> Replay[Return Cached Receipt -> Charge Once]
    Check -- Yes: In-Progress --> Lock[Return 409 Conflict: Processing]
    Check -- No --> Exec[Acquire Lock -> Execute Charge -> Cache Receipt]`,
        },
      ],
    },
    decisions: [
      {
        title: "Client-Generated UUID vs Server-Assigned ID",
        what: "Client generates Idempotency-Key before transmission",
        why: "Ensures network disconnects before reaching server don't change transaction identity",
        problemSolved: "If server generated the ID, the client wouldn't have it to retry with",
        withoutIt:
          "Network timeouts before the response would require creating fresh unlinked transactions",
        alternatives: ["Session-based deduplication", "User-level locking"],
        tradeoff: "Clients must generate clean UUIDs and preserve them across retry loops",
      },
    ],
    implementation: {
      behaviour:
        "Stores executed payments by idempotency key and replays receipts on duplicate submissions.",
      algorithm: [
        "1. Check if key in idempotency_store.",
        "2. If found with status='COMPLETED', return cached receipt with is_replay=True.",
        "3. If found with status='IN_PROGRESS', return 409 Conflict.",
        "4. If not found, lock key, execute charge, record receipt, and return is_replay=False.",
      ],
      ladder: [
        { level: "LEVEL 0", title: "Naïve Charge", detail: "Charges card on every request." },
        { level: "LEVEL 1", title: "Keyed Cache", detail: "Replays receipt for seen keys." },
        {
          level: "LEVEL 2",
          title: "Concurrent Locks",
          detail: "Locks key to reject parallel double-clicks.",
        },
      ],
      samples: [
        {
          language: "python",
          filename: "idempotent_payment.py",
          code: `class IdempotentPaymentGateway:
    def __init__(self):
        self.ledger = {} # key -> {"status": "COMPLETED", "amount": int, "tx_id": str}
        self.tx_counter = 1000

    def process_charge(self, idempotency_key: str, amount: int) -> dict:
        if idempotency_key in self.ledger:
            record = self.ledger[idempotency_key]
            return {
                "status": "SUCCESS",
                "tx_id": record["tx_id"],
                "amount": record["amount"],
                "is_replay": True
            }

        self.tx_counter += 1
        tx_id = f"tx_{self.tx_counter}"
        self.ledger[idempotency_key] = {
            "status": "COMPLETED",
            "amount": amount,
            "tx_id": tx_id
        }
        return {
            "status": "SUCCESS",
            "tx_id": tx_id,
            "amount": amount,
            "is_replay": False
        }`,
          explanations: [
            {
              code: "if idempotency_key in self.ledger: return { ... 'is_replay': True }",
              explanation:
                "Returns the original receipt without executing a second credit card charge.",
            },
            {
              code: "self.ledger[idempotency_key] = ...",
              explanation: "Records the transaction result keyed by the client's idempotency key.",
            },
          ],
        },
        {
          language: "java",
          filename: "IdempotentPaymentGateway.java",
          code: `import java.util.HashMap;
import java.util.Map;

public class IdempotentPaymentGateway {
    private static class Receipt {
        String txId;
        int amount;
        Receipt(String txId, int amount) {
            this.txId = txId;
            this.amount = amount;
        }
    }

    private final Map<String, Receipt> ledger = new HashMap<>();
    private int txCounter = 1000;

    public synchronized Map<String, Object> processCharge(String idempotencyKey, int amount) {
        Map<String, Object> res = new HashMap<>();
        if (ledger.containsKey(idempotencyKey)) {
            Receipt r = ledger.get(idempotencyKey);
            res.put("status", "SUCCESS");
            res.put("txId", r.txId);
            res.put("amount", r.amount);
            res.put("isReplay", true);
            return res;
        }

        txCounter++;
        String txId = "tx_" + txCounter;
        ledger.put(idempotencyKey, new Receipt(txId, amount));
        res.put("status", "SUCCESS");
        res.put("txId", txId);
        res.put("amount", amount);
        res.put("isReplay", false);
        return res;
    }
}`,
          explanations: [
            {
              code: "if (ledger.containsKey(idempotencyKey))",
              explanation: "Deduplicates retried payments using synchronized ledger lookup.",
            },
          ],
        },
        {
          language: "c",
          filename: "idempotent_payment.c",
          code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_PAYMENTS 64

typedef struct {
    char key[64];
    char tx_id[32];
    int amount;
    bool active;
} PaymentRecord;

typedef struct {
    PaymentRecord records[MAX_PAYMENTS];
    int count;
    int tx_counter;
} PaymentGateway;

void init_gateway(PaymentGateway *pg) {
    pg->count = 0;
    pg->tx_counter = 1000;
}

bool process_charge(PaymentGateway *pg, const char *key, int amount, char *out_tx_id, bool *is_replay) {
    for (int i = 0; i < pg->count; i++) {
        if (pg->records[i].active && strcmp(pg->records[i].key, key) == 0) {
            strcpy(out_tx_id, pg->records[i].tx_id);
            *is_replay = true;
            return true;
        }
    }
    if (pg->count >= MAX_PAYMENTS) return false;
    pg->tx_counter++;
    sprintf(pg->records[pg->count].tx_id, "tx_%d", pg->tx_counter);
    strncpy(pg->records[pg->count].key, key, 63);
    pg->records[pg->count].amount = amount;
    pg->records[pg->count].active = true;
    strcpy(out_tx_id, pg->records[pg->count].tx_id);
    *is_replay = false;
    pg->count++;
    return true;
}`,
          explanations: [
            {
              code: "if (strcmp(pg->records[i].key, key) == 0) { *is_replay = true; return true; }",
              explanation: "Replays existing transaction ID on identical idempotency key.",
            },
          ],
        },
      ],
      simulationNote: "Models idempotency key transaction ledger and response replay.",
    },
    practice: [
      {
        level: "Understand",
        title: "Two-Generals Problem",
        brief:
          "Why is it mathematically impossible to guarantee both parties know the message arrived over an unreliable network?",
      },
      {
        level: "Modify",
        title: "Payload Mismatch Check",
        brief: "Return 422 Unprocessable Entity if the key is reused with a different amount.",
      },
      {
        level: "Build",
        title: "Redis Distributed Lock",
        brief: "Implement a 30-second SET NX lock during the charge phase.",
      },
      {
        level: "Think",
        title: "Idempotency TTL",
        brief:
          "How long should idempotency keys be remembered in the database? 24 hours? 7 days? Forever?",
      },
    ],
    reflection: [
      "Why is client-side UUID generation essential for network-resilient financial operations?",
      "How do idempotency keys convert potentially dangerous duplicate HTTP POST operations into safe replays?",
    ],
    techNotes: [
      {
        name: "Stripe Idempotency Spec",
        kind: "Standard",
        note: "Stripe's API popularized the Idempotency-Key HTTP header, requiring 24-hour persistence and payload match validation.",
      },
    ],
    codeLab: {
      title: "Idempotent Charge Engine",
      brief:
        "Write a function execute_idempotent_charge(seen_keys, key, amount). If key is in seen_keys, return [True, seen_keys[key], 'REPLAY']. Otherwise generate tx_id = 'tx_' + key, save to seen_keys, and return [True, tx_id, 'CHARGED'].",
      functionName: "execute_idempotent_charge",
      signature: "def execute_idempotent_charge(seen_keys: dict, key: str, amount: int) -> list:",
      starterCode: `def execute_idempotent_charge(seen_keys, key, amount):
    # If key in seen_keys -> return REPLAY
    # Else -> generate tx_id and return CHARGED
    pass
`,
      javaSignature:
        "public static Object[] executeIdempotentCharge(java.util.Map<String, String> seenKeys, String key, int amount)",
      javaStarterCode: `public class Solution {
    public static Object[] executeIdempotentCharge(java.util.Map<String, String> seenKeys, String key, int amount) {
        if (seenKeys.containsKey(key)) {
            return new Object[]{true, seenKeys.get(key), "REPLAY"};
        }
        String txId = "tx_" + key;
        seenKeys.put(key, txId);
        return new Object[]{true, txId, "CHARGED"};
    }
}
`,
      cSignature:
        "bool execute_idempotent_charge(const char *seen_keys[][2], int seen_count, const char *key, int amount, char *out_tx, char *out_status)",
      cStarterCode: `// Idempotent charge in C
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

bool execute_idempotent_charge(const char *seen_keys[][2], int seen_count, const char *key, int amount, char *out_tx, char *out_status) {
    for (int i = 0; i < seen_count; i++) {
        if (strcmp(seen_keys[i][0], key) == 0) {
            strcpy(out_tx, seen_keys[i][1]);
            strcpy(out_status, "REPLAY");
            return true;
        }
    }
    sprintf(out_tx, "tx_%s", key);
    strcpy(out_status, "CHARGED");
    return true;
}
`,
      hints: [
        "If key in seen_keys: return [True, seen_keys[key], 'REPLAY'].",
        "Otherwise: assign tx_id = 'tx_' + key and return [True, tx_id, 'CHARGED'].",
      ],
      tests: [
        {
          name: "First charge executes",
          args: [{}, "k1", 100],
          expected: [true, "tx_k1", "CHARGED"],
        },
        {
          name: "Duplicate key returns replay",
          args: [{ k1: "tx_k1" }, "k1", 100],
          expected: [true, "tx_k1", "REPLAY"],
        },
        {
          name: "Second unique key executes",
          args: [{ k1: "tx_k1" }, "k2", 50],
          expected: [true, "tx_k2", "CHARGED"],
        },
      ],
      explanationPrompt:
        "Explain how returning the cached transaction receipt prevents the credit card from being debited twice.",
      mermaid: `graph TD
    A[Charge Request] --> B{Key in Seen Keys?}
    B -- Yes --> C[Return Cached Tx ID -> REPLAY]
    B -- No --> D[Generate Tx ID -> Save -> CHARGED]`,
    },
  },
];
