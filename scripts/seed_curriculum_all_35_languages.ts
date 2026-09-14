import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { CASE_TRANSLATIONS } from "./curriculum_translations";
import { MISSING_10_CASES } from "./curriculum_missing_10";

const CONVEX_URL = process.env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error("Missing VITE_CONVEX_URL. Configure .env.local before running.");
}

const client = new ConvexHttpClient(CONVEX_URL);

// Fallback C signatures for the 25 existing cases where not already specified in translations
const C_CODELAB_SIGNATURES: Record<string, { cSignature: string; cStarterCode: string }> = {
  "atm-machine": {
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
  },
  "library-management": {
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
  },
  "banking-system-transfers": {
    cSignature:
      "bool execute_transfer(int sender_balance, int receiver_balance, int amount, int *new_sender_bal, int *new_recv_bal, char *status)",
    cStarterCode: `// Banking Transfer in C
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
  },
  "parking-lot-allocation": {
    cSignature: "int calculate_parking_fee(int entry_hour, int exit_hour, int hourly_rate)",
    cStarterCode: `// Parking Fee Calculation in C
#include <stdio.h>

int calculate_parking_fee(int entry_hour, int exit_hour, int hourly_rate) {
    if (exit_hour <= entry_hour) return 0;
    int duration = exit_hour - entry_hour;
    return duration * hourly_rate;
}
`,
  },
  "vending-machine-states": {
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
  },
  "seat-booking-system": {
    cSignature: "bool book_seat(bool *seats, int total_seats, int seat_id)",
    cStarterCode: `// Seat Booking Reservation in C
#include <stdio.h>
#include <stdbool.h>

bool book_seat(bool *seats, int total_seats, int seat_id) {
    if (seat_id < 0 || seat_id >= total_seats) return false;
    if (seats[seat_id]) return false; // Already booked
    seats[seat_id] = true;
    return true;
}
`,
  },
  "inventory-stock-tracker": {
    cSignature: "bool deduct_stock(int *stock, int quantity)",
    cStarterCode: `// Inventory Stock Deduction in C
#include <stdio.h>
#include <stdbool.h>

bool deduct_stock(int *stock, int quantity) {
    if (quantity <= 0 || *stock < quantity) return false;
    *stock -= quantity;
    return true;
}
`,
  },
  "client-server-architecture": {
    cSignature: "int dispatch_request(const char *method, const char *path, char *response_body)",
    cStarterCode: `// HTTP Dispatcher in C
#include <stdio.h>
#include <string.h>

int dispatch_request(const char *method, const char *path, char *response_body) {
    if (strcmp(method, "GET") == 0 && strcmp(path, "/health") == 0) {
        strcpy(response_body, "OK");
        return 200;
    }
    strcpy(response_body, "NOT_FOUND");
    return 404;
}
`,
  },
  "dns-domain-lookup": {
    cSignature: "bool resolve_domain(const char *domain, char *ip_address, bool *cache_hit)",
    cStarterCode: `// DNS Resolver in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool resolve_domain(const char *domain, char *ip_address, bool *cache_hit) {
    if (strcmp(domain, "kruzz.dev") == 0) {
        strcpy(ip_address, "104.21.45.12");
        *cache_hit = true;
        return true;
    }
    return false;
}
`,
  },
  "image-cdn-delivery": {
    cSignature: "int get_image_with_cdn(const char *filename, bool in_edge, char *asset_data)",
    cStarterCode: `// CDN Asset Delivery in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

int get_image_with_cdn(const char *filename, bool in_edge, char *asset_data) {
    if (in_edge) {
        sprintf(asset_data, "EDGE_CACHE:%s", filename);
        return 200;
    }
    sprintf(asset_data, "ORIGIN_FETCH:%s", filename);
    return 200;
}
`,
  },
  "search-autocomplete": {
    cSignature:
      "int get_autocomplete_suggestions(const char *query, const char **candidates, int count, char **results)",
    cStarterCode: `// Autocomplete Prefix Filter in C
#include <stdio.h>
#include <string.h>

int get_autocomplete_suggestions(const char *query, const char **candidates, int count, char **results) {
    int matched = 0;
    int qlen = strlen(query);
    for (int i = 0; i < count; i++) {
        if (strncmp(candidates[i], query, qlen) == 0) {
            results[matched++] = (char *)candidates[i];
        }
    }
    return matched;
}
`,
  },
  "authentication-workings": {
    cSignature:
      "bool verify_identity(const char *username, const char *password, const char *db_hash)",
    cStarterCode: `// Identity Verification in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool verify_identity(const char *username, const char *password, const char *db_hash) {
    if (strlen(username) == 0 || strlen(password) == 0) return false;
    return strcmp(password, db_hash) == 0;
}
`,
  },
  "password-hashing-salts": {
    cSignature: "void hash_password(const char *password, const char *salt, char *out_hash)",
    cStarterCode: `// Salted Password Hashing in C
#include <stdio.h>
#include <string.h>

