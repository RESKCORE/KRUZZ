import type { CodeLab, CaseStudy, CodeTest } from "@/data/schema";

/**
 * Curated CodeLab implementations for KRUZZ curriculum cases.
 * Provides production-quality signatures, starter templates, hints,
 * unit test suites, and mermaid architecture diagrams for Python, Java, and C.
 */
const CURATED_CODE_LABS: Record<string, Partial<CodeLab>> = {
  "seat-booking-system": {
    title: "Atomic Seat Booking Engine",
    brief:
      "Write a function `book_seat(seat_map, seat_id)` that atomically reserves a seat in a movie auditorium. If the seat is currently 'AVAILABLE', transition its state to 'RESERVED' and return `[True, updated_seat_map, 'RESERVED']`. If the seat is already 'RESERVED' or 'BOOKED', return `[False, seat_map, 'SEAT_UNAVAILABLE']`. If the seat ID does not exist in `seat_map`, return `[False, seat_map, 'INVALID_SEAT']`.",
    functionName: "book_seat",
    signature: "def book_seat(seat_map: dict, seat_id: str) -> tuple:",
    starterCode: `def book_seat(seat_map, seat_id):
    """
    Atomic Seat Reservation Guard
    - Returns (True, updated_map, 'RESERVED') if seat was AVAILABLE
    - Returns (False, seat_map, 'SEAT_UNAVAILABLE') if already RESERVED or BOOKED
    - Returns (False, seat_map, 'INVALID_SEAT') if seat does not exist
    """
    if seat_id not in seat_map:
        return (False, seat_map, "INVALID_SEAT")
    
    current_status = seat_map.get(seat_id)
    if current_status != "AVAILABLE":
        return (False, seat_map, "SEAT_UNAVAILABLE")
    
    # Mutate state atomically to RESERVED
    seat_map[seat_id] = "RESERVED"
    return (True, seat_map, "RESERVED")
`,
    javaSignature:
      "public static Object[] bookSeat(java.util.Map<String, String> seatMap, String seatId)",
    javaStarterCode: `import java.util.Map;

public class Solution {
    public static Object[] bookSeat(Map<String, String> seatMap, String seatId) {
        if (!seatMap.containsKey(seatId)) {
            return new Object[]{false, seatMap, "INVALID_SEAT"};
        }
        if (!"AVAILABLE".equals(seatMap.get(seatId))) {
            return new Object[]{false, seatMap, "SEAT_UNAVAILABLE"};
        }
        seatMap.put(seatId, "RESERVED");
        return new Object[]{true, seatMap, "RESERVED"};
    }
}
`,
    cSignature: "bool book_seat(bool *seats, int total_seats, int seat_id)",
    cStarterCode: `// Seat Booking Reservation Guard in C
#include <stdio.h>
#include <stdbool.h>

bool book_seat(bool *seats, int total_seats, int seat_id) {
    if (seat_id < 0 || seat_id >= total_seats) {
        return false; // Out of bounds
    }
    if (seats[seat_id]) {
        return false; // Already booked
    }
    seats[seat_id] = true; // Lock reservation
    return true;
}
`,
    hints: [
      "Check whether seat_id exists in seat_map before checking its status.",
      "Verify that the seat status is strictly 'AVAILABLE'.",
      "Transition the seat to 'RESERVED' and return the result tuple.",
    ],
    tests: [
      {
        name: "Reserve available seat A1",
        args: [{ A1: "AVAILABLE", A2: "AVAILABLE" }, "A1"],
        expected: [true, { A1: "RESERVED", A2: "AVAILABLE" }, "RESERVED"],
      },
      {
        name: "Reject double booking on reserved seat",
        args: [{ B2: "RESERVED" }, "B2"],
        expected: [false, { B2: "RESERVED" }, "SEAT_UNAVAILABLE"],
      },
      {
        name: "Reject booking on already booked seat",
        args: [{ C3: "BOOKED" }, "C3"],
        expected: [false, { C3: "BOOKED" }, "SEAT_UNAVAILABLE"],
      },
      {
        name: "Reject invalid seat ID outside auditorium bounds",
        args: [{ A1: "AVAILABLE" }, "Z99"],
        expected: [false, { A1: "AVAILABLE" }, "INVALID_SEAT"],
      },
    ],
    explanationPrompt:
      "Explain how your seat booking algorithm prevents race conditions and double-booking when multiple users attempt to reserve the same seat simultaneously.",
    mermaid: `graph TD
    A[Customer Selects Seat ID] --> B{Seat in Hall Map?}
    B -- No --> C[Return INVALID_SEAT]
    B -- Yes --> D{Status == AVAILABLE?}
    D -- No --> E[Return SEAT_UNAVAILABLE]
    D -- Yes --> F[Transition to RESERVED]
    F --> G[Start Hold Window Timer & Return Success]`,
  },

  "atm-machine": {
    title: "ATM Withdrawal Validator",
    brief:
      "Write a function `process_atm_withdrawal(balance, pin, entered_pin, amount)` that evaluates an ATM cash withdrawal request. Validate PIN correctness, positive amount, and adequate balance. Return `[True, new_balance, 'SUCCESS']` if valid, or `[False, balance, error_reason]` on failure.",
    functionName: "process_atm_withdrawal",
    signature:
      "def process_atm_withdrawal(balance: int, pin: str, entered_pin: str, amount: int) -> tuple:",
    starterCode: `def process_atm_withdrawal(balance, pin, entered_pin, amount):
    if entered_pin != pin:
        return (False, balance, "INVALID_PIN")
    if amount <= 0:
        return (False, balance, "INVALID_AMOUNT")
    if amount > balance:
        return (False, balance, "INSUFFICIENT_FUNDS")
    return (True, balance - amount, "SUCCESS")
`,
    javaSignature:
      "public static Object[] processAtmWithdrawal(int balance, String pin, String enteredPin, int amount)",
    javaStarterCode: `public class Solution {
    public static Object[] processAtmWithdrawal(int balance, String pin, String enteredPin, int amount) {
        if (!pin.equals(enteredPin)) {
            return new Object[]{false, balance, "INVALID_PIN"};
        }
        if (amount <= 0) {
            return new Object[]{false, balance, "INVALID_AMOUNT"};
        }
        if (amount > balance) {
            return new Object[]{false, balance, "INSUFFICIENT_FUNDS"};
        }
        return new Object[]{true, balance - amount, "SUCCESS"};
    }
}
`,
    cSignature:
      "bool process_atm_withdrawal(int balance, const char *pin, const char *entered_pin, int amount, int *new_balance, char *message)",
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
    hints: [
      "Check PIN equality first before inspecting withdrawal amounts.",
      "Guard against non-positive withdrawal requests (amount <= 0).",
      "Ensure balance >= amount before deducting cash.",
    ],
    tests: [
      {
        name: "Valid cash withdrawal with correct PIN",
        args: [500, "1234", "1234", 100],
        expected: [true, 400, "SUCCESS"],
      },
      {
        name: "Reject invalid PIN authentication",
        args: [500, "1234", "9999", 100],
        expected: [false, 500, "INVALID_PIN"],
      },
      {
        name: "Reject withdrawal exceeding account balance",
        args: [200, "1234", "1234", 500],
        expected: [false, 200, "INSUFFICIENT_FUNDS"],
      },
      {
        name: "Reject non-positive cash amount",
        args: [500, "1234", "1234", -50],
        expected: [false, 500, "INVALID_AMOUNT"],
      },
    ],
    explanationPrompt:
      "Explain how an ATM enforces atomicity when dispensing physical currency versus decrementing digital bank ledgers.",
    mermaid: `graph TD
    A[Card Inserted & PIN Entered] --> B{PIN Correct?}
    B -- No --> C[Return INVALID_PIN]
    B -- Yes --> D{Amount > 0?}
    D -- No --> E[Return INVALID_AMOUNT]
    D -- Yes --> F{Balance >= Amount?}
    F -- No --> G[Return INSUFFICIENT_FUNDS]
    F -- Yes --> H[Deduct Balance & Dispense Cash]`,
  },

  "library-management": {
    title: "Library Checkout Controller",
    brief:
      "Write a function `process_checkout(book_is_borrowed, member_count, max_limit)` that determines whether a member can check out a library book. Return `[True, member_count + 1, 'CHECKOUT_ALLOWED']` if book is free and member is below limit, else appropriate rejection reason.",
    functionName: "process_checkout",
    signature:
      "def process_checkout(book_is_borrowed: bool, member_count: int, max_limit: int) -> tuple:",
    starterCode: `def process_checkout(book_is_borrowed, member_count, max_limit):
    if book_is_borrowed:
        return (False, member_count, "ALREADY_BORROWED")
    if member_count >= max_limit:
        return (False, member_count, "MAX_BORROW_LIMIT_REACHED")
    return (True, member_count + 1, "CHECKOUT_ALLOWED")
`,
    javaSignature:
      "public static Object[] processCheckout(boolean bookIsBorrowed, int memberCount, int maxLimit)",
    javaStarterCode: `public class Solution {
    public static Object[] processCheckout(boolean bookIsBorrowed, int memberCount, int maxLimit) {
        if (bookIsBorrowed) return new Object[]{false, memberCount, "ALREADY_BORROWED"};
        if (memberCount >= maxLimit) return new Object[]{false, memberCount, "MAX_BORROW_LIMIT_REACHED"};
        return new Object[]{true, memberCount + 1, "CHECKOUT_ALLOWED"};
    }
}
`,
    cSignature:
      "bool process_checkout(bool book_is_borrowed, int member_borrowed_count, int max_limit, char *message)",
    cStarterCode: `// Library Checkout Guard in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool process_checkout(bool book_is_borrowed, int member_borrowed_count, int max_limit, char *message) {
    if (book_is_borrowed) {
        strcpy(message, "ALREADY_BORROWED");
        return false;
    }
    if (member_borrowed_count >= max_limit) {
        strcpy(message, "MAX_BORROW_LIMIT_REACHED");
        return false;
    }
    strcpy(message, "CHECKOUT_ALLOWED");
    return true;
}
`,
    hints: [
      "Check if book is already borrowed first.",
      "Check if member has reached maximum borrowing limit.",
      "Increment member borrowed count on approval.",
    ],
    tests: [
      {
        name: "Allow checkout for eligible member",
        args: [false, 2, 5],
        expected: [true, 3, "CHECKOUT_ALLOWED"],
      },
      {
        name: "Reject checkout on already borrowed book",
        args: [true, 1, 5],
        expected: [false, 1, "ALREADY_BORROWED"],
      },
      {
        name: "Reject checkout when member reaches limit",
        args: [false, 5, 5],
        expected: [false, 5, "MAX_BORROW_LIMIT_REACHED"],
      },
    ],
    explanationPrompt:
      "Explain the trade-offs of tracking book copies as individual UUID inventory items versus an aggregated copy counter.",
    mermaid: `graph TD
    A[Member Scans Book Barcode] --> B{Book Checked Out?}
    B -- Yes --> C[Reject: ALREADY_BORROWED]
    B -- No --> D{Member at Max Limit?}
    D -- Yes --> E[Reject: MAX_LIMIT]
    D -- No --> F[Allow Checkout & Assign Due Date]`,
  },

  "banking-system-transfers": {
    title: "Atomic Bank Transfer Engine",
    brief:
      "Write a function `execute_transfer(sender_bal, recv_bal, amount)` that executes an atomic fund transfer between two bank accounts. Validate positive amount and sufficient funds. Return `[True, new_sender_bal, new_recv_bal, 'SUCCESS']` or `[False, sender_bal, recv_bal, error_msg]`.",
    functionName: "execute_transfer",
    signature: "def execute_transfer(sender_bal: int, recv_bal: int, amount: int) -> tuple:",
    starterCode: `def execute_transfer(sender_bal, recv_bal, amount):
    if amount <= 0:
        return (False, sender_bal, recv_bal, "INVALID_AMOUNT")
    if sender_bal < amount:
        return (False, sender_bal, recv_bal, "INSUFFICIENT_FUNDS")
    return (True, sender_bal - amount, recv_bal + amount, "SUCCESS")
`,
    javaSignature:
      "public static Object[] executeTransfer(int senderBal, int recvBal, int amount)",
    javaStarterCode: `public class Solution {
    public static Object[] executeTransfer(int senderBal, int recvBal, int amount) {
        if (amount <= 0) return new Object[]{false, senderBal, recvBal, "INVALID_AMOUNT"};
        if (senderBal < amount) return new Object[]{false, senderBal, recvBal, "INSUFFICIENT_FUNDS"};
        return new Object[]{true, senderBal - amount, recvBal + amount, "SUCCESS"};
    }
}
`,
    cSignature:
      "bool execute_transfer(int sender_balance, int receiver_balance, int amount, int *new_sender_bal, int *new_recv_bal, char *status)",
    cStarterCode: `// Bank Transfer Guard in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool execute_transfer(int sender_balance, int receiver_balance, int amount, int *new_sender_bal, int *new_recv_bal, char *status) {
    if (amount <= 0) {
        strcpy(status, "INVALID_AMOUNT");
        return false;
    }
    if (sender_balance < amount) {
        strcpy(status, "INSUFFICIENT_FUNDS");
        return false;
    }
    *new_sender_bal = sender_balance - amount;
    *new_recv_bal = receiver_balance + amount;
    strcpy(status, "SUCCESS");
    return true;
}
`,
    hints: [
      "Guard against non-positive amounts first.",
      "Check if sender has sufficient balance to cover amount.",
      "Ensure funds are conserved: sender decrease equals receiver increase.",
    ],
    tests: [
      {
        name: "Execute successful transfer",
        args: [1000, 200, 300],
        expected: [true, 700, 500, "SUCCESS"],
      },
      {
        name: "Reject overdraft transfer",
        args: [100, 500, 200],
        expected: [false, 100, 500, "INSUFFICIENT_FUNDS"],
      },
      {
        name: "Reject zero or negative transfer amount",
        args: [500, 500, 0],
        expected: [false, 500, 500, "INVALID_AMOUNT"],
      },
    ],
    explanationPrompt:
      "Explain how database ACID transactions guarantee money is never created or destroyed during network partitions.",
    mermaid: `graph TD
    A[Transfer Request Initiated] --> B{Amount > 0?}
    B -- No --> C[Reject: INVALID_AMOUNT]
    B -- Yes --> D{Sender Balance >= Amount?}
    D -- No --> E[Reject: INSUFFICIENT_FUNDS]
    D -- Yes --> F[Debit Sender & Credit Receiver]`,
  },

  "parking-lot-allocation": {
    title: "Parking Lot Space Allocator",
    brief:
      "Write a function `allocate_parking_spot(spots, vehicle_type)` that finds the nearest available spot capable of fitting `vehicle_type` ('MOTORCYCLE', 'COMPACT', 'LARGE'). Return `[True, updated_spots, spot_id]` if found, or `[False, spots, 'LOT_FULL']`.",
    functionName: "allocate_parking_spot",
    signature: "def allocate_parking_spot(spots: list, vehicle_type: str) -> tuple:",
    starterCode: `def allocate_parking_spot(spots, vehicle_type):
    # Allowed spot sizes per vehicle type
    fits = {
        "MOTORCYCLE": ["MOTORCYCLE", "COMPACT", "LARGE"],
        "COMPACT": ["COMPACT", "LARGE"],
        "LARGE": ["LARGE"]
    }
    allowed = fits.get(vehicle_type, [])
    for idx, s in enumerate(spots):
        if not s.get("occupied") and s.get("size") in allowed:
            spots[idx]["occupied"] = True
            return (True, spots, s.get("id"))
    return (False, spots, "LOT_FULL")
`,
    javaSignature:
      "public static Object[] allocateParkingSpot(java.util.List<java.util.Map<String, Object>> spots, String vehicleType)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Object[] allocateParkingSpot(List<Map<String, Object>> spots, String vehicleType) {
        for (Map<String, Object> spot : spots) {
            boolean occupied = (Boolean) spot.getOrDefault("occupied", false);
            if (!occupied) {
                spot.put("occupied", true);
                return new Object[]{true, spots, spot.get("id")};
            }
        }
        return new Object[]{false, spots, "LOT_FULL"};
    }
}
`,
    cSignature: "int calculate_parking_fee(int entry_hour, int exit_hour, int hourly_rate)",
    cStarterCode: `// Parking Fee Calculation in C
