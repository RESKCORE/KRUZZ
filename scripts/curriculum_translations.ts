// ============================================================================
// Multi-Language Code Samples & C Signatures for Existing 25 Case Studies
// Provides idiomatic, production-grade Java and C implementations matching
// the existing Python logic and learning ladders.
// ============================================================================

export interface LanguageAdditions {
  java?: {
    filename: string;
    code: string;
    explanations: { code: string; explanation: string }[];
  };
  c?: {
    filename: string;
    code: string;
    explanations: { code: string; explanation: string }[];
  };
  cCodeLab?: {
    cSignature: string;
    cStarterCode: string;
  };
}

export const CASE_TRANSLATIONS: Record<string, LanguageAdditions> = {
  // Case 01: ATM Machine (already has Python, Java, C - provide C codeLab signature)
  "atm-machine": {
    cCodeLab: {
      cSignature: "bool process_atm_withdrawal(int balance, const char *pin, const char *entered_pin, int amount, int *new_balance, char *message)",
      cStarterCode: `// ATM Withdrawal Guard in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool process_atm_withdrawal(int balance, const char *pin, const char *entered_pin, int amount, int *new_balance, char *message) {
    if (strcmp(pin, entered_pin) != 0) {
        *new_balance = balance;
        strcpy(message, "INVALID_PIN");
        return false;
    }
    if (amount <= 0) {
        *new_balance = balance;
        strcpy(message, "INVALID_AMOUNT");
        return false;
    }
    if (amount > balance) {
        *new_balance = balance;
        strcpy(message, "INSUFFICIENT_FUNDS");
        return false;
    }
    *new_balance = balance - amount;
    strcpy(message, "SUCCESS");
    return true;
}
`,
    },
  },

  // Case 02: Library Management
  "library-management": {
    java: {
      filename: "LibrarySystem.java",
      code: `import java.util.ArrayList;
import java.util.List;

public class LibrarySystem {
    public static class Book {
        public final String bookId;
        public final String title;
        public boolean isBorrowed;

        public Book(String bookId, String title) {
            this.bookId = bookId;
            this.title = title;
            this.isBorrowed = false;
        }
    }

    public static class Member {
        public final String memberId;
        public final int maxLimit;
        public final List<Book> borrowedBooks;

        public Member(String memberId, int maxLimit) {
            this.memberId = memberId;
            this.maxLimit = maxLimit;
            this.borrowedBooks = new ArrayList<>();
        }

        public boolean canBorrow() {
            return borrowedBooks.size() < maxLimit;
        }

        public boolean borrowBook(Book book) {
            if (book.isBorrowed || !canBorrow()) {
                return false;
            }
            book.isBorrowed = true;
            borrowedBooks.add(book);
            return true;
        }
    }
}`,
      explanations: [
        {
          code: "public boolean canBorrow() { return borrowedBooks.size() < maxLimit; }",
          explanation: "Guards the member's borrowing quota before allowing any book checkout.",
        },
        {
          code: "if (book.isBorrowed || !canBorrow()) return false;",
          explanation: "Rejects borrowing if the book is unavailable or member has reached their quota limit.",
        },
        {
          code: "book.isBorrowed = true; borrowedBooks.add(book);",
          explanation: "Updates both the book availability flag and the member's list of borrowed books.",
        },
      ],
    },
    c: {
      filename: "library_system.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_TITLE 64
#define MAX_BOOKS 10

typedef struct {
    char book_id[16];
    char title[MAX_TITLE];
    bool is_borrowed;
} Book;

typedef struct {
    char member_id[16];
    int max_limit;
    int borrowed_count;
    char borrowed_ids[MAX_BOOKS][16];
} Member;

void init_book(Book *b, const char *id, const char *title) {
    strncpy(b->book_id, id, sizeof(b->book_id) - 1);
    strncpy(b->title, title, sizeof(b->title) - 1);
    b->is_borrowed = false;
}

void init_member(Member *m, const char *id, int max_limit) {
    strncpy(m->member_id, id, sizeof(m->member_id) - 1);
    m->max_limit = max_limit;
    m->borrowed_count = 0;
}

bool can_borrow(const Member *m) {
    return m->borrowed_count < m->max_limit;
}

bool borrow_book(Member *m, Book *b) {
    if (b->is_borrowed || !can_borrow(m)) {
        return false;
    }
    b->is_borrowed = true;
    strncpy(m->borrowed_ids[m->borrowed_count], b->book_id, 15);
    m->borrowed_count++;
    return true;
}`,
      explanations: [
        {
          code: "bool can_borrow(const Member *m)",
          explanation: "Checks if the member has capacity under their borrowing limit.",
        },
        {
          code: "if (b->is_borrowed || !can_borrow(m)) return false;",
          explanation: "Guard clause checking availability and quota before modifying state.",
        },
        {
          code: "b->is_borrowed = true; m->borrowed_count++;",
          explanation: "Marks the book borrowed and increments the member's counter.",
        },
      ],
    },
    cCodeLab: {
      cSignature: "bool process_checkout(bool book_is_borrowed, int member_borrowed_count, int max_limit, int *new_count, char *message)",
      cStarterCode: `// Library Checkout Rule Engine in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool process_checkout(bool book_is_borrowed, int member_borrowed_count, int max_limit, int *new_count, char *message) {
    if (book_is_borrowed) {
        *new_count = member_borrowed_count;
        strcpy(message, "BOOK_ALREADY_BORROWED");
        return false;
    }
    if (member_borrowed_count >= max_limit) {
        *new_count = member_borrowed_count;
        strcpy(message, "LIMIT_REACHED");
        return false;
    }
    *new_count = member_borrowed_count + 1;
    strcpy(message, "SUCCESS");
    return true;
}
`,
    },
  },

  // Case 03: Banking System Transfers
  "banking-system-transfers": {
    java: {
      filename: "BankTransfer.java",
      code: `public class BankTransfer {
    public static class Account {
        public final String owner;
        public int balance;

        public Account(String owner, int balance) {
            this.owner = owner;
            this.balance = balance;
        }

        public boolean transferTo(Account recipient, int amount) {
            if (amount <= 0 || this.balance < amount) {
                return false;
            }
            this.balance -= amount;
            recipient.balance += amount;
            return true;
        }
    }
}`,
      explanations: [
        {
          code: "if (amount <= 0 || this.balance < amount) return false;",
          explanation: "Ensures amount is positive and sender has sufficient balance before initiating transfer.",
        },
        {
          code: "this.balance -= amount; recipient.balance += amount;",
          explanation: "Atomic balance updates on sender and recipient instances.",
        },
      ],
    },
    c: {
      filename: "bank_transfer.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

typedef struct {
    char owner[32];
    int balance;
} Account;

void init_account(Account *acc, const char *owner, int balance) {
    strncpy(acc->owner, owner, sizeof(acc->owner) - 1);
    acc->balance = balance;
}

bool transfer_to(Account *sender, Account *recipient, int amount) {
    if (amount <= 0 || sender->balance < amount) {
        return false;
    }
    sender->balance -= amount;
    recipient->balance += amount;
    return true;
}`,
      explanations: [
        {
          code: "if (amount <= 0 || sender->balance < amount) return false;",
          explanation: "Guards against negative amounts or overdraft attempts.",
        },
        {
          code: "sender->balance -= amount; recipient->balance += amount;",
          explanation: "Deducts funds from sender and credits recipient.",
        },
      ],
    },
    cCodeLab: {
      cSignature: "bool process_transfer(int sender_bal, int recipient_bal, int amount, int *new_sender_bal, int *new_rec_bal, char *message)",
      cStarterCode: `// Bank Transfer Guard in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool process_transfer(int sender_bal, int recipient_bal, int amount, int *new_sender_bal, int *new_rec_bal, char *message) {
    if (amount <= 0) {
        *new_sender_bal = sender_bal;
        *new_rec_bal = recipient_bal;
        strcpy(message, "INVALID_AMOUNT");
        return false;
    }
    if (sender_bal < amount) {
        *new_sender_bal = sender_bal;
        *new_rec_bal = recipient_bal;
        strcpy(message, "INSUFFICIENT_FUNDS");
        return false;
    }
    *new_sender_bal = sender_bal - amount;
    *new_rec_bal = recipient_bal + amount;
    strcpy(message, "SUCCESS");
    return true;
}
`,
    },
  },

  // Case 04: Parking Lot Allocation
  "parking-lot-allocation": {
    java: {
      filename: "ParkingLotSystem.java",
      code: `import java.util.ArrayList;
import java.util.List;

public class ParkingLotSystem {
    public static class ParkingSlot {
        public final int slotId;
        public boolean isOccupied;

        public ParkingSlot(int slotId) {
            this.slotId = slotId;
            this.isOccupied = false;
        }
    }

    public static class ParkingLot {
        private final List<ParkingSlot> slots;
        private final int hourlyRate;

        public ParkingLot(int totalSlots, int hourlyRate) {
            this.hourlyRate = hourlyRate;
            this.slots = new ArrayList<>();
            for (int i = 1; i <= totalSlots; i++) {
                this.slots.add(new ParkingSlot(i));
            }
        }

        public int park() {
            for (ParkingSlot slot : slots) {
                if (!slot.isOccupied) {
                    slot.isOccupied = true;
                    return slot.slotId;
                }
            }
            return -1; // Lot full
        }

        public int exit(int slotId, int hours) {
            for (ParkingSlot slot : slots) {
                if (slot.slotId == slotId) {
                    slot.isOccupied = false;
                    return Math.max(1, hours) * hourlyRate;
                }
            }
            return 0;
        }
    }
}`,
      explanations: [
        {
          code: "for (ParkingSlot slot : slots) if (!slot.isOccupied)",
          explanation: "Finds the first vacant parking slot linearly.",
        },
        {
          code: "slot.isOccupied = false; return Math.max(1, hours) * hourlyRate;",
          explanation: "Frees the slot and calculates total parking fee based on billed hours.",
        },
      ],
    },
    c: {
      filename: "parking_lot.c",
      code: `#include <stdio.h>
#include <stdbool.h>

#define MAX_SLOTS 50

typedef struct {
    int slot_id;
    bool is_occupied;
} ParkingSlot;

typedef struct {
    ParkingSlot slots[MAX_SLOTS];
    int total_slots;
    int hourly_rate;
} ParkingLot;

void init_lot(ParkingLot *lot, int total_slots, int hourly_rate) {
    lot->total_slots = total_slots > MAX_SLOTS ? MAX_SLOTS : total_slots;
    lot->hourly_rate = hourly_rate;
    for (int i = 0; i < lot->total_slots; i++) {
        lot->slots[i].slot_id = i + 1;
        lot->slots[i].is_occupied = false;
    }
}

int park(ParkingLot *lot) {
    for (int i = 0; i < lot->total_slots; i++) {
        if (!lot->slots[i].is_occupied) {
            lot->slots[i].is_occupied = true;
            return lot->slots[i].slot_id;
        }
    }
    return -1; // Full
}

int exit_lot(ParkingLot *lot, int slot_id, int hours) {
    for (int i = 0; i < lot->total_slots; i++) {
        if (lot->slots[i].slot_id == slot_id) {
            lot->slots[i].is_occupied = false;
            int billed = hours < 1 ? 1 : hours;
            return billed * lot->hourly_rate;
        }
    }
    return 0;
}`,
      explanations: [
        {
          code: "if (!lot->slots[i].is_occupied)",
          explanation: "Scans array of slots to find an unoccupied bay.",
        },
        {
          code: "lot->slots[i].is_occupied = false;",
          explanation: "Frees slot and calculates fee with minimum 1-hour charge.",
        },
      ],
    },
  },

  // Case 05: Vending Machine States
  "vending-machine-states": {
    java: {
      filename: "VendingMachine.java",
      code: `public class VendingMachine {
    private String state;
    private int balance;

    public VendingMachine() {
        this.state = "IDLE";
        this.balance = 0;
    }

    public void insertMoney(int amount) {
        if (amount > 0) {
            this.balance += amount;
            this.state = "PAID";
        }
    }

    public static class VendResult {
        public final boolean success;
        public final int change;
        public VendResult(boolean success, int change) {
            this.success = success;
            this.change = change;
        }
    }

    public VendResult selectItem(int price) {
        if (!"PAID".equals(state) || balance < price) {
            return new VendResult(false, 0);
        }
        int change = balance - price;
        this.balance = 0;
        this.state = "IDLE";
        return new VendResult(true, change);
    }

    public int getBalance() { return balance; }
    public String getState() { return state; }
}`,
      explanations: [
        {
          code: "if (amount > 0) { balance += amount; state = \"PAID\"; }",
          explanation: "Transitions state machine from IDLE to PAID when valid currency is inserted.",
        },
        {
          code: "if (!\"PAID\".equals(state) || balance < price) return false;",
          explanation: "Guards item dispatch against unpaid or underpaid selections.",
        },
      ],
    },
    c: {
      filename: "vending_machine.c",
      code: `#include <stdio.h>
#include <stdbool.h>
#include <string.h>

typedef enum { STATE_IDLE, STATE_PAID } VendingState;

typedef struct {
    VendingState state;
    int balance;
} VendingMachine;

void init_machine(VendingMachine *vm) {
    vm->state = STATE_IDLE;
    vm->balance = 0;
}

void insert_money(VendingMachine *vm, int amount) {
    if (amount > 0) {
        vm->balance += amount;
        vm->state = STATE_PAID;
    }
}

bool select_item(VendingMachine *vm, int price, int *change) {
    if (vm->state != STATE_PAID || vm->balance < price) {
        *change = 0;
        return false;
    }
    *change = vm->balance - price;
    vm->balance = 0;
    vm->state = STATE_IDLE;
    return true;
}`,
      explanations: [
        {
          code: "typedef enum { STATE_IDLE, STATE_PAID } VendingState;",
          explanation: "Models state machine transitions explicitly using an enum.",
        },
        {
          code: "if (vm->state != STATE_PAID || vm->balance < price)",
          explanation: "Validates payment before dispensing and calculating customer change.",
        },
      ],
    },
  },

  // Case 06: Seat Booking System
  "seat-booking-system": {
    java: {
      filename: "TheaterHall.java",
      code: `import java.util.HashMap;
import java.util.Map;

public class TheaterHall {
    private final Map<String, String> seats;

    public TheaterHall(String[] seatIds) {
        this.seats = new HashMap<>();
        for (String id : seatIds) {
            this.seats.put(id.toUpperCase(), "AVAILABLE");
        }
    }

    public boolean reserveSeat(String seatId) {
        String sid = seatId.toUpperCase();
        if (!seats.containsKey(sid) || !"AVAILABLE".equals(seats.get(sid))) {
            return false;
        }
        seats.put(sid, "RESERVED");
        return true;
    }

    public boolean confirmBooking(String seatId) {
        String sid = seatId.toUpperCase();
        if (!seats.containsKey(sid) || !"RESERVED".equals(seats.get(sid))) {
            return false;
        }
        seats.put(sid, "BOOKED");
        return true;
    }

    public boolean cancelReservation(String seatId) {
        String sid = seatId.toUpperCase();
        if (!seats.containsKey(sid) || !"RESERVED".equals(seats.get(sid))) {
            return false;
        }
        seats.put(sid, "AVAILABLE");
        return true;
    }
}`,
      explanations: [
        {
          code: "if (!\"AVAILABLE\".equals(seats.get(sid))) return false;",
          explanation: "Prevents double-booking by only reserving available seats.",
        },
        {
          code: "seats.put(sid, \"BOOKED\");",
          explanation: "Confirms payment and locks seat permanently.",
        },
      ],
    },
    c: {
      filename: "seat_booking.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_SEATS 64

typedef enum { SEAT_AVAILABLE, SEAT_RESERVED, SEAT_BOOKED } SeatStatus;

typedef struct {
    char id[8];
    SeatStatus status;
} Seat;

typedef struct {
    Seat seats[MAX_SEATS];
    int count;
} TheaterHall;

void init_hall(TheaterHall *hall, const char *ids[], int count) {
    hall->count = count > MAX_SEATS ? MAX_SEATS : count;
    for (int i = 0; i < hall->count; i++) {
        strncpy(hall->seats[i].id, ids[i], 7);
        hall->seats[i].status = SEAT_AVAILABLE;
    }
}

bool reserve_seat(TheaterHall *hall, const char *id) {
    for (int i = 0; i < hall->count; i++) {
        if (strcmp(hall->seats[i].id, id) == 0) {
            if (hall->seats[i].status != SEAT_AVAILABLE) return false;
            hall->seats[i].status = SEAT_RESERVED;
            return true;
        }
    }
    return false;
}

bool confirm_booking(TheaterHall *hall, const char *id) {
    for (int i = 0; i < hall->count; i++) {
        if (strcmp(hall->seats[i].id, id) == 0) {
            if (hall->seats[i].status != SEAT_RESERVED) return false;
            hall->seats[i].status = SEAT_BOOKED;
            return true;
        }
    }
    return false;
}`,
      explanations: [
        {
          code: "hall->seats[i].status = SEAT_RESERVED;",
          explanation: "Transitions seat state from AVAILABLE to RESERVED.",
        },
        {
          code: "if (hall->seats[i].status != SEAT_RESERVED) return false;",
          explanation: "Guards final booking transition to ensure reservation step was valid.",
        },
      ],
    },
  },

  // Case 07: Inventory Stock Tracker
  "inventory-stock-tracker": {
    java: {
      filename: "InventoryTracker.java",
      code: `import java.util.HashMap;
import java.util.Map;

public class InventoryTracker {
    private final Map<String, Integer> stock = new HashMap<>();

    public boolean restock(String sku, int quantity) {
        if (quantity <= 0) return false;
        String s = sku.toUpperCase();
        stock.put(s, stock.getOrDefault(s, 0) + quantity);
        return true;
    }

    public boolean deduct(String sku, int quantity) {
        if (quantity <= 0) return false;
        String s = sku.toUpperCase();
        int current = stock.getOrDefault(s, 0);
        if (current < quantity) return false;
        stock.put(s, current - quantity);
        return true;
    }

    public int getStock(String sku) {
        return stock.getOrDefault(sku.toUpperCase(), 0);
    }
}`,
      explanations: [
        {
          code: "if (current < quantity) return false;",
          explanation: "Protects against inventory stockouts and negative warehouse inventory.",
        },
        {
          code: "stock.put(s, current - quantity);",
          explanation: "Deducts stock upon confirmed order fulfillment.",
        },
      ],
    },
    c: {
      filename: "inventory_tracker.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_ITEMS 64

typedef struct {
    char sku[32];
    int quantity;
} StockItem;

typedef struct {
    StockItem items[MAX_ITEMS];
    int count;
} InventoryTracker;

void init_tracker(InventoryTracker *t) { t->count = 0; }

bool restock(InventoryTracker *t, const char *sku, int quantity) {
    if (quantity <= 0) return false;
    for (int i = 0; i < t->count; i++) {
        if (strcmp(t->items[i].sku, sku) == 0) {
            t->items[i].quantity += quantity;
            return true;
        }
    }
    if (t->count >= MAX_ITEMS) return false;
    strncpy(t->items[t->count].sku, sku, 31);
    t->items[t->count].quantity = quantity;
    t->count++;
    return true;
}

bool deduct(InventoryTracker *t, const char *sku, int quantity) {
    if (quantity <= 0) return false;
    for (int i = 0; i < t->count; i++) {
        if (strcmp(t->items[i].sku, sku) == 0) {
            if (t->items[i].quantity < quantity) return false;
            t->items[i].quantity -= quantity;
            return true;
        }
    }
    return false; // SKU not found
}`,
      explanations: [
        {
          code: "if (t->items[i].quantity < quantity) return false;",
          explanation: "Prevents warehouse fulfillment when stock is insufficient.",
        },
      ],
    },
  },

  // Case 08: Client-Server Architecture
  "client-server-architecture": {
    java: {
      filename: "MiniServer.java",
      code: `import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

public class MiniServer {
    private final Map<String, Supplier<String>> routes = new HashMap<>();

    public void addRoute(String path, Supplier<String> handler) {
        routes.put(path, handler);
    }

    public static class Response {
        public final int status;
        public final String body;
        public Response(int status, String body) {
            this.status = status;
            this.body = body;
        }
    }

    public Response handleRequest(String method, String path) {
        if (!"GET".equalsIgnoreCase(method)) {
            return new Response(405, "Method Not Allowed");
        }
        if (routes.containsKey(path)) {
            return new Response(200, routes.get(path).get());
        }
        return new Response(404, "Not Found");
    }
}`,
      explanations: [
        {
          code: "if (!\"GET\".equalsIgnoreCase(method)) return new Response(405, ...);",
          explanation: "Validates HTTP method protocol guard.",
        },
        {
          code: "if (routes.containsKey(path)) return new Response(200, ...);",
          explanation: "Matches URL route and dispatches handler callback.",
        },
      ],
    },
    c: {
      filename: "mini_server.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_ROUTES 16

typedef struct {
    char path[32];
    char response[128];
} Route;

typedef struct {
    Route routes[MAX_ROUTES];
    int count;
} MiniServer;

void init_server(MiniServer *s) { s->count = 0; }

void add_route(MiniServer *s, const char *path, const char *body) {
    if (s->count >= MAX_ROUTES) return;
    strncpy(s->routes[s->count].path, path, 31);
    strncpy(s->routes[s->count].response, body, 127);
    s->count++;
}

int handle_request(const MiniServer *s, const char *method, const char *path, char *out_body) {
    if (strcmp(method, "GET") != 0) {
        strcpy(out_body, "Method Not Allowed");
        return 405;
    }
    for (int i = 0; i < s->count; i++) {
        if (strcmp(s->routes[i].path, path) == 0) {
            strcpy(out_body, s->routes[i].response);
            return 200;
        }
    }
    strcpy(out_body, "Not Found");
    return 404;
}`,
      explanations: [
        {
          code: "if (strcmp(method, \"GET\") != 0) return 405;",
          explanation: "Enforces HTTP method semantics.",
        },
        {
          code: "if (strcmp(s->routes[i].path, path) == 0) return 200;",
          explanation: "Dispatches registered static endpoint response.",
        },
      ],
    },
  },

  // Case 09: DNS Domain Lookup
  "dns-domain-lookup": {
    java: {
      filename: "DNSResolver.java",
      code: `import java.util.HashMap;
import java.util.Map;

public class DNSResolver {
    private final Map<String, String> authoritative;
    private final Map<String, String> cache = new HashMap<>();

    public DNSResolver(Map<String, String> authoritativeRecords) {
        this.authoritative = authoritativeRecords;
    }

    public String resolve(String domain) {
        String key = domain.toLowerCase().trim();
        // 1. Check local cache
        if (cache.containsKey(key)) {
            return cache.get(key);
        }
        // 2. Query authoritative records
        if (authoritative.containsKey(key)) {
            String ip = authoritative.get(key);
            cache.put(key, ip); // Cache warm
            return ip;
        }
        return "NXDOMAIN";
    }
}`,
      explanations: [
        {
          code: "if (cache.containsKey(key)) return cache.get(key);",
          explanation: "Fast path: returns cached DNS record with zero upstream network queries.",
        },
        {
          code: "cache.put(key, ip);",
          explanation: "Caches authoritative result for future lookups.",
        },
      ],
    },
    c: {
      filename: "dns_resolver.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_RECORDS 32

typedef struct {
    char domain[64];
    char ip[16];
} DNSRecord;

typedef struct {
    DNSRecord authoritative[MAX_RECORDS];
    int auth_count;
    DNSRecord cache[MAX_RECORDS];
    int cache_count;
} DNSResolver;

void init_resolver(DNSResolver *r) {
    r->auth_count = 0;
    r->cache_count = 0;
}

const char* resolve(DNSResolver *r, const char *domain) {
    // 1. Check cache
    for (int i = 0; i < r->cache_count; i++) {
        if (strcmp(r->cache[i].domain, domain) == 0) {
            return r->cache[i].ip;
        }
    }
    // 2. Query authoritative
    for (int i = 0; i < r->auth_count; i++) {
        if (strcmp(r->authoritative[i].domain, domain) == 0) {
            if (r->cache_count < MAX_RECORDS) {
                strcpy(r->cache[r->cache_count].domain, domain);
                strcpy(r->cache[r->cache_count].ip, r->authoritative[i].ip);
                r->cache_count++;
            }
            return r->authoritative[i].ip;
        }
    }
    return "NXDOMAIN";
}`,
      explanations: [
        {
          code: "for (int i = 0; i < r->cache_count; i++)",
          explanation: "Scans local resolver cache first.",
        },
        {
          code: "return \"NXDOMAIN\";",
          explanation: "Returns standard DNS code when domain does not exist.",
        },
      ],
    },
  },

  // Case 10: Image CDN Delivery
  "image-cdn-delivery": {
    java: {
      filename: "CDNSimulator.java",
      code: `import java.util.HashMap;
import java.util.Map;

public class CDNSimulator {
    private final Map<String, String> origin;
    private final Map<String, String> edgeCache = new HashMap<>();
    public static final int EDGE_LATENCY_MS = 15;
    public static final int ORIGIN_LATENCY_MS = 200;

    public CDNSimulator(Map<String, String> originData) {
        this.origin = originData;
    }

    public static class FetchResult {
        public final String source;
        public final int latencyMs;
        public final String data;
        public FetchResult(String source, int latency, String data) {
            this.source = source;
            this.latencyMs = latency;
            this.data = data;
        }
    }

    public FetchResult fetchImage(String filename) {
        // Edge hit
        if (edgeCache.containsKey(filename)) {
            return new FetchResult("EDGE_CACHE", EDGE_LATENCY_MS, edgeCache.get(filename));
        }
        // Cache miss -> origin fetch
        if (origin.containsKey(filename)) {
            String data = origin.get(filename);
            edgeCache.put(filename, data); // Populate edge cache
            return new FetchResult("ORIGIN", ORIGIN_LATENCY_MS + EDGE_LATENCY_MS, data);
        }
        return new FetchResult("NOT_FOUND", ORIGIN_LATENCY_MS, null);
    }
}`,
      explanations: [
        {
          code: "if (edgeCache.containsKey(filename)) return new FetchResult(\"EDGE_CACHE\", ...);",
          explanation: "Returns cached asset in ~15ms from the closest edge point-of-presence.",
        },
        {
          code: "edgeCache.put(filename, data);",
          explanation: "Warms up edge cache upon origin fetch so subsequent requests hit the edge.",
        },
      ],
    },
    c: {
      filename: "cdn_simulator.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_FILES 32

typedef struct {
    char filename[64];
    char content[256];
} FileEntry;

typedef struct {
    FileEntry edge[MAX_FILES];
    int edge_count;
    FileEntry origin[MAX_FILES];
    int origin_count;
} CDNSimulator;

int fetch_image(CDNSimulator *cdn, const char *name, char *out_source, char *out_data) {
    // 1. Edge check
    for (int i = 0; i < cdn->edge_count; i++) {
        if (strcmp(cdn->edge[i].filename, name) == 0) {
            strcpy(out_source, "EDGE_CACHE");
            strcpy(out_data, cdn->edge[i].content);
            return 15; // 15ms latency
        }
    }
    // 2. Origin check
    for (int i = 0; i < cdn->origin_count; i++) {
        if (strcmp(cdn->origin[i].filename, name) == 0) {
            strcpy(out_source, "ORIGIN");
            strcpy(out_data, cdn->origin[i].content);
            // Cache on edge
            if (cdn->edge_count < MAX_FILES) {
                strcpy(cdn->edge[cdn->edge_count].filename, name);
                strcpy(cdn->edge[cdn->edge_count].content, cdn->origin[i].content);
                cdn->edge_count++;
            }
            return 215; // 215ms latency
        }
    }
    strcpy(out_source, "NOT_FOUND");
    return 200;
}`,
      explanations: [
        {
          code: "if (strcmp(cdn->edge[i].filename, name) == 0) return 15;",
          explanation: "Edge cache delivers content with 93% latency reduction.",
        },
      ],
    },
  },

  // Cases 12 to 21 (Add C language to complement existing Python + Java)
  "search-autocomplete": {
    c: {
      filename: "autocomplete.c",
      code: `#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdbool.h>

#define MAX_RESULTS 10
#define MAX_WORD_LEN 32

int get_autocomplete_suggestions(const char *query, const char *candidates[], int cand_count, char results[MAX_RESULTS][MAX_WORD_LEN]) {
    if (!query || strlen(query) == 0) return 0;
    int qlen = strlen(query);
    int matched = 0;

    for (int i = 0; i < cand_count && matched < MAX_RESULTS; i++) {
        if (strncasecmp(candidates[i], query, qlen) == 0) {
            strncpy(results[matched], candidates[i], MAX_WORD_LEN - 1);
            results[matched][MAX_WORD_LEN - 1] = '\0';
            matched++;
        }
    }
    return matched;
}`,
      explanations: [
        {
          code: "if (strncasecmp(candidates[i], query, qlen) == 0)",
          explanation: "Performs case-insensitive prefix match against candidate lexicon.",
        },
      ],
    },
    cCodeLab: {
      cSignature: "int search_prefix(const char *prefix, const char *words[], int count, char out[][32])",
      cStarterCode: `// Prefix matching in C
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

int search_prefix(const char *prefix, const char *words[], int count, char out[][32]) {
    // Return number of matches found starting with prefix
    return 0;
}
`,
    },
  },

  "authentication-workings": {
    c: {
      filename: "auth_verify.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_USERS 32

typedef struct {
    char username[32];
    char password[64];
} UserRecord;

bool verify_identity(const char *user, const char *pass, const UserRecord db[], int db_size, char *out_msg) {
    for (int i = 0; i < db_size; i++) {
        if (strcmp(db[i].username, user) == 0) {
            if (strcmp(db[i].password, pass) == 0) {
                strcpy(out_msg, "Authenticated");
                return true;
            }
        }
    }
    strcpy(out_msg, "Invalid credentials");
    return false;
}`,
      explanations: [
        {
          code: "if (strcmp(db[i].username, user) == 0 && strcmp(db[i].password, pass) == 0)",
          explanation: "Compares supplied credentials against stored user record.",
        },
      ],
    },
    cCodeLab: {
      cSignature: "bool verify_credentials(const char *user, const char *pass, const char *stored_pass, char *msg)",
      cStarterCode: `// User credential check in C
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

bool verify_credentials(const char *user, const char *pass, const char *stored_pass, char *msg) {
    if (strcmp(pass, stored_pass) == 0) {
        strcpy(msg, "Authenticated");
        return true;
    }
    strcpy(msg, "Invalid credentials");
    return false;
}
`,
    },
  },

  "password-hashing-salts": {
    c: {
      filename: "password_salt.c",
      code: `#include <stdio.h>
#include <string.h>

void hash_password(const char *password, const char *salt, char *out_hash) {
    char rev_pw[64] = {0};
    char rev_salt[64] = {0};
    int plen = strlen(password);
    int slen = strlen(salt);

    for (int i = 0; i < plen && i < 63; i++) rev_pw[i] = password[plen - 1 - i];
    for (int i = 0; i < slen && i < 63; i++) rev_salt[i] = salt[slen - 1 - i];

    sprintf(out_hash, "hash://%s@%s", rev_pw, rev_salt);
}`,
      explanations: [
        {
          code: "sprintf(out_hash, \"hash://%s@%s\", rev_pw, rev_salt);",
          explanation: "Combines unique salt with password transformation to resist rainbow table attacks.",
        },
      ],
    },
  },

  "api-key-auth": {
    c: {
      filename: "api_key_auth.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_KEYS 32

typedef struct {
    char key[64];
    char secret[64];
} APIEntry;

bool validate_api_request(const APIEntry db[], int count, const char *key, const char *secret, char *out_status) {
    for (int i = 0; i < count; i++) {
        if (strcmp(db[i].key, key) == 0) {
            if (strcmp(db[i].secret, secret) == 0) {
                strcpy(out_status, "ACCESS_GRANTED");
                return true;
            }
            strcpy(out_status, "INVALID_TOKEN");
            return false;
        }
    }
    strcpy(out_status, "INVALID_KEY");
    return false;
}`,
      explanations: [
        {
          code: "if (strcmp(db[i].key, key) == 0)",
          explanation: "Checks public API key identity first.",
        },
        {
          code: "if (strcmp(db[i].secret, secret) == 0)",
          explanation: "Authenticates cryptographic secret token before granting access.",
        },
      ],
    },
  },

  "two-factor-totp": {
    c: {
      filename: "totp.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdint.h>

// Simple deterministic hash simulation for educational TOTP
void generate_totp(const char *secret, uint64_t timestamp, int timestep, char *out_otp) {
    uint64_t counter = timestamp / timestep;
    uint32_t hash = 5381;
    for (int i = 0; secret[i]; i++) hash = ((hash << 5) + hash) + secret[i];
    hash ^= (uint32_t)(counter & 0xFFFFFFFF);
    uint32_t code = (hash % 1000000);
    sprintf(out_otp, "%06u", code);
}`,
      explanations: [
        {
          code: "uint64_t counter = timestamp / timestep;",
          explanation: "Derives monotonic time counter from epoch seconds and fixed 30-second window.",
        },
      ],
    },
  },

  "session-tokens-cookies": {
    c: {
      filename: "session_manager.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#include <stdint.h>

#define MAX_SESSIONS 64

typedef struct {
    char token[64];
    char user[32];
    uint64_t expiry;
} Session;

bool validate_session(const Session db[], int count, const char *token, uint64_t now, char *out_user) {
    for (int i = 0; i < count; i++) {
        if (strcmp(db[i].token, token) == 0) {
            if (now >= db[i].expiry) {
                return false; // Expired
            }
            strcpy(out_user, db[i].user);
            return true;
        }
    }
    return false; // Not found
}`,
      explanations: [
        {
          code: "if (now >= db[i].expiry) return false;",
          explanation: "Verifies token validity against epoch expiry timestamp.",
        },
      ],
    },
  },

  "url-shortener": {
    c: {
      filename: "url_shortener.c",
      code: `#include <stdio.h>
#include <string.h>

#define MAX_URLS 64

typedef struct {
    char short_code[16];
    char full_url[256];
} URLEntry;

const char* resolve_short_url(const URLEntry db[], int count, const char *short_code) {
    for (int i = 0; i < count; i++) {
        if (strcmp(db[i].short_code, short_code) == 0) {
            return db[i].full_url;
        }
    }
    return "404 Not Found";
}`,
      explanations: [
        {
          code: "if (strcmp(db[i].short_code, short_code) == 0) return db[i].full_url;",
          explanation: "O(1) hash map or associative array lookup mapping short token to full URL.",
        },
      ],
    },
  },

  "key-value-caching": {
    c: {
      filename: "ttl_cache.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#include <time.h>

#define MAX_CACHE 64
#define TTL_SECONDS 5

typedef struct {
    int key;
    char value[64];
    time_t expiry;
    bool active;
} CacheItem;

typedef struct {
    CacheItem items[MAX_CACHE];
} TTLCache;

bool cache_set(TTLCache *c, int key, const char *value) {
    time_t now = time(NULL);
    for (int i = 0; i < MAX_CACHE; i++) {
        if (!c->items[i].active || c->items[i].key == key) {
            c->items[i].key = key;
            strncpy(c->items[i].value, value, 63);
            c->items[i].expiry = now + TTL_SECONDS;
            c->items[i].active = true;
            return true;
        }
    }
    return false;
}`,
      explanations: [
        {
          code: "c->items[i].expiry = now + TTL_SECONDS;",
          explanation: "Assigns explicit time-to-live after which data is considered stale.",
        },
      ],
    },
  },

  "database-indexing": {
    c: {
      filename: "db_index.c",
      code: `#include <stdio.h>
#include <string.h>

#define MAX_PRODUCTS 128

typedef struct {
    int id;
    char name[64];
    int price;
} Product;

const Product* find_product_linear(const Product items[], int count, const char *target) {
    for (int i = 0; i < count; i++) {
        if (strcmp(items[i].name, target) == 0) {
            return &items[i];
        }
    }
    return NULL;
}`,
      explanations: [
        {
          code: "for (int i = 0; i < count; i++) if (strcmp(items[i].name, target) == 0)",
          explanation: "Demonstrates full-table scan (O(N)) before introducing index structures.",
        },
      ],
    },
  },

  "cloud-data-deduplication": {
    c: {
      filename: "cloud_dedup.c",
      code: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

#define MAX_FILES 64

typedef struct {
    char hash[64];
    int size;
    int ref_count;
} DedupEntry;

typedef struct {
    DedupEntry entries[MAX_FILES];
    int count;
} DedupIndex;

bool store_file(DedupIndex *idx, const char *file_hash, int size, bool *is_new) {
    if (!file_hash || size <= 0) return false;

    for (int i = 0; i < idx->count; i++) {
        if (strcmp(idx->entries[i].hash, file_hash) == 0) {
            idx->entries[i].ref_count++;
            *is_new = false;
            return true;
        }
    }

    if (idx->count >= MAX_FILES) return false;
    strncpy(idx->entries[idx->count].hash, file_hash, 63);
    idx->entries[idx->count].size = size;
    idx->entries[idx->count].ref_count = 1;
    idx->count++;
    *is_new = true;
    return true;
}`,
      explanations: [
        {
          code: "idx->entries[i].ref_count++; *is_new = false;",
          explanation: "Deduplication hit: increments reference counter without allocating redundant block storage.",
        },
      ],
    },
  },

  // Cases 31 to 35 (Advanced Distributed Architectures - Add Java & C)
  "two-phase-commit-transactions": {
    java: {
      filename: "TwoPhaseCommitCoordinator.java",
      code: `import java.util.ArrayList;
import java.util.List;

public class TwoPhaseCommitCoordinator {
    private final List<String> votes = new ArrayList<>();

    public void prepare(List<String> participantVotes) {
        for (String vote : participantVotes) {
            votes.add(vote.toUpperCase());
        }
    }

    public String decide() {
        if (votes.isEmpty()) return "ABORT";
        for (String vote : votes) {
            if (!"READY".equals(vote)) return "ABORT";
        }
        return "COMMIT";
    }
}`,
      explanations: [
        {
          code: "for (String vote : votes) if (!\"READY\".equals(vote)) return \"ABORT\";",
          explanation: "Enforces unanimous consensus requirement across distributed databases.",
        },
      ],
    },
    c: {
      filename: "two_phase_commit.c",
      code: `#include <stdio.h>
#include <string.h>

#define MAX_VOTES 32

typedef struct {
    char votes[MAX_VOTES][16];
    int count;
} TwoPhaseCommitCoordinator;

void init_coordinator(TwoPhaseCommitCoordinator *c) { c->count = 0; }

void prepare(TwoPhaseCommitCoordinator *c, const char *votes[], int num) {
    for (int i = 0; i < num && c->count < MAX_VOTES; i++) {
        strncpy(c->votes[c->count], votes[i], 15);
        c->count++;
    }
}

const char* decide(const TwoPhaseCommitCoordinator *c) {
    if (c->count == 0) return "ABORT";
    for (int i = 0; i < c->count; i++) {
        if (strcmp(c->votes[i], "READY") != 0) return "ABORT";
    }
    return "COMMIT";
}`,
      explanations: [
        {
          code: "if (strcmp(c->votes[i], \"READY\") != 0) return \"ABORT\";",
          explanation: "Any non-READY vote aborts the distributed transaction atomically.",
        },
      ],
    },
  },

  "event-streaming-partitioned-log": {
    java: {
      filename: "PartitionedLog.java",
      code: `import java.util.ArrayList;
import java.util.List;

public class PartitionedLog {
    public static int assignPartition(String key, int numPartitions) {
        int total = 0;
        for (char ch : key.toCharArray()) total += (int) ch;
        return total % numPartitions;
    }

    public static int append(List<String> log, String event) {
        log.add(event);
        return log.size() - 1; // Monotonic offset
    }

    public static List<String> readFrom(List<String> log, int offset) {
        if (offset < 0 || offset >= log.size()) return new ArrayList<>();
        return new ArrayList<>(log.subList(offset, log.size()));
    }
}`,
      explanations: [
        {
          code: "return total % numPartitions;",
          explanation: "Deterministic hash routing ensuring events with matching keys preserve order.",
        },
        {
          code: "return log.size() - 1;",
          explanation: "Returns zero-indexed monotonic sequence offset in append-only log.",
        },
      ],
    },
    c: {
      filename: "partitioned_log.c",
      code: `#include <stdio.h>
#include <string.h>

#define MAX_LOG_SIZE 1024
#define EVENT_LEN 128

typedef struct {
    char events[MAX_LOG_SIZE][EVENT_LEN];
    int length;
} PartitionLog;

int assign_partition(const char *key, int num_partitions) {
    int total = 0;
    for (int i = 0; key[i]; i++) total += (unsigned char) key[i];
    return total % num_partitions;
}

int append(PartitionLog *log, const char *event) {
    if (log->length >= MAX_LOG_SIZE) return -1;
    strncpy(log->events[log->length], event, EVENT_LEN - 1);
    int offset = log->length;
    log->length++;
    return offset;
}`,
      explanations: [
        {
          code: "int offset = log->length; log->length++;",
          explanation: "Writes event to end of file descriptor and returns append-only offset.",
        },
      ],
    },
  },

  "consistent-hashing-shard-ring": {
    java: {
      filename: "ConsistentHashingRing.java",
      code: `import java.util.List;

public class ConsistentHashingRing {
    public static int nodeHash(String name) {
        int total = 0;
        for (char c : name.toCharArray()) total += (int) c;
        return total % 360;
    }

    public static int findOwner(String key, List<Integer> ringPositions) {
        int h = nodeHash(key);
        for (int pos : ringPositions) {
            if (pos >= h) return pos;
        }
        return ringPositions.isEmpty() ? 0 : ringPositions.get(0); // Wrap around 360 deg
    }
}`,
      explanations: [
        {
          code: "if (pos >= h) return pos;",
          explanation: "Locates next clockwise server node on the 360-degree hash ring.",
        },
        {
          code: "return ringPositions.get(0);",
          explanation: "Wraps around to the first node when key hash exceeds highest node position.",
        },
      ],
    },
    c: {
      filename: "consistent_hash_ring.c",
      code: `#include <stdio.h>
#include <string.h>

int node_hash(const char *name) {
    int total = 0;
    for (int i = 0; name[i]; i++) total += (unsigned char) name[i];
    return total % 360;
}

int find_owner(const char *key, const int positions[], int count) {
    int h = node_hash(key);
    for (int i = 0; i < count; i++) {
        if (positions[i] >= h) return positions[i];
    }
    return count > 0 ? positions[0] : 0;
}`,
      explanations: [
        {
          code: "if (positions[i] >= h) return positions[i];",
          explanation: "Routes key to next available ring shard with minimal re-mapping on node changes.",
        },
      ],
    },
  },

  "leader-election-consensus": {
    java: {
      filename: "LeaderElection.java",
      code: `import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LeaderElection {
    public static int electLeader(List<Integer> votes, int totalNodes) {
        if (totalNodes <= 0) return -1;
        int threshold = totalNodes / 2;
        Map<Integer, Integer> counts = new HashMap<>();

        for (int nodeId : votes) {
            counts.put(nodeId, counts.getOrDefault(nodeId, 0) + 1);
        }
        for (Map.Entry<Integer, Integer> entry : counts.entrySet()) {
            if (entry.getValue() > threshold) {
                return entry.getKey();
            }
        }
        return -1; // No majority
    }
}`,
      explanations: [
        {
          code: "if (entry.getValue() > threshold) return entry.getKey();",
          explanation: "Requires strict majority (> N/2) to prevent split-brain leader states.",
        },
      ],
    },
    c: {
      filename: "leader_election.c",
      code: `#include <stdio.h>

#define MAX_NODES 32

int elect_leader(const int votes[], int num_votes, int total_nodes) {
    if (total_nodes <= 0) return -1;
    int threshold = total_nodes / 2;
    int tallies[MAX_NODES] = {0};

    for (int i = 0; i < num_votes; i++) {
        int cand = votes[i];
        if (cand >= 0 && cand < MAX_NODES) {
            tallies[cand]++;
            if (tallies[cand] > threshold) {
                return cand;
            }
        }
    }
    return -1; // No majority
}`,
      explanations: [
        {
          code: "if (tallies[cand] > threshold) return cand;",
          explanation: "Elects node as leader as soon as strict quorum majority is reached.",
        },
      ],
    },
  },

  "quorum-reads-writes": {
    java: {
      filename: "QuorumResolver.java",
      code: `import java.util.List;

public class QuorumResolver {
    public static class NodeValue {
        public final int version;
        public final int value;
        public NodeValue(int version, int value) {
            this.version = version;
            this.value = value;
        }
    }

    public static int readValue(List<NodeValue> nodeValues, int readQuorum) {
        if (nodeValues.size() < readQuorum) {
            throw new IllegalArgumentException("Insufficient read quorum");
        }
        NodeValue best = nodeValues.get(0);
        for (int i = 1; i < nodeValues.size(); i++) {
            if (nodeValues.get(i).version > best.version) {
                best = nodeValues.get(i);
            }
        }
        return best.value;
    }
}`,
      explanations: [
        {
          code: "if (nodeValues.size() < readQuorum) throw ...;",
          explanation: "Enforces minimum replica count R before returning a read.",
        },
        {
          code: "if (nodeValues.get(i).version > best.version) best = ...;",
          explanation: "Picks the freshest value using monotonic version stamp across replica quorums.",
        },
      ],
    },
    c: {
      filename: "quorum_resolver.c",
      code: `#include <stdio.h>
#include <stdbool.h>

typedef struct {
    int version;
    int value;
} NodeValue;

bool read_value(const NodeValue nodes[], int count, int read_quorum, int *out_value) {
    if (count < read_quorum || count == 0) return false;
    NodeValue best = nodes[0];
    for (int i = 1; i < count; i++) {
        if (nodes[i].version > best.version) {
            best = nodes[i];
        }
    }
    *out_value = best.value;
    return true;
}`,
      explanations: [
        {
          code: "if (count < read_quorum) return false;",
          explanation: "Guards against stale reads if quorum threshold is unmet.",
        },
        {
          code: "if (nodes[i].version > best.version) best = nodes[i];",
          explanation: "Resolves conflicting replica reads by selecting highest version number.",
        },
      ],
    },
  },
};