void hash_password(const char *password, const char *salt, char *out_hash) {
    sprintf(out_hash, "sha256$%s$%s", salt, password);
}
`,
  },
  "api-key-auth": {
    cSignature:
      "bool validate_api_request(const char *api_key, const char *secret_token, const char *valid_hash)",
    cStarterCode: `// API Key Validator in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool validate_api_request(const char *api_key, const char *secret_token, const char *valid_hash) {
    if (!api_key || !secret_token) return false;
    return strcmp(secret_token, valid_hash) == 0;
}
`,
  },
  "two-factor-totp": {
    cSignature: "int generate_totp(const char *secret, long long timestamp, int timestep)",
    cStarterCode: `// TOTP Token Calculation in C
#include <stdio.h>
#include <string.h>

int generate_totp(const char *secret, long long timestamp, int timestep) {
    long long counter = timestamp / (long long)timestep;
    unsigned int hash = 5381;
    for (int i = 0; secret[i] != '\\0'; i++) {
        hash = ((hash << 5) + hash) + secret[i];
    }
    hash = hash ^ (unsigned int)counter;
    return hash % 1000000;
}
`,
  },
  "session-tokens-cookies": {
    cSignature: "bool validate_session(const char *token, long long expires_at, long long now)",
    cStarterCode: `// Session Token Expiry Guard in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool validate_session(const char *token, long long expires_at, long long now) {
    if (!token || strlen(token) < 16) return false;
    return now < expires_at;
}
`,
  },
  "url-shortener": {
    cSignature: "bool resolve_short_url(const char *short_code, char *original_url)",
    cStarterCode: `// URL Shortener Resolver in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool resolve_short_url(const char *short_code, char *original_url) {
    if (strcmp(short_code, "krz1") == 0) {
        strcpy(original_url, "https://kruzz.dev/system-design");
        return true;
    }
    return false;
}
`,
  },
  "key-value-caching": {
    cSignature: "bool cache_set(const char *key, const char *value, int ttl_seconds)",
    cStarterCode: `// Key-Value Cache Set in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool cache_set(const char *key, const char *value, int ttl_seconds) {
    if (!key || !value || ttl_seconds <= 0) return false;
    return true;
}
`,
  },
  "database-indexing": {
    cSignature: "int core_function_name(const int *keys, int count, int target_key)",
    cStarterCode: `// B-Tree Leaf Binary Search in C
#include <stdio.h>

int core_function_name(const int *keys, int count, int target_key) {
    int low = 0, high = count - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (keys[mid] == target_key) return mid;
        if (keys[mid] < target_key) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}
`,
  },
  "cloud-data-deduplication": {
    cSignature: "bool store_file(const char *file_hash, int file_size, bool *is_duplicate)",
    cStarterCode: `// Cloud Chunk Deduplication in C
#include <stdio.h>
#include <stdbool.h>
#include <string.h>

bool store_file(const char *file_hash, int file_size, bool *is_duplicate) {
    if (!file_hash || file_size <= 0) return false;
    // Example stub: hash starting with "dup" is recognized as duplicate
    *is_duplicate = (strncmp(file_hash, "dup", 3) == 0);
    return true;
}
`,
  },
  "two-phase-commit-transactions": {
    cSignature: "const char *decide_two_phase(const char **votes, int vote_count)",
    cStarterCode: `// Two-Phase Commit Coordinator in C
#include <stdio.h>
#include <string.h>

const char *decide_two_phase(const char **votes, int vote_count) {
    if (vote_count <= 0) return "ABORT";
    for (int i = 0; i < vote_count; i++) {
        if (strcmp(votes[i], "COMMIT") != 0) {
            return "ABORT";
        }
    }
    return "COMMIT";
}
`,
  },
  "event-streaming-partitioned-log": {
    cSignature: "int assign_partition(const char *key, int num_partitions)",
    cStarterCode: `// Partition Assignment in C
#include <stdio.h>
#include <string.h>

int assign_partition(const char *key, int num_partitions) {
    if (num_partitions <= 0) return 0;
    unsigned int hash = 5381;
    for (int i = 0; key[i] != '\\0'; i++) {
        hash = ((hash << 5) + hash) + key[i];
    }
    return (int)(hash % num_partitions);
}
`,
  },
  "consistent-hashing-shard-ring": {
    cSignature: "int find_node(const char *key, const int *ring, int ring_size)",
    cStarterCode: `// Consistent Hashing Ring Lookup in C
#include <stdio.h>
#include <string.h>

int find_node(const char *key, const int *ring, int ring_size) {
    if (ring_size <= 0) return -1;
    unsigned int h = 0;
    for (int i = 0; key[i]; i++) h = h * 31 + key[i];
    int key_hash = (int)(h % 360);
    for (int i = 0; i < ring_size; i++) {
        if (ring[i] >= key_hash) return ring[i];
    }
    return ring[0];
}
`,
  },
  "leader-election-consensus": {
    cSignature: "int elect_leader(const int *votes, int vote_count, int total_nodes)",
    cStarterCode: `// Quorum Leader Election in C