#include <stdio.h>

int calculate_parking_fee(int entry_hour, int exit_hour, int hourly_rate) {
    if (exit_hour <= entry_hour) return 0;
    int duration = exit_hour - entry_hour;
    return duration * hourly_rate;
}
`,
    hints: [
      "Check spots in sequential order to allocate closest available space.",
      "Verify vehicle size compatibility.",
      "Mark spot occupied upon assignment.",
    ],
    tests: [
      {
        name: "Allocate first free spot",
        args: [
          [
            { id: "S1", size: "COMPACT", occupied: false },
            { id: "S2", size: "LARGE", occupied: false },
          ],
          "COMPACT",
        ],
        expected: [
          true,
          [
            { id: "S1", size: "COMPACT", occupied: true },
            { id: "S2", size: "LARGE", occupied: false },
          ],
          "S1",
        ],
      },
    ],
    explanationPrompt:
      "Explain how real-time parking spot allocation handles concurrent arrivals at different entrance gates.",
    mermaid: `graph TD
    A[Vehicle Approaches Gate] --> B[Scan Available Spots]
    B --> C{Compatible Spot Free?}
    C -- Yes --> D[Assign Nearest Spot & Open Barrier]
    C -- No --> E[Display LOT FULL Sign]`,
  },

  "vending-machine-states": {
    title: "Vending Machine State Machine",
    brief:
      "Write a function `process_vending_purchase(state, balance, item_price)` that calculates change and state transition for a vending purchase. Return `[True, change, 'DISPENSED']` if balance >= price and state is 'PAID', else `[False, balance, 'INSUFFICIENT_FUNDS']`.",
    functionName: "process_vending_purchase",
    signature:
      "def process_vending_purchase(state: str, balance: int, item_price: int) -> tuple:",
    starterCode: `def process_vending_purchase(state, balance, item_price):
    if state != "PAID" or balance < item_price:
        return (False, balance, "INSUFFICIENT_FUNDS")
    change = balance - item_price
    return (True, change, "DISPENSED")
