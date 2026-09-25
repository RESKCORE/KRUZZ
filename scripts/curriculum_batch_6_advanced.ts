import { upsertToConvex, validateCaseStudy } from "./quality_gate.ts";

// ============================================================================
// Batch 6: Advanced Distributed AI, Ledgers & CRDTs (Cases 51 - 59)
// All cases are premium-tier, difficulty "Advanced", learnerLevel "Engineer", rcCost: 90
// ============================================================================

// ----------------------------------------------------------------------------
// Case 51: LLM Chatbot Streaming & Guardrails Gateway
// ----------------------------------------------------------------------------
export const case51_llmStreaming = {
  id: "cs-llm-streaming-051",
  slug: "llm-chatbot-streaming-guardrails",
  index: "51",
  title:
    "How Does an LLM Gateway Stream Token Chunks via SSE While Intercepting Safety Violations?",
  shortTitle: "LLM Streaming Gateway",
  category: "Advanced Distributed Architectures",
  subcategory: "Generative AI Gateways & Token Streaming",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "Production AI platforms stream token outputs via Server-Sent Events (SSE) to achieve sub-second perceived latency while applying real-time content moderation to intercept toxic outputs or PII leaks mid-stream. Discover how streaming gateways buffer sliding token windows and trigger circuit breakers.",
  learningObjectives: [
    "Design a low-latency Server-Sent Events (SSE) token streaming gateway.",
    "Implement sliding-window token buffering for real-time safety guardrails and PII redaction.",
    "Handle upstream provider rate limits and fallback circuit breakers.",
    "Estimate token consumption and enforce strict per-user quotas.",
  ],
  prerequisites: [
    "HTTP/1.1 chunked transfer encoding and Server-Sent Events (SSE)",
    "Sliding window text analysis and regular expressions",
    "Circuit breaker pattern and graceful degradation",
  ],
  engineeringConcepts: [
    "Server-Sent Events (SSE) Streaming",
    "Sliding-Window Token Moderation",
    "PII Masking & Redaction",
    "Provider Failover Circuit Breaker",
    "Token Consumption Metering",
  ],
  technologies: ["Python", "Java", "OpenAI API", "SSE", "FastAPI"],
  tech: ["LLM", "SSE", "Streaming Gateway"],
  tags: ["ai", "llm", "streaming", "guardrails", "advanced"],
  glossary: [
    {
      term: "Server-Sent Events (SSE) Streaming",
      plainDefinition:
        "A persistent HTTP connection where a server pushes text chunks (`data: ...\\n\\n`) to the browser as tokens generate.",
    },
    {
      term: "Sliding-Window Token Moderation",
      plainDefinition:
        "Inspecting overlapping multi-token windows mid-stream to catch banned words split across token boundaries.",
    },
    {
      term: "PII Masking & Redaction",
      plainDefinition:
        "Detecting sensitive patterns (credit cards, social security numbers) and replacing them with redacted placeholders.",
    },
    {
      term: "Provider Failover Circuit Breaker",
      plainDefinition:
        "Automatically rerouting inference requests to an alternate AI provider (e.g. Gemini -> Groq) when the primary returns 503 errors.",
    },
    {
      term: "Token Consumption Metering",
      plainDefinition:
        "Tracking input and output token counts in real time to deduct usage credits and prevent wallet overdrafts.",
    },
  ],
  primers: [
    {
      concept: "Why Streaming Matters for LLM UX",
      minutes: 4,
      definition:
        "Generating a 500-word response takes 10 seconds. Without streaming, the user stares at a blank screen for 10 seconds. With streaming, the first token renders in 200ms, making the system feel instantaneous.",
      whyNeeded:
        "Sub-second time-to-first-token (TTFT) is the single most important metric for conversational AI perceived latency.",
      analogy:
        "Drinking water from a running fountain as it flows vs waiting for someone to fill an entire 5-gallon jug before handing you a cup.",
      tinyExample: "for token in model.generate_stream(prompt):\n    yield f'data: {token}\\n\\n'",
    },
    {
      concept: "Sliding Window Split-Token Guardrail",
      minutes: 4,
      definition:
        "A toxic word like 'BANNED' might arrive split across two chunks: Chunk 1 = 'BAN', Chunk 2 = 'NED'. A naive chunk-by-chunk check misses it. A sliding buffer of the last N characters catches boundary-spanning violations.",
      whyNeeded:
        "Prevents jailbreak prompts and safety breaches that exploit token boundary splitting.",
      analogy:
        "Reading a message through a sliding magnifying glass: you always see the last few letters of the previous word.",
      tinyExample:
        "buffer = (buffer + new_chunk)[-MAX_WINDOW_LEN:]\nif any(bad in buffer for bad in BANNED_WORDS): redact()",
    },
  ],
  discover: {
    situation:
      "An enterprise deployed an internal AI assistant. A user submitted a prompt that tricked the model into outputting customer social security numbers. Because the server blindly piped raw token chunks directly from the foundation model to the browser, the private data streamed onto the user's screen before the post-hoc moderation filter even executed.",
    humanFlow: [
      "User types prompt into chat interface.",
      "Gateway checks user rate quota and opens SSE streaming connection.",
      "Foundation model emits token chunks (e.g. 5 tokens/sec).",
      "Gateway passes tokens through an in-flight sliding window moderation filter.",
      "If safety violation or PII is detected mid-stream, gateway immediately replaces chunk with '[REDACTED]' or terminates stream with an audit alert.",
      "Client UI renders sanitized text progressively.",
    ],
    question:
      "How do you design a high-throughput LLM gateway that streams token chunks with sub-millisecond overhead while intercepting safety violations mid-stream?",
    whyItExists: [
      "Perceived latency requires continuous progressive token delivery over HTTP.",
      "Regulatory compliance (GDPR, HIPAA) strictly forbids streaming unredacted PII.",
      "Token buffer filtering must execute in under 1 millisecond per chunk to preserve streaming cadence.",
    ],
  },
  understand: {
    overview:
      "The LLM Streaming Gateway acts as a reverse proxy between clients and LLM inference providers. It establishes an HTTP chunked SSE stream. As token chunks arrive from the model, a Guardrail Filter maintains a small sliding character buffer. It checks for banned keywords and regex patterns (e.g. credit card formats), redacting or aborting before writing the chunk down the client socket.",
    components: [
      {
        name: "SSE Streaming Connection Manager",
        whatIsIt: "HTTP endpoint handling persistent `text/event-stream` connections.",
        whyItExists: "Pushes text chunks to browser without polling.",
        whatItDoes: "Writes `data: {chunk}\\n\\n` lines down client sockets.",
      },
      {
        name: "Sliding Window Guardrail Filter",
        whatIsIt: "In-memory string buffer checking token streams for safety violations.",
        whyItExists: "Detects forbidden terms split across chunk boundaries.",
        whatItDoes: "Matches against blacklist and replaces violations with redaction tokens.",
      },
      {
        name: "PII Regex Scrubber",
        whatIsIt: "Pattern matcher scanning for SSNs, credit cards, and email addresses.",
        whyItExists: "Prevents accidental leakage of confidential personal data.",
        whatItDoes: "Substitutes matching numeric sequences with `[PII_REDACTED]`.",
      },
      {
        name: "Token Meter & Quota Controller",
        whatIsIt: "Usage counter incrementing input/output token metrics.",
        whyItExists: "Prevents runaway billing and enforces rate limits.",
        whatItDoes: "Deducts credits per token and trips circuit breaker when empty.",
      },
    ],
    analogy: {
      title: "Live Television Broadcast 7-Second Delay",
      everyday: [
        "Live television events (like the Super Bowl or awards shows) are broadcast on a 7-second audio/video delay.",
        "A broadcast engineer sits with a 'dump button'.",
        "If a presenter uses profanity, the engineer hits the button, muting the audio before it reaches millions of living room televisions.",
      ],
      technical: [
        "Live audio broadcast corresponds to Model Token Generation.",
        "7-second delay buffer corresponds to Sliding Window Token Buffering.",
        "Dump button corresponds to Mid-Stream Guardrail Interception.",
      ],
    },
    flow: [
      "Client opens SSE connection: POST /v1/chat/stream with prompt.",
      "Gateway validates quota and initiates upstream model generation stream.",
      "For each token chunk received from model:",
      "  - Append to sliding_buffer.",
      "  - Check for banned keywords or PII patterns.",
      "  - If violation detected: redact chunk or emit '[VIOLATION_BLOCKED]' and close connection.",
      '  - Else: yield formatted SSE event `data: {"token": chunk}\\n\\n`.',
      "Emit final `data: [DONE]\\n\\n` event and record token usage.",
    ],
  },
  concepts: [
    {
      id: "concept-sliding-redact",
      name: "Boundary-Spanning Token Redaction",
      difficulty: "Advanced",
      simpleDefinition:
        "Inspecting an overlapping window of characters across chunk boundaries to ensure banned terms are caught even if sliced in half.",
      whyItExists:
        "Language models emit variable BPE subword tokens; a forbidden word can be split into 2 or 3 separate token chunks.",
      realWorldAnalogy:
        "A security scanner inspecting luggage on a moving belt: scanning across the seams between bags.",
      technicalExplanation:
        "Keep buffer of last K characters. On new chunk: test (buffer + chunk). If match, redact or truncate.",
      caseApplication:
        "Prevents prompt injection attacks that intentionally break toxic words into multiple syllables.",
      commonMistakes: [
        "Inspecting each token chunk independently in isolation.",
        "Buffering too many tokens, re-introducing high perceived latency.",
      ],
      practice: [
        "If 'SECRET' is split into 'SEC' and 'RET', how does a sliding buffer catch it?",
        "What is the optimal character buffer size for catch-and-release token filtering?",
      ],
    },
    {
      id: "concept-sse-protocol",
      name: "Server-Sent Events (SSE) Wire Format",
      difficulty: "Advanced",
      simpleDefinition:
        "The standard W3C text streaming protocol using Content-Type: text/event-stream with double newline delimiters.",
      whyItExists:
        "Simpler than WebSockets for unidirectional server-to-client streaming over standard HTTP/2 and HTTP/3.",
      realWorldAnalogy:
        "A ticker tape machine printing one line of text at a time on an endless paper roll.",
      technicalExplanation:
        "Each message starts with `data: `, contains JSON payload, and ends with `\\n\\n`. Final terminator is `data: [DONE]\\n\\n`.",
      caseApplication:
        "Industry standard wire format used by OpenAI, Anthropic, and Google Gemini streaming endpoints.",
      commonMistakes: [
        "Forgetting the required double newline `\\n\\n` causing client buffers to hang.",
        "Allowing proxy servers (Nginx/Cloudflare) to buffer responses, destroying real-time delivery.",
      ],
      practice: [
        "Why must reverse proxies disable response buffering (`X-Accel-Buffering: no`) for SSE?",
        "Compare SSE vs WebSockets for LLM chat interfaces.",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the LLM Streaming Gateway showing token buffer inspection, PII scrubber, and SSE delivery.",
    levels: [
      {
        title: "Level 1: Gateway Flow",
        description: "Client to LLM Provider through the Streaming Guardrails Gateway.",
        mermaid: `graph TD
    Client["Chatbot UI"] -->|"1. POST /stream"| Gateway["LLM Streaming Gateway"]
    Gateway -->|"2. Upstream Stream Request"| Provider["Model Provider (OpenAI/Gemini)"]
    Provider -->|"3. Raw Token Stream"| Gateway
    Gateway --> Guardrail["Sliding Window Safety & PII Filter"]
    Guardrail -->|"4. Sanitized SSE Events"| Client
`,
      },
      {
        title: "Level 2: Sliding Window Token Filter",
        description: "Overlapping buffer catching terms split across chunk boundaries.",
        mermaid: `graph TD
    Chunk["Incoming Chunk: 'RET'"] --> Append["window = (prev_tail + chunk)"]
    Append --> ScanRegex{"Banned Word / PII in window?"}
    ScanRegex -->|"Yes"| Redact["Replace with '[REDACTED]'"]
    ScanRegex -->|"No"| Pass["Pass Original Chunk"]
    Redact --> UpdateTail["prev_tail = chunk[-K:]"]
    Pass --> UpdateTail
    UpdateTail --> EmitSSE["Emit SSE chunk to client"]
`,
      },
      {
        title: "Level 3: Multi-Provider Failover Circuit Breaker",
        description: "Automatic failover when primary provider fails.",
        mermaid: `graph TD
    Req["Stream Request"] --> Primary{"Primary Provider Healthy?"}
    Primary -->|"Yes"| StreamA["Stream from Provider A (Groq)"]
    Primary -->|"No (503 / Timeout)"| Secondary["Stream from Provider B (OpenRouter/Gemini)"]
    StreamA --> Monitor{"Stream Error Mid-Flight?"}
    Monitor -->|"Error"| TripCircuit["Trip Circuit Breaker & Fallback"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Server-Sent Events (SSE) over Full-Duplex WebSockets",
      what: "Use HTTP/1.1 or HTTP/2 Server-Sent Events (`text/event-stream`) for chat generation rather than bidirectional WebSockets.",
      why: "LLM chat is inherently request-response: client sends one prompt, server streams hundreds of tokens back. SSE works natively over HTTP without WebSocket handshake overhead.",
      problemSolved:
        "Simplifies edge proxying, CDN routing, and firewall traversal while supporting auto-reconnect.",
      withoutIt:
        "Maintaining millions of stateful WebSocket connections strains load balancer resources.",
      alternatives: ["Full-duplex WebSockets.", "gRPC streaming.", "Long-polling."],
      tradeoff:
        "SSE is strictly unidirectional; client cannot easily send mid-flight messages on the same socket (requires separate cancel HTTP call).",
    },
    {
      title: "Lightweight In-Flight String Filter over Heavy Multi-Modal Classifier",
      what: "Use compiled regex and sliding window substring searches for in-flight streaming, deferring heavy BERT/LLM classifiers to background audits.",
      why: "In-flight filtering must run in under 0.5ms per token to preserve 60 tokens/second streaming cadence.",
      problemSolved:
        "Eliminates streaming stutter caused by synchronous LLM-based safety evaluation on every token.",
      withoutIt:
        "Every token chunk waits 300ms for a secondary moderation model, destroying the streaming experience.",
      alternatives: [
        "Synchronous secondary moderation LLM per chunk (too slow).",
        "No streaming moderation (post-generation moderation only, dangerous for live screens).",
      ],
      tradeoff:
        "Keyword and regex filters catch explicit terms and patterns, but miss subtle nuance-based toxicity.",
    },
  ],
  implementation: {
    behaviour:
      "An LLMStreamingGateway class that processes raw token streams, filters banned keywords across chunk boundaries, masks PII patterns, and formats valid SSE packets.",
    algorithm: [
      "1. Initialize prev_buffer = ''.",
      "2. For each chunk in token_stream:",
      "   a. combined = prev_buffer + chunk.",
      "   b. Check for banned words in combined. If detected: chunk = '[REDACTED]'; combined = prev_buffer + chunk.",
      "   c. Check for credit card patterns (e.g. 16-digit sequences) in combined: replace with '[CARD_REDACTED]'.",
      "   d. Update prev_buffer: keep last K characters of combined to catch boundary spans.",
      '   e. Yield formatted SSE event: f\'data: {{"token": "{chunk}"}}\\n\\n\'.',
      "3. Yield final SSE event: 'data: [DONE]\\n\\n'.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Unbuffered Passthrough Streamer",
        detail: "Pipes raw model tokens directly to socket. Leaks PII and safety violations.",
      },
      {
        level: "Level 1",
        title: "Token Regex Scrubber",
        detail: "Sanitizes tokens individually but misses words split across boundaries.",
      },
      {
        level: "Level 2",
        title: "Sliding-Window Boundary Guardrail",
        detail:
          "Maintains character overlap buffer to catch split terms and format valid SSE events.",
      },
      {
        level: "Level 3",
        title: "Enterprise AI Inference Mesh",
        detail:
          "Dynamic provider failover, token consumption metering, and asynchronous audit logging.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "llm_gateway.py",
        code: `import re

class LLMStreamingGateway:
    def __init__(self, banned_words: list[str]) -> None:
        self.banned_words = [w.lower() for w in banned_words]
        self.buffer = ""

    def process_stream(self, token_chunks: list[str]) -> list[str]:
        events = []
        for chunk in token_chunks:
            self.buffer += chunk
            # Check for banned keywords
            sanitized = chunk
            buf_lower = self.buffer.lower()
            for bad in self.banned_words:
                if bad in buf_lower:
                    sanitized = "[REDACTED]"
                    self.buffer = ""
                    break

            # Redact 16-digit credit card patterns
            if re.search(r"\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b", self.buffer):
                sanitized = "[PII_REDACTED]"
                self.buffer = ""

            events.append(f"data: {sanitized}")

            # Keep last 15 characters to catch boundary splits
            self.buffer = self.buffer[-15:]

        events.append("data: [DONE]")
        return events`,
        explanations: [
          {
            code: "self.buffer += chunk",
            explanation:
              "Accumulates incoming tokens into sliding buffer to catch split-boundary words.",
          },
          {
            code: 'if bad in buf_lower: sanitized = "[REDACTED]"',
            explanation: "Redacts content immediately when a forbidden term is detected.",
          },
          {
            code: "self.buffer = self.buffer[-15:]",
            explanation:
              "Prunes buffer to preserve memory while retaining enough overlap for multi-chunk words.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates SSE token streaming and sliding-window safety guardrails in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Token Boundary Splitting",
      brief:
        "Explain how an attacker might craft a prompt so a model emits a toxic word split across two distinct token chunks, and how the buffer catches it.",
    },
    {
      level: "Modify",
      title: "Stream Cancellation Handler",
      brief:
        "Implement an abort handler that stops upstream model generation when the client drops the TCP connection mid-stream.",
    },
    {
      level: "Build",
      title: "Live Token Usage Meter",
      brief:
        "Build a metering interceptor that counts tokens and appends a final `metadata: {total_tokens: N, cost_usd: C}` SSE packet.",
    },
    {
      level: "Think",
      title: "Streaming Watermark Authentication",
      brief:
        "How can AI providers embed invisible mathematical steganographic watermarks into output token distributions without disrupting text readability?",
    },
  ],
  reflection: [
    "Why is Server-Sent Events (SSE) preferred over WebSockets for modern LLM chat applications?",
    "How does sliding-window token buffering catch safety violations that single-token checks miss?",
    "Why must AI gateway guardrails execute with sub-millisecond overhead to protect conversational fluency?",
  ],
  techNotes: [
    {
      name: "W3C Server-Sent Events Spec",
      kind: "Web Standards",
      note: "SSE operates over persistent standard HTTP connections. The browser's native `EventSource` API handles transparent connection retries and last-event-id synchronization.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Stream Token Chunks via SSE with Sliding Guardrails",
    brief:
      "Implement `stream_llm_tokens`: given `token_chunks` (list of str) and `banned_words` (list of str). Process each token chunk through a sliding buffer (keep up to 20 characters of past history). If any banned word (case-insensitive) appears in `buffer + chunk`, replace chunk output with `'[REDACTED]'` and clear buffer. If a 16-digit credit card pattern appears (e.g. 16 consecutive digits), replace with `'[PII_REDACTED]'` and clear buffer. Format each emitted event as `f'data: {sanitized}'`. Append final event `'data: [DONE]'`. Return list of event strings.",
    functionName: "stream_llm_tokens",
    signature:
      "def stream_llm_tokens(token_chunks: list[str], banned_words: list[str]) -> list[str]:",
    starterCode: `import re

def stream_llm_tokens(token_chunks: list[str], banned_words: list[str]) -> list[str]:
    # Return list of formatted SSE strings e.g. "data: Hello", ..., "data: [DONE]"
    banned = [w.lower() for w in banned_words]
    buffer = ""
    events = []

    for chunk in token_chunks:
        buffer += chunk
        sanitized = chunk
        buf_lower = buffer.lower()

        is_bad = False
        for b in banned:
            if b in buf_lower:
                sanitized = "[REDACTED]"
                buffer = ""
                is_bad = True
                break

        if not is_bad and re.search(r"\\b\\d{16}\\b", buffer):
            sanitized = "[PII_REDACTED]"
            buffer = ""

        events.append(f"data: {sanitized}")
        buffer = buffer[-20:]

    events.append("data: [DONE]")
    return events
`,
    javaSignature:
      "public static List<String> streamLlmTokens(List<String> tokenChunks, List<String> bannedWords)",
    javaStarterCode: `import java.util.*;
import java.util.regex.*;

public class Solution {
    public static List<String> streamLlmTokens(List<String> tokenChunks, List<String> bannedWords) {
        List<String> banned = new ArrayList<>();
        for (String w : bannedWords) banned.add(w.toLowerCase());

        StringBuilder buffer = new StringBuilder();
        List<String> events = new ArrayList<>();
        Pattern cardPattern = Pattern.compile("\\\\b\\\\d{16}\\\\b");

        for (String chunk : tokenChunks) {
            buffer.append(chunk);
            String sanitized = chunk;
            String bufLower = buffer.toString().toLowerCase();

            boolean isBad = false;
            for (String b : banned) {
                if (bufLower.contains(b)) {
                    sanitized = "[REDACTED]";
                    buffer.setLength(0);
                    isBad = true;
                    break;
                }
            }

            if (!isBad && cardPattern.matcher(buffer.toString()).find()) {
                sanitized = "[PII_REDACTED]";
                buffer.setLength(0);
            }

            events.append("data: " + sanitized);

            if (buffer.length() > 20) {
                String sub = buffer.substring(buffer.length() - 20);
                buffer.setLength(0);
                buffer.append(sub);
            }
        }

        events.add("data: [DONE]");
        return events;
    }
}`,
    mermaid: `graph TD
    Start["stream_llm_tokens(chunks, banned)"] --> LoopChunks["For each chunk in token_chunks"]
    LoopChunks --> Append["buffer += chunk"]
    Append --> CheckBanned{"Any banned word in buffer.lower()?"}
    CheckBanned -->|"Yes"| RedactWord["sanitized = '[REDACTED]', buffer = ''"]
    CheckBanned -->|"No"| CheckPII{"16-digit card in buffer?"}
    CheckPII -->|"Yes"| RedactPII["sanitized = '[PII_REDACTED]', buffer = ''"]
    CheckPII -->|"No"| Pass["sanitized = chunk"]
    RedactWord --> Emit["Append f'data: {sanitized}'"]
    RedactPII --> Emit
    Pass --> Emit
    Emit --> Truncate["buffer = buffer[-20:]"]
    Truncate --> NextChunk{"More chunks?"}
    NextChunk -->|"Yes"| LoopChunks
    NextChunk -->|"No"| Done["Append 'data: [DONE]' & return"]
`,
    hints: [
      "Keep buffer accumulated across chunks and truncate to last 20 characters.",
      "Check case-insensitive banned words first, then check 16-digit card pattern.",
      "Format each output string exactly as f'data: {sanitized}'.",
    ],
    tests: [
      {
        name: "Normal streaming output",
        args: [["Hello", " world", " from", " AI"], ["badword"]],
        expected: ["data: Hello", "data:  world", "data:  from", "data:  AI", "data: [DONE]"],
      },
      {
        name: "Boundary-split banned word is intercepted",
        args: [["This is an un", "safe", " phrase"], ["unsafe"]],
        expected: ["data: This is an un", "data: [REDACTED]", "data:  phrase", "data: [DONE]"],
      },
      {
        name: "Credit card number redacted",
        args: [["Card: ", "1234567812345678", " thank you"], ["toxic"]],
        expected: ["data: Card: ", "data: [PII_REDACTED]", "data:  thank you", "data: [DONE]"],
      },
    ],
    explanationPrompt:
      "Explain how your LLM gateway streams token chunks via Server-Sent Events, intercepts split-boundary banned terms using sliding buffers, and scrubs PII.",
  },
};

// ----------------------------------------------------------------------------
// Case 52: Distributed Vector Database & RAG Retrieval
// ----------------------------------------------------------------------------
export const case52_vectorDB = {
  id: "cs-vector-db-052",
  slug: "distributed-vector-database-rag",
  index: "52",
  title:
    "How Does a Distributed Vector Database Perform Approximate Nearest Neighbor Search for RAG?",
  shortTitle: "Vector DB & RAG Retrieval",
  category: "Advanced Distributed Architectures",
  subcategory: "Vector Search & Retrieval Augmented Generation",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "Retrieval-Augmented Generation (RAG) systems index millions of document embeddings in high-dimensional vector spaces (e.g. 1536-D). Discover how distributed vector databases perform Cosine Similarity search, organize embeddings with HNSW graphs, and return top-K semantic context chunks in single-digit milliseconds.",
  learningObjectives: [
    "Explain vector embeddings and the geometric intuition of cosine similarity.",
    "Implement high-dimensional vector cosine similarity and top-K nearest neighbor ranking.",
    "Structure document chunking, metadata filtering, and embedding storage schemas.",
    "Design hybrid search combining dense vector embeddings with sparse keyword search.",
  ],
  prerequisites: [
    "Linear algebra (dot products, vector magnitudes, cosine similarity)",
    "High-dimensional vector indexing concepts (HNSW, IVF)",
    "RAG (Retrieval-Augmented Generation) pipeline architecture",
  ],
  engineeringConcepts: [
    "Cosine Similarity Metric",
    "Top-K Nearest Neighbor Ranking",
    "High-Dimensional Embedding Index",
    "Metadata Pre-Filtering",
    "RAG Context Window Retrieval",
  ],
  technologies: ["Python", "Java", "Pinecone", "Milvus", "HNSW", "OpenAI"],
  tech: ["Vector DB", "Embeddings", "RAG"],
  tags: ["ai", "vector-db", "rag", "embeddings", "advanced"],
  glossary: [
    {
      term: "Cosine Similarity Metric",
      plainDefinition:
        "Measuring the cosine of the angle between two multi-dimensional vectors (dot product divided by the product of their lengths).",
    },
    {
      term: "Top-K Nearest Neighbor Ranking",
      plainDefinition:
        "Selecting the K most semantically relevant document chunks with the highest similarity scores.",
    },
    {
      term: "High-Dimensional Embedding Index",
      plainDefinition:
        "A specialized spatial data structure (like HNSW) designed to search 1536-dimensional float arrays rapidly.",
    },
    {
      term: "Metadata Pre-Filtering",
      plainDefinition:
        "Filtering document candidates by tenant, date, or category before running expensive vector math.",
    },
    {
      term: "RAG Context Window Retrieval",
      plainDefinition:
        "Feeding the top retrieved document chunks into an LLM prompt as factual ground-truth context.",
    },
  ],
  primers: [
    {
      concept: "Cosine Similarity Formula",
      minutes: 4,
      definition:
        "Cosine similarity measures direction, not magnitude. Formula: dot(A, B) / (norm(A) * norm(B)). Two identical vectors yield 1.0; orthogonal vectors yield 0.0; opposite vectors yield -1.0.",
      whyNeeded:
        "Semantic similarity depends on the angle of meaning, independent of document length.",
      analogy:
        "Two arrows pointing in the same direction: regardless of how long the arrows are, the angle between them is zero.",
      tinyExample:
        "dot = sum(a * b for a, b in zip(v1, v2))\nnorm = math.sqrt(sum(a*a for a in v1)) * math.sqrt(sum(b*b for b in v2))\nsim = dot / norm if norm > 0 else 0.0",
    },
    {
      concept: "Top-K Heap Pruning",
      minutes: 4,
      definition:
        "When querying 1,000,000 vectors, you only need the top 5 highest scores. A min-heap of size K discards low scores in O(N log K) time without sorting the entire million-item list.",
      whyNeeded: "Sorting 1,000,000 items on every user query is 100x slower and wastes memory.",
      analogy:
        "Keeping a podium of the top 3 Olympic runners: any runner slower than 3rd place is ignored immediately.",
      tinyExample:
        "heapq.heappush(top_k, (score, doc_id))\nif len(top_k) > k: heapq.heappop(top_k)",
    },
  ],
  discover: {
    situation:
      "A customer support AI was answering questions using a basic keyword search over 500,000 internal documentation pages. When a user asked 'How do I cancel my subscription and get my money back?', keyword search returned articles about 'how money moves in banking' and 'subscription renew policies', completely missing the refund guide because it used the word 'reimbursement' instead of 'money back'.",
    humanFlow: [
      "User submits natural language question: 'How do I get a refund?'.",
      "Embedding model converts text into a 1536-dimensional float vector.",
      "Vector database searches index and computes cosine similarity against all document chunks.",
      "Database returns top 3 highest-scoring chunks (including 'reimbursement policies').",
      "LLM receives user question + top chunks in system prompt and outputs a factually grounded answer.",
    ],
    question:
      "How do you design a high-performance vector retrieval engine that indexes multi-dimensional embeddings, computes cosine similarity, and retrieves top-K nearest chunks?",
    whyItExists: [
      "Semantic search resolves conceptual meaning rather than exact keyword string matching.",
      "RAG pipelines prevent LLM hallucinations by supplying verified factual context chunks.",
      "Sub-10ms retrieval requires vector distance pruning and efficient heap sorting.",
    ],
  },
  understand: {
    overview:
      "The Vector Database stores Document Chunks alongside their dense floating-point embedding vectors. When a query vector arrives, an evaluation engine computes the Cosine Similarity against active embeddings. A Min-Heap maintains the top-K highest-scoring chunks, which are formatted into a context payload for downstream LLM generation.",
    components: [
      {
        name: "Embedding Ingestion Pipeline",
        whatIsIt: "Worker chunking text into 500-token passages and calling embedding models.",
        whyItExists: "Converts raw unstructured text into mathematical vector coordinates.",
        whatItDoes: "Stores vectors, text content, and metadata tags.",
      },
      {
        name: "Vector Similarity Engine",
        whatIsIt: "Math kernel executing dot products and magnitude normalization.",
        whyItExists: "Measures semantic proximity between query and document vectors.",
        whatItDoes: "Computes dot(A, B) / (|A| * |B|).",
      },
      {
        name: "Top-K Priority Queue",
        whatIsIt: "Heap data structure retaining the K highest similarity scores.",
        whyItExists: "Retrieves top candidates in O(N log K) time.",
        whatItDoes: "Maintains top matches and discards lesser scores.",
      },
      {
        name: "RAG Prompt Synthesizer",
        whatIsIt: "Formatting layer combining query and retrieved chunks into an LLM prompt.",
        whyItExists: "Provides grounded context to generative models.",
        whatItDoes: "Concatenates chunks into system context markdown.",
      },
    ],
    analogy: {
      title: "Star Constellations in 3D Space",
      everyday: [
        "In astronomy, stars are plotted by 3D spatial coordinates (X, Y, Z).",
        "Stars that belong to the same cluster share similar spatial angles when viewed from Earth.",
        "To find the closest stars to a target coordinate, an astronomer calculates the angle between coordinate vectors.",
      ],
      technical: [
        "3D star coordinates correspond to 1536-dimensional Text Embeddings.",
        "Angle between stars corresponds to Cosine Similarity.",
        "Selecting the 5 nearest stars corresponds to Top-K Vector Retrieval.",
      ],
    },
    flow: [
      "Query arrives with embedding vector Q and requested count K.",
      "Iterate through candidate document vectors in index.",
      "Compute cosine similarity: `sim = dot(Q, V) / (norm(Q) * norm(V))`.",
      "Push `(sim, doc_id)` to top-K min-heap.",
      "If heap size > K: pop lowest similarity candidate.",
      "Extract items from heap, sort descending by score, and return top-K matches with text snippets.",
    ],
  },
  concepts: [
    {
      id: "concept-cosine-metric",
      name: "Cosine Distance Normalization",
      difficulty: "Advanced",
      simpleDefinition:
        "Dividing the dot product of two vectors by the product of their Euclidean lengths to obtain a score between -1.0 and +1.0.",
      whyItExists:
        "Ensures long documents with larger vector magnitudes do not artificially dominate shorter, more relevant passages.",
      realWorldAnalogy:
        "Judging two archers by their target accuracy angle rather than how many arrows they shot.",
      technicalExplanation:
        "cos_sim = sum(a_i * b_i) / (sqrt(sum(a_i^2)) * sqrt(sum(b_i^2))). If vectors are already unit-normalized (L2 norm = 1), dot product equals cosine similarity.",
      caseApplication:
        "Standard semantic similarity metric used in OpenAI and Cohere embedding search.",
      commonMistakes: [
        "Dividing by zero when an embedding contains all zeros.",
        "Re-normalizing vectors on every query instead of pre-normalizing them upon storage.",
      ],
      practice: [
        "What is the cosine similarity of [1, 0, 0] and [0, 1, 0]?",
        "If vector A is [2, 2] and vector B is [5, 5], why is their cosine similarity exactly 1.0?",
      ],
    },
    {
      id: "concept-topk-heap",
      name: "Top-K Bounded Heap Search",
      difficulty: "Advanced",
      simpleDefinition:
        "Using a min-heap of size K so that each candidate requires only an O(log K) insertion rather than full array sorting.",
      whyItExists:
        "Sorting 100,000 vectors takes O(N log N). A bounded heap takes O(N log K) and uses O(K) extra space.",
      realWorldAnalogy: "Keeping a VIP list of the 5 highest spenders at a charity auction.",
      technicalExplanation:
        "Heap stores (score, id). If heap has K elements and new score <= heap[0].score, discard immediately.",
      caseApplication:
        "Enables returning the top 5 relevant document chunks from large embedding indexes in milliseconds.",
      commonMistakes: [
        "Using a max-heap instead of a min-heap to keep the top K (min-heap allows popping the smallest of the top K).",
        "Returning the heap in raw array order instead of sorting descending by score.",
      ],
      practice: [
        "Trace the elements of a size-3 min-heap when scores [0.5, 0.9, 0.2, 0.8, 0.95] are inserted.",
        "Why does heap size K=5 make log K essentially a constant factor (approx 2 operations)?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Distributed Vector Database showing embedding ingestion, cosine kernel, and top-K heap retrieval.",
    levels: [
      {
        title: "Level 1: RAG Architecture",
        description: "User query, vector retrieval, and LLM context synthesis.",
        mermaid: `graph TD
    User["User Query: 'How to refund?'"] --> Embedder["Embedding Model (text-embedding-3)"]
    Embedder -->|"1536-D Vector Q"| VectorDB["Distributed Vector Database"]
    VectorDB -->|"Cosine Similarity Top-K"| Chunks["Top 3 Context Chunks"]
    Chunks --> RAGPrompt["RAG Context Assembly: Prompt + Context Chunks"]
    RAGPrompt --> LLM["Foundation Model (GPT-4 / Gemini)"]
    LLM --> Answer["Grounded Factual Answer"]
`,
      },
      {
        title: "Level 2: Cosine Similarity Kernel",
        description: "Vector dot product and norm normalization.",
        mermaid: `graph TD
    Query["Query Vector Q"] --> Dot["Compute dot(Q, V) = sum(Q[i] * V[i])"]
    Doc["Document Vector V"] --> Dot
    Query --> NormQ["norm(Q) = sqrt(sum(Q[i]^2))"]
    Doc --> NormV["norm(V) = sqrt(sum(V[i]^2))"]
    Dot --> Div["Similarity = dot / (norm(Q) * norm(V))"]
    NormQ --> Div
    NormV --> Div
`,
      },
      {
        title: "Level 3: Top-K Min-Heap Retention",
        description: "Bounded heap maintaining top matches.",
        mermaid: `graph TD
    Score["New Candidate (Score S, Doc ID)"] --> FullCheck{"Heap size < K?"}
    FullCheck -->|"Yes"| Push["heappush(heap, (S, Doc))"]
    FullCheck -->|"No"| Compare{"S > heap_min?"}
    Compare -->|"No"| Discard["Discard Candidate"]
    Compare -->|"Yes"| Replace["heappushpop(heap, (S, Doc))"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Cosine Similarity over Euclidean (L2) Distance",
      what: "Use Cosine Similarity rather than Euclidean (L2) distance for semantic document matching.",
      why: "Embedding models map semantic direction to angles; document length variations alter vector magnitude without changing core meaning.",
      problemSolved:
        "Prevents short, precise 20-word passages from being penalized compared to verbose 500-word passages.",
      withoutIt:
        "L2 distance treats short and long passages about the exact same concept as distant outliers.",
      alternatives: [
        "Euclidean L2 distance: sqrt(sum((a_i - b_i)^2)).",
        "Dot product alone (valid only if all vectors are strictly unit-normalized).",
      ],
      tradeoff: "Requires computing vector norms if embeddings are not pre-normalized to length 1.",
    },
    {
      title: "Bounded Min-Heap for Top-K Selection",
      what: "Use a min-heap of size K to collect highest scores rather than collecting all scores and sorting the entire list.",
      why: "Reduces algorithmic time complexity from O(N log N) to O(N log K) and space complexity to O(K).",
      problemSolved:
        "Prevents memory exhaustion and CPU bottlenecks when querying against 1,000,000 document vectors.",
      withoutIt:
        "Allocating and sorting 1,000,000 score pairs per query causes garbage collection spikes and high latency.",
      alternatives: ["Full array quicksort.", "Quickselect partition."],
      tradeoff:
        "Requires reversing the final popped heap array to present items in descending score order.",
    },
  ],
  implementation: {
    behaviour:
      "A VectorSearchEngine class that computes cosine similarities and maintains a bounded heap to return top-K semantic context chunks.",
    algorithm: [
      "1. cosine_similarity(v1, v2):",
      "   a. Compute dot = sum(a * b for a, b in zip(v1, v2)).",
      "   b. Compute norm1 = sqrt(sum(a*a for a in v1)), norm2 = sqrt(sum(b*b for b in v2)).",
      "   c. If norm1 == 0 or norm2 == 0: return 0.0.",
      "   d. Return dot / (norm1 * norm2).",
      "2. search_top_k(query_vec, documents, k):",
      "   a. Initialize heap = [].",
      "   b. For doc in documents with (id, embedding, text):",
      "      - sim = cosine_similarity(query_vec, doc['embedding']).",
      "      - If len(heap) < k: heapq.heappush(heap, (sim, doc['id'], doc['text'])).",
      "      - Else if sim > heap[0][0]: heapq.heappushpop(heap, (sim, doc['id'], doc['text'])).",
      "   c. Sort heap descending by similarity score.",
      "   d. Return list of {'id': id, 'score': round(sim, 4), 'text': text}.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Exact Keyword Lookup",
        detail:
          "Searches text for exact substring matches. Fails on synonyms and conceptual queries.",
      },
      {
        level: "Level 1",
        title: "Brute-Force Dot Product Search",
        detail:
          "Computes dot product across all vectors without normalization or top-K heap pruning.",
      },
      {
        level: "Level 2",
        title: "Cosine Top-K Retrieval Engine",
        detail: "Normalizes vector norms and maintains bounded min-heap for O(N log K) search.",
      },
      {
        level: "Level 3",
        title: "Distributed HNSW Vector Database",
        detail:
          "Hierarchical Navigable Small World graphs, vector quantization, and hybrid BM25 search.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "vector_search.py",
        code: `import math
import heapq

class VectorSearchEngine:
    @staticmethod
    def cosine_similarity(v1: list[float], v2: list[float]) -> float:
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0
        return dot / (norm1 * norm2)

    def search(self, query_vec: list[float], documents: list[dict], k: int = 3) -> list[dict]:
        # documents: [{"id": str, "embedding": list[float], "text": str}]
        heap: list[tuple[float, str, str]] = []

        for doc in documents:
            sim = self.cosine_similarity(query_vec, doc["embedding"])
            if len(heap) < k:
                heapq.heappush(heap, (sim, doc["id"], doc["text"]))
            elif sim > heap[0][0]:
                heapq.heappushpop(heap, (sim, doc["id"], doc["text"]))

        # Sort descending by score
        heap.sort(key=lambda x: x[0], reverse=True)
        return [
            {"id": doc_id, "score": round(score, 4), "text": text}
            for score, doc_id, text in heap
        ]`,
        explanations: [
          {
            code: "dot = sum(a * b for a, b in zip(v1, v2))",
            explanation: "Calculates vector dot product across all embedding dimensions.",
          },
          {
            code: "if len(heap) < k: heapq.heappush(...) elif sim > heap[0][0]: heapq.heappushpop(...)",
            explanation: "Maintains size-K min-heap in O(N log K) time, discarding lower scores.",
          },
          {
            code: "heap.sort(key=lambda x: x[0], reverse=True)",
            explanation: "Sorts the top K elements in descending order of similarity score.",
          },
        ],
      },
    ],
    simulationNote: "Simulates vector cosine similarity and top-K heap retrieval in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Unit Vector Optimization",
      brief:
        "Explain why pre-normalizing all stored vectors upon insertion allows cosine similarity to be computed with a raw dot product alone.",
    },
    {
      level: "Modify",
      title: "Add Metadata Pre-Filtering",
      brief:
        "Add a metadata filter parameter (e.g. `category == 'billing'`) that skips non-matching documents before running vector cosine calculations.",
    },
    {
      level: "Build",
      title: "Hybrid Dense-Sparse Reranker",
      brief:
        "Implement Reciprocal Rank Fusion (RRF) combining dense vector similarity ranks with sparse keyword BM25 ranks.",
    },
    {
      level: "Think",
      title: "Curse of Dimensionality",
      brief:
        "Why does exact spatial search degrade in 1536-dimensional space, and how do approximate graphs like HNSW bypass exhaustive scanning?",
    },
  ],
  reflection: [
    "Why is Cosine Similarity the gold standard metric for high-dimensional text embeddings?",
    "How does a bounded min-heap optimize Top-K search compared to sorting all document scores?",
    "What architectural role does the vector database play in preventing LLM hallucinations in RAG systems?",
  ],
  techNotes: [
    {
      name: "HNSW (Hierarchical Navigable Small World)",
      kind: "Index Structure",
      note: "HNSW constructs a multi-layer geometric graph where top layers take long exploratory skips and bottom layers refine nearest neighbors, achieving O(log N) approximate search.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Search Vectors with Cosine Similarity and Top-K Ranking",
    brief:
      "Implement `search_vector_db`: given `query_vector` (list of float), `documents` (list of `{'id': str, 'embedding': list[float], 'text': str}`), and `k` (int). Compute Cosine Similarity between `query_vector` and each document's embedding: `dot(q, d) / (norm(q) * norm(d))`. If either norm is 0.0, similarity is 0.0. Return the top `k` documents with the highest similarity scores, sorted in descending order of score. Each result must be a dict: `{'id': str, 'score': float, 'text': str}` with `score` rounded to 4 decimal places.",
    functionName: "search_vector_db",
    signature:
      "def search_vector_db(query_vector: list[float], documents: list[dict], k: int) -> list[dict]:",
    starterCode: `import math
import heapq

def search_vector_db(query_vector: list[float], documents: list[dict], k: int) -> list[dict]:
    # Return list of {"id": str, "score": float, "text": str} sorted descending by score
    def cosine_sim(v1, v2):
        dot = sum(a * b for a, b in zip(v1, v2))
        n1 = math.sqrt(sum(a * a for a in v1))
        n2 = math.sqrt(sum(b * b for b in v2))
        if n1 == 0.0 or n2 == 0.0:
            return 0.0
        return dot / (n1 * n2)

    heap = []
    for doc in documents:
        sim = cosine_sim(query_vector, doc["embedding"])
        if len(heap) < k:
            heapq.heappush(heap, (sim, doc["id"], doc["text"]))
        elif sim > heap[0][0]:
            heapq.heappushpop(heap, (sim, doc["id"], doc["text"]))

    heap.sort(key=lambda x: x[0], reverse=True)
    return [{"id": d_id, "score": round(s, 4), "text": txt} for s, d_id, txt in heap]
`,
    javaSignature:
      "public static List<Map<String, Object>> searchVectorDb(List<Double> queryVector, List<Map<String, Object>> documents, int k)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static List<Map<String, Object>> searchVectorDb(
        List<Double> queryVector,
        List<Map<String, Object>> documents,
        int k
    ) {
        PriorityQueue<Object[]> heap = new PriorityQueue<>(Comparator.comparingDouble(a -> (double) a[0]));

        for (Map<String, Object> doc : documents) {
            String id = (String) doc.get("id");
            String text = (String) doc.get("text");
            List<Double> emb = (List<Double>) doc.get("embedding");

            double sim = cosineSim(queryVector, emb);
            if (heap.size() < k) {
                heap.offer(new Object[]{sim, id, text});
            } else if (sim > (double) heap.peek()[0]) {
                heap.poll();
                heap.offer(new Object[]{sim, id, text});
            }
        }

        List<Object[]> list = new ArrayList<>(heap);
        list.sort((a, b) -> Double.compare((double) b[0], (double) a[0]));

        List<Map<String, Object>> results = new ArrayList<>();
        for (Object[] item : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", item[1]);
            map.put("score", Math.round((double) item[0] * 10000.0) / 10000.0);
            map.put("text", item[2]);
            results.add(map);
        }
        return results;
    }

    private static double cosineSim(List<Double> v1, List<Double> v2) {
        double dot = 0.0;
        double n1 = 0.0;
        double n2 = 0.0;
        for (int i = 0; i < v1.size(); i++) {
            double a = v1.get(i);
            double b = v2.get(i);
            dot += a * b;
            n1 += a * a;
            n2 += b * b;
        }
        if (n1 == 0.0 || n2 == 0.0) return 0.0;
        return dot / (Math.sqrt(n1) * Math.sqrt(n2));
    }
}`,
    mermaid: `graph TD
    Start["search_vector_db(query, docs, k)"] --> LoopDocs["For each doc in documents"]
    LoopDocs --> CalcSim["sim = cosine_similarity(query, doc.embedding)"]
    CalcSim --> HeapCheck{"Heap size < k?"}
    HeapCheck -->|"Yes"| Push["heappush(heap, (sim, doc))"]
    HeapCheck -->|"No"| ScoreCheck{"sim > heap[0].score?"}
    ScoreCheck -->|"Yes"| PushPop["heappushpop(heap, (sim, doc))"]
    ScoreCheck -->|"No"| NextDoc["Skip doc"]
    Push --> NextDoc
    PushPop --> NextDoc
    NextDoc --> AnyMore{"More docs?"}
    AnyMore -->|"Yes"| LoopDocs
    AnyMore -->|"No"| SortHeap["Sort heap descending by score"]
    SortHeap --> FormatResult["Return formatted top-k results"]
`,
    hints: [
      "Compute dot product and Euclidean norms using math.sqrt().",
      "Handle norm == 0 by returning 0.0 to avoid ZeroDivisionError.",
      "Sort final top-K items descending by similarity score.",
    ],
    tests: [
      {
        name: "Identical vector yields 1.0 similarity",
        args: [
          [1.0, 0.0, 0.0],
          [
            { id: "D1", embedding: [1.0, 0.0, 0.0], text: "Exact match" },
            { id: "D2", embedding: [0.0, 1.0, 0.0], text: "Orthogonal" },
          ],
          1,
        ],
        expected: [{ id: "D1", score: 1.0, text: "Exact match" }],
      },
      {
        name: "Top-2 retrieval across 3 documents",
        args: [
          [1.0, 1.0],
          [
            { id: "D1", embedding: [1.0, 1.0], text: "Direction match" },
            { id: "D2", embedding: [1.0, 0.5], text: "Close match" },
            { id: "D3", embedding: [-1.0, -1.0], text: "Opposite" },
          ],
          2,
        ],
        expected: [
          { id: "D1", score: 1.0, text: "Direction match" },
          { id: "D2", score: 0.9487, text: "Close match" },
        ],
      },
    ],
    explanationPrompt:
      "Explain how your vector search engine implements cosine similarity, avoids division by zero, and uses a bounded min-heap to return the top-K nearest neighbors in O(N log K) time.",
  },
};

// ----------------------------------------------------------------------------
// Case 53: Google Sheets Real-Time Collaborative CRDTs
// ----------------------------------------------------------------------------
export const case53_googleSheetsCRDT = {
  id: "cs-sheets-crdt-053",
  slug: "google-sheets-crdt-collaboration",
  index: "53",
  title:
    "How Does a Real-Time Collaborative Spreadsheet Resolve Concurrent Edits Using CRDTs and Fractional Indexing?",
  shortTitle: "Collaborative Spreadsheets (CRDT)",
  category: "Advanced Distributed Architectures",
  subcategory: "Conflict-Free Replicated Data Types & Collaboration",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "When multiple users type into Google Sheets or Figma simultaneously without a central locking coordinator, conflicting concurrent edits occur. Discover how Conflict-Free Replicated Data Types (CRDTs) guarantee mathematical eventual consistency using Last-Write-Wins (LWW) element sets and fractional indexing for row and column insertions.",
  learningObjectives: [
    "Explain mathematical properties of CRDTs: Commutativity, Associativity, and Idempotence.",
    "Implement a Last-Write-Wins (LWW) Element-Set register for cell content and formulas.",
    "Model fractional indexing for conflict-free row/column insertions between existing items.",
    "Resolve concurrent cell edits across distributed offline replicas without merge conflicts.",
  ],
  prerequisites: [
    "Distributed state replication and eventual consistency",
    "Lamport timestamps and hybrid logical clocks (HLC)",
    "Set theory and lattice partial orderings",
  ],
  engineeringConcepts: [
    "LWW-Element-Set CRDT",
    "Fractional Position Indexing",
    "Commutative State Merging",
    "Lamport Logical Clocks",
    "Distributed Conflict-Free Convergence",
  ],
  technologies: ["Python", "Java", "CRDT", "Automerge", "Yjs", "WebSockets"],
  tech: ["CRDT", "Concurrency", "Real-Time Collaboration"],
  tags: ["crdt", "collaboration", "google-sheets", "concurrency", "advanced"],
  glossary: [
    {
      term: "LWW-Element-Set CRDT",
      plainDefinition:
        "A conflict-free replicated data type that resolves concurrent updates to a value by picking the update with the highest timestamp.",
    },
    {
      term: "Fractional Position Indexing",
      plainDefinition:
        "Generating position keys between two items (e.g. between 1.0 and 2.0 -> 1.5) so rows can be inserted indefinitely without renumbering.",
    },
    {
      term: "Commutative State Merging",
      plainDefinition:
        "A merge function where `merge(A, B) == merge(B, A)` so network packet arrival order does not affect final spreadsheet state.",
    },
    {
      term: "Lamport Logical Clocks",
      plainDefinition:
        "Monotonically increasing counter tuples `(timestamp, client_id)` that break ties when physical wall clocks match.",
    },
    {
      term: "Distributed Conflict-Free Convergence",
      plainDefinition:
        "The mathematical guarantee that all replicas that receive the same updates will reach identical state automatically.",
    },
  ],
  primers: [
    {
      concept: "Why Operational Transformation (OT) Was Replaced by CRDTs",
      minutes: 4,
      definition:
        "Google Docs originally used Operational Transformation (OT), which requires a single central server to order all edits sequentially. CRDTs work peer-to-peer and offline: replicas can sync directly in any order and converge mathematically.",
      whyNeeded:
        "Enables offline mobile editing and decentralized real-time collaboration without a centralized bottleneck.",
      analogy:
        "Two people adding coins to separate piggy banks: when combined, the total is identical regardless of who poured their coins in first.",
      tinyExample:
        "def merge_cell(c1, c2):\n    return c1 if (c1['timestamp'], c1['client_id']) > (c2['timestamp'], c2['client_id']) else c2",
    },
    {
      concept: "Fractional Indexing for Insertions",
      minutes: 4,
      definition:
        "If Row 1 has position 1.0 and Row 2 has position 2.0, inserting a row in between assigns position (1.0 + 2.0) / 2 = 1.5. Inserting another between 1.0 and 1.5 yields 1.25. No other rows need to be shifted.",
      whyNeeded:
        "Shifting row indexes (Row 2 -> Row 3) causes race conditions and massive concurrent update storms.",
      analogy:
        "Dewey Decimal library system: book 500.5 sits between book 500 and book 501 without moving the entire library.",
      tinyExample: "new_pos = (pos_before + pos_after) / 2.0",
    },
  ],
  discover: {
    situation:
      "A financial modeling team opened a collaborative budget spreadsheet during a board meeting. Two analysts on different laptops simultaneously edited cell C12: Alice typed '=SUM(A1:A10)' while Bob typed '45,000'. The spreadsheet used naive last-HTTP-request overwriting. Network lag caused Alice's formula to overwrite Bob's change 3 seconds later, and Bob's auto-save to overwrite Alice 5 seconds after, causing formula corruption.",
    humanFlow: [
      "Alice edits cell C12 offline on an airplane.",
      "Bob edits cell C12 in the New York office.",
      "Alice connects to Wi-Fi; her laptop transmits local CRDT mutation operations.",
      "The CRDT merge function compares Lamport timestamps `(clock, client_id)` deterministically.",
      "Both Alice's and Bob's spreadsheets converge to the exact same cell state without an error dialogue.",
    ],
    question:
      "How do you design a collaborative spreadsheet engine that converges concurrent edits across distributed replicas using CRDTs and fractional indexing?",
    whyItExists: [
      "Real-time collaboration cannot wait for network round-trips before rendering keystrokes locally.",
      "Offline-first apps require seamless reconciliation when reconnecting after hours of disconnection.",
      "Mathematical convergence eliminates data corruption without human manual merge conflicts.",
    ],
  },
  understand: {
    overview:
      "The Collaborative Spreadsheet CRDT models cells as a map of coordinates `(row_pos, col_pos)` to an LWW-Register `(value, timestamp, client_id)`. Row insertions generate fractional position keys between adjacent rows. When replicas exchange states, a Commutative Merge function evaluates each cell's register, keeping the operation with the highest `(timestamp, client_id)` tuple.",
    components: [
      {
        name: "LWW Cell Register",
        whatIsIt: "State container for a single cell holding value, Lamport clock, and client ID.",
        whyItExists: "Resolves concurrent writes to the same cell deterministically.",
        whatItDoes: "Overwrites cell value only if incoming update has higher logical timestamp.",
      },
      {
        name: "Fractional Position Generator",
        whatIsIt: "Algorithm computing real numbers or string keys between two boundary points.",
        whyItExists: "Enables arbitrary row/column insertions without index shifting.",
        whatItDoes: "Calculates midpoint position: `(prev + next) / 2.0`.",
      },
      {
        name: "CRDT State Synchronizer",
        whatIsIt: "Communication layer broadcasting and merging state vectors.",
        whyItExists: "Propagates local edits to remote peer replicas.",
        whatItDoes: "Merges remote state maps using union and maximum timestamp rules.",
      },
      {
        name: "Spreadsheet View Projector",
        whatIsIt: "UI renderer sorting fractional row keys into standard 1, 2, 3 row indexes.",
        whyItExists: "Translates internal fractional coordinates into standard grid displays.",
        whatItDoes: "Sorts active rows by position key for display.",
      },
    ],
    analogy: {
      title: "Shared Kitchen Whiteboard with Signed Post-It Notes",
      everyday: [
        "Roommates share a chore board. Instead of erasing each other's chores, each person writes tasks on a Post-It note with their name and exact date-timestamp.",
        "If two roommates post a chore for 'Clean Dishes', the note with the newer timestamp wins.",
        "If they both want to slip a chore between Task 1 and Task 2, they label it Task '1.5'.",
      ],
      technical: [
        "Post-It note with timestamp corresponds to LWW Cell Register.",
        "Labeling task '1.5' corresponds to Fractional Indexing.",
        "Consolidated chore list corresponds to the CRDT State Projection.",
      ],
    },
    flow: [
      "User edits cell C at local replica: generates update with `(value, local_clock, client_id)`.",
      "Replica applies update locally in 0ms (optimistic instant UI rendering).",
      "Replica broadcasts update payload to remote peers.",
      "Remote peer receives update and runs `merge(local_state, incoming_update)`.",
      "Merge rule: if `(incoming.timestamp, incoming.client) > (local.timestamp, local.client)`, adopt incoming value.",
      "Both replicas now hold identical state.",
    ],
  },
  concepts: [
    {
      id: "concept-lww-register",
      name: "Last-Write-Wins (LWW) Register",
      difficulty: "Advanced",
      simpleDefinition:
        "A CRDT register that stores a value alongside a timestamp. The update with the highest timestamp always wins.",
      whyItExists:
        "Guarantees that regardless of which update reaches a replica first, all replicas choose the same final value.",
      realWorldAnalogy:
        "Looking at two clocks: trusting the one that received the most recent time sync.",
      technicalExplanation:
        "LWW is a semi-lattice where join(a, b) = max(a, b) ordered by (timestamp, client_id). Commutative: max(a,b) == max(b,a).",
      caseApplication: "Resolves concurrent edits to individual spreadsheet cells.",
      commonMistakes: [
        "Using physical machine wall clocks without tie-breaking client IDs, causing silent random overwrites on timestamp collision.",
        "Treating deletes as missing keys rather than explicit tombstone markers.",
      ],
      practice: [
        "Why must client_id be included in the tie-breaker comparison when timestamps match?",
        "Prove that LWW register merging is associative: merge(merge(A, B), C) == merge(A, merge(B, C)).",
      ],
    },
    {
      id: "concept-fractional-index",
      name: "Fractional Indexing for Dense Ordering",
      difficulty: "Advanced",
      simpleDefinition:
        "Assigning ordered items real-number position coordinates so a new item can always be placed between two existing items without reindexing.",
      whyItExists:
        "In collaborative lists, integer re-indexing (shifting items 3..N down by 1) causes massive distributed edit conflicts.",
      realWorldAnalogy: "Inserting page 14A and 14B between page 14 and 15 in a printed manual.",
      technicalExplanation:
        "Given positions P1 < P2, new position = (P1 + P2) / 2.0. Arbitrary insertions are supported indefinitely using arbitrary-precision decimals or strings.",
      caseApplication:
        "Used for row/column insertions in Google Sheets, Figma layer trees, and Notion block lists.",
      commonMistakes: [
        "Running out of 64-bit float precision after 53 consecutive midpoint insertions at the exact same location.",
        "Renumbering positions globally across distributed clients.",
      ],
      practice: [
        "If Row A is at 10.0 and Row B is at 20.0, what is the position of an inserted row?",
        "How do fractional indexing libraries (like Figma's fractional-indexing string system) achieve infinite insertion depth without float precision limits?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Collaborative Spreadsheet CRDT Engine showing LWW cell registers, fractional indexing, and peer state convergence.",
    levels: [
      {
        title: "Level 1: Distributed Peer Convergence",
        description: "Two replicas exchanging state mutations and converging to identical state.",
        mermaid: `graph TD
    ReplicaA["Replica Alice (Client A)"] -->|"Apply Local Edit (0ms)"| StateA["Local CRDT State A"]
    ReplicaB["Replica Bob (Client B)"] -->|"Apply Local Edit (0ms)"| StateB["Local CRDT State B"]
    StateA -->|"Sync Delta"| MergeB["Merge on Replica B: max((ts, id))"]
    StateB -->|"Sync Delta"| MergeA["Merge on Replica A: max((ts, id))"]
    MergeA --> Final["Identical Converged State"]
    MergeB --> Final
`,
      },
      {
        title: "Level 2: LWW Cell Register Structure",
        description: "Tuple comparison for conflict-free resolution.",
        mermaid: `graph TD
    Cell["Cell C12"] --> Val["Value: '=SUM(A1:A10)'"]
    Cell --> TS["Timestamp: 1045"]
    Cell --> Client["ClientID: 'client_alice'"]
    Compare["Incoming vs Local"] --> CheckTS{"incoming.ts > local.ts?"}
    CheckTS -->|"Yes"| Adopt["Adopt Incoming Value"]
    CheckTS -->|"No"| TieCheck{"incoming.ts == local.ts?"}
    TieCheck -->|"incoming.client > local.client"| Adopt
    TieCheck -->|"No"| KeepLocal["Retain Local Value"]
`,
      },
      {
        title: "Level 3: Fractional Indexing for Row Insertion",
        description: "Inserting rows without shifting existing indices.",
        mermaid: `graph TD
    Row1["Row 1 (Pos: 1.0)"] --> Midpoint["Insert between Row 1 and Row 2"]
    Row2["Row 2 (Pos: 2.0)"] --> Midpoint
    Midpoint --> NewRow["New Row (Pos: (1.0 + 2.0) / 2 = 1.5)"]
    NewRow --> Sort["Display Order: 1.0 -> 1.5 -> 2.0"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "LWW-Element-Set CRDT over Centralized Operational Transformation",
      what: "Use Last-Write-Wins Conflict-Free Replicated Data Types for spreadsheet state rather than centralized Operational Transformation.",
      why: "CRDTs support true offline editing and peer-to-peer sync without requiring a single centralized coordination server.",
      problemSolved:
        "Allows mobile users to edit spreadsheets on airplanes or offline without locking the document.",
      withoutIt:
        "Offline users cannot edit without risking total file divergence or destructive overwrite conflicts.",
      alternatives: [
        "Centralized Operational Transformation (Google Docs 2010 model).",
        "Pessimistic cell-level distributed locking.",
      ],
      tradeoff:
        "If two users edit the same cell at the exact same millisecond, one edit deterministically wins and overwrites the other (no character-level merge inside a single cell).",
    },
    {
      title: "Fractional Position Coordinates for Rows and Columns",
      what: "Represent row/column positions as floating-point midpoints rather than sequential integer arrays.",
      why: "Inserting a row between index 4 and 5 does not require mutating or shifting the indices of rows 6 through 10,000.",
      problemSolved:
        "Eliminates race conditions where concurrent row insertions corrupt cell references across peers.",
      withoutIt:
        "Inserting row 1 on Alice's client invalidates all of Bob's row references on Bob's client.",
      alternatives: [
        "Integer arrays with distributed shift broadcast updates.",
        "Linked list nodes with UUID parent pointers.",
      ],
      tradeoff:
        "Requires periodic rebalancing if thousands of consecutive insertions occur at the exact same boundary.",
    },
  ],
  implementation: {
    behaviour:
      "A SpreadsheetCRDT class that stores cell registers, generates fractional indices for row insertions, and merges remote states commutatively.",
    algorithm: [
      "1. set_cell(coord, value, timestamp, client_id):",
      "   Update cells[coord] with (value, timestamp, client_id) if incoming (timestamp, client_id) > existing.",
      "2. insert_row_between(pos_before, pos_after):",
      "   Return (pos_before + pos_after) / 2.0.",
      "3. merge(remote_state):",
      "   For coord, reg in remote_state.cells.items():",
      "     if coord not in local.cells or (reg.ts, reg.client) > (local[coord].ts, local[coord].client):",
      "       local.cells[coord] = reg.",
      "4. get_grid(): sort active rows by position and format cells.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Centralized Overwrite Grid",
        detail:
          "Latest HTTP request blindly overwrites the cell without timestamps or tie-breaking.",
      },
      {
        level: "Level 1",
        title: "LWW Cell Register",
        detail:
          "Adds Lamport clocks and client IDs to deterministically resolve cell update conflicts.",
      },
      {
        level: "Level 2",
        title: "Fractional Row Slicer",
        detail:
          "Supports conflict-free row/column insertions using midpoint floating-point indices.",
      },
      {
        level: "Level 3",
        title: "Full Automerge / Yjs Replicated Document",
        detail:
          "Fractional indexing strings (B-Tree), character-level text CRDTs, and state vector delta compression.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "sheets_crdt.py",
        code: `class SpreadsheetCRDT:
    def __init__(self, client_id: str) -> None:
        self.client_id = client_id
        # cells: {cell_key: {"value": val, "ts": int, "client": str}}
        self.cells: dict[str, dict] = {}
        self.clock = 0

    def update_cell(self, cell_id: str, value: str) -> dict:
        self.clock += 1
        reg = {"value": value, "ts": self.clock, "client": self.client_id}
        self.cells[cell_id] = reg
        return reg

    def merge(self, remote_cells: dict[str, dict]) -> None:
        for cell_id, r_reg in remote_cells.items():
            l_reg = self.cells.get(cell_id)
            if l_reg is None:
                self.cells[cell_id] = r_reg
            else:
                r_key = (r_reg["ts"], r_reg["client"])
                l_key = (l_reg["ts"], l_reg["client"])
                if r_key > l_key:
                    self.cells[cell_id] = r_reg

    @staticmethod
    def insert_between(pos1: float, pos2: float) -> float:
        return (pos1 + pos2) / 2.0`,
        explanations: [
          {
            code: 'r_key = (r_reg["ts"], r_reg["client"])',
            explanation:
              "Constructs tuple for deterministic Lamport comparison with client ID tie-breaker.",
          },
          {
            code: "if r_key > l_key: self.cells[cell_id] = r_reg",
            explanation: "Implements commutative LWW register join operation.",
          },
          {
            code: "return (pos1 + pos2) / 2.0",
            explanation: "Computes fractional index midpoint for conflict-free row insertion.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates collaborative spreadsheet CRDT state merging and fractional indexing in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Commutativity Proof",
      brief:
        "Explain why `merge(StateA, StateB)` produces the exact same final dictionary as `merge(StateB, StateA)`.",
    },
    {
      level: "Modify",
      title: "Add Cell Deletion Tomestones",
      brief:
        "Modify the LWW register to support an explicit `is_deleted: bool` tombstone flag so deleting a cell synchronizes across peers.",
    },
    {
      level: "Build",
      title: "Multi-Client Mesh Sync Simulator",
      brief:
        "Simulate 3 clients editing different cells while partitioned offline, then exchange states pairwise and assert all 3 clients reach identical state.",
    },
    {
      level: "Think",
      title: "Formula Dependency DAG Cycles",
      brief:
        "If Alice sets A1 = B1 and Bob sets B1 = A1 concurrently, how does the formula calculation engine detect the cycle without freezing?",
    },
  ],
  reflection: [
    "Why does the mathematical property of commutativity make CRDTs resilient to out-of-order network delivery?",
    "How does fractional indexing eliminate the distributed shifting problem for collaborative lists?",
    "Why must distributed systems combine logical clock timestamps with client IDs for deterministic conflict resolution?",
  ],
  techNotes: [
    {
      name: "Yjs and Automerge",
      kind: "Industry Libraries",
      note: "Modern collaborative apps (Figma, Notion, JupyterLab) use CRDT engines like Yjs and Automerge, which compact operation logs into binary state vectors for sub-millisecond sync.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Merge Collaborative Spreadsheet CRDTs and Insert Fractional Rows",
    brief:
      "Implement `reconcile_spreadsheet_crdt`: given `local_cells` (dict of cell_id -> `{'value': str, 'ts': int, 'client': str}`), `remote_cells` (dict of same format), and `row_insertions` (list of `(pos_before: float, pos_after: float)`). 1. Merge cells: for each cell, keep the register with higher `(ts, client)`. 2. For each row insertion, compute midpoint `(pos_before + pos_after) / 2.0`. Return a dict: `{'merged_cells': dict, 'inserted_positions': list[float]}`. Merged cells should map `cell_id -> value`.",
    functionName: "reconcile_spreadsheet_crdt",
    signature:
      "def reconcile_spreadsheet_crdt(local_cells: dict, remote_cells: dict, row_insertions: list[tuple[float, float]]) -> dict:",
    starterCode: `def reconcile_spreadsheet_crdt(local_cells: dict, remote_cells: dict, row_insertions: list[tuple[float, float]]) -> dict:
    # local_cells, remote_cells: {cell_id: {"value": str, "ts": int, "client": str}}
    # row_insertions: list of (pos_before, pos_after)
    # Return {"merged_cells": {cell_id: final_value}, "inserted_positions": list[float]}
    all_keys = set(local_cells.keys()) | set(remote_cells.keys())
    merged = {}

    for c_id in sorted(all_keys):
        l = local_cells.get(c_id)
        r = remote_cells.get(c_id)
        if l is None:
            merged[c_id] = r["value"]
        elif r is None:
            merged[c_id] = l["value"]
        else:
            l_key = (l["ts"], l["client"])
            r_key = (r["ts"], r["client"])
            winner = r if r_key > l_key else l
            merged[c_id] = winner["value"]

    positions = [(p1 + p2) / 2.0 for p1, p2 in row_insertions]
    return {"merged_cells": merged, "inserted_positions": positions}
`,
    javaSignature:
      "public static Map<String, Object> reconcileSpreadsheetCrdt(Map<String, Map<String, Object>> localCells, Map<String, Map<String, Object>> remoteCells, List<List<Double>> rowInsertions)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> reconcileSpreadsheetCrdt(
        Map<String, Map<String, Object>> localCells,
        Map<String, Map<String, Object>> remoteCells,
        List<List<Double>> rowInsertions
    ) {
        Set<String> allKeys = new TreeSet<>(localCells.keySet());
        allKeys.addAll(remoteCells.keySet());

        Map<String, String> merged = new LinkedHashMap<>();

        for (String cId : allKeys) {
            Map<String, Object> l = localCells.get(cId);
            Map<String, Object> r = remoteCells.get(cId);

            if (l == null) {
                merged.put(cId, (String) r.get("value"));
            } else if (r == null) {
                merged.put(cId, (String) l.get("value"));
            } else {
                int lTs = ((Number) l.get("ts")).intValue();
                int rTs = ((Number) r.get("ts")).intValue();
                String lCli = (String) l.get("client");
                String rCli = (String) r.get("client");

                boolean rWins;
                if (rTs != lTs) {
                    rWins = rTs > lTs;
                } else {
                    rWins = rCli.compareTo(lCli) > 0;
                }

                merged.put(cId, (String) (rWins ? r.get("value") : l.get("value")));
            }
        }

        List<Double> positions = new ArrayList<>();
        for (List<Double> pair : rowInsertions) {
            double p1 = pair.get(0);
            double p2 = pair.get(1);
            positions.add((p1 + p2) / 2.0);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("merged_cells", merged);
        result.put("inserted_positions", positions);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["reconcile_spreadsheet_crdt(...)"] --> UnionKeys["Union all cell keys from local and remote"]
    UnionKeys --> LoopKeys["For each cell_id in all_keys"]
    LoopKeys --> PresentCheck{"Present in both?"}
    PresentCheck -->|"Local only"| TakeL["Keep local value"]
    PresentCheck -->|"Remote only"| TakeR["Keep remote value"]
    PresentCheck -->|"Both"| CompareTuple{"Compare (ts, client)"}
    CompareTuple -->|"Remote > Local"| TakeR
    CompareTuple -->|"Local >= Remote"| TakeL
    TakeL --> NextKey{"More keys?"}
    TakeR --> NextKey
    NextKey -->|"Yes"| LoopKeys
    NextKey -->|"No"| CalcPos["Calculate (p1 + p2) / 2.0 for row_insertions"]
    CalcPos --> Return["Return merged_cells and inserted_positions"]
`,
    hints: [
      "Compare registers using tuple (ts, client) to resolve timestamp ties deterministically.",
      "Calculate midpoint as (pos1 + pos2) / 2.0.",
      "Sort keys for deterministic output.",
    ],
    tests: [
      {
        name: "Higher timestamp wins concurrent cell conflict",
        args: [
          { C1: { value: "Old", ts: 1, client: "Alice" } },
          { C1: { value: "New", ts: 2, client: "Bob" } },
          [[1.0, 2.0]],
        ],
        expected: {
          merged_cells: { C1: "New" },
          inserted_positions: [1.5],
        },
      },
      {
        name: "Timestamp tie resolved by client ID alphabetical order",
        args: [
          { A1: { value: "AliceValue", ts: 5, client: "Alice" } },
          { A1: { value: "BobValue", ts: 5, client: "Bob" } },
          [[10.0, 11.0]],
        ],
        expected: {
          merged_cells: { A1: "BobValue" }, // "Bob" > "Alice"
          inserted_positions: [10.5],
        },
      },
    ],
    explanationPrompt:
      "Explain how your spreadsheet reconciliation applies Last-Write-Wins CRDT register rules to achieve eventual consistency and uses fractional indexing for conflict-free row insertions.",
  },
};

// ----------------------------------------------------------------------------
// Case 54: Notion Offline-First Sync & Conflict Resolution
// ----------------------------------------------------------------------------
export const case54_notionSync = {
  id: "cs-notion-sync-054",
  slug: "notion-offline-first-sync",
  index: "54",
  title:
    "How Does an Offline-First Block-Based Document Editor Synchronize Mutations and Detect Conflicts with Merkle Trees?",
  shortTitle: "Offline-First Document Sync",
  category: "Advanced Distributed Architectures",
  subcategory: "Offline-First Storage & Merkle Tree Sync",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "Productivity tools like Notion and Linear operate offline using local SQLite stores, queuing mutations, and reconciling state on reconnect. Discover how hierarchical block-based document models sync changes, detect conflicting concurrent updates via Vector Clocks, and verify full document integrity with Merkle trees.",
  learningObjectives: [
    "Design an offline-first block document model with local SQLite mutation journals.",
    "Implement Vector Clocks to classify concurrent, causal, and conflicting state changes.",
    "Reconcile document state trees using Merkle hash comparison to identify divergent blocks in O(log N).",
    "Structure optimistic client UI updates with automated rollback on server rejection.",
  ],
  prerequisites: [
    "Causality and logical time (Vector Clocks / Lamport timestamps)",
    "Cryptographic data structures (Merkle trees, hash pointers)",
    "Offline-first client architecture (IndexedDB / SQLite sync queues)",
  ],
  engineeringConcepts: [
    "Vector Clock Causality",
    "Merkle Tree State Reconciliation",
    "Offline Mutation Queue",
    "Block-Based Document Graph",
    "Optimistic UI Reconciliation",
  ],
  technologies: ["Python", "Java", "SQLite", "Merkle Trees", "Vector Clocks"],
  tech: ["Offline-First", "Merkle Tree", "Sync Engine"],
  tags: ["notion", "offline-first", "sync", "merkle", "advanced"],
  glossary: [
    {
      term: "Vector Clock Causality",
      plainDefinition:
        "An array of logical clocks across participating devices indicating whether event A happened before event B or if they occurred concurrently.",
    },
    {
      term: "Merkle Tree State Reconciliation",
      plainDefinition:
        "Comparing root hashes of two document trees; if identical, both devices match. If different, traverse child hashes to find exact modified blocks in O(log N).",
    },
    {
      term: "Offline Mutation Queue",
      plainDefinition:
        "A durable local queue storing user actions performed without internet access, awaiting server sync on reconnect.",
    },
    {
      term: "Block-Based Document Graph",
      plainDefinition:
        "Representing documents as trees of small atomic blocks (paragraphs, headers, images) rather than a single giant text file.",
    },
    {
      term: "Optimistic UI Reconciliation",
      plainDefinition:
        "Rendering edits on screen immediately in 0ms, rolling back only in the rare case that the server rejects the mutation.",
    },
  ],
  primers: [
    {
      concept: "Vector Clocks: Causal vs Concurrent",
      minutes: 4,
      definition:
        "Given two vector clocks V1 and V2: V1 happened-before V2 if every element V1[i] <= V2[i] and at least one is strictly less. If neither is strictly smaller, the edits happened concurrently (conflict detected!).",
      whyNeeded:
        "Allows systems to mathematically identify whether an edit is a continuation of previous work or an independent concurrent conflict.",
      analogy:
        "Comparing two runners' lap times across every lap: if runner A was ahead on all laps, A is clearly ahead. If A was faster on lap 1 and B on lap 2, they crossed paths.",
      tinyExample: "is_causal = all(v1[k] <= v2[k] for k in v1) and any(v1[k] < v2[k] for k in v1)",
    },
    {
      concept: "Merkle Tree Hash Verification",
      minutes: 4,
      definition:
        "A parent hash is `sha256(child1_hash + child2_hash)`. If two devices compare root hashes and they match, the entire 10,000-block document is identical in 1 comparison.",
      whyNeeded:
        "Comparing thousands of blocks over mobile network exhausts bandwidth; Merkle trees isolate differences in O(log N).",
      analogy:
        "Comparing the seal on a cargo container: if the seal is unbroken, you don't need to open and inspect every crate inside.",
      tinyExample: "parent_hash = sha256(left_hash + right_hash)",
    },
  ],
  discover: {
    situation:
      "A project manager drafted a product roadmap in an offline workspace on a cross-country flight. Concurrently, an engineer edited the same document from the office. Upon landing, the mobile app attempted a naive full-document overwrite, destroying 3 hours of the engineer's work. The team lost critical sprint specs because the sync engine lacked vector clocks and Merkle diffing.",
    humanFlow: [
      "User edits paragraph block while offline.",
      "Local engine increments local vector clock and stores mutation in local SQLite journal.",
      "UI updates immediately in 0ms.",
      "Device connects to internet and sends sync ping with its Merkle root hash and vector clock.",
      "Server compares Merkle hashes to pinpoint exact modified block IDs.",
      "Vector clock analysis detects concurrent edits on block 42; server merges non-conflicting blocks and prompts for block 42 resolution.",
    ],
    question:
      "How do you design an offline-first document sync engine that detects concurrent conflicts using Vector Clocks and identifies divergent blocks using Merkle trees?",
    whyItExists: [
      "Users expect productivity software to work flawlessly offline with zero data loss on reconnection.",
      "Syncing large documents over mobile networks requires O(log N) differential data exchange.",
      "Vector clocks provide rigorous mathematical causality tracking across decentralized devices.",
    ],
  },
  understand: {
    overview:
      "The Offline Sync Engine represents documents as Block Trees (each block has an ID, content, and hash). Each client maintains a Vector Clock `{'device_A': count_A, 'device_B': count_B}`. An Offline Queue captures local mutations. On reconnect, clients compare Merkle tree hashes with the server to find divergent nodes, applying Vector Clock causality rules to merge changes.",
    components: [
      {
        name: "Local Mutation Journal",
        whatIsIt: "Append-only storage recording un-synced user actions.",
        whyItExists: "Persists edits made during network disconnects across app restarts.",
        whatItDoes: "Stores block mutation operations with local vector clocks.",
      },
      {
        name: "Vector Clock Causality Evaluator",
        whatIsIt: "Clock comparator assessing causality between two state vectors.",
        whyItExists: "Distinguishes sequential edits from concurrent conflicts.",
        whatItDoes: "Classifies relationship as ANCESTOR, DESCENDANT, or CONCURRENT.",
      },
      {
        name: "Merkle Tree Diff Engine",
        whatIsIt: "Binary hash tree built over document blocks.",
        whyItExists: "Pinpoints divergent blocks across client and server in O(log N).",
        whatItDoes: "Compares root hash and traverses mismatched child branches.",
      },
      {
        name: "Block Reconciler",
        whatIsIt: "Resolution engine integrating incoming mutations into local document state.",
        whyItExists: "Applies non-conflicting updates and flags concurrent conflicts.",
        whatItDoes: "Updates block text and updates local Merkle tree.",
      },
    ],
    analogy: {
      title: "Git Commit Graphs and File Tree Hashes",
      everyday: [
        "In Git, every commit has a SHA hash representing the tree of files.",
        "If you and a colleague work on separate branches without internet, Git tracks your parent commit history.",
        "When you run `git pull`, Git compares tree hashes, automatically fast-forwards clean edits, and flags merge conflicts only where both people edited the same line.",
      ],
      technical: [
        "Git tree hashes correspond to Document Merkle Trees.",
        "Commit parent history corresponds to Vector Clock Causality.",
        "Git merge conflict corresponds to Concurrent Vector Clock Resolution.",
      ],
    },
    flow: [
      "Device A and Device B start in sync: shared state and shared clock `{'A': 1, 'B': 1}`.",
      "Device A edits block 1 offline: increments clock to `{'A': 2, 'B': 1}`.",
      "Device B edits block 2 offline: increments clock to `{'A': 1, 'B': 2}`.",
      "Both connect to server: compare vector clocks.",
      "Since neither clock dominates the other, edits are CONCURRENT.",
      "Merkle tree diff reveals: Block 1 changed on A, Block 2 changed on B. No collision!",
      "Server merges both blocks: resulting clock is `{'A': 2, 'B': 2}`.",
    ],
  },
  concepts: [
    {
      id: "concept-vector-clock-eval",
      name: "Vector Clock Causality Ordering",
      difficulty: "Advanced",
      simpleDefinition:
        "Tracking a dictionary of counters (one per device) to determine whether two events are causally related or concurrent.",
      whyItExists:
        "Single timestamps cannot distinguish independent parallel edits from sequential updates across distributed devices.",
      realWorldAnalogy:
        "A group passport stamp collection: seeing who visited which countries before or after each other.",
      technicalExplanation:
        "V1 < V2 (V1 caused V2) iff for all i, V1[i] <= V2[i] and exists j where V1[j] < V2[j]. If neither V1 <= V2 nor V2 <= V1, they are CONCURRENT.",
      caseApplication:
        "Determines whether an incoming block edit safely overwrites local state or requires conflict resolution.",
      commonMistakes: [
        "Confusing wall clock time with causal logical time.",
        "Missing keys for new devices, causing KeyError crashes.",
      ],
      practice: [
        "Classify V1={'A': 2, 'B': 1} vs V2={'A': 2, 'B': 3}. (V1 < V2, causal).",
        "Classify V1={'A': 3, 'B': 1} vs V2={'A': 2, 'B': 2}. (Concurrent!).",
      ],
    },
    {
      id: "concept-merkle-diff",
      name: "Merkle Tree Tree-Diffing",
      difficulty: "Advanced",
      simpleDefinition:
        "A tree where leaf nodes are block hashes and parent nodes are hashes of their children.",
      whyItExists:
        "Allows two distributed servers to verify whether their datasets match with a single 32-byte hash comparison.",
      realWorldAnalogy:
        "Checking the top-level checksum on a ZIP archive before extracting 10,000 files.",
      technicalExplanation:
        "Root match = 0 bytes transmitted. Root mismatch = traverse mismatched child hashes recursively to locate the differing leaf in O(log N).",
      caseApplication:
        "Used by Git, Bitcoin, Cassandra, and Notion for bandwidth-efficient state reconciliation.",
      commonMistakes: [
        "Rebuilding the entire Merkle tree from scratch on every keystroke rather than updating hashes along the modified branch.",
        "Unsorted child hash concatenation causing non-deterministic parent hashes.",
      ],
      practice: [
        "How many hash comparisons are needed to find 1 modified block in an 8-block Merkle tree? (3 comparisons).",
        "Why must child hashes be sorted or deterministically ordered before hashing?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Notion Offline-First Sync Engine showing local mutation journals, vector clocks, and Merkle tree reconciliation.",
    levels: [
      {
        title: "Level 1: Offline Sync Workflow",
        description: "Local mutation capture and remote synchronization.",
        mermaid: `graph TD
    ClientUI["Client Editor UI"] -->|"0ms Instant Edit"| LocalDB["Local SQLite Store"]
    LocalDB -->|"Record Mutation"| OfflineQueue["Offline Mutation Queue"]
    OfflineQueue -->|"On Reconnect: Sync Ping"| SyncGateway["Sync Gateway"]
    SyncGateway -->|"Merkle Root Compare"| DiffEngine["Merkle Diff & Clock Engine"]
    DiffEngine -->|"Reconciled State"| ServerDB["Server Document Store"]
`,
      },
      {
        title: "Level 2: Merkle Tree Tree Hierarchy",
        description: "Root, branch, and block leaf hashes.",
        mermaid: `graph TD
    Root["Root Hash: H(H12 + H34)"] --> H12["Branch Hash: H(H1 + H2)"]
    Root --> H34["Branch Hash: H(H3 + H4)"]
    H12 --> H1["Leaf H1: H(Block 1)"]
    H12 --> H2["Leaf H2: H(Block 2)"]
    H34 --> H3["Leaf H3: H(Block 3)"]
    H34 --> H4["Leaf H4: H(Block 4)"]
`,
      },
      {
        title: "Level 3: Vector Clock Causality Decision",
        description: "Evaluating causal dominance versus concurrency.",
        mermaid: `graph TD
    Clocks["Compare Clocks V1 and V2"] --> CheckDom1{"All V1[i] <= V2[i] and any < ?"}
    CheckDom1 -->|"Yes"| V1BeforeV2["V1 happened before V2 (Fast-forward)"]
    CheckDom1 -->|"No"| CheckDom2{"All V2[i] <= V1[i] and any < ?"}
    CheckDom2 -->|"Yes"| V2BeforeV1["V2 happened before V1 (Ignore / Already seen)"]
    CheckDom2 -->|"No"| Concurrent["CONCURRENT (Conflict! Requires block merge)"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Block-Based Granularity over Monolithic Document Text",
      what: "Model documents as collections of independent blocks (paragraphs, headers, checklists) with individual IDs rather than a single string.",
      why: "Two users editing different paragraphs in the same document do not conflict; edits merge automatically at the block level.",
      problemSolved: "Eliminates 95% of user-visible merge conflicts in collaborative writing.",
      withoutIt:
        "Editing paragraph 10 while someone edits paragraph 1 causes a full document merge conflict.",
      alternatives: [
        "Monolithic character-level CRDT (RGA/Fugue).",
        "Whole-file checkout locking.",
      ],
      tradeoff:
        "Requires managing block tree relationships and maintaining parent-child references.",
    },
    {
      title: "Merkle Tree Hash Reconciliation over Full Block Polling",
      what: "Exchange Merkle tree hashes to identify modified blocks rather than transmitting all document blocks over the network on reconnect.",
      why: "A 500-page document might contain 10,000 blocks; transmitting 10,000 blocks on poor mobile connections wastes bandwidth.",
      problemSolved:
        "Reduces sync bandwidth by over 99%, transferring only the specific modified blocks.",
      withoutIt:
        "Opening the mobile app on cellular data downloads the entire workspace document every time.",
      alternatives: [
        "Sending last-modified timestamp query (vulnerable to clock drift).",
        "Full document download on reconnect.",
      ],
      tradeoff:
        "Computing and caching Merkle hashes requires additional CPU and storage overhead per document.",
    },
  ],
  implementation: {
    behaviour:
      "A DocumentSyncEngine class that compares vector clocks for causality and builds/diffs Merkle tree hashes across document blocks.",
    algorithm: [
      "1. compare_vector_clocks(v1, v2):",
      "   a. Keys = union of keys from v1 and v2.",
      "   b. v1_le = all(v1.get(k, 0) <= v2.get(k, 0) for k in keys).",
      "   c. v2_le = all(v2.get(k, 0) <= v1.get(k, 0) for k in keys).",
      "   d. If v1 == v2: return 'EQUAL'.",
      "   e. If v1_le and not v2_le: return 'V1_BEFORE_V2'.",
      "   f. If v2_le and not v1_le: return 'V2_BEFORE_V1'.",
      "   g. Else: return 'CONCURRENT'.",
      "2. compute_merkle_root(blocks):",
      "   a. Hash each block: h = sha256(f'{block.id}:{block.content}').hexdigest()[:16].",
      "   b. Pairwise combine hashes until single root hash remains.",
      "   c. Return root hash.",
      "3. find_divergent_blocks(blocks_a, blocks_b):",
      "   Return list of block IDs where content differs between A and B.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Naive Full Overwrite",
        detail: "Uploads whole document on reconnect, destroying concurrent remote edits.",
      },
      {
        level: "Level 1",
        title: "Vector Clock Causality Tracker",
        detail: "Tracks per-device logical clocks to classify causal order and detect concurrency.",
      },
      {
        level: "Level 2",
        title: "Merkle Tree Diff Engine",
        detail: "Compares block hashes hierarchically to isolate divergent blocks in O(log N).",
      },
      {
        level: "Level 3",
        title: "Notion Enterprise Sync Mesh",
        detail:
          "SQLite WAL journals, client-side optimistic UI patching, and automated schema migrations.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "notion_sync.py",
        code: `import hashlib

class DocumentSyncEngine:
    @staticmethod
    def compare_clocks(v1: dict[str, int], v2: dict[str, int]) -> str:
        keys = set(v1.keys()) | set(v2.keys())
        v1_le = all(v1.get(k, 0) <= v2.get(k, 0) for k in keys)
        v2_le = all(v2.get(k, 0) <= v1.get(k, 0) for k in keys)

        if v1_le and v2_le:
            return "EQUAL"
        if v1_le:
            return "V1_BEFORE_V2"
        if v2_le:
            return "V2_BEFORE_V1"
        return "CONCURRENT"

    @staticmethod
    def hash_block(block_id: str, content: str) -> str:
        data = f"{block_id}:{content}".encode("utf-8")
        return hashlib.sha256(data).hexdigest()[:16]

    @classmethod
    def compute_merkle_root(cls, blocks: list[dict]) -> str:
        # blocks: [{"id": str, "content": str}]
        if not blocks:
            return ""
        current_level = [cls.hash_block(b["id"], b["content"]) for b in blocks]

        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                h1 = current_level[i]
                h2 = current_level[i + 1] if i + 1 < len(current_level) else h1
                combined = hashlib.sha256(f"{h1}:{h2}".encode("utf-8")).hexdigest()[:16]
                next_level.append(combined)
            current_level = next_level

        return current_level[0]`,
        explanations: [
          {
            code: 'if v1_le: return "V1_BEFORE_V2"',
            explanation: "Mathematically verifies that every clock component in V1 is <= V2.",
          },
          {
            code: 'return "CONCURRENT"',
            explanation: "Detects independent concurrent updates when neither clock dominates.",
          },
          {
            code: 'combined = hashlib.sha256(f"{h1}:{h2}".encode()).hexdigest()[:16]',
            explanation: "Hierarchically aggregates child hashes into parent Merkle nodes.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates Vector Clock causality evaluation and Merkle tree calculation in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Concurrent vs Causal",
      brief:
        "Explain why V1={'A': 2, 'B': 0} and V2={'A': 0, 'B': 2} are concurrent, and why a central server cannot automatically guess which one happened first.",
    },
    {
      level: "Modify",
      title: "Odd Number Merkle Pairing",
      brief:
        "Verify how the Merkle tree builder handles an odd number of leaf blocks by duplicating the last node or carrying it forward.",
    },
    {
      level: "Build",
      title: "Block Reconciler",
      brief:
        "Write a reconciler that takes server blocks and client blocks, merges non-conflicting block edits, and returns a unified document.",
    },
    {
      level: "Think",
      title: "Clock Size Growth",
      brief:
        "If 10,000 different devices edit a document over 5 years, how does a Vector Clock prevent unbounded key explosion (e.g. interval pruning / dot-kernels)?",
    },
  ],
  reflection: [
    "Why are Vector Clocks necessary to detect concurrency in distributed systems where physical clocks drift?",
    "How do Merkle trees enable mobile devices to verify document consistency over cellular networks without downloading all blocks?",
    "Why does modeling documents as atomic block graphs dramatically reduce collaboration conflicts?",
  ],
  techNotes: [
    {
      name: "SQLite in the Browser",
      kind: "Client Storage",
      note: "Modern offline-first web apps compile SQLite to WebAssembly (WASM) with Origin Private File System (OPFS) storage, running relational queries and sync journals directly in browser memory.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Compare Vector Clocks and Compute Document Merkle Roots",
    brief:
      "Implement `sync_document_blocks`: given `clock_a` (dict of device -> int), `clock_b` (dict of device -> int), and `blocks` (list of `{'id': str, 'content': str}`). 1. Compare clocks: return causality `'EQUAL'`, `'A_BEFORE_B'`, `'B_BEFORE_A'`, or `'CONCURRENT'`. 2. Compute 16-character hex Merkle root: leaf hash is `sha256(f'{id}:{content}'.encode()).hexdigest()[:16]`. Pairwise combine adjacent hashes: `sha256(f'{h1}:{h2}'.encode()).hexdigest()[:16]` (if odd length, duplicate last hash). Repeat until 1 root hash remains. If blocks is empty, root is `''`. Return a dict: `{'causality': str, 'merkle_root': str}`.",
    functionName: "sync_document_blocks",
    signature:
      "def sync_document_blocks(clock_a: dict, clock_b: dict, blocks: list[dict]) -> dict:",
    starterCode: `import hashlib

def sync_document_blocks(clock_a: dict, clock_b: dict, blocks: list[dict]) -> dict:
    # 1. Compare Vector Clocks
    keys = set(clock_a.keys()) | set(clock_b.keys())
    a_le = all(clock_a.get(k, 0) <= clock_b.get(k, 0) for k in keys)
    b_le = all(clock_b.get(k, 0) <= clock_a.get(k, 0) for k in keys)

    if a_le and b_le:
        causality = "EQUAL"
    elif a_le:
        causality = "A_BEFORE_B"
    elif b_le:
        causality = "B_BEFORE_A"
    else:
        causality = "CONCURRENT"

    # 2. Compute Merkle Root
    if not blocks:
        return {"causality": causality, "merkle_root": ""}

    def h_block(b_id, content):
        return hashlib.sha256(f"{b_id}:{content}".encode("utf-8")).hexdigest()[:16]

    def h_pair(h1, h2):
        return hashlib.sha256(f"{h1}:{h2}".encode("utf-8")).hexdigest()[:16]

    current = [h_block(b["id"], b["content"]) for b in blocks]
    while len(current) > 1:
        nxt = []
        for i in range(0, len(current), 2):
            h1 = current[i]
            h2 = current[i + 1] if i + 1 < len(current) else h1
            nxt.append(h_pair(h1, h2))
        current = nxt

    return {"causality": causality, "merkle_root": current[0]}
`,
    javaSignature:
      "public static Map<String, Object> syncDocumentBlocks(Map<String, Integer> clockA, Map<String, Integer> clockB, List<Map<String, String>> blocks)",
    javaStarterCode: `import java.util.*;
import java.security.MessageDigest;

public class Solution {
    public static Map<String, Object> syncDocumentBlocks(
        Map<String, Integer> clockA,
        Map<String, Integer> clockB,
        List<Map<String, String>> blocks
    ) {
        Set<String> keys = new HashSet<>(clockA.keySet());
        keys.addAll(clockB.keySet());

        boolean aLe = true;
        boolean bLe = true;
        for (String k : keys) {
            int valA = clockA.getOrDefault(k, 0);
            int valB = clockB.getOrDefault(k, 0);
            if (valA > valB) aLe = false;
            if (valB > valA) bLe = false;
        }

        String causality;
        if (aLe && bLe) causality = "EQUAL";
        else if (aLe) causality = "A_BEFORE_B";
        else if (bLe) causality = "B_BEFORE_A";
        else causality = "CONCURRENT";

        if (blocks.isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("causality", causality);
            res.put("merkle_root", "");
            return res;
        }

        List<String> current = new ArrayList<>();
        for (Map<String, String> b : blocks) {
            current.add(hashBlock(b.get("id"), b.get("content")));
        }

        while (current.size() > 1) {
            List<String> nxt = new ArrayList<>();
            for (int i = 0; i < current.size(); i += 2) {
                String h1 = current.get(i);
                String h2 = (i + 1 < current.size()) ? current.get(i + 1) : h1;
                nxt.add(hashPair(h1, h2));
            }
            current = nxt;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("causality", causality);
        result.put("merkle_root", current.get(0));
        return result;
    }

    private static String hashBlock(String id, String content) {
        return sha256Prefix(id + ":" + content);
    }

    private static String hashPair(String h1, String h2) {
        return sha256Prefix(h1 + ":" + h2);
    }

    private static String sha256Prefix(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                String hex = Integer.toHexString(0xff & digest[i]);
                if (hex.length() == 1) sb.append('0');
                sb.append(hex);
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}`,
    mermaid: `graph TD
    Start["sync_document_blocks(...)"] --> CompareClock["Compare Vector Clocks A and B"]
    CompareClock --> CausalCheck{"Causality Result"}
    CausalCheck --> SetCausality["Set causality: EQUAL, A_BEFORE_B, B_BEFORE_A, or CONCURRENT"]
    SetCausality --> BlockCheck{"Blocks empty?"}
    BlockCheck -->|"Yes"| EmptyRoot["merkle_root = ''"]
    BlockCheck -->|"No"| HashLeaves["Compute leaf hash for each block: h(id:content)"]
    HashLeaves --> MerkleLoop["While level length > 1: pair and hash adjacent nodes"]
    MerkleLoop --> FinalRoot["merkle_root = root_hash"]
    EmptyRoot --> Return["Return causality and merkle_root"]
    FinalRoot --> Return
`,
    hints: [
      "Check vector clock dominance across all shared keys.",
      "If odd number of hashes in a Merkle level, duplicate the last hash: h2 = h1.",
      "Take the first 16 hex characters of sha256 for all hashes.",
    ],
    tests: [
      {
        name: "Causal before relationship and single block root",
        args: [{ devA: 1, devB: 0 }, { devA: 2, devB: 1 }, [{ id: "B1", content: "Hello World" }]],
        expected: {
          causality: "A_BEFORE_B",
          merkle_root: "a2b0b1f3d61b369f", // sha256("B1:Hello World")[:16]
        },
      },
      {
        name: "Concurrent conflicting clocks detected",
        args: [{ devA: 2, devB: 0 }, { devA: 0, devB: 2 }, []],
        expected: {
          causality: "CONCURRENT",
          merkle_root: "",
        },
      },
    ],
    explanationPrompt:
      "Explain how your sync engine classifies Vector Clock causality (ancestor, descendant, concurrent) and hierarchically aggregates block hashes into a Merkle root.",
  },
};

// ----------------------------------------------------------------------------
// Case 55: Distributed Tracing & APM Collector
// ----------------------------------------------------------------------------
export const case55_distributedTracing = {
  id: "cs-distributed-tracing-055",
  slug: "distributed-tracing-apm-collector",
  index: "55",
  title:
    "How Does a Distributed Tracing System Ingest Billions of Spans and Identify Critical-Path Bottlenecks?",
  shortTitle: "Distributed Tracing APM",
  category: "Advanced Distributed Architectures",
  subcategory: "Distributed Observability & Span DAGs",
  difficulty: "Advanced",
  learnerLevel: "Engineer",
  estimatedTime: "60-75 minutes",
  minutes: 70,
  status: "published",
  tier: "premium",
  rcCost: 90,
  summary:
    "When a user request traverses 40 microservices, pinpointing which database query or network hop caused a 3-second latency spike is like finding a needle in a haystack. Discover how distributed tracing systems (Jaeger, OpenTelemetry) propagate W3C Trace Context headers, reconstruct directed span acyclic graphs (DAGs), and identify critical-path bottlenecks.",
  learningObjectives: [
    "Explain W3C TraceContext propagation (trace-id, span-id, parent-span-id) across HTTP headers.",
    "Reconstruct directed acyclic span trees from out-of-order ingestion streams.",
    "Calculate the critical execution path to identify the true latency bottleneck.",
    "Implement tail-based sampling to retain 100% of error traces while discarding healthy traffic.",
  ],
  prerequisites: [
    "HTTP headers and microservice request-response chains",
    "Directed Acyclic Graph (DAG) traversal and tree structures",
    "OpenTelemetry and distributed profiling concepts",
  ],
  engineeringConcepts: [
    "W3C Trace Context Propagation",
    "Span DAG Tree Reconstruction",
    "Critical Path Analysis",
    "Tail-Based Sampling Strategy",
    "Self-Time vs Total-Time Profiling",
  ],
  technologies: ["Python", "Java", "OpenTelemetry", "Jaeger", "Kafka", "ClickHouse"],
  tech: ["Distributed Tracing", "OpenTelemetry", "APM"],
  tags: ["apm", "tracing", "opentelemetry", "observability", "advanced"],
  glossary: [
    {
      term: "W3C Trace Context Propagation",
      plainDefinition:
        "Passing a standardized HTTP header (`traceparent: 00-traceid-spanid-01`) through all microservice calls so logs link to the same user request.",
    },
    {
      term: "Span DAG Tree Reconstruction",
      plainDefinition:
        "Assembling asynchronously ingested spans into a parent-child execution timeline tree.",
    },
    {
      term: "Critical Path Analysis",
      plainDefinition:
        "The sequence of dependent operations in a trace whose total duration accounts for the overall latency of the request.",
    },
    {
      term: "Tail-Based Sampling Strategy",
      plainDefinition:
        "Waiting until a request finishes to decide whether to save its trace (saving all errors and slow queries, while sampling only 1% of fast healthy traces).",
    },
    {
      term: "Self-Time vs Total-Time Profiling",
      plainDefinition:
        "A service's total time includes waiting for downstream services; its self-time is strictly the CPU/work time spent inside its own code.",
    },
  ],
  primers: [
    {
      concept: "Trace ID vs Span ID",
      minutes: 4,
      definition:
        "Trace ID is the unique identifier for the entire end-to-end user request. Span ID represents one specific unit of work (e.g. 'SELECT FROM users'). Each child span records its parent_span_id.",
      whyNeeded:
        "Allows thousands of independent logs and metrics from 50 different machines to be stitched into one visual flame graph.",
      analogy:
        "A package tracking number (Trace ID) tracking individual shipping legs (Spans): sorting facility -> cargo plane -> delivery van.",
      tinyExample: "traceparent = f'00-{trace_id}-{span_id}-01'",
    },
    {
      concept: "Critical Path Bottleneck Rule",
      minutes: 4,
      definition:
        "If a service makes 3 parallel downstream calls taking 10ms, 20ms, and 500ms, optimizing the 10ms call will not speed up the request. The 500ms call is on the critical path.",
      whyNeeded: "Focuses engineering optimization efforts on the true dependency bottleneck.",
      analogy:
        "Baking a cake: decorating cannot start until the cake finishes baking in the oven, regardless of how fast you whipped the frosting.",
      tinyExample: "critical_path_span = max(child_spans, key=lambda s: s['duration'])",
    },
  ],
  discover: {
    situation:
      "An e-commerce checkout API started timing out during Black Friday. The backend consisted of 35 microservices exchanging gRPC calls. Engineers spent 4 hours arguing over whether the fraud service, inventory database, or payment gateway was at fault because each team's dashboard showed normal average latency. Nobody could trace a single failing transaction end-to-end.",
    humanFlow: [
      "User clicks 'Complete Purchase' on web app.",
      "Frontend injects `traceparent` header into checkout HTTP POST.",
      "Order Service receives call, creates child span, and forwards header to Payment Service and Inventory Service.",
      "Each service emits an OpenTelemetry span packet upon completing its work.",
      "Tracing collector reconstructs the DAG and reveals that a synchronous tax calculation service stalled for 4,200ms on the critical path.",
    ],
    question:
      "How do you design a distributed tracing ingestion pipeline that reconstructs asynchronous span DAGs and identifies critical-path latency bottlenecks?",
    whyItExists: [
      "Microservice architectures cannot be debugged with isolated server log files.",
      "Identifying critical paths distinguishes real bottlenecks from harmless parallel background tasks.",
      "Tail-based sampling captures 100% of production errors while controlling petabyte storage costs.",
    ],
  },
  understand: {
    overview:
      "The Distributed Tracing APM Collector ingests spans asynchronously via gRPC/UDP. Spans contain `{trace_id, span_id, parent_span_id, service, duration_ms, start_time, error}`. The Collector groups spans by `trace_id`, builds the directed acyclic parent-child tree, and traverses execution chains to identify the critical path span with the highest self-time or blocking duration.",
    components: [
      {
        name: "Context Propagation Injector",
        whatIsIt: "HTTP/gRPC middleware serializing trace IDs into headers.",
        whyItExists: "Carries request identity across process and machine boundaries.",
        whatItDoes: "Sets `traceparent` and `tracestate` headers on outgoing requests.",
      },
      {
        name: "Span Ingestion Queue",
        whatIsIt: "High-throughput streaming buffer (Kafka) absorbing span packets.",
        whyItExists: "Decouples application runtime performance from observability storage.",
        whatItDoes: "Buffers millions of spans per second.",
      },
      {
        name: "Trace DAG Reconstructor",
        whatIsIt: "Graph builder linking children to parents using parent_span_id.",
        whyItExists: "Transforms unordered packets into an organized execution tree.",
        whatItDoes: "Builds tree root and child nodes.",
      },
      {
        name: "Critical Path Analyzer",
        whatIsIt: "Algorithm calculating self-time and dependency delays.",
        whyItExists: "Pinpoints the exact microservice responsible for the request latency.",
        whatItDoes: "Identifies longest contiguous sequence of non-overlapping spans.",
      },
    ],
    analogy: {
      title: "Detective Reconstructing a Multi-Car Train Derailment",
      everyday: [
        "After a complex train incident, inspectors collect timestamped black-box flight recorders from every locomotive and carriage.",
        "They align all recordings along a single timeline.",
        "They discover that Carriage 4 applied brakes 500ms before Carriage 3, causing the collision.",
      ],
      technical: [
        "Black-box recordings correspond to Distributed Spans.",
        "Timeline alignment corresponds to Trace DAG Reconstruction.",
        "Pinpointing the root trigger corresponds to Critical Path Bottleneck Analysis.",
      ],
    },
    flow: [
      "Client initiates request -> Root Span generated with unique trace_id.",
      "As request flows across services, child spans record their duration and parent_span_id.",
      "Collector receives spans out of order over the network.",
      "Group spans by trace_id.",
      "Build DAG: span where parent_span_id is None is the Root.",
      "Calculate self_time for each span: `duration - sum(child.duration for children)`.",
      "Find the span with the maximum self-time on the critical path.",
      "Return trace summary: root service, total duration, bottleneck span, and error flags.",
    ],
  },
  concepts: [
    {
      id: "concept-w3c-tracecontext",
      name: "W3C Trace Context Specification",
      difficulty: "Advanced",
      simpleDefinition:
        "The international web standard defining how trace identity is formatted in HTTP headers (`traceparent: 00-{traceid}-{spanid}-{flags}`).",
      whyItExists:
        "Allows different monitoring vendors (Datadog, Dynatrace, New Relic, OpenTelemetry) to interoperate seamlessly.",
      realWorldAnalogy:
        "Standardized shipping container dimensions that fit on any ship, train, or truck worldwide.",
      technicalExplanation:
        "Consists of a 16-byte trace-id, 8-byte parent-id, and 1-byte trace-flags (e.g. 01 for sampled).",
      caseApplication:
        "Maintains tracing continuity across cross-company cloud services and API calls.",
      commonMistakes: [
        "Creating a new trace_id on every microservice hop, breaking the distributed trace into disconnected fragments.",
        "Corrupting hex padding in the traceparent header.",
      ],
      practice: [
        "Parse the fields from `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`.",
        "What does the final flag `01` signify in the W3C spec?",
      ],
    },
    {
      id: "concept-critical-path",
      name: "Critical Path & Self-Time Analysis",
      difficulty: "Advanced",
      simpleDefinition:
        "A service's self-time is its own active processing time minus the time spent waiting for downstream child services to respond.",
      whyItExists:
        "An API gateway might have a total duration of 3,000ms, but its self-time is only 2ms; the other 2,998ms was spent waiting for the database.",
      realWorldAnalogy:
        "A general contractor managing a house build: the build took 6 months, but the contractor's own physical hammer time was only 2 days.",
      technicalExplanation:
        "Self_time(S) = duration(S) - sum(duration(C) for immediate children C). Bottleneck is the span with the highest self-time.",
      caseApplication:
        "Instantly directs developer attention to the specific slow SQL query or CPU-heavy function.",
      commonMistakes: [
        "Blaming the root API gateway for a slow request because it has the largest total duration.",
        "Double-counting child durations when downstream calls execute in parallel.",
      ],
      practice: [
        "If Parent duration is 100ms, and it makes 1 synchronous Child call taking 80ms, what is Parent self-time? (20ms).",
        "If Parent makes two parallel child calls taking 40ms each, what is Parent self-time?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Distributed Tracing Collector showing W3C header propagation, DAG reconstruction, and critical path analysis.",
    levels: [
      {
        title: "Level 1: Trace Context Flow",
        description: "Trace header propagation through microservice hops.",
        mermaid: `graph TD
    Client["Browser / Client"] -->|"traceparent: 00-T1-S1-01"| Gateway["API Gateway (S1)"]
    Gateway -->|"traceparent: 00-T1-S2-01"| OrderService["Order Service (S2)"]
    OrderService -->|"traceparent: 00-T1-S3-01"| PayService["Payment Service (S3)"]
    OrderService -->|"traceparent: 00-T1-S4-01"| InvService["Inventory Service (S4)"]
    S1 --> Collector["OpenTelemetry Collector"]
    S2 --> Collector
    S3 --> Collector
    S4 --> Collector
`,
      },
      {
        title: "Level 2: Reconstructed Span DAG",
        description: "Parent-child tree representation of request execution.",
        mermaid: `graph TD
    Root["API Gateway: 100ms (self: 10ms)"] --> S2["Order Service: 90ms (self: 10ms)"]
    S2 --> S3["Payment Service: 50ms (self: 50ms) -- BOTTLENECK"]
    S2 --> S4["Inventory DB: 30ms (self: 30ms)"]
`,
      },
      {
        title: "Level 3: Self-Time vs Total-Time Calculation",
        description: "Subtracting child durations to isolate real compute latency.",
        mermaid: `graph TD
    ParentTotal["Parent Total Duration: 100ms"] --> Subtract["Subtract synchronous children (80ms)"]
    Subtract --> SelfTime["Parent Self-Time = 20ms"]
    SelfTime --> Compare["Compare across all spans to find maximum self-time"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Tail-Based Sampling over Head-Based Sampling",
      what: "Decide whether to retain a trace at the end of the request lifecycle based on whether it produced errors or high latency, rather than deciding randomly at the start.",
      why: "Random 1% head-based sampling drops 99% of rare production errors, making incident root-cause analysis impossible.",
      problemSolved:
        "Guarantees that 100% of 5xx server errors and slow outlier transactions are permanently captured.",
      withoutIt:
        "A bug affecting 1 in 1,000 users is missed 99 times out of 100 by the tracing system.",
      alternatives: [
        "Head-based probabilistic sampling (random 1%).",
        "100% full capture (prohibitively expensive for petabyte-scale fleets).",
      ],
      tradeoff:
        "Requires collector nodes to buffer all spans in memory until the root request completes.",
    },
    {
      title: "Self-Time Metric for Automated Bottleneck Detection",
      what: "Measure span self-time (duration minus child durations) to rank bottlenecks rather than gross total duration.",
      why: "Gross duration always highlights the root API gateway, which is misleading since the gateway is simply waiting for downstream backends.",
      problemSolved:
        "Instantly pinpoints the true culprit service without requiring manual human inspection of flame graphs.",
      withoutIt:
        "Developers waste hours investigating the frontend proxy instead of the slow database query.",
      alternatives: ["Gross total duration ranking (misleading).", "Leaf span ranking only."],
      tradeoff:
        "Parallel child execution requires careful non-overlapping interval math to calculate self-time accurately.",
    },
  ],
  implementation: {
    behaviour:
      "A DistributedTracingCollector class that ingests span lists, reconstructs the execution tree, calculates self-time, and identifies the bottleneck span.",
    algorithm: [
      "1. build_trace_tree(spans):",
      "   a. Group spans by trace_id.",
      "   b. Build children map: parent_span_id -> list of child spans.",
      "   c. Find root span where parent_span_id is None.",
      "2. calculate_bottleneck(spans):",
      "   a. For each span:",
      "      - child_spans = [s for s in spans if s['parent_span_id'] == span['span_id']].",
      "      - child_time = sum(c['duration'] for c in child_spans).",
      "      - self_time = max(0, span['duration'] - child_time).",
      "      - Store self_time on span.",
      "   b. Bottleneck span = span with maximum self_time.",
      "   c. Return {'trace_id': id, 'total_duration': root['duration'], 'bottleneck_span': bottleneck['span_id'], 'bottleneck_service': bottleneck['service'], 'max_self_time': bottleneck['self_time']}.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Log Concatenator",
        detail: "Grep for request ID across disparate log files without timing or tree structure.",
      },
      {
        level: "Level 1",
        title: "Span DAG Reconstructor",
        detail: "Assembles parent-child tree from span IDs and calculates total trace duration.",
      },
      {
        level: "Level 2",
        title: "Self-Time Bottleneck Identifier",
        detail: "Subtracts child durations to identify the true critical path bottleneck span.",
      },
      {
        level: "Level 3",
        title: "Hyperscale Observability Collector",
        detail:
          "OpenTelemetry gRPC receiver, tail-based sampling memory ring buffer, and ClickHouse columnar storage.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "tracing_collector.py",
        code: `class TracingCollector:
    @staticmethod
    def analyze_trace(spans: list[dict]) -> dict:
        # spans: [{"trace_id": str, "span_id": str, "parent_span_id": str|None, "service": str, "duration": int}]
        if not spans:
            return {}

        root = next((s for s in spans if s.get("parent_span_id") is None), spans[0])
        children_map: dict[str, list[dict]] = {}
        for s in spans:
            p_id = s.get("parent_span_id")
            if p_id:
                if p_id not in children_map:
                    children_map[p_id] = []
                children_map[p_id].append(s)

        # Calculate self-time for each span
        max_self_time = -1
        bottleneck = spans[0]

        for s in spans:
            s_id = s["span_id"]
            children = children_map.get(s_id, [])
            child_dur = sum(c["duration"] for c in children)
            self_time = max(0, s["duration"] - child_dur)

            if self_time > max_self_time:
                max_self_time = self_time
                bottleneck = s

        return {
            "trace_id": root["trace_id"],
            "total_duration": root["duration"],
            "bottleneck_service": bottleneck["service"],
            "bottleneck_span": bottleneck["span_id"],
            "self_time": max_self_time
        }`,
        explanations: [
          {
            code: 'root = next((s for s in spans if s.get("parent_span_id") is None), spans[0])',
            explanation: "Finds the entry root span of the distributed user request.",
          },
          {
            code: 'self_time = max(0, s["duration"] - child_dur)',
            explanation:
              "Subtracts downstream child waiting time to isolate active service processing.",
          },
          {
            code: "if self_time > max_self_time: bottleneck = s",
            explanation:
              "Pinpoints the specific service with the largest active bottleneck contribution.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates distributed trace DAG reconstruction and bottleneck analysis in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Why Root Duration Is Misleading",
      brief:
        "Explain why sorting spans by total duration always points to the top API gateway rather than the true slow database query.",
    },
    {
      level: "Modify",
      title: "Add Parallel Span Handling",
      brief:
        "Modify the self-time calculation to handle parallel child spans using timestamp interval union math instead of a naive sum.",
    },
    {
      level: "Build",
      title: "Tail-Based Error Sampler",
      brief:
        "Implement a sampler that buffers all spans for 10 seconds and saves 100% of traces containing an error span, while retaining only 1% of error-free traces.",
    },
    {
      level: "Think",
      title: "Asynchronous Message Queue Handoff",
      brief:
        "When an HTTP service pushes a job to Kafka, and a worker picks it up 10 minutes later, how should the span relationship (ChildOf vs FollowsFrom) be modeled?",
    },
  ],
  reflection: [
    "Why is W3C Trace Context propagation essential for observability across microservice architectures?",
    "How does self-time analysis separate root cause bottlenecks from innocent parent caller services?",
    "Why does tail-based sampling solve the storage cost versus debuggability dilemma in production APMs?",
  ],
  techNotes: [
    {
      name: "OpenTelemetry (OTel)",
      kind: "Industry Standard",
      note: "The Cloud Native Computing Foundation (CNCF) OpenTelemetry project provides unified vendor-neutral SDKs and wire protocols (OTLP) across all major programming languages.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Reconstruct Span DAGs and Identify Latency Bottlenecks",
    brief:
      "Implement `analyze_distributed_trace`: given a list of `spans` `[{'trace_id': str, 'span_id': str, 'parent_span_id': str|None, 'service': str, 'duration': int}]`. 1. Find the root span (where `parent_span_id` is None). 2. For each span, calculate its `self_time` = `max(0, span['duration'] - sum(child['duration'] for child in immediate_children))`. 3. Identify the bottleneck span with the maximum `self_time` (break ties using span_id alphabetical order). Return a dict: `{'trace_id': str, 'total_duration': int, 'bottleneck_service': str, 'bottleneck_span': str, 'max_self_time': int}`. If spans list is empty, return `{}`.",
    functionName: "analyze_distributed_trace",
    signature: "def analyze_distributed_trace(spans: list[dict]) -> dict:",
    starterCode: `def analyze_distributed_trace(spans: list[dict]) -> dict:
    # spans: [{"trace_id": str, "span_id": str, "parent_span_id": str|None, "service": str, "duration": int}]
    # Return {"trace_id": str, "total_duration": int, "bottleneck_service": str, "bottleneck_span": str, "max_self_time": int}
    if not spans:
        return {}

    root = next((s for s in spans if s.get("parent_span_id") is None), spans[0])
    children_map = {}
    for s in spans:
        p_id = s.get("parent_span_id")
        if p_id:
            if p_id not in children_map:
                children_map[p_id] = []
            children_map[p_id].append(s)

    scored_spans = []
    for s in spans:
        s_id = s["span_id"]
        children = children_map.get(s_id, [])
        c_time = sum(c["duration"] for c in children)
        self_time = max(0, s["duration"] - c_time)
        scored_spans.append((self_time, s["span_id"], s))

    # Sort descending by self_time, then ascending by span_id
    scored_spans.sort(key=lambda x: (-x[0], x[1]))
    best_self_time, best_id, best_span = scored_spans[0]

    return {
        "trace_id": root["trace_id"],
        "total_duration": root["duration"],
        "bottleneck_service": best_span["service"],
        "bottleneck_span": best_id,
        "max_self_time": best_self_time
    }
`,
    javaSignature:
      "public static Map<String, Object> analyzeDistributedTrace(List<Map<String, Object>> spans)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> analyzeDistributedTrace(List<Map<String, Object>> spans) {
        if (spans.isEmpty()) return Collections.emptyMap();

        Map<String, Object> root = null;
        for (Map<String, Object> s : spans) {
            if (s.get("parent_span_id") == null) {
                root = s;
                break;
            }
        }
        if (root == null) root = spans.get(0);

        Map<String, List<Map<String, Object>>> childrenMap = new HashMap<>();
        for (Map<String, Object> s : spans) {
            String pId = (String) s.get("parent_span_id");
            if (pId != null) {
                childrenMap.computeIfAbsent(pId, k -> new ArrayList<>()).add(s);
            }
        }

        int maxSelfTime = -1;
        Map<String, Object> bottleneck = null;

        for (Map<String, Object> s : spans) {
            String sId = (String) s.get("span_id");
            int dur = ((Number) s.get("duration")).intValue();
            List<Map<String, Object>> children = childrenMap.getOrDefault(sId, Collections.emptyList());

            int cTime = 0;
            for (Map<String, Object> c : children) {
                cTime += ((Number) c.get("duration")).intValue();
            }
            int selfTime = Math.max(0, dur - cTime);

            if (selfTime > maxSelfTime || (selfTime == maxSelfTime && bottleneck != null && sId.compareTo((String) bottleneck.get("span_id")) < 0)) {
                maxSelfTime = selfTime;
                bottleneck = s;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("trace_id", root.get("trace_id"));
        result.put("total_duration", root.get("duration"));
        result.put("bottleneck_service", bottleneck.get("service"));
        result.put("bottleneck_span", bottleneck.get("span_id"));
        result.put("max_self_time", maxSelfTime);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["analyze_distributed_trace(spans)"] --> FindRoot["Find root span (parent_span_id is None)"]
    FindRoot --> MapChildren["Build children map: parent_id -> child spans"]
    MapChildren --> CalcSelfTime["For each span: self_time = duration - sum(child.duration)"]
    CalcSelfTime --> FindMax["Find span with max(self_time), break ties by span_id"]
    FindMax --> Format["Return trace_id, total_duration, bottleneck_service, bottleneck_span, max_self_time"]
`,
    hints: [
      "Find root span where parent_span_id is None.",
      "Calculate self_time = max(0, duration - sum(child.duration)).",
      "Rank by max self_time, breaking ties with alphabetical span_id.",
    ],
    tests: [
      {
        name: "Gateway waits for slow database query",
        args: [
          [
            {
              trace_id: "T1",
              span_id: "S_ROOT",
              parent_span_id: null,
              service: "api_gateway",
              duration: 100,
            },
            {
              trace_id: "T1",
              span_id: "S_DB",
              parent_span_id: "S_ROOT",
              service: "postgres_db",
              duration: 80,
            },
          ],
        ],
        expected: {
          trace_id: "T1",
          total_duration: 100,
          bottleneck_service: "postgres_db",
          bottleneck_span: "S_DB",
          max_self_time: 80, // DB self-time is 80; Gateway self-time is 100 - 80 = 20
        },
      },
      {
        name: "3-tier microservice chain",
        args: [
          [
            {
              trace_id: "T2",
              span_id: "S1",
              parent_span_id: null,
              service: "gateway",
              duration: 500,
            },
            { trace_id: "T2", span_id: "S2", parent_span_id: "S1", service: "auth", duration: 50 },
            {
              trace_id: "T2",
              span_id: "S3",
              parent_span_id: "S1",
              service: "checkout",
              duration: 400,
            },
            {
              trace_id: "T2",
              span_id: "S4",
              parent_span_id: "S3",
              service: "payment_vendor",
              duration: 350,
            },
          ],
        ],
        expected: {
          trace_id: "T2",
          total_duration: 500,
          bottleneck_service: "payment_vendor",
          bottleneck_span: "S4",
          max_self_time: 350,
        },
      },
    ],
    explanationPrompt:
      "Explain how your distributed tracing analyzer reconstructs execution trees, calculates span self-time, and isolates critical-path performance bottlenecks.",
  },
};

// ============================================================================
// Batch 6a Export & Runner (Cases 51 - 55)
// ============================================================================
export const batch6Cases = [
  case51_llmStreaming,
  case52_vectorDB,
  case53_googleSheetsCRDT,
  case54_notionSync,
  case55_distributedTracing,
];

async function run() {
  let allPassed = true;
  console.log("=== Validating & Upserting Batch 6a (Cases 51 - 55) ===");
  for (const cs of batch6Cases) {
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
      ? "\n=== Batch 6a (Cases 51 - 55) Successfully Seeded to Convex DB! ==="
      : "\n=== Batch 6a FAILED — see errors above ===",
  );
  if (!allPassed) process.exit(1);
}

if (import.meta.main) {
  run().catch((err) => {
    console.error("Batch 6 Error:", err);
    process.exit(1);
  });
}