#include <stdio.h>

int elect_leader(const int *votes, int vote_count, int total_nodes) {
    int majority = (total_nodes / 2) + 1;
    if (vote_count >= majority) {
        return votes[0];
    }
    return -1;
}
`,
  },
  "quorum-reads-writes": {
    cSignature:
      "int read_value(const int *versions, const int *values, int count, int read_quorum)",
    cStarterCode: `// Quorum Consensus Read in C
#include <stdio.h>

int read_value(const int *versions, const int *values, int count, int read_quorum) {
    if (count < read_quorum || count == 0) return -1;
    int max_ver = -1;
    int latest_val = -1;
    for (int i = 0; i < count; i++) {
        if (versions[i] > max_ver) {
            max_ver = versions[i];
            latest_val = values[i];
        }
    }
    return latest_val;
}
`,
  },
};

async function main() {
  console.log("=== KRUZZ 35-Case Curriculum Seeding (Python, Java, C) ===");

  // 1. Fetch current case studies from Convex
  const existingStudies = await client.query(api.caseStudies.list, {});
  console.log(`Fetched ${existingStudies.length} existing cases from database.`);

  // 2. Update existing cases with Java and C samples + C codeLab signatures
  for (const study of existingStudies) {
    const slug = study.slug;
    const additions = CASE_TRANSLATIONS[slug];
    const cCodeLabFallback = C_CODELAB_SIGNATURES[slug];

    let modified = false;
    const samples = study.implementation?.samples ? [...study.implementation.samples] : [];

    // Check Java sample
    if (additions?.java) {
      const javaIndex = samples.findIndex((s: any) => s.language?.toLowerCase() === "java");
      const javaSample = {
        language: "java",
        filename: additions.java.filename,
        code: additions.java.code,
      };
      if (javaIndex >= 0) {
        samples[javaIndex] = javaSample;
      } else {
        samples.push(javaSample);
      }
      modified = true;
    }

    // Check C sample
    if (additions?.c) {
      const cIndex = samples.findIndex((s: any) => s.language?.toLowerCase() === "c");
      const cSample = {
        language: "c",
        filename: additions.c.filename,
        code: additions.c.code,
      };
      if (cIndex >= 0) {
        samples[cIndex] = cSample;
      } else {
        samples.push(cSample);
      }
      modified = true;
    }

    // Update implementation samples
    if (!study.implementation) {
      study.implementation = {
        behaviour: "",
        algorithm: [],
        ladder: [],
        samples,
        simulationNote: "",
      };
    } else {
      study.implementation.samples = samples;
    }

    // Update codeLab with C support
    if (study.codeLab) {
      const cCodeLabData = additions?.cCodeLab ?? cCodeLabFallback;
      if (cCodeLabData) {
        study.codeLab.cSignature = cCodeLabData.cSignature;
        study.codeLab.cStarterCode = cCodeLabData.cStarterCode;
      }
      if (!study.codeLab.languages) {
        study.codeLab.languages = ["Python", "Java", "C"];
      }
      modified = true;
    }

    if (modified) {
      console.log(
        `Updating [${study.index}] ${study.slug} -> samples: [${samples.map((s: any) => s.language).join(", ")}]...`,
      );
      await client.mutation(api.caseStudies.upsert, { caseStudy: study });
    }
  }

  // 3. Upsert missing 10 cases (11, 22-30)
  console.log(`\nInserting/Updating 10 Missing Cases...`);
  for (const missingCase of MISSING_10_CASES) {
    console.log(
      `Upserting [${missingCase.index}] ${missingCase.slug} -> samples: [${missingCase.implementation.samples.map((s: any) => s.language).join(", ")}]...`,
    );
    await client.mutation(api.caseStudies.upsert, { caseStudy: missingCase });
  }

  // 4. Verification Check
  console.log("\n=== Final Verification ===");
  const allStudies = await client.query(api.caseStudies.list, {});
  console.log(`Total Case Studies in Convex: ${allStudies.length}`);

  let allValid = true;
  for (const s of allStudies) {
    const langs = s.implementation?.samples?.map((x: any) => x.language.toLowerCase()) || [];
    const hasPython = langs.includes("python");
    const hasJava = langs.includes("java");
    const hasC = langs.includes("c");
    const hasCSig = !!s.codeLab?.cSignature;

    const ok = hasPython && hasJava && hasC && hasCSig;
    if (!ok) {
      console.error(
        `FAIL: [${s.index}] ${s.slug} -> python:${hasPython}, java:${hasJava}, c:${hasC}, cSig:${hasCSig}`,
      );
      allValid = false;
    } else {
      console.log(`[${s.index}] ${s.slug} - OK (Python, Java, C)`);
    }
  }

  if (allStudies.length === 35 && allValid) {
    console.log(
      "\nSUCCESS: All 35 Case Studies are populated with complete Python, Java, and C implementations!",
    );
  } else {
    console.error(`\nWARNING: Expected 35 cases with all languages, found ${allStudies.length}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