`,
    javaSignature:
      "public static Object[] processVendingPurchase(String state, int balance, int itemPrice)",
    javaStarterCode: `public class Solution {
    public static Object[] processVendingPurchase(String state, int balance, int itemPrice) {
        if (!"PAID".equals(state) || balance < itemPrice) {
            return new Object[]{false, balance, "INSUFFICIENT_FUNDS"};
        }
        return new Object[]{true, balance - itemPrice, "DISPENSED"};
    }
}
`,
    cSignature:
      "bool process_vending_purchase(const char *state, int balance, int item_price, int *change, char *next_state)",
    cStarterCode: `// Vending Machine State Transition in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool process_vending_purchase(const char *state, int balance, int item_price, int *change, char *next_state) {
    if (strcmp(state, "IDLE") == 0 || balance < item_price) {
        *change = balance;
        strcpy(next_state, "INSUFFICIENT");
        return false;
    }
    *change = balance - item_price;
    strcpy(next_state, "DISPENSED");
    return true;
}
`,
    hints: [
      "Ensure the machine is in the PAID state before attempting purchase.",
      "Check balance against item_price.",
      "Calculate change and transition state to DISPENSED.",
    ],
    tests: [
      {
        name: "Dispense item with change",
        args: ["PAID", 100, 65],
        expected: [true, 35, "DISPENSED"],
      },
      {
        name: "Reject insufficient balance",
        args: ["PAID", 40, 50],
        expected: [false, 40, "INSUFFICIENT_FUNDS"],
      },
    ],
    explanationPrompt:
      "Explain how a state machine prevents item dispensing without verified coin/cash acceptance.",
    mermaid: `graph TD
    A[IDLE: Insert Coins] --> B[ACCEPTING_COINS]
    B --> C{Balance >= Item Price?}
    C -- Yes --> D[DISPENSING: Return Change]
    C -- No --> B`,
  },
};

/**
 * Automatically synthesizes a high-quality CodeLab for any case study
 * when not explicitly authored in the database.
 */
function synthesizeDefaultCodeLab(study: CaseStudy | any): CodeLab {
  const slug = study.slug || "system-lab";
  const title = study.title ? `${study.title} — Implementation Lab` : "Interactive System Lab";
  const funcName = slug.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() + "_handler";

  // Derive hints from practice or algorithm if available
  const hints: string[] = [];
  if (Array.isArray(study.practice) && study.practice.length > 0) {
    study.practice.slice(0, 3).forEach((p: any) => {
      if (p.brief) hints.push(p.brief);
    });
  } else if (Array.isArray(study.implementation?.algorithm)) {
    study.implementation.algorithm.slice(0, 3).forEach((step: string) => {
      hints.push(step);
    });
  }
  if (hints.length === 0) {
    hints.push("Validate input boundary conditions and null checks.");
    hints.push("Implement the core domain state transition.");
    hints.push("Return the verified operational result tuple.");
  }

  const pySig = `def ${funcName}(payload: dict) -> tuple:`;
  const pyStarter = `def ${funcName}(payload):
    """
    Implementation Lab: ${study.title || slug}
    - Validate inputs
    - Process business logic
    - Return confirmation status
    """
    if not payload:
        return (False, "INVALID_PAYLOAD")
    # Write your solution here
    return (True, "SUCCESS")
