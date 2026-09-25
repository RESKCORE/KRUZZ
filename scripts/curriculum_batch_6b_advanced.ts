import { upsertToConvex, validateCaseStudy } from "./quality_gate.ts";

// ============================================================================
// Batch 6b: Advanced Distributed Systems & Ledgers (Cases 56 - 59)
// All cases are premium-tier, difficulty "Advanced", learnerLevel "Engineer", rcCost: 90
// ============================================================================

// ----------------------------------------------------------------------------
// Case 56: High-Scale Git Virtual Monorepo & Object Storage
// ----------------------------------------------------------------------------
export const case56_virtualGitMonorepo = {
  id: "cs-git-monorepo-056",
  slug: "high-scale-git-virtual-monorepo",
  index: "56",
  title:
    "How Does a Virtual Git Monorepo Handle Millions of Files Without Freezing Developer Machines?",
  shortTitle: "Virtual Git Monorepo",
  category: "Advanced Distributed Architectures",
  subcategory: "Content-Addressable Storage & Virtual Filesystems",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "Massive enterprise codebases at Microsoft (Windows) and Google contain millions of source files across tens of gigabytes. Standard Git operations like `git status` or `git checkout` crawl every file on disk, taking minutes or running out of memory. Discover how virtualized filesystems (VFS for Git / Scalar) project file trees dynamically, download content lazily on-demand, and perform fast Merkle tree diffs.",
  learningObjectives: [
    "Explain Git's internal object model: Blobs, Trees, Commits, and Annotated Tags.",
    "Design a virtualized filesystem layer (VFS) that hydrates file contents on open/read.",
    "Implement content-addressable Merkle tree diffing to detect modified, added, and deleted files in O(D) time.",
    "Architect sparse-checkout projection and partial-clone object packing for multi-gigabyte repos.",
  ],
  prerequisites: [
    "Git internal architecture (DAG of commits and tree objects)",
    "Content-addressable storage (SHA-1 / SHA-256 hashing)",
    "Filesystem virtual drivers (FUSE / Windows Projected File System ProjFS)",
  ],
  engineeringConcepts: [
    "Content-Addressable Storage",
    "Merkle Tree Commit Graphs",
    "Virtualized Filesystem (ProjFS/FUSE)",
    "Sparse Checkout & Partial Clone",
    "Tree Object Diffing",
  ],
  technologies: ["Python", "Java", "Git", "Scalar", "VFSForGit", "ProjFS"],
  tech: ["Git Monorepo", "Content-Addressable", "VFS"],
  tags: ["git", "monorepo", "vfs", "merkle", "advanced"],
  glossary: [
    {
      term: "Content-Addressable Storage",
      plainDefinition:
        "Storing data indexed by the cryptographic hash of its contents (e.g. SHA-1) rather than a mutable file path or address.",
    },
    {
      term: "Merkle Tree Tree Object",
      plainDefinition:
        "A Git directory snapshot containing an array of permissions, filenames, and hash pointers to child blobs or sub-trees.",
    },
    {
      term: "Sparse Checkout",
      plainDefinition:
        "A Git client feature that only populates files on disk that match specific subdirectory cone patterns requested by the developer.",
    },
    {
      term: "Projected File System (ProjFS)",
      plainDefinition:
        "An OS kernel driver providing virtual directory placeholders that materialize physical file bytes on disk only when an application calls read().",
    },
    {
      term: "Partial Clone & Blob Bloat",
      plainDefinition:
        "Cloning repository metadata and commit history while excluding file blob contents until explicitly referenced.",
    },
  ],
  primers: [
    {
      concept: "The Git Monorepo Problem",
      minutes: 4,
      definition:
        "A repository with 5,000,000 files causes `git status` to invoke 5,000,000 stat() kernel calls. Even on fast NVMe drives, this takes 45 to 90 seconds per command, paralyzing developer workflows.",
      whyNeeded:
        "Enterprise monorepos require virtualization so that only the 500 files a developer actually touches exist on the local disk.",
      analogy:
        "Streaming movies on Netflix on-demand vs downloading every single movie in the entire Netflix library before you can watch one video.",
      tinyExample:
        "# Sparse clone avoids downloading 200GB of blobs\ngit clone --filter=blob:none --sparse https://github.com/org/monorepo.git",
    },
    {
      concept: "Merkle Tree Diffing in O(Changes)",
      minutes: 4,
      definition:
        "Because tree objects are hashed recursively, if a directory and all its files are unchanged between two commits, their tree SHA hashes are identical. Git skips comparing every child file inside that entire directory.",
      whyNeeded:
        "Allows comparing two commits containing millions of files in milliseconds if only 3 files changed.",
      analogy:
        "Comparing the seal on two shipping containers: if the seal numbers match, you don't need to unpack and count all 10,000 boxes inside.",
      tinyExample: "if tree_a.hash == tree_b.hash: return [] # Whole subtree is identical!",
    },
  ],
  discover: {
    situation:
      "A gaming company consolidated 40 sub-projects into a single unified monorepo. Within 6 months, the repo reached 4 million files and 180 GB in size. Engineers running `git checkout` or `git status` experienced 90-second freezes, and IDEs crashed trying to index the entire filesystem.",
    humanFlow: [
      "Developer runs `git clone --filter=blob:none` which downloads commit graph and tree objects (1 GB) in 30 seconds.",
      "OS virtual filesystem driver (ProjFS/FUSE) mounts the working directory with zero-byte placeholders.",
      "Developer navigates to `src/engine/physics` and opens `collision.cpp` in their IDE.",
      "OS filesystem driver catches the `read()` fault and triggers a background HTTP GET to the Git Object Cache.",
      "Blob bytes download in 15ms and are written to local disk cache; IDE reads file seamlessly.",
      "Developer modifies `collision.cpp` and runs `git commit`; only modified hashes bubble up the Merkle tree.",
    ],
    question:
      "How do you design a virtualized Git monorepo system that supports millions of files while keeping client disk usage under 2 GB and `git status` under 100 milliseconds?",
    whyItExists: [
      "Monorepos prevent cross-project dependency hell and enable atomic cross-service refactors.",
      "Physical disk capacity and OS directory traversal scale poorly beyond 500,000 files.",
      "Dynamic on-demand blob hydration preserves fast local developer feedback loops.",
    ],
  },
  understand: {
    overview:
      "The Virtual Git Monorepo architecture pairs Git sparse checkout / partial clone protocols with a kernel-level Projected File System (ProjFS / FUSE). Tree metadata is populated locally to expose directory structure, but blob payloads are stored in a distributed Object Storage tier (S3 / Ceph) fronted by regional CDN caches. When an application reads a placeholder, the VFS driver fetches the blob by its SHA hash and writes it to disk transparently.",
    components: [
      {
        name: "Virtual Filesystem Provider (VFS / ProjFS)",
        whatIsIt: "OS kernel filter driver intercepting filesystem syscalls.",
        whyItExists: "Emulates the presence of files without writing bytes to disk.",
        whatItDoes: "Translates `open()` / `read()` calls into lazy network blob fetches.",
      },
      {
        name: "Git Object Cache & Storage Tier",
        whatIsIt: "Distributed content-addressable storage storing blobs by SHA-1 / SHA-256.",
        whyItExists: "Decouples massive file blobs from the core Git commit graph.",
        whatItDoes: "Serves deduplicated object streams over HTTP chunked streaming.",
      },
      {
        name: "Merkle Tree Diff Engine",
        whatIsIt: "Tree comparison algorithm traversing commit tree objects.",
        whyItExists: "Determines file additions, modifications, and deletions instantly.",
        whatItDoes: "Short-circuits identical subtree hashes to achieve O(D) performance.",
      },
      {
        name: "Sparse-Checkout Cone Manager",
        whatIsIt: "Rule engine defining which directories should be materialized.",
        whyItExists: "Restricts local disk representation to the developer's working domain.",
        whatItDoes: "Updates `.git/info/sparse-checkout` patterns.",
      },
    ],
    analogy: {
      title: "Streaming Video Player with Pre-Loaded Chapter Thumbnails",
      everyday: [
        "When you open Netflix, the entire 2-hour movie is NOT downloaded to your phone memory.",
        "The app only downloads the timeline chapters, subtitles, and thumbnails (metadata).",
        "When you click on minute 42, the player fetches only that specific 10-second video chunk.",
      ],
      technical: [
        "Timeline thumbnails correspond to Git Tree and Commit Metadata.",
        "On-demand video chunk fetching corresponds to Lazy Blob Hydration via ProjFS.",
        "Cached viewed scenes correspond to Local Working Tree Disk Blobs.",
      ],
    },
    flow: [
      "Client clones repo using partial clone filter `--filter=blob:none`.",
      "VFS driver projects root tree into directory hierarchy; files appear in Windows Explorer / POSIX shell with sizes.",
      "Developer opens file `main.py` -> OS invokes VFS `OnQueryFileName` & `OnProvideData`.",
      "VFS queries local `.git/objects` cache. If cache miss, requests `GET /objects/sha1` from Git CDN.",
      "CDN returns compressed blob; VFS decompresses and hydrates local file block.",
      "Subsequent reads hit local disk cache directly at native NVMe speed.",
    ],
  },
  concepts: [
    {
      id: "concept-git-object-model",
      name: "Git Content-Addressable Object Model",
      difficulty: "Advanced",
      simpleDefinition:
        "Git stores everything as one of four object types: Blob (file contents), Tree (directory list of names and hashes), Commit (pointer to top tree and parents), and Tag.",
      whyItExists:
        "Provides cryptographic immutability and automatic deduplication across branches and history.",
      realWorldAnalogy:
        "A safe deposit box where the key number is the exact fingerprint of whatever item you put inside.",
      technicalExplanation:
        "Objects are compressed with zlib and stored as `sha1(type + ' ' + size + '\\0' + content)`. If two files have identical content, they share the exact same blob SHA.",
      caseApplication:
        "Allows monorepo caching layers to store a shared library header once, even if copied in 500 subfolders.",
      commonMistakes: [
        "Assuming Git stores diffs between versions (Git stores full snapshots of trees).",
        "Attempting to modify an object in place without changing its SHA.",
      ],
      practice: [
        "What happens to the SHA of a root tree when a single leaf file is edited?",
        "Why does content-addressable deduplication fail when files have identical content but different line endings?",
      ],
    },
    {
      id: "concept-lazy-hydration",
      name: "Lazy Blob Hydration via VFS",
      difficulty: "Advanced",
      simpleDefinition:
        "Creating virtual file placeholders that look and act like real files, but only download actual data bytes from the network when opened.",
      whyItExists:
        "Reduces monorepo clone size from 200 GB to 800 MB and clone time from 2 hours to 45 seconds.",
      realWorldAnalogy:
        "A library catalog card: you can browse millions of book titles instantly, but you only walk to the shelf to grab the book you want to read.",
      technicalExplanation:
        "Kernel drivers hook `IRP_MJ_CREATE` and `IRP_MJ_READ` to fetch missing blocks from a remote blob service before completing the user-space I/O request.",
      caseApplication:
        "Allows a developer to clone a 5-million file Windows monorepo onto a laptop with 256 GB SSD.",
      commonMistakes: [
        "Blocking the OS thread indefinitely if the remote blob cache suffers a network timeout.",
        "Hydrating whole large files into memory instead of streaming chunks.",
      ],
      practice: [
        "How does `git grep` interact with a virtual filesystem, and why can it cause accidental whole-repo dehydration?",
        "How do sparse-checkout cone patterns prevent grep from triggering whole-repo downloads?",
      ],
    },
    {
      id: "concept-merkle-diff",
      name: "Merkle Tree Diffing Optimization",
      difficulty: "Advanced",
      simpleDefinition:
        "Skipping entire directory branches during diff calculations whenever their tree hashes match.",
      whyItExists:
        "Diffing two snapshots in a 5,000,000 file repo takes O(Changes) instead of O(Total Files).",
      realWorldAnalogy:
        "Comparing two corporate org charts: if the VP of Marketing and all their reports haven't changed, you don't need to re-verify every intern in Marketing.",
      technicalExplanation:
        "Traverse tree A and tree B simultaneously. If `A.hash == B.hash`, prune recursion. If hashes differ, compare entry lists to find added, deleted, or modified entries.",
      caseApplication: "Enables instant `git diff HEAD~1` even across millions of source files.",
      commonMistakes: [
        "Traversing both trees down to all leaves even when subtrees have identical hashes.",
        "Ignoring file mode/permission modifications when hashes are equal.",
      ],
      practice: [
        "If a commit changes 1 file at depth 5, how many tree objects must be updated and recalculated?",
        "What is the worst-case time complexity of Merkle tree diffing?",
      ],
    },
  ],
  architecture: {
    levels: [
      {
        level: 1,
        title: "Level 1: Foundation (Standard Git Monorepo & Sparse Checkout)",
        focus: "Native Git sparse checkout with partial clone filters.",
        mermaid: `graph TD
    Client["Developer Laptop (Git CLI)"] --> SparseFilter["Sparse-Checkout Filter: /src/core/*"]
    SparseFilter --> GitLocal[".git/ Local Store (Trees & Metadata)"]
    Client --> GitServer["Central Git Server (Gerrit / GitHub)"]
    GitServer --> Storage["Git Packfiles on NVMe"]
`,
        changes: [
          "Enable `--filter=blob:none` to clone trees and commits without blobs.",
          "Configure `git sparse-checkout set /src/domain` to populate only required subdirectories.",
        ],
        components: [
          {
            name: "Git Sparse-Checkout Manager",
            description: "Limits working tree file creation.",
          },
          {
            name: "Partial Clone Blob Filter",
            description: "Omits remote blobs during initial fetch.",
          },
        ],
        tradeoffs: [
          {
            aspect: "Simplicity vs Scale",
            choice: "Native Git tooling",
            alternative: "Custom kernel VFS drivers",
            impact:
              "No OS driver installation needed, but unpopulated directories do not appear in file explorer.",
          },
        ],
        failureModes: [
          {
            mode: "Accidental full checkout",
            consequence: "Downloading millions of blobs, filling local disk.",
            mitigation: "Enforce server-side sparse clone policies.",
          },
        ],
      },
      {
        level: 2,
        title: "Level 2: Scale & Distribution (Projected VFS & Regional Blob Cache)",
        focus: "Kernel-level filesystem virtualization with distributed object caching.",
        mermaid: `graph LR
    IDE["Developer IDE / Build System"] --> VFS["ProjFS / FUSE Kernel Driver"]
    VFS --> LocalDisk["Local Hydrated Cache"]
    VFS -->|"Cache Miss"| RegionalEdge["Regional Git Cache Proxy (Edge CDN)"]
    RegionalEdge --> S3["Object Storage (Ceph / S3 Blobs)"]
    RegionalEdge --> GitMeta["Git Metadata Service (Commits/Trees)"]
`,
        changes: [
          "Implement ProjFS/FUSE virtual driver to project empty directory trees.",
          "Deploy regional edge cache proxies to serve blobs with sub-10ms latency.",
        ],
        components: [
          {
            name: "ProjFS Virtual Driver",
            description: "Intercepts filesystem I/O and triggers lazy hydration.",
          },
          {
            name: "Regional Edge Cache Proxy",
            description: "Caches frequently requested blobs close to developer offices.",
          },
        ],
        tradeoffs: [
          {
            aspect: "OS Complexity vs Developer UX",
            choice: "Kernel VFS driver",
            alternative: "CLI wrapper scripts",
            impact:
              "Seamless IDE support, but requires kernel driver signing and platform-specific builds.",
          },
        ],
        failureModes: [
          {
            mode: "Regional cache outage",
            consequence: "File reads block or error out in IDE.",
            mitigation: "Graceful fallback to central S3 bucket with retry backoff.",
          },
        ],
      },
      {
        level: 3,
        title: "Level 3: Production Resilience (Content-Addressable Dedup & Background Pre-fetch)",
        focus: "Predictive pre-fetching, commit graph optimization, and global scale.",
        mermaid: `graph TD
    BranchSwitch["Branch Switch Event (git checkout feature-x)"] --> PreFetch["Predictive Pre-Fetch Daemon"]
    PreFetch --> DepGraph["Build Dependency Graph"]
    DepGraph --> FetchBlobs["Batch Fetch Required Blobs in Background"]
    FetchBlobs --> BlobCache["Local Object Store"]
    BlobCache --> FastReady["Zero-Latency IDE File Access"]
`,
        changes: [
          "Deploy predictive pre-fetch daemon that reads build target dependencies and pre-loads blobs during branch switch.",
          "Maintain generation-number commit graphs (`commit-graph` file) to make reachability queries instant.",
        ],
        components: [
          {
            name: "Predictive Pre-fetch Daemon",
            description: "Anticipates file reads based on build targets.",
          },
          {
            name: "Commit-Graph Optimizer",
            description: "Accelerates merge base and topological sorting queries.",
          },
        ],
        tradeoffs: [
          {
            aspect: "Bandwidth vs Instant Access",
            choice: "Background pre-fetching of active build targets",
            alternative: "Strict purely on-demand fetching",
            impact:
              "Zero IDE freeze during compilation at the cost of modest background network traffic.",
          },
        ],
        failureModes: [
          {
            mode: "Network disconnect while offline",
            consequence: "Uncached files cannot be opened.",
            mitigation: "Offer `vfs prefetch --target=//src/app` command before traveling.",
          },
        ],
      },
    ],
  },
  decisions: [
    {
      decision: "Sparse Checkout vs Projected Virtual Filesystem (ProjFS)",
      chosen: "Projected Virtual Filesystem with on-demand block hydration",
      alternatives: [
        "Manual Sparse-Checkout cone configuration",
        "Splitting into 500 separate Git submodules",
      ],
      tradeoffs:
        "ProjFS provides seamless transparent file access without requiring manual cone updates, but requires kernel drivers.",
      rationale:
        "Developers frequently jump across service boundaries; manual cone management creates friction and broken links.",
      impact: "Zero-configuration developer experience with 98% reduced disk footprint.",
    },
    {
      decision: "Blob Storage: Git Packfiles vs Distributed Object Store (S3)",
      chosen: "Split architecture: Git server stores commits/trees; S3 stores raw blobs",
      alternatives: [
        "Storing everything in massive monolithic Git packfiles on Git servers",
        "Git LFS for large files only",
      ],
      tradeoffs:
        "S3 provides infinite horizontal scaling and cheap tiered storage, but requires a custom object proxy.",
      rationale:
        "Packfiles over 50 GB suffer severe lock contention and memory pressure during `git repack`.",
      impact:
        "Git servers remain lightweight (<10 GB RAM) while petabytes of blobs scale on cloud object storage.",
    },
  ],
  implementation: {
    steps: [
      {
        step: 1,
        title: "Compute Content Hash and Object Representation",
        objective:
          "Format raw file bytes into Git blob format and calculate cryptographic SHA-1 hash.",
        code: `import hashlib

def create_git_blob(content_bytes: bytes) -> tuple[str, bytes]:
    """Generates standard Git blob format: 'blob <size>\\0<content>' and returns (sha1, payload)"""
    header = f"blob {len(content_bytes)}\\0".encode('utf-8')
    payload = header + content_bytes
    sha1 = hashlib.sha1(payload).hexdigest()
    return sha1, payload`,
        explanation:
          "Matches Git's internal object specification, ensuring exact compatibility with native Git repositories.",
      },
      {
        step: 2,
        title: "Merkle Tree Diff Algorithm",
        objective:
          "Compare two directory tree dictionaries and report added, modified, and deleted paths in O(Differences).",
        code: `def diff_virtual_trees(tree_a: dict, tree_b: dict) -> list[dict]:
    """Compares tree_a and tree_b: {path: sha1} and produces sorted list of differences."""
    all_paths = sorted(set(tree_a.keys()) | set(tree_b.keys()))
    diffs = []
    for path in all_paths:
        sha_a = tree_a.get(path)
        sha_b = tree_b.get(path)
        if sha_a is None:
            diffs.append({"path": path, "type": "ADDED", "new_sha": sha_b})
        elif sha_b is None:
            diffs.append({"path": path, "type": "DELETED", "old_sha": sha_a})
        elif sha_a != sha_b:
            diffs.append({"path": path, "type": "MODIFIED", "old_sha": sha_a, "new_sha": sha_b})
    return diffs`,
        explanation:
          "Detects all atomic state transitions between commits without inspecting file contents on disk.",
      },
      {
        step: 3,
        title: "Lazy VFS Block Request Simulator",
        objective:
          "Simulate virtual file read with local disk cache check and remote blob download.",
        code: `class VirtualMonorepoFS:
    def __init__(self, remote_blob_store):
        self.remote_store = remote_blob_store
        self.local_cache = {} # sha -> bytes
        self.tree = {} # path -> sha

    def open_and_read(self, path: str) -> bytes:
        if path not in self.tree:
            raise FileNotFoundError(f"Path {path} does not exist in virtual tree")
        sha = self.tree[path]
        if sha not in self.local_cache:
            # Lazy hydration on demand
            self.local_cache[sha] = self.remote_store.get(sha)
        return self.local_cache[sha]`,
        explanation:
          "Hydrates missing blobs transparently upon the first file read, subsequent reads hit local memory/disk cache.",
      },
    ],
    samples: [
      {
        title: "Sparse Checkout Configuration",
        language: "bash",
        code: `git clone --filter=blob:none --no-checkout https://git.internal.corp/monorepo.git
cd monorepo
git sparse-checkout init --cone
git sparse-checkout set src/services/billing src/shared/proto
git checkout main`,
        explanation:
          "Initializes cone-mode sparse checkout, ensuring only billing and protobuf folders are written to disk.",
      },
      {
        title: "Merkle Tree Summary Output",
        language: "json",
        code: `{
  "total_files_a": 1500000,
  "total_files_b": 1500002,
  "added_count": 2,
  "modified_count": 1,
  "deleted_count": 0,
  "changes": [
    { "path": "src/billing/invoice.py", "type": "MODIFIED", "old_sha": "a1b2c3...", "new_sha": "d4e5f6..." },
    { "path": "src/billing/tests/test_dunning.py", "type": "ADDED", "new_sha": "7a8b9c..." }
  ]
}`,
        explanation: "Structured summary of differences across millions of tracked files.",
      },
    ],
  },
  practice: [
    {
      level: "Understand",
      title: "Full Working Tree Overhead",
      brief:
        "Explain why standard `git status` crawls become unacceptably slow on repos with millions of files due to OS stat() system calls.",
    },
    {
      level: "Modify",
      title: "Sparse Cone Configuration",
      brief:
        "Configure Git's partial clone `--filter=blob:none` to download tree and commit topologies without fetching multi-gigabyte blob payloads.",
    },
    {
      level: "Build",
      title: "Lazy Hydration Driver",
      brief:
        "Design a kernel VFS filter driver (ProjFS/FUSE) intercepting filesystem syscalls to download Git blobs on-demand in milliseconds.",
    },
    {
      level: "Think",
      title: "Merkle Tree Pruning",
      brief:
        "Explain the mathematical property of cryptographic Merkle trees that allows diffing two multi-million file commits in O(Changes) time.",
    },
  ],
  reflection: [
    "How would you prevent developers from running commands like `find .` or `grep -r` that unintentionally trigger whole-repo hydration?",
    "How does content-addressable storage simplify building a distributed build cache (like Bazel or Turborepo)?",
    "Why is kernel-level filesystem projection superior to manual sparse-checkout cone maintenance for large engineering teams?",
  ],
  techNotes: [
    {
      name: "Microsoft Scalar & ProjFS",
      kind: "Kernel Architecture",
      note: "Scalar (formerly VFS for Git) leverages the Windows Projected File System (ProjFS) or POSIX FUSE to project directory hierarchies without materializing file contents until read syscalls are issued.",
    },
    {
      name: "Git Partial Clone Specification",
      kind: "Protocol Extension",
      note: "Promisor remotes support `--filter=blob:none` and `--filter=tree:0` filters where missing objects are dynamically downloaded on-demand over Git wire protocol v2.",
    },
  ],
  codeLab: {
    functionName: "virtual_git_tree_diff",
    signature: "def virtual_git_tree_diff(tree_a: dict, tree_b: dict) -> dict:",
    starterCode: `def virtual_git_tree_diff(tree_a: dict, tree_b: dict) -> dict:
    """
    Compares two virtual Git trees (path -> sha1) and returns diff summary:
    {
        "total_files_a": int,
        "total_files_b": int,
        "added_count": int,
        "modified_count": int,
        "deleted_count": int,
        "changes": [
            {"path": str, "type": "ADDED"|"MODIFIED"|"DELETED", "old_sha": str|None, "new_sha": str|None}
        ]
    }
    The changes list must be sorted alphabetically by path.
    """
    all_paths = sorted(set(tree_a.keys()) | set(tree_b.keys()))
    changes = []
    added = 0
    modified = 0
    deleted = 0

    for path in all_paths:
        sha_a = tree_a.get(path)
        sha_b = tree_b.get(path)
        if sha_a is None:
            added += 1
            changes.append({"path": path, "type": "ADDED", "old_sha": None, "new_sha": sha_b})
        elif sha_b is None:
            deleted += 1
            changes.append({"path": path, "type": "DELETED", "old_sha": sha_a, "new_sha": None})
        elif sha_a != sha_b:
            modified += 1
            changes.append({"path": path, "type": "MODIFIED", "old_sha": sha_a, "new_sha": sha_b})

    return {
        "total_files_a": len(tree_a),
        "total_files_b": len(tree_b),
        "added_count": added,
        "modified_count": modified,
        "deleted_count": deleted,
        "changes": changes,
    }
`,
    javaSignature:
      "public static Map<String, Object> virtualGitTreeDiff(Map<String, String> treeA, Map<String, String> treeB)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> virtualGitTreeDiff(Map<String, String> treeA, Map<String, String> treeB) {
        TreeSet<String> allPaths = new TreeSet<>();
        allPaths.addAll(treeA.keySet());
        allPaths.addAll(treeB.keySet());

        List<Map<String, Object>> changes = new ArrayList<>();
        int added = 0;
        int modified = 0;
        int deleted = 0;

        for (String path : allPaths) {
            String shaA = treeA.get(path);
            String shaB = treeB.get(path);

            if (shaA == null) {
                added++;
                Map<String, Object> c = new LinkedHashMap<>();
                c.put("path", path);
                c.put("type", "ADDED");
                c.put("old_sha", null);
                c.put("new_sha", shaB);
                changes.add(c);
            } else if (shaB == null) {
                deleted++;
                Map<String, Object> c = new LinkedHashMap<>();
                c.put("path", path);
                c.put("type", "DELETED");
                c.put("old_sha", shaA);
                c.put("new_sha", null);
                changes.add(c);
            } else if (!shaA.equals(shaB)) {
                modified++;
                Map<String, Object> c = new LinkedHashMap<>();
                c.put("path", path);
                c.put("type", "MODIFIED");
                c.put("old_sha", shaA);
                c.put("new_sha", shaB);
                changes.add(c);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total_files_a", treeA.size());
        result.put("total_files_b", treeB.size());
        result.put("added_count", added);
        result.put("modified_count", modified);
        result.put("deleted_count", deleted);
        result.put("changes", changes);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["virtual_git_tree_diff(tree_a, tree_b)"] --> CombineKeys["all_paths = sorted(set(tree_a.keys()) | set(tree_b.keys()))"]
    CombineKeys --> LoopPaths["For each path in all_paths"]
    LoopPaths --> CheckExistence{"Where does path exist?"}
    CheckExistence -->|"Only in B"| AddAction["type = ADDED, added_count++"]
    CheckExistence -->|"Only in A"| DelAction["type = DELETED, deleted_count++"]
    CheckExistence -->|"In Both"| CheckHash{"sha_a == sha_b?"}
    CheckHash -->|"No"| ModAction["type = MODIFIED, modified_count++"]
    CheckHash -->|"Yes"| SkipAction["No change"]
    AddAction --> NextPath{"More paths?"}
    DelAction --> NextPath
    ModAction --> NextPath
    SkipAction --> NextPath
    NextPath -->|"Yes"| LoopPaths
    NextPath -->|"No"| BuildSummary["Build and return diff summary dictionary"]
`,
    hints: [
      "Combine all unique file paths from both trees and sort them alphabetically.",
      "Compare SHA-1 hashes: if only in tree_b it is ADDED, if only in tree_a it is DELETED, if both differ it is MODIFIED.",
      "Calculate total counts and return the structured report.",
    ],
    tests: [
      {
        name: "Identical trees produce zero changes",
        args: [
          { "src/main.py": "hash_a", "README.md": "hash_b" },
          { "src/main.py": "hash_a", "README.md": "hash_b" },
        ],
        expected: {
          total_files_a: 2,
          total_files_b: 2,
          added_count: 0,
          modified_count: 0,
          deleted_count: 0,
          changes: [],
        },
      },
      {
        name: "Added, modified, and deleted files detected in alphabetical order",
        args: [
          { "docs/arch.md": "sha1", "src/auth.py": "sha2", "src/legacy.py": "sha3" },
          { "docs/arch.md": "sha1", "src/auth.py": "sha2_updated", "src/new_feature.py": "sha4" },
        ],
        expected: {
          total_files_a: 3,
          total_files_b: 3,
          added_count: 1,
          modified_count: 1,
          deleted_count: 1,
          changes: [
            { path: "src/auth.py", type: "MODIFIED", old_sha: "sha2", new_sha: "sha2_updated" },
            { path: "src/legacy.py", type: "DELETED", old_sha: "sha3", new_sha: null },
            { path: "src/new_feature.py", type: "ADDED", old_sha: null, new_sha: "sha4" },
          ],
        },
      },
    ],
    explanationPrompt:
      "Explain how your virtual Git diff engine compares tree snapshots, handles file additions/modifications/deletions, and scales to millions of content-addressed entries.",
  },
};

// ----------------------------------------------------------------------------
// Case 57: SaaS Subscription Billing & Dunning Engine
// ----------------------------------------------------------------------------
export const case57_subscriptionBilling = {
  id: "cs-billing-dunning-057",
  slug: "subscription-billing-dunning-engine",
  index: "57",
  title:
    "How Does a SaaS Billing Engine Calculate Mid-Cycle Prorations and Recover Failed Payments via Smart Dunning?",
  shortTitle: "Subscription Billing & Dunning",
  category: "E-Commerce & Financial Systems",
  subcategory: "Recurring Billing, Proration & Dunning Recovery",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "SaaS platforms bill millions of users on recurring monthly or annual plans. When a customer upgrades from a $50/mo plan to a $200/mo plan on day 10 of a 30-day billing cycle, the system must accurately compute prorated credits and charges down to the exact second without rounding errors. When credit cards fail, smart dunning schedules automated retries and grace periods to minimize churn.",
  learningObjectives: [
    "Model recurring subscription states (Trialing, Active, Past Due, Canceled, Suspended).",
    "Calculate mid-cycle plan upgrade and downgrade prorations with high-precision arithmetic.",
    "Design an exponential backoff and smart retry dunning state machine for failed card charges.",
    "Implement idempotency keys to ensure recurring invoice generation never double-charges users.",
  ],
  prerequisites: [
    "Relational database transactions and ledger entries",
    "Timezone handling, leap years, and calendar cycle billing",
    "Payment gateway webhooks and idempotency tokens",
  ],
  engineeringConcepts: [
    "Subscription Lifecycle State Machine",
    "Mid-Cycle Proration Calculation",
    "Smart Dunning Retry Strategy",
    "Idempotent Invoice Generation",
    "Double-Entry Billing Ledger",
  ],
  technologies: ["Python", "Java", "Stripe API", "PostgreSQL", "Temporal", "Redis"],
  tech: ["Billing Engine", "Proration", "Dunning"],
  tags: ["billing", "saas", "proration", "dunning", "advanced"],
  glossary: [
    {
      term: "Proration",
      plainDefinition:
        "Calculating the proportional cost adjustment when a user changes subscription plans mid-way through a billing cycle.",
    },
    {
      term: "Dunning Engine",
      plainDefinition:
        "The automated system that retries failed payment methods, sends reminder notifications, and manages account grace periods.",
    },
    {
      term: "Involuntary Churn",
      plainDefinition:
        "Customers losing access to a product not because they chose to cancel, but because their credit card expired or failed to charge.",
    },
    {
      term: "Billing Period Anchor",
      plainDefinition:
        "The specific calendar day of the month (e.g. 15th) that marks the start and end of a recurring subscription cycle.",
    },
    {
      term: "Negative Proration Credit",
      plainDefinition:
        "A financial balance credit applied to a customer account when downgrading to a cheaper plan with unused pre-paid time remaining.",
    },
  ],
  primers: [
    {
      concept: "How Mid-Cycle Proration Works",
      minutes: 4,
      definition:
        "If you pay $30 on Day 1 for a 30-day month, you consume $1/day. If you upgrade to a $60/month plan on Day 10, you have 20 unused days of the $30 plan ($20 credit) and 20 days on the $60 plan ($40 charge). Net upgrade charge = $40 - $20 = $20.",
      whyNeeded:
        "Customers expect fair billing without paying full price twice or receiving free tier upgrades.",
      analogy:
        "Trading in a rental car after 10 days of a 30-day lease: you get refunded the remaining 20 days on the sedan and pay 20 days for the SUV.",
      tinyExample:
        "unused_credit = old_rate * (remaining_days / total_days)\nnew_charge = new_rate * (remaining_days / total_days)\nnet_due = new_charge - unused_credit",
    },
    {
      concept: "Smart Dunning vs Immediate Suspension",
      minutes: 4,
      definition:
        "When an automatic charge fails, suspending the user immediately causes anger and churn. Dunning retries the card on smart intervals (e.g., Day 1, Day 3, Day 5, Day 7) while granting a grace period.",
      whyNeeded:
        "Recovers up to 75% of failed recurring payments caused by temporary bank limits or payroll timing.",
      analogy:
        "A landlord sending a polite courtesy text when rent is 1 day late instead of instantly changing the door locks.",
      tinyExample:
        "RETRY_DELAYS = [1, 3, 5, 7] # days\nif attempt < len(RETRY_DELAYS): schedule_retry(RETRY_DELAYS[attempt])",
    },
  ],
  discover: {
    situation:
      "A B2B SaaS startup billed monthly subscriptions using simple cron jobs. When an enterprise customer upgraded from the $1,000/mo Team plan to the $5,000/mo Enterprise plan mid-month, the script charged them the full $5,000 immediately without crediting the $800 unused portion of the Team plan. Furious finance teams threatened cancellations over double-billing.",
    humanFlow: [
      "Customer signs up on January 1st for $30/month (billed Jan 1 to Jan 31).",
      "On January 11th (Day 10 used, 20 remaining), customer upgrades to $90/month Pro plan.",
      "Billing engine computes unused balance on $30 plan ($20) and prorated cost of $90 plan ($60).",
      "Engine generates immediate delta invoice for $40 ($60 - $20) with unique idempotency token.",
      "If credit card charges successfully, subscription status becomes `ACTIVE` on Pro tier.",
      "If card fails: dunning state machine transitions account to `PAST_DUE` with 7-day grace period and schedules 3 retries.",
      "If all retries fail: account transitions to `SUSPENDED`.",
    ],
    question:
      "How do you design a robust SaaS billing and dunning engine that computes mid-cycle prorations down to the day and recovers failed charges via automated retry schedules?",
    whyItExists: [
      "Involuntary churn due to failed card charges accounts for 20-40% of all SaaS customer loss.",
      "Proration errors damage enterprise trust and trigger costly credit card chargebacks.",
      "Idempotency guarantees prevent disastrous duplicate credit card charges during network timeouts.",
    ],
  },
  understand: {
    overview:
      "The Subscription Billing and Dunning Engine maintains recurring customer subscription contracts. On mid-cycle changes, the Proration Calculator derives daily unit rates and generates balance adjustments. On billing dates, the Invoice Generator issues charges using idempotent payment gateway tokens. In the event of payment failure, the Dunning State Machine coordinates exponential retry intervals, customer notification webhooks, and grace period enforcement.",
    components: [
      {
        name: "Subscription Lifecycle Controller",
        whatIsIt:
          "State machine tracking subscription status (TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELED).",
        whyItExists: "Governs product feature access permissions based on payment standing.",
        whatItDoes: "Transitions states based on payment events and dunning results.",
      },
      {
        name: "Proration Calculator",
        whatIsIt: "High-precision financial math module calculating usage credits.",
        whyItExists:
          "Computes exact fairness adjustments when plans or quantities change mid-cycle.",
        whatItDoes: "Calculates unused time credit and prorated future time charges.",
      },
      {
        name: "Dunning Retry Scheduler",
        whatIsIt: "Temporal workflow / queue scheduling smart payment retries.",
        whyItExists: "Recovers failed recurring payments without human intervention.",
        whatItDoes:
          "Retries card on optimal days (e.g. 1st of month, Fridays) and manages grace periods.",
      },
      {
        name: "Idempotent Payment Dispatcher",
        whatIsIt: "Gateway interface attaching UUID idempotency keys to Stripe/Adyen requests.",
        whyItExists: "Guarantees a customer is never billed twice even if API calls timeout.",
        whatItDoes: "Caches gateway response by `idempotency_key`.",
      },
    ],
    analogy: {
      title: "Gym Membership Upgrade & Grace Period",
      everyday: [
        "You pay $30 on the 1st for a standard gym membership.",
        "On the 11th, you upgrade to the Platinum VIP pass ($90/month).",
        "The gym front desk credits the 20 days you didn't use on standard ($20) and charges 20 days for VIP ($60), so you pay $40.",
        "If your card is declined, they let you work out for 3 days while texting you to update your card before locking your badge.",
      ],
      technical: [
        "Gym front desk corresponds to Proration Calculator.",
        "Unused standard days correspond to Negative Proration Credit.",
        "3-day courtesy workout access corresponds to Dunning Grace Period.",
      ],
    },
    flow: [
      "Customer requests plan upgrade from CurrentPlan to NewPlan.",
      "Calculate `days_used` and `remaining_days = days_in_cycle - days_used`.",
      "Compute `unused_credit = round(current_rate * remaining_days / days_in_cycle, 2)`.",
      "Compute `new_charge = round(new_rate * remaining_days / days_in_cycle, 2)`.",
      "Compute `net_charge = max(0.0, round(new_charge - unused_credit, 2))`.",
      "Attempt payment with idempotency key `upgrade_{sub_id}_{timestamp}`.",
      "If payment succeeds: set subscription plan = NewPlan, status = ACTIVE.",
      "If payment fails: increment `payment_attempts`. If attempts < 4: status = RETRY_SCHEDULED; else SUSPENDED.",
    ],
  },
  concepts: [
    {
      id: "concept-proration-math",
      name: "Proration Math & Rounding Guarantees",
      difficulty: "Advanced",
      simpleDefinition:
        "Calculating fractional financial obligations for partial calendar periods and strictly rounding to 2 decimal places to prevent penny discrepancies.",
      whyItExists:
        "Floating point math (0.1 + 0.2 = 0.30000000000000004) introduces financial drift that fails accounting audits.",
      realWorldAnalogy:
        "Dividing a pizza into equal slices: you can't have an infinite fraction of a crumb on an official tax return.",
      technicalExplanation:
        "Use integers representing cents (e.g. $19.99 = 1999 cents) or `Decimal` types with `ROUND_HALF_UP` to calculate unit time fractions.",
      caseApplication:
        "Guarantees that `unused_credit + net_charge` perfectly equals the target plan rate for the billing cycle.",
      commonMistakes: [
        "Using IEEE 754 floating point numbers directly in currency calculations.",
        "Failing to account for variable month lengths (28, 29, 30, 31 days).",
      ],
      practice: [
        "Why is calendar day proration preferred over fixed 30-day approximations in enterprise contracts?",
        "If a user downgrades mid-cycle and net_charge is negative, should you refund their credit card or issue a billing credit?",
      ],
    },
    {
      id: "concept-dunning-recovery",
      name: "Smart Dunning State Machine",
      difficulty: "Advanced",
      simpleDefinition:
        "A coordinated workflow that attempts payment retries on increasing intervals while giving the user a grace period to update their card.",
      whyItExists:
        "Most credit card declines are soft declines (temporary overdraft, daily limit) that clear after payday.",
      realWorldAnalogy:
        "A redialing telephone: if the line is busy, wait 2 minutes, then 5 minutes, then 15 minutes before giving up.",
      technicalExplanation:
        "Retries are scheduled at T+1 day, T+3 days, T+5 days, T+7 days. Each failure triggers an email with a secure 1-click update link. Account is suspended only at T+7.",
      caseApplication:
        "Recovers up to $250,000/month in recurring revenue for a mid-market SaaS business.",
      commonMistakes: [
        "Retrying the card 10 times in 10 minutes, triggering bank fraud lockouts.",
        "Immediately revoking API keys, breaking customer production systems over a $20 card expiration.",
      ],
      practice: [
        "What is the difference between a soft card decline and a hard card decline (e.g. stolen card)?",
        "Why should dunning retries avoid running at midnight when automated bank batch processing occurs?",
      ],
    },
    {
      id: "concept-idempotent-charging",
      name: "Payment Idempotency Keys",
      difficulty: "Advanced",
      simpleDefinition:
        "A unique token sent with a payment request that guarantees the card is charged at most once, even if the request is submitted multiple times.",
      whyItExists:
        "Network timeouts leave clients unsure if a charge succeeded or failed; retrying without idempotency results in double charges.",
      realWorldAnalogy:
        "A check number on a personal bank check: the bank will never cash check #104 twice.",
      technicalExplanation:
        "Client generates UUID. Server checks database: if UUID exists and completed, return cached charge result without touching credit card rails.",
      caseApplication:
        "Prevents duplicate $5,000 invoice charges during transient cloud gateway disconnects.",
      commonMistakes: [
        "Generating idempotency keys based on volatile timestamps rather than entity IDs.",
        "Reusing the same idempotency key for two different transactions.",
      ],
      practice: [
        "How long should payment gateways cache idempotency keys (e.g. 24 hours)?",
        "What HTTP status code should be returned if a request with an existing idempotency key is currently processing?",
      ],
    },
  ],
  architecture: {
    levels: [
      {
        level: 1,
        title: "Level 1: Foundation (Periodic Cron & Direct Gateway Charging)",
        focus: "Nightly cron job querying billing database and charging cards directly.",
        mermaid: `graph TD
    CronJob["Nightly Billing Cron (00:00 UTC)"] --> QueryDB["SELECT * FROM subs WHERE next_bill_date <= TODAY"]
    QueryDB --> Gateway["Stripe / Adyen Payment Gateway"]
    Gateway --> UpdateDB["UPDATE subs SET status = 'ACTIVE' or 'FAILED'"]
`,
        changes: [
          "Deploy nightly cron script iterating over active subscriptions.",
          "Call payment gateway API sequentially per customer.",
        ],
        components: [
          { name: "Billing Cron Worker", description: "Iterates through due subscriptions." },
          { name: "Payment Gateway Client", description: "Executes credit card charges." },
        ],
        tradeoffs: [
          {
            aspect: "Simplicity vs Scale",
            choice: "Monolithic cron script",
            alternative: "Distributed workflow engine",
            impact:
              "Simple to build, but fails to complete within nightly window as customer count exceeds 50,000.",
          },
        ],
        failureModes: [
          {
            mode: "Cron process crash mid-run",
            consequence: "Half the customers are not billed; re-running risks double-billing.",
            mitigation:
              "Wrap each customer charge in an individual database transaction with status flags.",
          },
        ],
      },
      {
        level: 2,
        title: "Level 2: Scale & Distribution (Temporal Workflows & Smart Dunning Queue)",
        focus: "Event-driven billing workflows with stateful dunning orchestration.",
        mermaid: `graph LR
    UpgradeReq["Plan Upgrade Request"] --> ProrateEngine["Proration Engine"]
    ProrateEngine --> Temporal["Temporal / Cadence Workflow Engine"]
    Temporal --> ChargeWorker["Idempotent Charge Worker"]
    ChargeWorker --> Stripe["Payment Gateway"]
    Stripe -->|"Decline"| DunningQueue["Dunning Retry Queue (Backoff: 1d, 3d, 5d)"]
    DunningQueue --> Notification["Customer Email Alert ('Update Payment Method')"]
`,
        changes: [
          "Migrate from cron to durable Temporal workflow per subscription.",
          "Implement smart dunning queue with exponential retry backoff.",
        ],
        components: [
          { name: "Proration Engine", description: "Calculates precise mid-cycle upgrade deltas." },
          {
            name: "Temporal Workflow Orchestrator",
            description: "Manages multi-day dunning state and timers.",
          },
        ],
        tradeoffs: [
          {
            aspect: "Operational Overhead vs Durability",
            choice: "Durable workflow engine",
            alternative: "Ad-hoc SQL retry tables",
            impact: "Eliminates race conditions and missed retries across server reboots.",
          },
        ],
        failureModes: [
          {
            mode: "Payment webhook dropped",
            consequence: "Subscription remains in past_due state even after card is updated.",
            mitigation: "Daily reconciliation polling job reconciling gateway charge status.",
          },
        ],
      },
      {
        level: 3,
        title:
          "Level 3: Production Resilience (Double-Entry Financial Ledger & Machine Learning Dunning)",
        focus: "Immutable financial ledger and ML-driven payment retry timing.",
        mermaid: `graph TD
    PaymentEvent["Payment Succeeded / Failed Event"] --> Ledger["Immutable Double-Entry Ledger (Postgres)"]
    Ledger --> Debits["Accounts Receivable / Cash Debit"]
    Ledger --> Credits["Deferred Revenue / Earned Revenue Credit"]
    PaymentEvent --> MLDunning["ML Optimal Retry Predictor (Predicts Best Day/Hour)"]
    MLDunning --> SmartRetry["Schedule Retry on High-Success Window"]
`,
        changes: [
          "Enforce double-entry accounting ledger where every charge maps to debits and credits.",
          "Deploy ML model predicting card retry success based on issuing bank BIN and historical acceptance patterns.",
        ],
        components: [
          {
            name: "Double-Entry Ledger",
            description: "Immutable audit log of all financial events.",
          },
          {
            name: "ML Dunning Optimizer",
            description: "Predicts optimal retry window per card issuer.",
          },
        ],
        tradeoffs: [
          {
            aspect: "Complexity vs Recovery Rate",
            choice: "ML-driven dynamic retry timing",
            alternative: "Static 1-3-5-7 day retry schedule",
            impact: "Improves failed payment recovery by an additional 12%.",
          },
        ],
        failureModes: [
          {
            mode: "Ledger discrepancy detected",
            consequence: "Trial balance fails to sum to zero.",
            mitigation: "Automated reconciliation alert halting automated balance transfers.",
          },
        ],
      },
    ],
  },
  decisions: [
    {
      decision: "Immediate Plan Upgrade Charging vs End-of-Cycle Invoice Co-terming",
      chosen:
        "Immediate prorated charging on upgrade; End-of-cycle credit application on downgrade",
      alternatives: [
        "Holding all charges until the regular monthly renewal date",
        "Resetting the billing cycle anchor date to the upgrade date",
      ],
      tradeoffs:
        "Immediate charging validates payment ability before granting higher tier features, but creates mid-cycle micro-invoices.",
      rationale:
        "Prevents fraud where malicious actors upgrade to expensive tiers, consume resources, and cancel before the month ends.",
      impact: "Zero abuse on expensive GPU/compute tiers with clean financial auditability.",
    },
    {
      decision: "Static Dunning Schedule vs Exponential Retry Intervals",
      chosen: "Exponential 4-stage retry schedule: +1 day, +3 days, +5 days, +7 days",
      alternatives: ["Retrying daily for 14 days", "Retrying only once after 7 days"],
      tradeoffs:
        "4-stage schedule covers payday intervals without triggering card network excessive retry fees.",
      rationale:
        "Card networks (Visa/Mastercard) assess penalty fees on merchants that retry declined cards more than 15 times per month.",
      impact: "Recovers 73% of soft declines while avoiding card brand compliance penalties.",
    },
  ],
  implementation: {
    steps: [
      {
        step: 1,
        title: "Proration Calculation Formula",
        objective: "Derive unused credit and prorated upgrade charges given cycle parameters.",
        code: `def calculate_proration(current_rate: float, new_rate: float, days_used: int, days_in_cycle: int) -> tuple[float, float, float]:
    """Calculates (unused_credit, new_charge, net_due) rounded to 2 decimal places."""
    remaining_days = max(0, days_in_cycle - days_used)
    unused_credit = round(current_rate * (remaining_days / days_in_cycle), 2)
    new_charge = round(new_rate * (remaining_days / days_in_cycle), 2)
    net_due = max(0.0, round(new_charge - unused_credit, 2))
    return unused_credit, new_charge, net_due`,
        explanation: "Computes financial fairness deltas with explicit two-decimal float rounding.",
      },
      {
        step: 2,
        title: "Dunning State Machine",
        objective:
          "Determine subscription status and next retry delay given current attempt count.",
        code: `RETRY_SCHEDULE_DAYS = [1, 3, 5, 7]

def evaluate_dunning_status(payment_attempts: int, is_paid: bool) -> dict:
    if is_paid:
        return {"status": "ACTIVE", "next_retry_days": None, "grace_period_active": False}
    if payment_attempts < len(RETRY_SCHEDULE_DAYS):
        delay = RETRY_SCHEDULE_DAYS[payment_attempts]
        return {"status": "RETRY_SCHEDULED", "next_retry_days": delay, "grace_period_active": True}
    return {"status": "SUBSCRIPTION_SUSPENDED", "next_retry_days": None, "grace_period_active": False}`,
        explanation:
          "Transitions subscription states and schedules retry delays based on attempt history.",
      },
      {
        step: 3,
        title: "Complete Billing Invoice Pipeline",
        objective: "Combine proration with dunning logic into a unified invoice generator.",
        code: `def generate_subscription_invoice(current_rate, new_rate, days_used, days_in_cycle, attempts, is_paid):
    unused_credit, new_charge, net_due = calculate_proration(current_rate, new_rate, days_used, days_in_cycle)
    dunning = evaluate_dunning_status(attempts, is_paid)
    return {
        "net_due": net_due,
        "unused_credit": unused_credit,
        "new_charge": new_charge,
        "subscription_status": dunning["status"],
        "next_retry_days": dunning["next_retry_days"]
    }`,
        explanation: "Produces a complete billing execution payload ready for accounting ledgers.",
      },
    ],
    samples: [
      {
        title: "Proration Calculation Output",
        language: "json",
        code: `{
  "invoice_id": "inv_9042",
  "current_plan": "Starter ($30/mo)",
  "new_plan": "Enterprise ($90/mo)",
  "days_used": 10,
  "days_in_cycle": 30,
  "unused_credit": 20.00,
  "new_charge": 60.00,
  "net_due": 40.00,
  "status": "PAID"
}`,
        explanation: "Customer invoice showing exact proration line items.",
      },
      {
        title: "Dunning Retry Notification",
        language: "json",
        code: `{
  "subscription_id": "sub_5512",
  "attempt": 2,
  "status": "RETRY_SCHEDULED",
  "next_retry_in_days": 3,
  "grace_period_expires": "2026-10-02T00:00:00Z",
  "action_required": "Please update your credit card to avoid service suspension."
}`,
        explanation: "Dunning event dispatched to notification worker.",
      },
    ],
  },
  practice: [
    {
      level: "Understand",
      title: "Mid-Cycle Fairness",
      brief:
        "Calculate exact proration when upgrading a user from a $60/month plan to a $120/month plan mid-way through a 30-day month.",
    },
    {
      level: "Modify",
      title: "Payment Idempotency",
      brief:
        "Implement unique UUID idempotency keys on payment gateway charge calls to prevent double-charging during network timeouts.",
    },
    {
      level: "Build",
      title: "Smart Dunning State Machine",
      brief:
        "Build an automated retry workflow that attempts card charges on T+1, T+3, T+5, and T+7 days while keeping account access active in grace period.",
    },
    {
      level: "Think",
      title: "Grace Period vs Involuntary Churn",
      brief:
        "Explain why offering a 7-day dunning grace period reduces involuntary SaaS churn by over 70% compared to instant service suspension.",
    },
  ],
  reflection: [
    "How would you handle negative proration credits if a customer downgrades plans—refund their card or keep it as an account credit?",
    "How should high-frequency usage-based billing (e.g., API calls or tokens) be combined with fixed monthly subscription billing?",
    "Why are idempotency keys mandatory for preventing duplicate charges during network gateway timeouts?",
  ],
  techNotes: [
    {
      name: "Stripe Proration Algorithm",
      kind: "Financial API Standard",
      note: "Stripe calculates proration by multiplying the unit price difference by the fraction of seconds remaining in the billing period, rounded to the nearest integer currency unit (cents).",
    },
    {
      name: "Card Network Dunning Guidelines",
      kind: "Payment Compliance",
      note: "Visa and Mastercard enforce Excessive Retry rules prohibiting merchants from retrying a declined authorization more than 15 times within a 30-day window to prevent network congestion.",
    },
  ],
  codeLab: {
    functionName: "calculate_subscription_invoice",
    signature:
      "def calculate_subscription_invoice(current_rate: float, new_rate: float, days_used: int, days_in_cycle: int, payment_attempts: int, is_paid: bool) -> dict:",
    starterCode: `def calculate_subscription_invoice(current_rate: float, new_rate: float, days_used: int, days_in_cycle: int, payment_attempts: int, is_paid: bool) -> dict:
    """
    Calculates proration and dunning status:
    remaining_days = max(0, days_in_cycle - days_used)
    unused_credit = round(current_rate * (remaining_days / days_in_cycle), 2)
    new_charge = round(new_rate * (remaining_days / days_in_cycle), 2)
    net_due = max(0.0, round(new_charge - unused_credit, 2))

    Dunning rules:
    - If is_paid is True: status = "ACTIVE", next_retry_days = None
    - If is_paid is False:
        retry_schedule = [1, 3, 5, 7]
        if payment_attempts < len(retry_schedule):
            status = "RETRY_SCHEDULED"
            next_retry_days = retry_schedule[payment_attempts]
        else:
            status = "SUBSCRIPTION_SUSPENDED"
            next_retry_days = None

    Returns {
        "net_due": float,
        "unused_credit": float,
        "new_charge": float,
        "status": str,
        "next_retry_days": int|None
    }
    """
    remaining_days = max(0, days_in_cycle - days_used)
    unused_credit = round(current_rate * (remaining_days / days_in_cycle), 2)
    new_charge = round(new_rate * (remaining_days / days_in_cycle), 2)
    net_due = max(0.0, round(new_charge - unused_credit, 2))

    retry_schedule = [1, 3, 5, 7]
    if is_paid:
        status = "ACTIVE"
        next_retry_days = None
    elif payment_attempts < len(retry_schedule):
        status = "RETRY_SCHEDULED"
        next_retry_days = retry_schedule[payment_attempts]
    else:
        status = "SUBSCRIPTION_SUSPENDED"
        next_retry_days = None

    return {
        "net_due": net_due,
        "unused_credit": unused_credit,
        "new_charge": new_charge,
        "status": status,
        "next_retry_days": next_retry_days,
    }
`,
    javaSignature:
      "public static Map<String, Object> calculateSubscriptionInvoice(double currentRate, double newRate, int daysUsed, int daysInCycle, int paymentAttempts, boolean isPaid)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> calculateSubscriptionInvoice(double currentRate, double newRate, int daysUsed, int daysInCycle, int paymentAttempts, boolean isPaid) {
        int remainingDays = Math.max(0, daysInCycle - daysUsed);
        double unusedCredit = Math.round(currentRate * ((double) remainingDays / daysInCycle) * 100.0) / 100.0;
        double newCharge = Math.round(newRate * ((double) remainingDays / daysInCycle) * 100.0) / 100.0;
        double netDue = Math.max(0.0, Math.round((newCharge - unusedCredit) * 100.0) / 100.0);

        int[] retrySchedule = new int[]{1, 3, 5, 7};
        String status;
        Integer nextRetryDays = null;

        if (isPaid) {
            status = "ACTIVE";
        } else if (paymentAttempts < retrySchedule.length) {
            status = "RETRY_SCHEDULED";
            nextRetryDays = retrySchedule[paymentAttempts];
        } else {
            status = "SUBSCRIPTION_SUSPENDED";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("net_due", netDue);
        result.put("unused_credit", unusedCredit);
        result.put("new_charge", newCharge);
        result.put("status", status);
        result.put("next_retry_days", nextRetryDays);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["calculate_subscription_invoice(...)"] --> CalcRem["remaining_days = max(0, days_in_cycle - days_used)"]
    CalcRem --> CalcProration["unused_credit = round(current * rem / total, 2)<br/>new_charge = round(new * rem / total, 2)"]
    CalcProration --> CalcNet["net_due = max(0.0, round(new_charge - unused_credit, 2))"]
    CalcNet --> CheckPaid{"is_paid == True?"}
    CheckPaid -->|"Yes"| Active["status = ACTIVE, next_retry_days = None"]
    CheckPaid -->|"No"| CheckAttempts{"attempts < 4?"}
    CheckAttempts -->|"Yes"| Retry["status = RETRY_SCHEDULED, next_retry_days = schedule[attempts]"]
    CheckAttempts -->|"No"| Suspend["status = SUBSCRIPTION_SUSPENDED, next_retry_days = None"]
    Active --> Return["Return formatted invoice dictionary"]
    Retry --> Return
    Suspend --> Return
`,
    hints: [
      "Calculate remaining days using max(0, days_in_cycle - days_used).",
      "Round all currency values to 2 decimal places with round(val, 2).",
      "Ensure net_due cannot be negative: use max(0.0, ...).",
    ],
    tests: [
      {
        name: "Standard mid-cycle upgrade paid successfully",
        args: [30.0, 90.0, 10, 30, 0, true],
        expected: {
          net_due: 40.0,
          unused_credit: 20.0,
          new_charge: 60.0,
          status: "ACTIVE",
          next_retry_days: null,
        },
      },
      {
        name: "Failed payment triggers stage 0 dunning retry",
        args: [50.0, 100.0, 15, 30, 0, false],
        expected: {
          net_due: 25.0,
          unused_credit: 25.0,
          new_charge: 50.0,
          status: "RETRY_SCHEDULED",
          next_retry_days: 1,
        },
      },
      {
        name: "Exhausted retries suspends subscription",
        args: [100.0, 200.0, 20, 30, 4, false],
        expected: {
          net_due: 33.33,
          unused_credit: 33.33,
          new_charge: 66.67,
          status: "SUBSCRIPTION_SUSPENDED",
          next_retry_days: null,
        },
      },
    ],
    explanationPrompt:
      "Explain how your subscription invoice generator calculates proration down to the cent and handles progressive dunning retry schedules.",
  },
};

// ----------------------------------------------------------------------------
// Case 58: Distributed ETL Workflow & DAG Task Scheduler
// ----------------------------------------------------------------------------
export const case58_dagScheduler = {
  id: "cs-dag-scheduler-058",
  slug: "distributed-etl-dag-scheduler",
  index: "58",
  title:
    "How Does a Workflow Orchestrator Schedule DAG Tasks, Resolve Dependencies, and Handle Failures at Scale?",
  shortTitle: "Distributed ETL DAG Scheduler",
  category: "Advanced Distributed Architectures",
  subcategory: "Workflow Orchestration & Directed Acyclic Graphs",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "Data engineering platforms like Apache Airflow, Prefect, and Temporal orchestrate complex workflows expressed as Directed Acyclic Graphs (DAGs). When a daily ETL pipeline contains hundreds of tasks with complex upstream dependencies, the scheduler must detect dependency cycles, compute parallel execution layers via Kahn's algorithm, and cascade upstream task failures to block downstream dependents without stalling independent pipelines.",
  learningObjectives: [
    "Model data pipelines as Directed Acyclic Graphs (DAGs) of tasks and directed dependencies.",
    "Implement cycle detection and topological sorting using Kahn's algorithm (in-degree tracking).",
    "Derive parallel execution stages for multi-worker distributed clusters.",
    "Cascade upstream task failures to isolate downstream blocked tasks while continuing independent jobs.",
  ],
  prerequisites: [
    "Graph theory (DAGs, adjacency lists, in-degrees, topological sort)",
    "Distributed task queues (Celery, Kafka, Redis)",
    "Idempotent task execution and retry policies",
  ],
  engineeringConcepts: [
    "Directed Acyclic Graph (DAG)",
    "Topological Sorting (Kahn's Algorithm)",
    "Cycle Detection",
    "Failure Cascade Propagation",
    "Parallel Execution Layering",
  ],
  technologies: ["Python", "Java", "Apache Airflow", "Temporal", "Celery", "Kafka"],
  tech: ["DAG Scheduler", "Topological Sort", "ETL"],
  tags: ["dag", "etl", "orchestration", "airflow", "advanced"],
  glossary: [
    {
      term: "Directed Acyclic Graph (DAG)",
      plainDefinition:
        "A graph of nodes (tasks) connected by directed arrows (dependencies) with no closed loops, meaning you can never circle back to where you started.",
    },
    {
      term: "Topological Sort",
      plainDefinition:
        "An ordering of tasks such that for every directed edge U -> V, task U completes before task V starts.",
    },
    {
      term: "In-Degree",
      plainDefinition:
        "The number of incoming edges pointing into a node, representing how many upstream dependencies must finish before the task can execute.",
    },
    {
      term: "Cascading Upstream Failure",
      plainDefinition:
        "When an upstream task fails, automatically marking all its direct and indirect downstream children as SKIPPED or BLOCKED.",
    },
    {
      term: "Execution Stage / Layer",
      plainDefinition:
        "A group of tasks whose dependencies have all been satisfied, allowing them to run concurrently on separate worker machines.",
    },
  ],
  primers: [
    {
      concept: "Why DAGs Are Essential for Big Data ETL",
      minutes: 4,
      definition:
        "You cannot train an ML model before raw data is cleaned, and you cannot clean raw data before it is extracted from Postgres. DAGs formally declare these rules so tasks never run out of order.",
      whyNeeded:
        "Prevents race conditions, corrupted data warehouses, and wasted compute resources.",
      analogy:
        "Baking a cake: you cannot put the cake in the oven before mixing the batter, but you can melt chocolate and chop nuts at the exact same time in parallel.",
      tinyExample:
        "# Upstream -> Downstream\n[('extract_sql', 'clean_data'), ('clean_data', 'train_model')]",
    },
    {
      concept: "Kahn's Algorithm for Topological Sort",
      minutes: 4,
      definition:
        "Count in-degrees for all tasks. Put all tasks with in-degree 0 in a queue. Pop a task, add to schedule, and decrement in-degrees of its neighbors. Repeat. If scheduled count < total tasks, a cycle exists!",
      whyNeeded:
        "Guarantees that dependencies are resolved in valid order and immediately flags invalid cyclic graphs.",
      analogy:
        "Unpacking nesting Russian dolls from outside to inside: you can only remove a doll once nothing is covering it.",
      tinyExample:
        "while queue:\n    node = queue.pop(0)\n    order.append(node)\n    for child in adj[node]:\n        in_degree[child] -= 1\n        if in_degree[child] == 0: queue.append(child)",
    },
  ],
  discover: {
    situation:
      "A fintech data platform ran daily financial reconciliations with 80 separate SQL and Python scripts scheduled via cron at fixed times (e.g. Script 1 at 2:00 AM, Script 2 at 2:30 AM). One night, Script 1 took 45 minutes instead of 20 due to high volume. Script 2 started blindly while Script 1 was still writing, generating invalid account balances that took 3 days to audit and fix.",
    humanFlow: [
      "Engineer defines workflow DAG: `Extract` -> `Transform` -> `Validate` -> `Publish`.",
      "Scheduler parses graph, checks for cyclic deadlocks, and identifies root tasks (in-degree 0).",
      "Worker cluster pulls ready tasks (`Extract`) from queue and executes concurrently.",
      "Upon completion of `Extract`, scheduler decrements child in-degrees and enqueues `Transform`.",
      "If `Transform` throws an unhandled exception: scheduler marks `Transform` as `FAILED`.",
      "`Validate` and `Publish` are flagged as `BLOCKED_UPSTREAM_FAILURE` and prevented from running.",
      "Unrelated independent pipelines (e.g. `User Analytics`) continue executing without disruption.",
    ],
    question:
      "How do you design a resilient distributed DAG scheduler that validates dependency topologies, executes independent tasks in parallel stages, and propagates failure cascades?",
    whyItExists: [
      "Time-based cron scheduling of interdependent jobs guarantees race conditions as data volumes grow.",
      "Parallel execution stages reduce total batch pipeline runtime by 60-80%.",
      "Automated failure cascades prevent corrupted downstream reporting tables.",
    ],
  },
  understand: {
    overview:
      "The Distributed DAG Scheduler continuously evaluates task dependency states. It maintains an in-memory graph of vertices (tasks) and directed edges (dependencies). It uses Kahn's algorithm to partition executable tasks into dependency-free parallel layers. When a worker reports a task failure, the scheduler traverses the reachability subgraph to mark all transitive downstream tasks as BLOCKED, preventing erroneous executions while keeping unaffected subtrees alive.",
    components: [
      {
        name: "DAG Topology Parser & Validator",
        whatIsIt: "Graph parsing engine constructing adjacency matrices and in-degree maps.",
        whyItExists: "Detects syntax errors and cyclic dependency deadlocks prior to execution.",
        whatItDoes: "Executes Kahn's algorithm to ensure topological order exists.",
      },
      {
        name: "Stage & Layer Scheduler",
        whatIsIt: "Task dispatcher grouping ready tasks into parallel execution batches.",
        whyItExists:
          "Maximizes cluster CPU/memory utilization by executing all zero-in-degree tasks at once.",
        whatItDoes: "Pushes runnable tasks to distributed worker queues (Celery/Kafka).",
      },
      {
        name: "Failure Cascade Propagator",
        whatIsIt: "Graph traversal module implementing Breadth-First Search (BFS) on failure.",
        whyItExists: "Prevents tasks from executing on incomplete or dirty upstream inputs.",
        whatItDoes: "Recursively marks all reachable descendants as BLOCKED.",
      },
      {
        name: "Distributed Worker Pool",
        whatIsIt: "Fleet of compute nodes pulling task payloads from message queues.",
        whyItExists: "Executes Python/SQL scripts in isolated containers.",
        whatItDoes: "Reports SUCCESS / FAILED heartbeats and exit codes back to scheduler.",
      },
    ],
    analogy: {
      title: "Automobile Assembly Line",
      everyday: [
        "In a car factory, you cannot install the wheels until the axle is mounted.",
        "You cannot mount the engine until the chassis frame is welded.",
        "However, while the engine is being mounted, the seat upholstery can be stitched in a separate room in parallel.",
        "If the chassis frame cracks (failure), the painters and windshield installers are told not to work on that car.",
      ],
      technical: [
        "Chassis frame mounting corresponds to Root Task (in-degree 0).",
        "Parallel seat stitching corresponds to Concurrent Stage Execution.",
        "Halting painters and windshield installers corresponds to Failure Cascade Propagation.",
      ],
    },
    flow: [
      "Scheduler receives list of `tasks` and `dependencies: [[upstream, downstream]]`.",
      "Build adjacency list and compute `in_degree` for every task.",
      "Detect cycles using Kahn's algorithm: if topologically sorted count < total tasks, abort with `CYCLE_ERROR`.",
      "Group tasks into layered execution stages: Stage 0 = initial in-degree 0 tasks.",
      "If `failed_task_id` is specified: perform BFS from `failed_task_id` along downstream edges.",
      "Mark all visited downstream tasks as `BLOCKED`.",
      "Filter remaining runnable tasks in topological order into `execution_order`.",
    ],
  },
  concepts: [
    {
      id: "concept-kahns-algorithm",
      name: "Kahn's Topological Sort & Cycle Detection",
      difficulty: "Advanced",
      simpleDefinition:
        "An algorithm that finds a linear ordering of graph nodes with directed dependencies by repeatedly removing nodes with zero incoming edges.",
      whyItExists:
        "Guarantees that prerequisites always execute before dependents and catches circular dependencies (A depends on B, B depends on A).",
      realWorldAnalogy:
        "A university course prerequisite chart: you can only enroll in courses for which you have completed all prerequisite credits.",
      technicalExplanation:
        "Initialize queue with all nodes where in_degree == 0. While queue is non-empty: pop node, add to ordering, decrement in_degree of neighbors. If in_degree reaches 0, enqueue neighbor. If processed count != total nodes, cycle detected.",
      caseApplication: "Used by Apache Airflow, dbt, and Makefiles to build execution plans.",
      commonMistakes: [
        "Using simple DFS without cycle coloring, resulting in infinite recursion on cyclic graphs.",
        "Forgetting to update in-degrees when tasks finish dynamically.",
      ],
      practice: [
        "What is the time complexity of Kahn's algorithm in terms of vertices V and edges E?",
        "If a graph has 10 tasks and Kahn's algorithm only processes 8 tasks before the queue empties, what does that indicate?",
      ],
    },
    {
      id: "concept-failure-cascades",
      name: "Transitive Failure Cascading",
      difficulty: "Advanced",
      simpleDefinition:
        "When a task fails, immediately finding all downstream tasks that depend on it directly or indirectly and marking them blocked.",
      whyItExists:
        "Executing a task whose upstream dependency failed wastes compute resources and generates corrupt data.",
      realWorldAnalogy:
        "A power outage at a water filtration plant: the bottling factory downstream must immediately halt because dirty water cannot be bottled.",
      technicalExplanation:
        "Perform BFS or DFS starting from the failed task, following outgoing dependency edges. All reached nodes are added to `blocked_tasks` set.",
      caseApplication:
        "Prevents a broken raw data ingest from triggering thousands of ML model training jobs.",
      commonMistakes: [
        "Blocking only direct children instead of all transitive descendants.",
        "Blocking independent tasks that share no common ancestry with the failed node.",
      ],
      practice: [
        "How can a DAG configure 'trigger rules' (e.g. `all_done` or `one_failed`) to run cleanup tasks even when upstream tasks fail?",
        "Why is BFS preferred over DFS for calculating minimum dependency depth?",
      ],
    },
    {
      id: "concept-parallel-stages",
      name: "Parallel Execution Layering",
      difficulty: "Advanced",
      simpleDefinition:
        "Partitioning DAG tasks into sequential stages where all tasks within the same stage can be safely executed concurrently.",
      whyItExists:
        "Allows distributed worker clusters to maximize concurrency while respecting dependency barriers.",
      realWorldAnalogy:
        "Construction phases: Phase 1 = excavation. Phase 2 = foundation + underground plumbing (can happen together). Phase 3 = framing.",
      technicalExplanation:
        "A task's layer depth is `max(parent_layer_depth) + 1`. Tasks sharing the same layer depth can run in parallel on separate worker nodes.",
      caseApplication:
        "Enables a 100-task ETL pipeline to complete in 15 minutes instead of 3 hours.",
      commonMistakes: [
        "Overloading worker nodes by dispatching all ready tasks without concurrency limits.",
        "Failing to handle straggler tasks that delay the completion of an entire stage.",
      ],
      practice: [
        "How does a dynamic work-stealing scheduler improve utilization when tasks in the same stage have widely varying durations?",
        "What happens to a parallel stage if one worker crashes due to an out-of-memory error?",
      ],
    },
  ],
  architecture: {
    levels: [
      {
        level: 1,
        title: "Level 1: Foundation (Single-Process ThreadPool DAG Runner)",
        focus: "In-memory topological execution using Python concurrent.futures.",
        mermaid: `graph TD
    DAGFile["DAG Definition (Python Script)"] --> InDegreeMap["In-Memory In-Degree Tracker"]
    InDegreeMap --> ThreadPool["Local ThreadPoolExecutor (Workers = 4)"]
    ThreadPool --> TaskExec["Execute Task Functions Locally"]
`,
        changes: [
          "Parse DAG into adjacency dictionary in memory.",
          "Use ThreadPoolExecutor to run tasks with zero in-degree.",
        ],
        components: [
          {
            name: "Local DAG Parser",
            description: "Builds adjacency list from task dependencies.",
          },
          { name: "ThreadPool Worker", description: "Executes ready tasks on local CPU cores." },
        ],
        tradeoffs: [
          {
            aspect: "Simplicity vs Scalability",
            choice: "Single machine thread pool",
            alternative: "Distributed Celery cluster",
            impact: "Zero infrastructure dependencies, but limited by single host CPU and RAM.",
          },
        ],
        failureModes: [
          {
            mode: "Host reboot",
            consequence: "Entire pipeline aborts; no state is preserved.",
            mitigation: "Persist task states in local SQLite database.",
          },
        ],
      },
      {
        level: 2,
        title: "Level 2: Scale & Distribution (Distributed Celery / Kafka Worker Pool)",
        focus: "Centralized state database with distributed queue workers.",
        mermaid: `graph LR
    Scheduler["Airflow / Temporal Scheduler Daemon"] --> Postgres["State Database (DAG Runs, Task Instances)"]
    Scheduler --> RedisQueue["Message Broker (Redis / RabbitMQ)"]
    RedisQueue --> Worker1["Worker Node 1 (Docker/K8s)"]
    RedisQueue --> Worker2["Worker Node 2 (Docker/K8s)"]
    Worker1 -->|"Task Complete"| Postgres
    Worker2 -->|"Task Failed"| Postgres
`,
        changes: [
          "Decouple scheduler daemon from worker execution nodes.",
          "Dispatch tasks across distributed queues via Celery / Redis.",
        ],
        components: [
          { name: "Scheduler Daemon", description: "Periodically polls DB to advance DAG state." },
          {
            name: "Distributed Message Broker",
            description: "Buffers ready tasks for worker pull.",
          },
        ],
        tradeoffs: [
          {
            aspect: "Concurrency vs DB Load",
            choice: "Centralized SQL state polling",
            alternative: "P2P consensus coordination",
            impact:
              "High visibility into task states, but database can become a bottleneck at 10,000 tasks/min.",
          },
        ],
        failureModes: [
          {
            mode: "Worker OOM during heavy transform",
            consequence: "Task disappears without reporting status.",
            mitigation: "Heartbeat timeout detector that re-queues zombie tasks.",
          },
        ],
      },
      {
        level: 3,
        title: "Level 3: Production Resilience (Dynamic DAGs & Fault-Tolerant Re-Execution)",
        focus: "Dynamic task generation, cross-DAG dependencies, and intelligent failure retries.",
        mermaid: `graph TD
    Trigger["Sensor / Data Availability Trigger"] --> DynamicDAG["Dynamic DAG Expander (Map/Reduce Tasks)"]
    DynamicDAG --> K8sOperator["Kubernetes Ephemeral Task Pods"]
    K8sOperator --> Observability["OpenTelemetry Traces & Metric Alerts"]
    K8sOperator --> SmartRetry["Selective Subtree Re-execution"]
`,
        changes: [
          "Deploy tasks as ephemeral Kubernetes Pods to ensure complete resource isolation.",
          "Support selective re-execution: rerun failed task and its downstream cascade without restarting successful upstream tasks.",
        ],
        components: [
          {
            name: "Kubernetes Task Operator",
            description: "Spawns dedicated isolated container per task.",
          },
          {
            name: "Selective Subtree Re-executor",
            description: "Reruns only dirty nodes upon code bug fix.",
          },
        ],
        tradeoffs: [
          {
            aspect: "Pod Startup Overhead vs Isolation",
            choice: "Ephemeral Kubernetes pods",
            alternative: "Long-running worker processes",
            impact:
              "2-5 second container boot overhead, but zero dependency pollution between tasks.",
          },
        ],
        failureModes: [
          {
            mode: "Cluster-wide resource saturation",
            consequence: "New task pods get stuck in Pending state.",
            mitigation: "Configure cluster autoscaling and task concurrency throttling.",
          },
        ],
      },
    ],
  },
  decisions: [
    {
      decision: "Topological Sort: Kahn's Algorithm vs Depth-First Search (DFS) Post-Order",
      chosen: "Kahn's Algorithm with in-degree tracking",
      alternatives: [
        "DFS with recursion stack coloring",
        "Matrix multiplication transitive closure",
      ],
      tradeoffs:
        "Kahn's algorithm naturally yields parallel execution layers and detects cycles iteratively without recursion stack limits.",
      rationale:
        "Enterprise DAGs can have thousands of nodes; deep DFS recursions can hit Python's maximum recursion depth.",
      impact: "Predictable O(V + E) performance with instant parallel stage generation.",
    },
    {
      decision: "Failure Handling: Hard Pipeline Abort vs Isolated Cascade Blocking",
      chosen:
        "Isolated Cascade Blocking (block descendants, allow independent subtrees to complete)",
      alternatives: [
        "Hard-abort the entire pipeline immediately",
        "Ignore failure and blindly execute downstream tasks",
      ],
      tradeoffs:
        "Allows 90% of business reporting to finish on time even if an optional marketing data source fails.",
      rationale:
        "Critical operational dashboards should not be blocked by non-critical peripheral job errors.",
      impact: "Maximizes daily pipeline uptime and minimizes engineering on-call pages.",
    },
  ],
  implementation: {
    steps: [
      {
        step: 1,
        title: "Adjacency List and In-Degree Construction",
        objective: "Convert task lists and dependency pairs into directed graph representations.",
        code: `def build_graph(tasks: list[str], dependencies: list[list[str]]) -> tuple[dict, dict]:
    adj = {t: [] for t in tasks}
    in_degree = {t: 0 for t in tasks}
    for u, v in dependencies:
        adj[u].append(v)
        in_degree[v] += 1
    return adj, in_degree`,
        explanation: "Initializes graph data structures for topological processing.",
      },
      {
        step: 2,
        title: "Kahn's Algorithm for Topological Sort & Cycle Detection",
        objective:
          "Compute valid linear execution sequence and flag circular dependency deadlocks.",
        code: `def topological_sort(tasks: list[str], adj: dict, in_degree: dict) -> list[str]:
    in_deg = dict(in_degree)
    queue = [t for t in tasks if in_deg[t] == 0]
    queue.sort() # Deterministic ordering
    order = []
    while queue:
        node = queue.pop(0)
        order.append(node)
        for child in sorted(adj[node]):
            in_deg[child] -= 1
            if in_deg[child] == 0:
                queue.append(child)
    if len(order) != len(tasks):
        raise ValueError("Cycle detected in DAG")
    return order`,
        explanation: "Guarantees that every task appears after all its upstream dependencies.",
      },
      {
        step: 3,
        title: "Failure Cascade Propagation via BFS",
        objective: "Find all reachable downstream tasks from a failed node and mark them blocked.",
        code: `def find_downstream_cascade(failed_node: str, adj: dict) -> set[str]:
    blocked = set()
    queue = [failed_node]
    while queue:
        curr = queue.pop(0)
        for child in adj.get(curr, []):
            if child not in blocked:
                blocked.add(child)
                queue.append(child)
    return blocked`,
        explanation:
          "Isolates the blast radius of an upstream failure to only affected downstream dependencies.",
      },
    ],
    samples: [
      {
        title: "Airflow DAG Python Definition",
        language: "python",
        code: `from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

with DAG("daily_etl", start_date=datetime(2026, 1, 1), schedule="@daily") as dag:
    extract = BashOperator(task_id="extract", bash_command="python extract.py")
    transform = BashOperator(task_id="transform", bash_command="python transform.py")
    load = BashOperator(task_id="load", bash_command="python load.py")

    extract >> transform >> load`,
        explanation:
          "Declarative Python syntax for constructing DAG dependencies in Apache Airflow.",
      },
      {
        title: "Scheduler Execution Plan Output",
        language: "json",
        code: `{
  "status": "SCHEDULED",
  "total_tasks": 5,
  "execution_order": ["extract_sql", "extract_s3", "clean_data", "load_warehouse"],
  "blocked_tasks": ["train_ml_model"],
  "failure_reason": "Task 'clean_data' failed with exit code 1"
}`,
        explanation: "Scheduler state representation reflecting an isolated failure cascade.",
      },
    ],
  },
  practice: [
    {
      level: "Understand",
      title: "Topological Sort & Deadlock",
      brief:
        "Explain how Kahn's algorithm detects circular dependencies in a DAG when topologically sorted task count is less than total tasks.",
    },
    {
      level: "Modify",
      title: "Concurrent Stage Layering",
      brief:
        "Partition a DAG of tasks into parallel stages where all tasks with zero remaining in-degrees execute concurrently across worker nodes.",
    },
    {
      level: "Build",
      title: "Failure Cascade Propagator",
      brief:
        "Implement a BFS graph traversal algorithm that cascades upstream task failures to downstream dependencies while keeping independent subtrees running.",
    },
    {
      level: "Think",
      title: "Blast Radius Containment",
      brief:
        "Explain why a resilient DAG scheduler isolates failures to affected dependency subgraphs rather than aborting the entire data pipeline.",
    },
  ],
  reflection: [
    "How would you implement dynamic task mapping (e.g. processing 100 partitions in parallel where partition count is unknown until runtime)?",
    "What strategies prevent a long-running straggler task from holding up downstream ETL stages for hours?",
    "Why is isolated failure cascading critical for maintaining daily operational data warehouse SLAs?",
  ],
  techNotes: [
    {
      name: "Kahn's Topological Sort Complexity",
      kind: "Algorithm Analysis",
      note: "Kahn's algorithm runs in O(V + E) time and O(V) space. It reliably detects graph cycles because nodes participating in directed cycles will never reach an in-degree of 0.",
    },
    {
      name: "Airflow Task Execution Engine",
      kind: "Workflow Orchestrator",
      note: "The Apache Airflow scheduler continuously parses DAG files, resolves dependencies in PostgreSQL metadata tables, and queues runnable tasks into Celery or Kubernetes executors.",
    },
  ],
  codeLab: {
    functionName: "schedule_dag_execution",
    signature:
      "def schedule_dag_execution(tasks: list[str], dependencies: list[list[str]], failed_task_id: str | None = None) -> dict:",
    starterCode: `def schedule_dag_execution(tasks: list[str], dependencies: list[list[str]], failed_task_id: str | None = None) -> dict:
    """
    Validates a DAG and computes its execution plan:
    - tasks: list of task identifier strings
    - dependencies: list of [upstream_task, downstream_task]
    - failed_task_id: optional task id that failed during execution

    Rules:
    1. If a cycle exists, return:
       {"status": "CYCLE_ERROR", "execution_order": [], "blocked_tasks": []}
    2. Topological sort using Kahn's algorithm (sort ties alphabetically).
    3. If failed_task_id is given:
       - Find all downstream tasks reachable from failed_task_id (transitive closure).
       - Add failed_task_id itself and all reachable downstream tasks to blocked_tasks (sorted).
       - execution_order contains all scheduled tasks excluding any blocked tasks.
    4. Return:
       {
           "status": "SCHEDULED",
           "execution_order": list[str],
           "blocked_tasks": list[str]
       }
    """
    adj = {t: [] for t in tasks}
    in_degree = {t: 0 for t in tasks}

    for u, v in dependencies:
        if u in adj and v in in_degree:
            adj[u].append(v)
            in_degree[v] += 1

    # Kahn's algorithm with deterministic tie breaking
    queue = [t for t in tasks if in_degree[t] == 0]
    queue.sort()
    order = []
    in_deg = dict(in_degree)

    while queue:
        curr = queue.pop(0)
        order.append(curr)
        for neighbor in sorted(adj[curr]):
            in_deg[neighbor] -= 1
            if in_deg[neighbor] == 0:
                queue.append(neighbor)
                queue.sort()

    if len(order) != len(tasks):
        return {"status": "CYCLE_ERROR", "execution_order": [], "blocked_tasks": []}

    blocked = set()
    if failed_task_id and failed_task_id in adj:
        blocked.add(failed_task_id)
        bfs_q = [failed_task_id]
        while bfs_q:
            node = bfs_q.pop(0)
            for child in adj[node]:
                if child not in blocked:
                    blocked.add(child)
                    bfs_q.append(child)

    final_order = [t for t in order if t not in blocked]
    sorted_blocked = sorted(list(blocked))

    return {
        "status": "SCHEDULED",
        "execution_order": final_order,
        "blocked_tasks": sorted_blocked,
    }
`,
    javaSignature:
      "public static Map<String, Object> scheduleDagExecution(List<String> tasks, List<List<String>> dependencies, String failedTaskId)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> scheduleDagExecution(List<String> tasks, List<List<String>> dependencies, String failedTaskId) {
        Map<String, List<String>> adj = new HashMap<>();
        Map<String, Integer> inDegree = new HashMap<>();

        for (String t : tasks) {
            adj.put(t, new ArrayList<>());
            inDegree.put(t, 0);
        }

        for (List<String> edge : dependencies) {
            String u = edge.get(0);
            String v = edge.get(1);
            if (adj.containsKey(u) && inDegree.containsKey(v)) {
                adj.get(u).add(v);
                inDegree.put(v, inDegree.get(v) + 1);
            }
        }

        PriorityQueue<String> queue = new PriorityQueue<>();
        for (String t : tasks) {
            if (inDegree.get(t) == 0) {
                queue.add(t);
            }
        }

        List<String> order = new ArrayList<>();
        Map<String, Integer> inDeg = new HashMap<>(inDegree);

        while (!queue.isEmpty()) {
            String curr = queue.poll();
            order.add(curr);
            for (String neighbor : adj.get(curr)) {
                int rem = inDeg.get(neighbor) - 1;
                inDeg.put(neighbor, rem);
                if (rem == 0) {
                    queue.add(neighbor);
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        if (order.size() != tasks.size()) {
            result.put("status", "CYCLE_ERROR");
            result.put("execution_order", Collections.emptyList());
            result.put("blocked_tasks", Collections.emptyList());
            return result;
        }

        Set<String> blocked = new HashSet<>();
        if (failedTaskId != null && adj.containsKey(failedTaskId)) {
            blocked.add(failedTaskId);
            Queue<String> bfsQ = new LinkedList<>();
            bfsQ.add(failedTaskId);
            while (!bfsQ.isEmpty()) {
                String node = bfsQ.poll();
                for (String child : adj.get(node)) {
                    if (!blocked.contains(child)) {
                        blocked.add(child);
                        bfsQ.add(child);
                    }
                }
            }
        }

        List<String> finalOrder = new ArrayList<>();
        for (String t : order) {
            if (!blocked.contains(t)) {
                finalOrder.add(t);
            }
        }

        List<String> sortedBlocked = new ArrayList<>(blocked);
        Collections.sort(sortedBlocked);

        result.put("status", "SCHEDULED");
        result.put("execution_order", finalOrder);
        result.put("blocked_tasks", sortedBlocked);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["schedule_dag_execution(tasks, dependencies, failed_id)"] --> BuildAdj["Build adj and in_degree maps"]
    BuildAdj --> InitQueue["Enqueue all nodes with in_degree == 0"]
    InitQueue --> KahnLoop["While queue non-empty: pop node, add to order, decrement neighbors"]
    KahnLoop --> CycleCheck{"len(order) == len(tasks)?"}
    CycleCheck -->|"No"| CycleError["Return status: 'CYCLE_ERROR'"]
    CycleCheck -->|"Yes"| CheckFailed{"failed_task_id provided?"}
    CheckFailed -->|"Yes"| BFS["BFS to find all downstream reachable nodes -> blocked"]
    CheckFailed -->|"No"| NoBlock["blocked = set()"]
    BFS --> FilterOrder["final_order = [t for t in order if t not in blocked]"]
    NoBlock --> FilterOrder
    FilterOrder --> ReturnResult["Return SCHEDULED with execution_order and blocked_tasks"]
`,
    hints: [
      "Use Kahn's algorithm with a sorted queue or priority queue for deterministic alphabetical tie-breaking.",
      "Check if len(order) == len(tasks) to detect cyclic dependencies.",
      "Perform a standard BFS from failed_task_id along downstream edges to identify all blocked tasks.",
    ],
    tests: [
      {
        name: "Standard diamond DAG executes in topological order",
        args: [
          ["A", "B", "C", "D"],
          [
            ["A", "B"],
            ["A", "C"],
            ["B", "D"],
            ["C", "D"],
          ],
          null,
        ],
        expected: {
          status: "SCHEDULED",
          execution_order: ["A", "B", "C", "D"],
          blocked_tasks: [],
        },
      },
      {
        name: "Cycle detected returns CYCLE_ERROR",
        args: [
          ["Task1", "Task2", "Task3"],
          [
            ["Task1", "Task2"],
            ["Task2", "Task3"],
            ["Task3", "Task1"],
          ],
          null,
        ],
        expected: {
          status: "CYCLE_ERROR",
          execution_order: [],
          blocked_tasks: [],
        },
      },
      {
        name: "Failed task blocks itself and all downstream descendants",
        args: [
          ["extract", "transform", "load", "analytics"],
          [
            ["extract", "transform"],
            ["transform", "load"],
            ["extract", "analytics"],
          ],
          "transform",
        ],
        expected: {
          status: "SCHEDULED",
          execution_order: ["extract", "analytics"],
          blocked_tasks: ["load", "transform"],
        },
      },
    ],
    explanationPrompt:
      "Explain how your workflow scheduler implements Kahn's algorithm for topological sorting, detects circular dependencies, and cascades failure events using graph reachability.",
  },
};

// ----------------------------------------------------------------------------
// Case 59: Event-Sourced Payment Ledger & Double-Entry Accounting
// ----------------------------------------------------------------------------
export const case59_eventSourcedLedger = {
  id: "cs-ledger-accounting-059",
  slug: "event-sourced-payment-ledger",
  index: "59",
  title:
    "How Does an Immutable Double-Entry Ledger Prevent Financial Discrepancies and Reconstruct Account Balances?",
  shortTitle: "Event-Sourced Payment Ledger",
  category: "E-Commerce & Financial Systems",
  subcategory: "Double-Entry Accounting & Event Sourcing",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "Financial platforms like Stripe, Revolut, and Modern Treasury cannot use simple SQL `UPDATE accounts SET balance = balance + 10` statements—a single race condition, lost update, or software crash would corrupt money balances and fail regulatory banking audits. Discover how event-sourced double-entry ledgers treat financial transactions as immutable append-only journals where every cent debited must equal every cent credited.",
  learningObjectives: [
    "Master the core mathematical rule of double-entry accounting: Sum(Debits) == Sum(Credits).",
    "Design an append-only event-sourced journal that reconstructs account balances at any point in time.",
    "Prevent race conditions and double-spending using optimistic concurrency and sequential journal versions.",
    "Implement CQRS snapshot projections to query balances in O(1) time without replaying millions of historic events.",
  ],
  prerequisites: [
    "Event sourcing principles and CQRS architecture",
    "Relational database isolation levels (SERIALIZABLE / READ COMMITTED)",
    "Financial accounting principles (Assets, Liabilities, Equity, Debits, Credits)",
  ],
  engineeringConcepts: [
    "Double-Entry Accounting Invariant",
    "Append-Only Event Sourcing",
    "CQRS Balance Projections",
    "Optimistic Concurrency Versioning",
    "Immutable Financial Audit Trail",
  ],
  technologies: ["Python", "Java", "PostgreSQL", "Kafka", "EventStoreDB", "Redis"],
  tech: ["Event Sourcing", "Double-Entry Ledger", "CQRS"],
  tags: ["ledger", "fintech", "event-sourcing", "double-entry", "advanced"],
  glossary: [
    {
      term: "Double-Entry Accounting",
      plainDefinition:
        "A centuries-old bookkeeping method where every transaction requires at least two equal and opposite entries: a debit to one account and a credit to another.",
    },
    {
      term: "Event Sourcing",
      plainDefinition:
        "An architectural pattern where application state is stored as a sequence of immutable events rather than overwriting mutable table rows.",
    },
    {
      term: "CQRS (Command Query Responsibility Segregation)",
      plainDefinition:
        "Separating the write model (appending journal transactions) from the read model (querying cached account balance tables).",
    },
    {
      term: "Zero-Sum Balancing Invariant",
      plainDefinition:
        "The mathematical guarantee that within every journal entry, total debited amount minus total credited amount equals exactly zero.",
    },
    {
      term: "Snapshot Projection",
      plainDefinition:
        "A materialized checkpoint of account balances up to event #N, allowing the system to compute current balance by replaying only events since the snapshot.",
    },
  ],
  primers: [
    {
      concept: "Why Never Use UPDATE balance = balance + amount",
      minutes: 4,
      definition:
        "If you only store current balances, you have zero proof of how a customer arrived at $1,000. If an engineer accidentally runs a bad SQL query or a race condition executes twice, money vanishes or appears with zero forensic trace.",
      whyNeeded:
        "Banking regulations (SOX, PCI, Basel III) legally require complete, tamper-proof audit trails of every penny moved.",
      analogy:
        "A bank passbook: the teller never erases your balance with white-out and writes a new number. Every deposit and withdrawal is stamped on a new line with an ink date.",
      tinyExample:
        "# NEVER: db.execute('UPDATE accounts SET balance = balance - 100')\n# ALWAYS: db.execute('INSERT INTO ledger_entries (debit_acct, credit_acct, amount) VALUES ...')",
    },
    {
      concept: "Double-Entry: Debits Equal Credits",
      minutes: 4,
      definition:
        "Money cannot be created out of thin air. When User A transfers $50 to User B, User A's Cash asset account is credited $50 (decreased), and User B's Cash asset account is debited $50 (increased). Sum of debits ($50) == Sum of credits ($50).",
      whyNeeded: "Guarantees the overall ledger remains mathematically balanced at all times.",
      analogy:
        "Pouring water between two measuring cups: the water gained in cup 2 is exactly equal to the water lost in cup 1.",
      tinyExample: "assert sum(entry.debits) == sum(entry.credits), 'Unbalanced journal entry!'",
    },
  ],
  discover: {
    situation:
      "A fast-growing fintech wallet stored user balances as a single float column `user_balance` in a PostgreSQL database. During a Black Friday flash sale, concurrent webhook callbacks for payment refunds collided with user peer-to-peer transfers. Due to lost updates and race conditions, $42,000 of customer balances vanished into negative numbers, and auditors could not reconstruct which transactions caused the discrepancy.",
    humanFlow: [
      "User initiates $100 transfer from their Wallet to their Bank Account.",
      "Ledger engine creates an immutable transaction with a unique transaction ID.",
      "Transaction records two journal postings: Debit User Bank Account ($100), Credit User Wallet ($100).",
      "Validator checks: `sum(debits) == sum(credits) == 100` and verifies User Wallet has sufficient funds.",
      "Entry is appended to the immutable `ledger_entries` table with incrementing sequence number.",
      "Projection daemon consumes the event and updates the fast read-cache table `account_balances`.",
      "Auditor queries transaction history at any past timestamp to verify exact balance provenance.",
    ],
    question:
      "How do you design an event-sourced double-entry ledger that guarantees mathematical balancing, prevents double-spending, and reconstructs historical balances with zero discrepancies?",
    whyItExists: [
      "Mutable database updates make financial forensics, fraud detection, and regulatory audits impossible.",
      "Double-entry balancing mathematically eliminates money creation or loss bugs.",
      "Event sourcing allows rolling back and debugging the exact state of any account at any point in history.",
    ],
  },
  understand: {
    overview:
      "The Event-Sourced Payment Ledger models all financial activity as an append-only sequence of balanced journal entries. Each transaction consists of one or more debits and credits that sum to zero. Write operations append new journal entries to an append-only store with optimistic concurrency checks. Read queries utilize materialized projection tables (CQRS) that represent pre-computed balances, rebuilt periodically from immutable event checkpoints.",
    components: [
      {
        name: "Immutable Journal Store",
        whatIsIt: "Append-only table storing timestamped debit and credit records.",
        whyItExists: "Provides permanent, tamper-evident proof of every transaction.",
        whatItDoes: "Rejects UPDATE and DELETE queries at the database trigger level.",
      },
      {
        name: "Double-Entry Invariant Validator",
        whatIsIt: "Pre-commit validation logic ensuring total debits equal total credits.",
        whyItExists: "Enforces the fundamental conservation-of-money rule.",
        whatItDoes: "Rejects any transaction where `sum(debits) != sum(credits)`.",
      },
      {
        name: "CQRS Balance Projector",
        whatIsIt: "Background worker maintaining current account balance views.",
        whyItExists: "Enables sub-millisecond balance checks without replaying entire histories.",
        whatItDoes: "Updates `account_balances` read table upon new journal event commit.",
      },
      {
        name: "Snapshot Checkpoint Engine",
        whatIsIt: "Periodic job recording balance snapshots every N events.",
        whyItExists: "Limits event replay time during disaster recovery to O(K) where K < N.",
        whatItDoes: "Stores serialized account balances alongside event sequence IDs.",
      },
    ],
    analogy: {
      title: "Banker's Leather-Bound Ledger",
      everyday: [
        "In a 19th-century bank, the head teller writes transactions in a thick leather book using permanent black ink.",
        "If a customer deposits $100, the teller writes: 'Cash Vault: +$100 | Customer Account: +$100 liability'.",
        "If an error is made, the teller never erases the line; they write a corrective reversal entry on the next line.",
        "At the end of the day, the bookkeeper tallies the debit column and credit column; if the sums don't match, nobody goes home.",
      ],
      technical: [
        "Permanent black ink book corresponds to Append-Only PostgreSQL Journal Table.",
        "Corrective reversal entry corresponds to Compensating Event Pattern.",
        "End-of-day tally matching corresponds to Zero-Sum Double-Entry Invariant Validation.",
      ],
    },
    flow: [
      "Client submits transfer: `$100 from Account A to Account B`.",
      "Engine parses postings: `[{account: 'A', type: 'CREDIT', amount: 100}, {account: 'B', type: 'DEBIT', amount: 100}]`.",
      "Engine checks: `sum(debits) == sum(credits)`. If unequal, reject with `UNBALANCED_ENTRY`.",
      "Engine checks Account A current balance. If `balance - 100 < 0` (for asset accounts), reject with `INSUFFICIENT_FUNDS`.",
      "Append transaction into `ledger_entries` table with current version sequence number.",
      "Asynchronously dispatch event to CQRS projector to update `account_balances` cache.",
      "Return success confirmation with unique transaction ID and updated balances.",
    ],
  },
  concepts: [
    {
      id: "concept-double-entry-invariant",
      name: "Double-Entry Zero-Sum Invariant",
      difficulty: "Advanced",
      simpleDefinition:
        "Every single financial transaction must have at least one debit and one credit, and the total value of debits must exactly equal the total value of credits.",
      whyItExists: "Ensures money is never accidentally created or destroyed by software bugs.",
      realWorldAnalogy:
        "Newton's third law of motion: every action has an equal and opposite reaction.",
      technicalExplanation:
        "For any transaction T consisting of postings p_i with sign s_i in {+1, -1}, sum(s_i * amount_i) == 0. Transactions violating this condition are aborted before commit.",
      caseApplication:
        "Used by payment processors to guarantee accounting books balance down to the exact cent.",
      commonMistakes: [
        "Allowing single-legged transactions (e.g. updating one account without an offsetting counterpart account).",
        "Rounding amounts during currency conversion before checking the zero-sum balance.",
      ],
      practice: [
        "When a user deposits $500 via ACH, which account is debited and which account is credited?",
        "Why is an overdraft fee represented as a debit to the customer account and a credit to the bank's fee revenue account?",
      ],
    },
    {
      id: "concept-event-sourcing-replay",
      name: "Event Sourcing & Point-in-Time Replay",
      difficulty: "Advanced",
      simpleDefinition:
        "Reconstructing the exact state of any account at any historic date by replaying all journal events recorded up to that specific timestamp.",
      whyItExists:
        "Provides auditability, reproducible debugging, and disaster recovery against database corruption.",
      realWorldAnalogy:
        "A chess game notation sheet: by reading the list of moves from move 1 to move 24, you can place the pieces on the board to see the exact game state at move 24.",
      technicalExplanation:
        "Current Balance = Initial_State + sum(Debits) - sum(Credits). By filtering events where `timestamp <= target_time`, historical state is deterministically reproduced.",
      caseApplication:
        "Enables instant generation of monthly statements and tax reports for any billing cycle.",
      commonMistakes: [
        "Mutating historic events in the database to fix past mistakes (always use compensating reversal entries).",
        "Replaying millions of events from the beginning of time on every read request without snapshot caching.",
      ],
      practice: [
        "What is a compensating transaction and how does it differ from a database rollback?",
        "How do snapshots improve balance query performance from O(N) to O(1)?",
      ],
    },
    {
      id: "concept-cqrs-projections",
      name: "CQRS Materialized Views & Concurrency",
      difficulty: "Advanced",
      simpleDefinition:
        "Separating the high-throughput write stream of journal events from the fast pre-calculated read views of current balances.",
      whyItExists:
        "Querying current balance by summing 500,000 ledger rows on every checkout page load is unacceptably slow.",
      realWorldAnalogy:
        "A scoreboard at a basketball game: fans read the big scoreboard number (projection), while the referee records individual fouls and points in the official scorebook (journal).",
      technicalExplanation:
        "Writes append to the journal table. A streaming worker or DB trigger updates `account_balances (account_id, balance, last_event_id)`. Optimistic locking on `version` prevents race conditions.",
      caseApplication:
        "Allows mobile banking apps to display user balances in 5 milliseconds while supporting 10,000 transactions/sec.",
      commonMistakes: [
        "Allowing the read view to fall behind the write log without warning clients of eventual consistency lag.",
        "Updating the read projection without a strict transaction or exactly-once delivery guarantee.",
      ],
      practice: [
        "How does a system handle a read request if the user just completed a transfer and the projection worker is 50ms behind?",
        "Why should account balances be stored as 64-bit integers (cents/micros) rather than 64-bit floats?",
      ],
    },
  ],
  architecture: {
    levels: [
      {
        level: 1,
        title: "Level 1: Foundation (PostgreSQL Journal with DB Check Constraints)",
        focus: "Relational append-only tables with SQL CHECK constraints and triggers.",
        mermaid: `graph TD
    Client["Payment API"] --> Tx["DB Transaction BEGIN"]
    Tx --> InsertJournal["INSERT INTO ledger_journal (entry_id, timestamp)"]
    Tx --> InsertPostings["INSERT INTO ledger_postings (debit/credit lines)"]
    InsertPostings --> Trigger["SQL Trigger: Verify sum(debits) == sum(credits)"]
    Trigger --> Commit["DB COMMIT"]
`,
        changes: [
          "Create `ledger_journal` and `ledger_postings` relational schema.",
          "Add database trigger enforcing debit/credit balance equality before transaction commit.",
        ],
        components: [
          {
            name: "Ledger Journal Table",
            description: "Records transaction headers and metadata.",
          },
          {
            name: "Ledger Postings Table",
            description: "Records individual debit and credit entries.",
          },
        ],
        tradeoffs: [
          {
            aspect: "Simplicity vs Throughput",
            choice: "PostgreSQL ACID transactions",
            alternative: "Distributed event store",
            impact:
              "Guarantees immediate consistency and ACID durability, but limited to single-node DB write IOPS (~5,000 TPS).",
          },
        ],
        failureModes: [
          {
            mode: "Unbalanced posting payload",
            consequence: "Database trigger aborts transaction.",
            mitigation: "Client catches constraint error and returns 400 Bad Request to caller.",
          },
        ],
      },
      {
        level: 2,
        title: "Level 2: Scale & Distribution (CQRS Balance Projections & Redis Cache)",
        focus: "Separation of write journal from read projections using message queues.",
        mermaid: `graph LR
    API["Ledger Write Service"] --> Postgres["Postgres (Append-Only Journal)"]
    Postgres --> CDC["Change Data Capture (Debezium / Logical Replication)"]
    CDC --> Kafka["Kafka Topic: ledger.events"]
    Kafka --> Projector["Balance Projection Worker"]
    Projector --> Redis["Redis Read Cache (Cached Balances)"]
    App["Mobile App Balance Query"] --> Redis
`,
        changes: [
          "Deploy Change Data Capture (CDC) streaming committed postings to Kafka.",
          "Implement CQRS balance projection daemon updating Redis cache.",
        ],
        components: [
          { name: "CDC Connector", description: "Streams journal commits to Kafka." },
          {
            name: "Projection Worker",
            description: "Maintains current balance projections in Redis.",
          },
        ],
        tradeoffs: [
          {
            aspect: "Read Speed vs Consistency",
            choice: "Asynchronous CQRS projection",
            alternative: "Synchronous balance calculation",
            impact:
              "Sub-millisecond balance reads, but introduces potential 10-50ms replication lag.",
          },
        ],
        failureModes: [
          {
            mode: "Projection consumer lag",
            consequence: "User sees stale balance after transfer.",
            mitigation:
              "Read-your-own-writes session token directing immediate post-transfer reads to primary DB.",
          },
        ],
      },
      {
        level: 3,
        title:
          "Level 3: Production Resilience (Sharded Partitioning & Automated Reconciliation Audits)",
        focus:
          "Account-sharded ledgers, periodic snapshotting, and continuous balance integrity verification.",
        mermaid: `graph TD
    Transfers["Incoming Transaction Stream"] --> ShardRouter["Account-Hash Shard Router"]
    ShardRouter --> ShardA["Ledger Shard A (Accounts 0-999)"]
    ShardRouter --> ShardB["Ledger Shard B (Accounts 1000-1999)"]
    ShardA --> Snapshotter["Periodic Snapshot Engine (Every 10,000 Events)"]
    Snapshotter --> S3["S3 Snapshot Archive"]
    Snapshotter --> Auditor["Nightly Zero-Sum Reconciliation Verifier"]
`,
        changes: [
          "Partition ledger entries across database shards by account ID.",
          "Run nightly automated reconciliation daemon checking sum of all accounts against central bank reserves.",
        ],
        components: [
          { name: "Shard Router", description: "Routes transactions by account hash." },
          {
            name: "Automated Reconciliation Auditor",
            description: "Verifies mathematical integrity across all accounts.",
          },
        ],
        tradeoffs: [
          {
            aspect: "Cross-Shard Transfers vs Scale",
            choice: "Two-Phase Commit (2PC) for cross-shard transfers",
            alternative: "Single monolithic database",
            impact:
              "Unlimited horizontal scalability at the cost of cross-shard coordination latency.",
          },
        ],
        failureModes: [
          {
            mode: "Network partition during cross-shard transfer",
            consequence: "One shard prepared but second shard timed out.",
            mitigation: "Saga orchestrator with automated compensating transaction reversal.",
          },
        ],
      },
    ],
  },
  decisions: [
    {
      decision: "Event Sourced Append-Only Journal vs Mutable Row Balance Updates",
      chosen: "Event Sourced Append-Only Journal with CQRS projections",
      alternatives: [
        "Direct SQL `UPDATE accounts SET balance = balance + :amount`",
        "Hybrid balance table with audit log table updated via triggers",
      ],
      tradeoffs:
        "Requires more storage and CQRS projection infrastructure, but provides mathematical auditability and eliminates lost update bugs.",
      rationale:
        "Financial platforms must legally prove balance provenance to banking auditors; lost updates are unacceptable.",
      impact:
        "Zero untraceable balance discrepancies and 100% compliance with financial accounting standards.",
    },
    {
      decision: "Currency Storage Format: 64-bit Integer (Cents/Micros) vs Floating Point",
      chosen: "64-bit BigInt representing minor units (cents or micro-units)",
      alternatives: [
        "IEEE 754 floating point (`float64`)",
        "String representation with arbitrary precision decimal libraries",
      ],
      tradeoffs:
        "Requires multiplying and dividing by 100 on display, but avoids floating point precision drift.",
      rationale:
        "Binary floating point cannot precisely represent base-10 decimals like 0.10, leading to phantom cent errors.",
      impact: "Zero rounding errors across millions of aggregated financial transactions.",
    },
  ],
  implementation: {
    steps: [
      {
        step: 1,
        title: "Define Journal Entry Structure and Invariants",
        objective:
          "Establish debit/credit entries and verify that sum of debits strictly equals sum of credits.",
        code: `def validate_journal_entry(entry: dict) -> bool:
    """Verifies that total debits equal total credits within a journal entry."""
    total_debits = sum(item["amount"] for item in entry.get("debits", []))
    total_credits = sum(item["amount"] for item in entry.get("credits", []))
    return total_debits > 0 and total_debits == total_credits`,
        explanation:
          "Enforces the zero-sum double-entry accounting invariant before writing to the database.",
      },
      {
        step: 2,
        title: "Replay Engine for Account Balance Reconstruction",
        objective:
          "Compute historical or current balance by summing all debit and credit postings for an account.",
        code: `def calculate_account_balance(account_id: str, postings: list[dict], account_type: str = "ASSET") -> int:
    """
    Computes balance in cents:
    For ASSET accounts: balance increases with DEBITS, decreases with CREDITS.
    For LIABILITY/EQUITY accounts: balance increases with CREDITS, decreases with DEBITS.
    """
    balance = 0
    for p in postings:
        if p["account"] == account_id:
            if account_type == "ASSET":
                balance += p["amount"] if p["type"] == "DEBIT" else -p["amount"]
            else:
                balance += p["amount"] if p["type"] == "CREDIT" else -p["amount"]
    return balance`,
        explanation: "Reconstructs exact account state from the underlying event journal.",
      },
      {
        step: 3,
        title: "Atomic Ledger Processing with Overdraft Protection",
        objective:
          "Process a sequence of journal entries, reject invalid transactions, and update balances.",
        code: `def process_ledger_batch(initial_balances: dict, entries: list[dict]) -> dict:
    balances = dict(initial_balances)
    rejected = []
    processed = 0

    for entry in entries:
        if not validate_journal_entry(entry):
            rejected.append({"entry_id": entry.get("entry_id"), "reason": "UNBALANCED_ENTRY"})
            continue

        # Check funds: credits decrease asset account balances
        can_apply = True
        temp_balances = dict(balances)
        for c in entry.get("credits", []):
            acct = c["account"]
            amt = c["amount"]
            curr = temp_balances.get(acct, 0)
            if curr < amt:
                can_apply = False
                break
            temp_balances[acct] = curr - amt

        if not can_apply:
            rejected.append({"entry_id": entry.get("entry_id"), "reason": "INSUFFICIENT_FUNDS"})
            continue

        for d in entry.get("debits", []):
            acct = d["account"]
            temp_balances[acct] = temp_balances.get(acct, 0) + d["amount"]

        balances = temp_balances
        processed += 1

    return {"balances": balances, "processed_count": processed, "rejected": rejected}`,
        explanation:
          "Applies transactions atomically, isolating invalid or overdrafting transactions.",
      },
    ],
    samples: [
      {
        title: "Double-Entry Journal Entry JSON",
        language: "json",
        code: `{
  "entry_id": "tx_88921",
  "timestamp": "2026-09-25T14:30:00Z",
  "description": "User A peer-to-peer transfer to User B",
  "debits": [
    { "account": "user_b_wallet", "amount": 5000 }
  ],
  "credits": [
    { "account": "user_a_wallet", "amount": 5000 }
  ]
}`,
        explanation: "Balanced double-entry posting moving 5000 cents ($50.00) between accounts.",
      },
      {
        title: "Reconciliation Audit Report",
        language: "json",
        code: `{
  "audit_timestamp": "2026-09-25T23:59:59Z",
  "total_journal_entries": 1420580,
  "total_debits_sum_cents": 8940250000,
  "total_credits_sum_cents": 8940250000,
  "is_zero_sum_balanced": true,
  "discrepancies_detected": 0
}`,
        explanation:
          "Automated nightly trial balance report proving total debits equal total credits.",
      },
    ],
  },
  practice: [
    {
      level: "Understand",
      title: "Double-Entry Invariant",
      brief:
        "Explain why double-entry bookkeeping requires that every financial transaction has equal total debits and credits.",
    },
    {
      level: "Modify",
      title: "CQRS Materialized Snapshots",
      brief:
        "Implement a CQRS snapshot projection worker that caches account balances to avoid replaying millions of historic events on every read.",
    },
    {
      level: "Build",
      title: "Compensating Reversal Entries",
      brief:
        "Design a compensating transaction mechanism to correct past erroneous postings without mutating the immutable event journal.",
    },
    {
      level: "Think",
      title: "Integer Cents vs Floating Point",
      brief:
        "Explain why financial ledgers strictly store monetary amounts as 64-bit integers (cents) rather than IEEE-754 floating-point numbers.",
    },
  ],
  reflection: [
    "How would you handle currency exchange transactions (e.g. USD to EUR) where debit is $100 USD and credit is €92 EUR?",
    "How does optimistic concurrency control with account version numbers prevent concurrent double-spending?",
    "Why is the append-only event sourcing pattern legally required for modern financial and banking regulatory compliance?",
  ],
  techNotes: [
    {
      name: "Double-Entry Accounting Standard (Luca Pacioli)",
      kind: "Financial Invariant",
      note: "The fundamental accounting equation states: Assets = Liabilities + Equity. Every transaction consists of balanced debits and credits where sum(debits) - sum(credits) == 0.",
    },
    {
      name: "EventStore / CQRS Projection Pattern",
      kind: "Distributed Ledger Architecture",
      note: "Append-only journals store immutable financial event records. CQRS projection workers update materialized account balance caches asynchronously using optimistic concurrency version numbers.",
    },
  ],
  codeLab: {
    functionName: "reconcile_ledger_transactions",
    signature:
      "def reconcile_ledger_transactions(initial_balances: dict, journal_entries: list[dict]) -> dict:",
    starterCode: `def reconcile_ledger_transactions(initial_balances: dict, journal_entries: list[dict]) -> dict:
    """
    Processes double-entry journal transactions and returns ledger summary:
    - initial_balances: dict mapping account_id -> balance (in cents, int)
    - journal_entries: list of {
        "entry_id": str,
        "debits": [{"account": str, "amount": int}],
        "credits": [{"account": str, "amount": int}]
      }

    Rules:
    1. Validation: sum(debits) must equal sum(credits) and be > 0.
       If unequal, entry is rejected with reason "UNBALANCED_ENTRY".
    2. Overdraft check: credits decrease account balance. If any credited account
       would drop below 0, reject entry with reason "INSUFFICIENT_FUNDS".
    3. Valid entry:
       - For each credit: balance[acct] -= amount
       - For each debit: balance[acct] = balance.get(acct, 0) + amount
    4. Return summary:
       {
           "is_balanced": bool (True if total debits == total credits across all accepted),
           "final_balances": dict (account -> balance),
           "processed_count": int,
           "rejected_entries": [{"entry_id": str, "reason": str}]
       }
    """
    balances = dict(initial_balances)
    rejected = []
    processed = 0
    total_accepted_debits = 0
    total_accepted_credits = 0

    for entry in journal_entries:
        entry_id = entry.get("entry_id", "unknown")
        debits = entry.get("debits", [])
        credits = entry.get("credits", [])

        sum_d = sum(d["amount"] for d in debits)
        sum_c = sum(c["amount"] for c in credits)

        if sum_d <= 0 or sum_d != sum_c:
            rejected.append({"entry_id": entry_id, "reason": "UNBALANCED_ENTRY"})
            continue

        # Check funds: credits decrease balance
        temp_balances = dict(balances)
        insufficient = False
        for c in credits:
            acct = c["account"]
            amt = c["amount"]
            curr = temp_balances.get(acct, 0)
            if curr < amt:
                insufficient = True
                break
            temp_balances[acct] = curr - amt

        if insufficient:
            rejected.append({"entry_id": entry_id, "reason": "INSUFFICIENT_FUNDS"})
            continue

        # Apply debits
        for d in debits:
            acct = d["account"]
            amt = d["amount"]
            temp_balances[acct] = temp_balances.get(acct, 0) + amt

        balances = temp_balances
        processed += 1
        total_accepted_debits += sum_d
        total_accepted_credits += sum_c

    return {
        "is_balanced": total_accepted_debits == total_accepted_credits,
        "final_balances": balances,
        "processed_count": processed,
        "rejected_entries": rejected,
    }
`,
    javaSignature:
      "public static Map<String, Object> reconcileLedgerTransactions(Map<String, Integer> initialBalances, List<Map<String, Object>> journalEntries)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> reconcileLedgerTransactions(Map<String, Integer> initialBalances, List<Map<String, Object>> journalEntries) {
        Map<String, Integer> balances = new HashMap<>(initialBalances);
        List<Map<String, String>> rejected = new ArrayList<>();
        int processed = 0;
        long totalDebits = 0;
        long totalCredits = 0;

        for (Map<String, Object> entry : journalEntries) {
            String entryId = (String) entry.getOrDefault("entry_id", "unknown");
            List<Map<String, Object>> debits = (List<Map<String, Object>>) entry.getOrDefault("debits", Collections.emptyList());
            List<Map<String, Object>> credits = (List<Map<String, Object>>) entry.getOrDefault("credits", Collections.emptyList());

            long sumD = 0;
            for (Map<String, Object> d : debits) {
                sumD += ((Number) d.get("amount")).longValue();
            }

            long sumC = 0;
            for (Map<String, Object> c : credits) {
                sumC += ((Number) c.get("amount")).longValue();
            }

            if (sumD <= 0 || sumD != sumC) {
                Map<String, String> rej = new LinkedHashMap<>();
                rej.put("entry_id", entryId);
                rej.put("reason", "UNBALANCED_ENTRY");
                rejected.add(rej);
                continue;
            }

            Map<String, Integer> tempBalances = new HashMap<>(balances);
            boolean insufficient = false;

            for (Map<String, Object> c : credits) {
                String acct = (String) c.get("account");
                int amt = ((Number) c.get("amount")).intValue();
                int curr = tempBalances.getOrDefault(acct, 0);
                if (curr < amt) {
                    insufficient = true;
                    break;
                }
                tempBalances.put(acct, curr - amt);
            }

            if (insufficient) {
                Map<String, String> rej = new LinkedHashMap<>();
                rej.put("entry_id", entryId);
                rej.put("reason", "INSUFFICIENT_FUNDS");
                rejected.add(rej);
                continue;
            }

            for (Map<String, Object> d : debits) {
                String acct = (String) d.get("account");
                int amt = ((Number) d.get("amount")).intValue();
                tempBalances.put(acct, tempBalances.getOrDefault(acct, 0) + amt);
            }

            balances = tempBalances;
            processed++;
            totalDebits += sumD;
            totalCredits += sumC;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("is_balanced", totalDebits == totalCredits);
        result.put("final_balances", balances);
        result.put("processed_count", processed);
        result.put("rejected_entries", rejected);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["reconcile_ledger_transactions(initial_balances, entries)"] --> LoopEntries["For each entry in journal_entries"]
    LoopEntries --> CalcSums["sum_d = sum(debits), sum_c = sum(credits)"]
    CalcSums --> BalanceCheck{"sum_d > 0 and sum_d == sum_c?"}
    BalanceCheck -->|"No"| RejectUnbalanced["rejected.append(UNBALANCED_ENTRY)"]
    BalanceCheck -->|"Yes"| CheckFunds{"All credited accounts have balance >= amount?"}
    CheckFunds -->|"No"| RejectFunds["rejected.append(INSUFFICIENT_FUNDS)"]
    CheckFunds -->|"Yes"| ApplyEntry["Deduct credits, add debits, processed++"]
    RejectUnbalanced --> NextEntry{"More entries?"}
    RejectFunds --> NextEntry
    ApplyEntry --> NextEntry
    NextEntry -->|"Yes"| LoopEntries
    NextEntry -->|"No"| BuildSummary["Return is_balanced, final_balances, processed_count, rejected_entries"]
`,
    hints: [
      "Verify sum(debits) == sum(credits) and > 0 before touching any account balance.",
      "Check that each credited account has sufficient balance to prevent negative balances.",
      "Track total accepted debits and credits to confirm is_balanced is True.",
    ],
    tests: [
      {
        name: "Valid peer-to-peer transfer updates balances",
        args: [
          { alice_wallet: 10000, bob_wallet: 2000 },
          [
            {
              entry_id: "E1",
              debits: [{ account: "bob_wallet", amount: 3000 }],
              credits: [{ account: "alice_wallet", amount: 3000 }],
            },
          ],
        ],
        expected: {
          is_balanced: true,
          final_balances: { alice_wallet: 7000, bob_wallet: 5000 },
          processed_count: 1,
          rejected_entries: [],
        },
      },
      {
        name: "Unbalanced entry and insufficient funds rejected",
        args: [
          { charlie: 1000, dave: 500 },
          [
            {
              entry_id: "E2_BAD",
              debits: [{ account: "dave", amount: 500 }],
              credits: [{ account: "charlie", amount: 400 }], // Unbalanced: 500 != 400
            },
            {
              entry_id: "E3_OVERDRAFT",
              debits: [{ account: "dave", amount: 2000 }],
              credits: [{ account: "charlie", amount: 2000 }], // Insufficient: charlie has only 1000
            },
          ],
        ],
        expected: {
          is_balanced: true,
          final_balances: { charlie: 1000, dave: 500 },
          processed_count: 0,
          rejected_entries: [
            { entry_id: "E2_BAD", reason: "UNBALANCED_ENTRY" },
            { entry_id: "E3_OVERDRAFT", reason: "INSUFFICIENT_FUNDS" },
          ],
        },
      },
    ],
    explanationPrompt:
      "Explain how your double-entry ledger verifies the zero-sum invariant, checks for overdrafts, and guarantees append-only auditability across financial transactions.",
  },
};

// ============================================================================
// Batch 6b Export & Runner (Cases 56 - 59)
// ============================================================================
export const batch6bCases = [
  case56_virtualGitMonorepo,
  case57_subscriptionBilling,
  case58_dagScheduler,
  case59_eventSourcedLedger,
];

async function run() {
  let allPassed = true;
  console.log("=== Validating & Upserting Batch 6b (Cases 56 - 59) ===");
  for (const cs of batch6bCases) {
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
      ? "\n=== Batch 6b (Cases 56 - 59) Successfully Seeded to Convex DB! ==="
      : "\n=== Batch 6b FAILED — see errors above ===",
  );
  if (!allPassed) process.exit(1);
}

if (import.meta.main) {
  run().catch((err) => {
    console.error("Batch 6b Error:", err);
    process.exit(1);
  });
}