`;

  const javaSig = `public static Object[] ${funcName}(java.util.Map<String, Object> payload)`;
  const javaStarter = `import java.util.Map;

public class Solution {
    public static Object[] ${funcName}(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return new Object[]{false, "INVALID_PAYLOAD"};
        }
        // Write your solution here
        return new Object[]{true, "SUCCESS"};
    }
}
`;

  const cSig = `bool ${funcName}(const char *request_json, char *response_out)`;
  const cStarter = `// System Implementation in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool ${funcName}(const char *request_json, char *response_out) {
    if (!request_json || strlen(request_json) == 0) {
        strcpy(response_out, "INVALID_REQUEST");
        return false;
    }
    strcpy(response_out, "SUCCESS");
    return true;
}
`;

  const tests: CodeTest[] = [
    {
      name: "Standard valid request execution",
      args: [{ action: "PROCESS", id: "101" }],
      expected: [true, "SUCCESS"],
    },
    {
      name: "Reject empty or invalid input",
      args: [{}],
      expected: [false, "INVALID_PAYLOAD"],
    },
  ];

  return {
    title,
    brief:
      study.summary ||
      `Implement the core architectural function for ${study.title || slug}. Handle edge cases, validate inputs, and ensure data consistency.`,
    language: "python",
    functionName: funcName,
    signature: pySig,
    starterCode: pyStarter,
    javaSignature: javaSig,
    javaStarterCode: javaStarter,
    cSignature: cSig,
    cStarterCode: cStarter,
    hints,
    tests,
    explanationPrompt: `Explain your implementation for ${study.title || slug}: how did you structure state transitions, and what failure modes does your solution mitigate?`,
    mermaid: `graph TD
    A[Client Request Received] --> B{Payload Valid?}
    B -- No --> C[Return Error Status]
    B -- Yes --> D[Execute State Transition]
    D --> E[Return Success Confirmation]`,
  };
}

/**
 * Resolves a complete, guaranteed non-null CodeLab for any case study.
 * Blends database `study.codeLab` with curated templates and dynamic fallback.
 */
export function resolveCodeLab(study: CaseStudy | any | undefined | null): CodeLab {
  if (!study) {
    return synthesizeDefaultCodeLab({ slug: "practice-lab", title: "Practice Lab" });
  }

  const curated = CURATED_CODE_LABS[study.slug];
  const dbLab = study.codeLab;
  const fallback = synthesizeDefaultCodeLab(study);

  // If database has a complete lab, use it with fallbacks for missing fields
  if (dbLab && dbLab.functionName && dbLab.signature) {
    const rawTests =
      Array.isArray(dbLab.tests) && dbLab.tests.length > 0
        ? dbLab.tests
        : curated?.tests && curated.tests.length > 0
          ? curated.tests
          : fallback.tests;

    const rawHints =
      Array.isArray(dbLab.hints) && dbLab.hints.length > 0
        ? dbLab.hints
        : curated?.hints && curated.hints.length > 0
          ? curated.hints
          : fallback.hints;

    const res: CodeLab = {
      title: dbLab.title || curated?.title || fallback.title,
      brief: dbLab.brief || curated?.brief || fallback.brief,
      language: (dbLab.language as any) || "python",
      functionName: dbLab.functionName,
      signature: dbLab.signature,
      starterCode: dbLab.starterCode || curated?.starterCode || fallback.starterCode,
      hints: rawHints,
      tests: rawTests,
      explanationPrompt:
        dbLab.explanationPrompt || curated?.explanationPrompt || fallback.explanationPrompt,
      mermaid: dbLab.mermaid || curated?.mermaid || fallback.mermaid,
    };

    const javaSig = dbLab.javaSignature || curated?.javaSignature || fallback.javaSignature;
    if (javaSig) res.javaSignature = javaSig;

    const javaStarter = dbLab.javaStarterCode || curated?.javaStarterCode || fallback.javaStarterCode;
    if (javaStarter) res.javaStarterCode = javaStarter;

    const pySig = dbLab.pythonSignature || dbLab.signature || fallback.signature;
    if (pySig) res.pythonSignature = pySig;

    const pyStarter = dbLab.pythonStarterCode || dbLab.starterCode || fallback.starterCode;
    if (pyStarter) res.pythonStarterCode = pyStarter;

    const cSig = dbLab.cSignature || curated?.cSignature || fallback.cSignature;
    if (cSig) res.cSignature = cSig;

    const cStarter = dbLab.cStarterCode || curated?.cStarterCode || fallback.cStarterCode;
    if (cStarter) res.cStarterCode = cStarter;

    if (dbLab.languages) res.languages = dbLab.languages;
    if (dbLab.requiredConcepts) res.requiredConcepts = dbLab.requiredConcepts;

    return res;
  }

  // If curated entry exists for this case study
  if (curated) {
    const res: CodeLab = {
      title: curated.title || fallback.title,
      brief: curated.brief || fallback.brief,
      language: "python",
      functionName: curated.functionName || fallback.functionName,
      signature: curated.signature || fallback.signature,
      starterCode: curated.starterCode || fallback.starterCode,
      hints: curated.hints || fallback.hints,
      tests: curated.tests || fallback.tests,
      explanationPrompt: curated.explanationPrompt || fallback.explanationPrompt,
      mermaid: curated.mermaid || fallback.mermaid,
    };

    const javaSig = curated.javaSignature || fallback.javaSignature;
    if (javaSig) res.javaSignature = javaSig;

    const javaStarter = curated.javaStarterCode || fallback.javaStarterCode;
    if (javaStarter) res.javaStarterCode = javaStarter;

    const pySig = curated.signature || fallback.signature;
    if (pySig) res.pythonSignature = pySig;

    const pyStarter = curated.starterCode || fallback.starterCode;
    if (pyStarter) res.pythonStarterCode = pyStarter;

    const cSig = curated.cSignature || fallback.cSignature;
    if (cSig) res.cSignature = cSig;

    const cStarter = curated.cStarterCode || fallback.cStarterCode;
    if (cStarter) res.cStarterCode = cStarter;

    return res;
  }

  // Otherwise synthesize a dynamic lab based on the case study
  return fallback;
}
