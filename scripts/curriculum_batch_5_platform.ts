import { upsertToConvex, validateCaseStudy } from "./quality_gate.ts";

// ============================================================================
// Batch 5: Scalable Web & Edge Platform Services (Cases 43 - 50)
// Intermediate (Builder / Scale, Messaging & Reliability) — Premium tier
// ============================================================================

// ----------------------------------------------------------------------------
// Case 43: Slack Channels & Threaded Messaging
// ----------------------------------------------------------------------------
export const case43_slackMessaging = {
  id: "cs-slack-channels-043",
  slug: "slack-channels-threads",
  index: "43",
  title:
    "How Does a Team Messaging Platform Fan Out Channel Messages and Manage Thread Hierarchies?",
  shortTitle: "Slack Channels & Threads",
  category: "Realtime & Communication",
  subcategory: "Thread Hierarchies & Fanout Delivery",
  difficulty: "Intermediate",
  learnerLevel: "Builder",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "premium",
  rcCost: 50,
  summary:
    "Workplace collaboration platforms like Slack support channels with tens of thousands of members and deep reply threads. Discover how real-time pub/sub fanout delivers messages over WebSockets while thread hierarchies and unread watermarks track read status per member.",
  learningObjectives: [
    "Design a channel pub/sub message broker fanning out chat packets to active WebSocket connections.",
    "Model hierarchical parent-child thread trees with efficient pagination.",
    "Implement read cursor watermarks to calculate unread badge counters per user.",
    "Structure broadcast vs thread-only notification dispatching logic.",
  ],
  prerequisites: [
    "WebSockets and publish-subscribe patterns",
    "Tree hierarchies (parent-child pointers)",
    "Message timestamps and high-watermark cursors",
  ],
  engineeringConcepts: [
    "Channel Pub/Sub Fanout",
    "Hierarchical Thread Modeling",
    "Read Pointer Watermarks",
    "Broadcast Scoping (Channel vs Thread)",
    "Transient Connection Registry",
  ],
  technologies: ["Python", "Java", "WebSockets", "Redis Pub/Sub", "Kafka"],
  tech: ["Pub/Sub", "WebSockets", "Trees"],
  tags: ["chat", "slack", "realtime", "threads", "intermediate"],
  glossary: [
    {
      term: "Channel Pub/Sub Fanout",
      plainDefinition:
        "Taking one message posted to a channel and replicating it to all currently connected members via active sockets.",
    },
    {
      term: "Hierarchical Thread Modeling",
      plainDefinition:
        "Linking reply messages to a root parent message so discussions remain organized without cluttering the main channel.",
    },
    {
      term: "Read Pointer Watermarks",
      plainDefinition:
        "The timestamp or ID of the latest message a user has viewed, used to count newer unread messages.",
    },
    {
      term: "Broadcast Scoping (Channel vs Thread)",
      plainDefinition:
        "Directing updates only to thread followers unless the author explicitly flags 'Also send to channel'.",
    },
    {
      term: "Transient Connection Registry",
      plainDefinition:
        "An in-memory index mapping active user IDs to their live socket descriptors across server nodes.",
    },
  ],
  primers: [
    {
      concept: "Channel vs Thread Fanout",
      minutes: 4,
      definition:
        "A channel message fans out to all 5,000 members. A thread reply fans out only to the root author and explicitly subscribed thread participants unless 'broadcast_to_channel' is true.",
      whyNeeded:
        "Broadcasting every single thread reply to 5,000 users creates massive notification fatigue and socket bandwidth spikes.",
      analogy:
        "Speaking on a megaphone to an entire auditorium vs leaning in to whisper with the 3 people who asked a question.",
      tinyExample: "recipients = channel_members if is_channel_msg else thread_participants",
    },
    {
      concept: "Read Watermark Math",
      minutes: 4,
      definition:
        "Unread count is the number of messages in channel C where message.created_at > user_watermark[C]. Moving the watermark updates the unread badge to 0.",
      whyNeeded: "Users need instant red badge counts showing where new unread activity occurred.",
      analogy: "A physical bookmark placed in a book: unread pages are all pages after the ribbon.",
      tinyExample: "unread_count = sum(1 for m in msgs if m['timestamp'] > user_watermark)",
    },
  ],
  discover: {
    situation:
      "A company expanded from 50 to 5,000 employees on a custom chat tool. In the '#all-announcements' channel, whenever an executive posted, 800 employees replied with 'Congrats!' and emoji reactions. Every single reply was broadcast to all 5,000 WebSockets, causing 4,000,000 socket packet deliveries per minute and crashing client laptops.",
    humanFlow: [
      "User posts a root message in a public channel.",
      "Channel subscribers receive real-time notification on desktop/mobile.",
      "Teammates reply inside the message thread, grouping discussions under the root message ID.",
      "Thread replies ping only active thread participants unless 'also send to channel' is checked.",
      "Client advances read watermark upon viewing channel, clearing unread indicator.",
    ],
    question:
      "How do you design a team messaging platform that supports threaded discussions, controls broadcast fanout, and tracks per-user unread watermarks efficiently?",
    whyItExists: [
      "Large channels require scoped thread replies to prevent noisy notification floods.",
      "Socket servers must fan out packets in sub-50ms without blocking request threads.",
      "Per-user unread counters require efficient time-based cursor lookups.",
    ],
  },
  understand: {
    overview:
      "The Slack messaging architecture consists of a Channel Registry, a Thread Tree Manager, and a Pub/Sub Fanout Router. Messages have a parent_id (null for top-level channel messages). The Fanout Router inspects message scope: channel messages broadcast to all channel subscribers, while thread messages dispatch only to thread followers. A Read Cursor service tracks each user's latest seen message ID.",
    components: [
      {
        name: "Channel Pub/Sub Hub",
        whatIsIt: "Message bus routing messages to active subscriber connections.",
        whyItExists: "Decouples message senders from thousands of active receiving clients.",
        whatItDoes: "Replicates packets to connection servers holding matching subscriber sockets.",
      },
      {
        name: "Thread Hierarchy Tree",
        whatIsIt: "Data structure grouping replies under their root parent message.",
        whyItExists: "Enables organizing deep conversations without cluttering main feeds.",
        whatItDoes: "Stores child reply lists and maintains reply counters on parent messages.",
      },
      {
        name: "Read Watermark Store",
        whatIsIt: "Fast key-value cache mapping (user_id, channel_id) to the last read timestamp.",
        whyItExists: "Calculates unread badge indicators on demand.",
        whatItDoes: "Advances on scroll and computes unread deltas.",
      },
      {
        name: "Socket Connection Gateway",
        whatIsIt: "Cluster of long-lived WebSocket servers terminating client TCP sockets.",
        whyItExists: "Maintains full-duplex persistent connections to end-user devices.",
        whatItDoes: "Pushes JSON message payloads down client sockets.",
      },
    ],
    analogy: {
      title: "Town Hall Meeting with Breakout Tables",
      everyday: [
        "In a town hall meeting, the speaker on the main stage addresses everyone in the auditorium (Channel Message).",
        "Attendees gather at smaller breakout tables to discuss specific agenda items (Thread Replies).",
        "Discussions at table 4 do not interrupt the rest of the auditorium unless the table leader walks up to the microphone (Also Send to Channel).",
      ],
      technical: [
        "Main stage speech corresponds to Root Channel Broadcast.",
        "Breakout table discussions correspond to Scoped Thread Replies.",
        "Table leader microphone corresponds to the 'broadcast_to_channel' flag.",
      ],
    },
    flow: [
      "User submits message: {id, channel_id, parent_id, text, timestamp, also_to_channel}.",
      "If parent_id is null: message is a root channel post. Dispatch to all channel members.",
      "If parent_id is present: message is a thread reply. Update parent's reply_count.",
      "Thread subscribers list = {parent_author} union all previous reply authors in thread.",
      "If also_to_channel is True: recipients = channel_members. Else: recipients = thread_subscribers.",
      "Deliver message payload to active sockets of all resolved recipients.",
      "Update channel message store.",
    ],
  },
  concepts: [
    {
      id: "concept-thread-scope",
      name: "Thread Scoping & Selective Fanout",
      difficulty: "Intermediate",
      simpleDefinition:
        "Routing thread reply messages only to users who have participated in that thread, unless explicit broadcast is requested.",
      whyItExists: "Prevents explosive N*M message multiplication in high-membership channels.",
      realWorldAnalogy:
        "Email 'Reply' vs 'Reply All': replying only to the relevant subset unless everyone must know.",
      technicalExplanation:
        "Recipients R = (channel_members if (parent_id is None or also_to_channel) else (thread_authors)).",
      caseApplication:
        "Keeps '#general' quiet even when 50 people discuss lunch plans in a side thread.",
      commonMistakes: [
        "Broadcasting all thread replies to the entire channel.",
        "Failing to increment parent reply_count and update latest_reply_timestamp on the parent card.",
      ],
      practice: [
        "Who should receive a notification when user C replies in a thread started by A where B previously replied?",
        "How do you design database queries to fetch a channel feed without loading 200 child replies per message?",
      ],
    },
    {
      id: "concept-watermark-unread",
      name: "High-Watermark Read Cursor",
      difficulty: "Intermediate",
      simpleDefinition:
        "A monotonic timestamp or sequence number indicating the latest message a user has seen in a channel.",
      whyItExists:
        "Allows computing unread counts with a simple range query without tracking read status for every individual message.",
      realWorldAnalogy:
        "A physical bookmark or email inbox 'read up to this point' separator line.",
      technicalExplanation:
        "Unread count = count(messages where channel_id == C and timestamp > watermark[user, C]).",
      caseApplication: "Shows bold channel names and badge numbers in the Slack sidebar.",
      commonMistakes: [
        "Updating read status by writing a row into a `message_reads` table for every single user, causing millions of writes.",
        "Allowing read watermarks to move backwards.",
      ],
      practice: [
        "Why is storing a single timestamp cursor per (user, channel) O(1) space compared to O(M) message receipts?",
        "What happens to the unread count when a user clears watermarks on their phone?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Slack Channels & Threaded Messaging Engine showing fanout routing and watermark tracking.",
    levels: [
      {
        title: "Level 1: System Message Flow",
        description: "Message dispatch through Pub/Sub to WebSockets and client feeds.",
        mermaid: `graph TD
    Sender["Author Client"] -->|"POST /messages"| Gateway["API Gateway"]
    Gateway -->|"Route Message"| Router["Fanout Router"]
    Router -->|"Channel Fanout"| PubSub["Redis Pub/Sub Channel Bus"]
    Router -->|"Persist Message"| MsgDB["Message Store"]
    PubSub --> SocketServers["WebSocket Edge Nodes"]
    SocketServers -->|"Push JSON Packet"| Recipients["Connected Channel Clients"]
`,
      },
      {
        title: "Level 2: Thread Hierarchy & Recipient Resolution",
        description:
          "Logic determining whether a message goes to the whole channel or thread participants.",
        mermaid: `graph TD
    Msg["Incoming Message"] --> ParentCheck{"parent_id is null?"}
    ParentCheck -->|"Yes (Root Message)"| FullChannel["Recipients = All Channel Members"]
    ParentCheck -->|"No (Thread Reply)"| BroadcastCheck{"also_send_to_channel == True?"}
    BroadcastCheck -->|"Yes"| FullChannel
    BroadcastCheck -->|"No"| ThreadOnly["Recipients = Thread Author + Previous Thread Repliers"]
`,
      },
      {
        title: "Level 3: Read Watermark & Unread Calculation",
        description:
          "Computing unread badge counts using channel message timestamps and user watermarks.",
        mermaid: `graph TD
    FetchSidebar["Calculate Unread Badges"] --> GetWatermark["Fetch user_watermark(channel_id)"]
    GetWatermark --> CountNew["Count messages where timestamp > user_watermark"]
    CountNew --> HasUnread{"Count > 0?"}
    HasUnread -->|"Yes"| ShowBadge["Display Bold Channel & Badge Count"]
    HasUnread -->|"No"| ClearBadge["Normal Font, No Badge"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Timestamp Read Watermark vs Per-Message Read Receipts",
      what: "Store a single `last_read_timestamp` per user per channel rather than tracking individual message read rows.",
      why: "Reduces read-state storage from O(U * M) to O(U * C) where C is channel count, saving gigabytes of database writes.",
      problemSolved:
        "Prevents database write lock thrashing when 10,000 users scroll through the same channel.",
      withoutIt:
        "Every channel scroll generates 50 database inserts into a `message_read_receipts` table.",
      alternatives: [
        "Per-message read receipt tracking (like WhatsApp double blue ticks).",
        "Client-side unread tracking without server sync.",
      ],
      tradeoff:
        "Cannot easily tell a sender which specific individual members read their message in a public channel with 5,000 members.",
    },
    {
      title: "Selective Thread Fanout by Default",
      what: "Default thread replies to notify only thread participants, requiring an explicit flag to broadcast to channel.",
      why: "Protects channel signal-to-noise ratio and reduces WebSocket message broadcast volume by over 80%.",
      problemSolved: "Eliminates notification spam storms in large company-wide channels.",
      withoutIt:
        "A channel with 10,000 members becomes unusable whenever any thread discussion starts.",
      alternatives: [
        "Broadcast all replies to channel automatically.",
        "Disallow threads entirely (flat channel message feed).",
      ],
      tradeoff:
        "Users who do not follow the thread miss discussions unless explicitly tagged or notified.",
    },
  ],
  implementation: {
    behaviour:
      "A SlackChannelManager class that routes messages to appropriate recipient sets and computes unread badge counts based on read watermarks.",
    algorithm: [
      "1. post_message(channel_id, sender, text, parent_id, timestamp, also_to_channel):",
      "   a. Create message dict. Store in channel_messages[channel_id].",
      "   b. If parent_id is None:",
      "      - Recipients = channel_members[channel_id].",
      "   c. Else (thread reply):",
      "      - Record reply in threads[parent_id].",
      "      - If also_to_channel is True: recipients = channel_members[channel_id].",
      "      - Else: recipients = set(thread_participants[parent_id]) | {sender}.",
      "   d. Return {'message_id': id, 'recipients': sorted(list(recipients))}.",
      "2. get_unread_count(channel_id, user, watermark_timestamp):",
      "   a. Filter channel_messages[channel_id] where msg['timestamp'] > watermark_timestamp.",
      "   b. Return count.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Flat Broadcast Chat",
        detail: "Sends every message to every channel member without thread support.",
      },
      {
        level: "Level 1",
        title: "Thread Reply Tree",
        detail: "Groups messages under parent_id and calculates thread reply counts.",
      },
      {
        level: "Level 2",
        title: "Scoped Fanout & Watermarks",
        detail: "Filters thread recipients and computes unread badge counters per user.",
      },
      {
        level: "Level 3",
        title: "Hyperscale Enterprise Slack Architecture",
        detail:
          "Distributed Redis pub/sub shards, offline push notification queues, and typing indicators.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "slack_messaging.py",
        code: `class SlackMessagingEngine:
    def __init__(self, channel_members: dict[str, set[str]]) -> None:
        self.members = channel_members  # {channel_id: set of user_ids}
        self.messages: dict[str, list[dict]] = {}
        self.thread_participants: dict[str, set[str]] = {}

    def post_message(
        self,
        channel_id: str,
        sender: str,
        text: str,
        msg_id: str,
        timestamp: int,
        parent_id: str | None = None,
        also_to_channel: bool = False
    ) -> list[str]:
        msg = {
            "id": msg_id,
            "sender": sender,
            "text": text,
            "timestamp": timestamp,
            "parent_id": parent_id
        }
        if channel_id not in self.messages:
            self.messages[channel_id] = []
        self.messages[channel_id].append(msg)

        if parent_id is None:
            # Root message goes to entire channel
            return sorted(list(self.members.get(channel_id, set())))

        # Thread reply
        if parent_id not in self.thread_participants:
            self.thread_participants[parent_id] = set()
        self.thread_participants[parent_id].add(sender)

        if also_to_channel:
            return sorted(list(self.members.get(channel_id, set())))

        return sorted(list(self.thread_participants[parent_id]))

    def get_unread_count(self, channel_id: str, watermark: int) -> int:
        msgs = self.messages.get(channel_id, [])
        return sum(1 for m in msgs if m["timestamp"] > watermark)`,
        explanations: [
          {
            code: "if parent_id is None: return sorted(list(self.members.get(channel_id, set())))",
            explanation: "Broadcasts root channel posts to all subscribed channel members.",
          },
          {
            code: "if also_to_channel: return sorted(list(self.members.get(channel_id, set())))",
            explanation: "Expands thread delivery to the whole channel when explicitly requested.",
          },
          {
            code: 'return sum(1 for m in msgs if m["timestamp"] > watermark)',
            explanation:
              "Calculates unread badge count by comparing message timestamps with the user's read watermark.",
          },
        ],
      },
    ],
    simulationNote: "Simulates message fanout and unread watermark calculation in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Thread Participant Growth",
      brief:
        "Explain how the thread participant set grows as more users reply, and why the initial thread creator is always an implicit participant.",
    },
    {
      level: "Modify",
      title: "Add @Channel Mention Override",
      brief:
        "Modify the recipient resolution logic so that if message text contains '@channel', the message broadcasts to all channel members even inside a thread.",
    },
    {
      level: "Build",
      title: "Unread Thread Reply Tracker",
      brief:
        "Implement a thread-level unread tracker that alerts users if new replies landed in threads they previously commented on.",
    },
    {
      level: "Think",
      title: "Offline Push vs Online Socket",
      brief:
        "If a recipient does not have an active WebSocket connection, how does the system route the message to APNs/FCM mobile push queues without delaying online socket delivery?",
    },
  ],
  reflection: [
    "Why is selective thread fanout critical to scaling team chat applications?",
    "How does the watermark cursor technique reduce read-tracking storage from quadratic to linear?",
    "What architectural components separate persistent message storage from transient socket connections?",
  ],
  techNotes: [
    {
      name: "Redis Pub/Sub vs Kafka",
      kind: "Architecture",
      note: "Slack uses Redis Pub/Sub for sub-millisecond ephemeral socket broadcasting to online users, while Kafka acts as the durable write-ahead log for message history and search indexing.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Dispatch Slack Channel Messages and Calculate Unread Badges",
    brief:
      "Implement `process_slack_stream`: given `channel_members` (dict of channel_id -> list of member IDs), `incoming_messages` (list of dicts `{'channel_id': str, 'sender': str, 'msg_id': str, 'timestamp': int, 'parent_id': str|None, 'also_to_channel': bool}`), and `user_watermarks` (dict of (user, channel_id) -> watermark_timestamp). For each message, resolve the list of recipient user IDs (sorted). When `parent_id` is None, recipients = channel members. When `parent_id` is set, recipients = thread participants (authors of thread messages up to this point) unless `also_to_channel` is True (which sends to all channel members). Return a dict with: `'fanouts'` (list of dicts `{'msg_id': str, 'recipients': list[str]}`) and `'unread_counts'` (dict of `user@channel` -> int of messages newer than user's watermark).",
    functionName: "process_slack_stream",
    signature:
      "def process_slack_stream(channel_members: dict, incoming_messages: list[dict], user_watermarks: dict) -> dict:",
    starterCode: `def process_slack_stream(channel_members: dict, incoming_messages: list[dict], user_watermarks: dict) -> dict:
    # channel_members: {channel_id: [user_ids]}
    # incoming_messages: [{"channel_id": str, "sender": str, "msg_id": str, "timestamp": int, "parent_id": str|None, "also_to_channel": bool}]
    # user_watermarks: {"user@channel": int}
    # Return {"fanouts": [{"msg_id": str, "recipients": list[str]}], "unread_counts": {"user@channel": int}}
    fanouts = []
    thread_participants = {}  # parent_id -> set of users
    channel_msgs = {}        # channel_id -> list of timestamps

    for m in incoming_messages:
        c_id = m["channel_id"]
        sender = m["sender"]
        msg_id = m["msg_id"]
        ts = m["timestamp"]
        p_id = m.get("parent_id")
        also_channel = m.get("also_to_channel", False)

        if c_id not in channel_msgs:
            channel_msgs[c_id] = []
        channel_msgs[c_id].append(ts)

        c_members = set(channel_members.get(c_id, []))

        if p_id is None:
            # Root message: sender is participant of this thread
            if msg_id not in thread_participants:
                thread_participants[msg_id] = set()
            thread_participants[msg_id].add(sender)
            recipients = sorted(list(c_members))
        else:
            if p_id not in thread_participants:
                thread_participants[p_id] = set()
            thread_participants[p_id].add(sender)

            if also_channel:
                recipients = sorted(list(c_members))
            else:
                recipients = sorted(list(thread_participants[p_id]))

        fanouts.append({"msg_id": msg_id, "recipients": recipients})

    unreads = {}
    for user_chan, w_ts in user_watermarks.items():
        parts = user_chan.split("@")
        if len(parts) == 2:
            c_id = parts[1]
            all_ts = channel_msgs.get(c_id, [])
            count = sum(1 for t in all_ts if t > w_ts)
            unreads[user_chan] = count

    return {"fanouts": fanouts, "unread_counts": unreads}
`,
    javaSignature:
      "public static Map<String, Object> processSlackStream(Map<String, List<String>> channelMembers, List<Map<String, Object>> incomingMessages, Map<String, Integer> userWatermarks)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> processSlackStream(
        Map<String, List<String>> channelMembers,
        List<Map<String, Object>> incomingMessages,
        Map<String, Integer> userWatermarks
    ) {
        List<Map<String, Object>> fanouts = new ArrayList<>();
        Map<String, Set<String>> threadParticipants = new HashMap<>();
        Map<String, List<Integer>> channelMsgs = new HashMap<>();

        for (Map<String, Object> m : incomingMessages) {
            String cId = (String) m.get("channel_id");
            String sender = (String) m.get("sender");
            String msgId = (String) m.get("msg_id");
            int ts = ((Number) m.get("timestamp")).intValue();
            String pId = (String) m.get("parent_id");
            boolean alsoChannel = (boolean) m.getOrDefault("also_to_channel", false);

            channelMsgs.computeIfAbsent(cId, k -> new ArrayList<>()).add(ts);

            List<String> membersList = channelMembers.getOrDefault(cId, Collections.emptyList());
            Set<String> cMembers = new HashSet<>(membersList);
            List<String> recipients;

            if (pId == null) {
                threadParticipants.computeIfAbsent(msgId, k -> new HashSet<>()).add(sender);
                recipients = new ArrayList<>(cMembers);
            } else {
                threadParticipants.computeIfAbsent(pId, k -> new HashSet<>()).add(sender);
                if (alsoChannel) {
                    recipients = new ArrayList<>(cMembers);
                } else {
                    recipients = new ArrayList<>(threadParticipants.get(pId));
                }
            }

            Collections.sort(recipients);
            Map<String, Object> fanout = new HashMap<>();
            fanout.put("msg_id", msgId);
            fanout.put("recipients", recipients);
            fanouts.add(fanout);
        }

        Map<String, Integer> unreads = new HashMap<>();
        for (Map.Entry<String, Integer> entry : userWatermarks.entrySet()) {
            String userChan = entry.getKey();
            int wTs = entry.getValue();
            String[] parts = userChan.split("@");
            if (parts.length == 2) {
                String cId = parts[1];
                List<Integer> timestamps = channelMsgs.getOrDefault(cId, Collections.emptyList());
                int count = 0;
                for (int t : timestamps) {
                    if (t > wTs) count++;
                }
                unreads.put(userChan, count);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("fanouts", fanouts);
        result.put("unread_counts", unreads);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["process_slack_stream(...)"] --> LoopM["For each message in incoming_messages"]
    LoopM --> TypeCheck{"parent_id is null?"}
    TypeCheck -->|"Yes (Root)"| RootAction["Add sender to thread_participants(msg_id) & recipients = channel_members"]
    TypeCheck -->|"No (Reply)"| AddParticipant["Add sender to thread_participants(parent_id)"]
    AddParticipant --> BroadcastCheck{"also_to_channel == True?"}
    BroadcastCheck -->|"Yes"| BroadcastAction["recipients = channel_members"]
    BroadcastCheck -->|"No"| ThreadAction["recipients = thread_participants(parent_id)"]
    RootAction --> RecordFanout["Record fanout(msg_id, sorted(recipients))"]
    BroadcastAction --> RecordFanout
    ThreadAction --> RecordFanout
    RecordFanout --> NextM{"More messages?"}
    NextM -->|"Yes"| LoopM
    NextM -->|"No"| WatermarkLoop["Compute unread counts per user@channel"]
    WatermarkLoop --> Return["Return fanouts and unread_counts"]
`,
    hints: [
      "Remember to sort recipients alphabetically for deterministic output.",
      "The thread creator and all previous repliers are part of thread_participants.",
      "Count unread messages strictly where message timestamp > watermark timestamp.",
    ],
    tests: [
      {
        name: "Root message followed by thread reply with selective scoping",
        args: [
          { general: ["Alice", "Bob", "Charlie", "Dave"] },
          [
            {
              channel_id: "general",
              sender: "Alice",
              msg_id: "M1",
              timestamp: 100,
              parent_id: null,
              also_to_channel: false,
            },
            {
              channel_id: "general",
              sender: "Bob",
              msg_id: "M2",
              timestamp: 110,
              parent_id: "M1",
              also_to_channel: false,
            },
          ],
          { "Charlie@general": 90, "Dave@general": 105 },
        ],
        expected: {
          fanouts: [
            { msg_id: "M1", recipients: ["Alice", "Bob", "Charlie", "Dave"] },
            { msg_id: "M2", recipients: ["Alice", "Bob"] }, // Only thread participants (Alice + Bob)
          ],
          unread_counts: {
            "Charlie@general": 2, // Saw up to 90, both 100 & 110 are newer
            "Dave@general": 1, // Saw up to 105, only 110 is newer
          },
        },
      },
      {
        name: "Thread reply with also_to_channel broadcasts to entire channel",
        args: [
          { dev: ["Alice", "Bob", "Charlie"] },
          [
            {
              channel_id: "dev",
              sender: "Alice",
              msg_id: "M1",
              timestamp: 200,
              parent_id: null,
              also_to_channel: false,
            },
            {
              channel_id: "dev",
              sender: "Bob",
              msg_id: "M2",
              timestamp: 210,
              parent_id: "M1",
              also_to_channel: true, // Broadcast override
            },
          ],
          { "Charlie@dev": 205 },
        ],
        expected: {
          fanouts: [
            { msg_id: "M1", recipients: ["Alice", "Bob", "Charlie"] },
            { msg_id: "M2", recipients: ["Alice", "Bob", "Charlie"] },
          ],
          unread_counts: {
            "Charlie@dev": 1,
          },
        },
      },
    ],
    explanationPrompt:
      "Explain how your messaging engine implements selective thread scoping, resolves recipient sets, and calculates unread counters using high-watermark timestamps.",
  },
};

// ----------------------------------------------------------------------------
// Case 44: Real-time Live Location Fleet Telemetry
// ----------------------------------------------------------------------------
export const case44_fleetTelemetry = {
  id: "cs-fleet-telemetry-044",
  slug: "realtime-live-location-fleet",
  index: "44",
  title:
    "How Does a Fleet Telemetry Engine Ingest Millions of GPS Coordinates and Trigger Geofence Arrivals?",
  shortTitle: "Live Fleet Telemetry",
  category: "Realtime & Communication",
  subcategory: "Spatial Telemetry & Geofence Ingestion",
  difficulty: "Intermediate",
  learnerLevel: "Builder",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "premium",
  rcCost: 50,
  summary:
    "Ridesharing and delivery networks process GPS pings from hundreds of thousands of active drivers every 4 seconds. Discover how telemetry ingestion pipelines compact time-series coordinates, filter noisy jitter, and evaluate circular geofences to trigger automated customer arrival notifications.",
  learningObjectives: [
    "Design a high-frequency GPS telemetry ingestion pipeline with dead-reckoning and jitter smoothing.",
    "Evaluate circular geofence boundary intersections in real time.",
    "Compact time-series coordinate streams to minimize storage overhead.",
    "Implement state transitions for order trip phases (Dispatched, En Route, Arrived, Completed).",
  ],
  prerequisites: [
    "Spatial distance math (Euclidean / Haversine)",
    "Time-series buffering and data compaction",
    "State machine lifecycle management",
  ],
  engineeringConcepts: [
    "High-Frequency Telemetry Ingestion",
    "Circular Geofence Intersection",
    "GPS Jitter Filtering",
    "Trajectory Compaction",
    "Trip Lifecycle State Transition",
  ],
  technologies: ["Python", "Java", "Kafka", "Redis", "WebSockets"],
  tech: ["Kafka", "Geofencing", "Telemetry"],
  tags: ["uber", "fleet", "realtime", "geofence", "intermediate"],
  glossary: [
    {
      term: "High-Frequency Telemetry Ingestion",
      plainDefinition:
        "Handling rapid periodic location updates from mobile devices (e.g. 1 ping every 3-5 seconds per driver).",
    },
    {
      term: "Circular Geofence Intersection",
      plainDefinition:
        "Testing whether a coordinate falls within a specified radius (e.g. 200 meters) of a target landmark.",
    },
    {
      term: "GPS Jitter Filtering",
      plainDefinition:
        "Discarding erratic micro-movements caused by tall buildings and sensor noise when a vehicle is stationary.",
    },
    {
      term: "Trajectory Compaction",
      plainDefinition:
        "Retaining only key coordinate points along straight road segments rather than saving every redundant ping.",
    },
    {
      term: "Trip Lifecycle State Transition",
      plainDefinition:
        "Automatically flipping trip status from 'EN_ROUTE' to 'ARRIVED' when the driver breaches the geofence perimeter.",
    },
  ],
  primers: [
    {
      concept: "Geofence Arrival Detection",
      minutes: 4,
      definition:
        "A destination has coordinates (dest_lat, dest_lon) and an arrival threshold radius (e.g. 0.2 km). If distance(driver_pos, dest_pos) <= radius, arrival is triggered.",
      whyNeeded:
        "Customers want immediate push alerts ('Your driver has arrived!') without driver having to manually tap a button.",
      analogy:
        "An automatic door sensor opening when a shopper steps within 2 meters of the sliding door.",
      tinyExample: "is_arrived = haversine(driver_lat, driver_lon, target_lat, target_lon) <= 0.2",
    },
    {
      concept: "Coordinate Jitter Threshold",
      minutes: 4,
      definition:
        "If a vehicle's speed is 0 km/h, satellite reflections may cause coordinates to wander by 5 meters every second. Ignore updates where delta_dist < 10 meters unless timestamp delta is large.",
      whyNeeded: "Prevents false ETA recalculations and distracting passenger map jitter.",
      analogy: "A noise-canceling microphone ignoring low-volume ambient room hum.",
      tinyExample: "if dist(last_pos, curr_pos) < MIN_MOVE_METERS:\n    skip_update()",
    },
  ],
  discover: {
    situation:
      "A fast-growing food delivery app tracked 50,000 couriers. Raw GPS updates were directly written into PostgreSQL on every ping, generating 15,000 SQL writes per second and overwhelming database I/O. Concurrently, couriers standing across the street from restaurants were never marked as 'Arrived' because geofence checks were only run manually by courier button taps.",
    humanFlow: [
      "Courier picks up food order and heads towards customer delivery address.",
      "Courier phone transmits GPS coordinates every 4 seconds over persistent connection.",
      "Ingestion service buffers coordinates, calculates distance to customer delivery drop point.",
      "When courier crosses the 200m circular perimeter, system automatically transitions trip to 'ARRIVED'.",
      "Customer receives push notification: 'Your courier has arrived downstairs!'",
    ],
    question:
      "How do you design a real-time fleet telemetry pipeline that processes high-frequency GPS streams, filters sensor noise, and triggers automated geofence arrivals?",
    whyItExists: [
      "Rideshare and delivery logistics rely on automated milestone detection without manual driver intervention.",
      "High-frequency sensor updates require streaming buffers to prevent storage exhaustion.",
      "Passenger trust depends on smooth, accurate vehicle location display on live maps.",
    ],
  },
  understand: {
    overview:
      "The Fleet Telemetry Engine ingests GPS telemetry via an edge gateway into a streaming topic. A Geofence Processor evaluates current positions against active trip destination perimeters using the Haversine formula. When a vehicle enters the destination radius, an Arrival Event is published to customer push notification queues and trip state is updated.",
    components: [
      {
        name: "Telemetry Ingestion Gateway",
        whatIsIt: "Stateless streaming receiver accepting UDP/TCP/WebSocket coordinate packets.",
        whyItExists: "Terminates millions of device pings without blocking on database locks.",
        whatItDoes: "Pushes raw pings into a partitioned Kafka telemetry stream.",
      },
      {
        name: "Spatial Geofence Processor",
        whatIsIt: "Streaming worker evaluating driver locations against destination coordinates.",
        whyItExists: "Automates milestone events (Driver Arrived, Delivery Approaching).",
        whatItDoes: "Computes geodesic distance and fires alerts when distance <= radius.",
      },
      {
        name: "Live Coordinate Cache",
        whatIsIt: "In-memory Redis geospatial key-value store holding latest driver locations.",
        whyItExists: "Powers customer map tracking with sub-10ms lookup latency.",
        whatItDoes: "Stores current lat/lon and bearing heading per driver.",
      },
      {
        name: "Trip State Controller",
        whatIsIt: "Authoritative state machine managing order status.",
        whyItExists:
          "Ensures legal state transitions (ASSIGNED -> EN_ROUTE -> ARRIVED -> DELIVERED).",
        whatItDoes: "Updates order records upon geofence verification.",
      },
    ],
    analogy: {
      title: "Airport Radar and Landing Runway Beacon",
      everyday: [
        "Air traffic radar continuously tracks airplane transponder beacons every few seconds.",
        "When an incoming flight enters the 5-mile approach corridor of the runway, runway approach lights activate automatically.",
        "Ground staff prepare the gate before the plane even touches down.",
      ],
      technical: [
        "Transponder beacons correspond to periodic driver GPS Telemetry pings.",
        "5-mile approach corridor corresponds to the Circular Geofence Perimeter.",
        "Runway lights activation corresponds to automated Arrival Notification push.",
      ],
    },
    flow: [
      "Driver phone sends ping: {driver_id, trip_id, lat, lon, timestamp}.",
      "Telemetry processor retrieves trip destination: {dest_lat, dest_lon, geofence_radius_km, status}.",
      "If trip status is 'ARRIVED', skip geofence evaluation.",
      "Calculate distance = haversine(driver_lat, driver_lon, dest_lat, dest_lon).",
      "If distance <= geofence_radius_km: transition status to 'ARRIVED' and emit arrival alert.",
      "Update driver's latest position in Redis cache for customer map rendering.",
    ],
  },
  concepts: [
    {
      id: "concept-geofence-trigger",
      name: "Geofence Boundary Intersection",
      difficulty: "Intermediate",
      simpleDefinition:
        "Detecting when a moving point transitions from outside a geometric boundary to inside it.",
      whyItExists:
        "Enables automated real-world action triggers without relying on human confirmation.",
      realWorldAnalogy: "A pet's electronic collar beeping when approaching the edge of the yard.",
      technicalExplanation:
        "Distance D = haversine(pos, center). State = INSIDE if D <= radius else OUTSIDE. Transition OUTSIDE -> INSIDE triggers event.",
      caseApplication: "Alerts riders that their Uber is waiting outside the building.",
      commonMistakes: [
        "Failing to latch the arrival state, causing a driver who circles the block to trigger 5 arrival notifications.",
        "Using too small a radius (e.g. 10 meters) where GPS drift causes missed detections.",
      ],
      practice: [
        "Why is a 100-200m radius typically preferred over 15m for street vehicle geofences?",
        "How do you handle polygon geofences (e.g. airport zones) vs circular geofences?",
      ],
    },
    {
      id: "concept-dead-reckoning",
      name: "Telemetry Smoothing & Jitter Filter",
      difficulty: "Intermediate",
      simpleDefinition: "Smoothing erratic sensor jumps by discarding implausible velocity spikes.",
      whyItExists:
        "Urban canyons (tall skyscrapers) reflect GPS signals, creating fake 100-meter teleports in 1 second.",
      realWorldAnalogy: "Shock absorbers in a car smoothing out road bumps.",
      technicalExplanation:
        "Calculate apparent speed = distance / delta_time. If speed > 150 km/h for a city delivery scooter, discard ping as multipath jitter.",
      caseApplication:
        "Prevents car icon on passenger screen from jumping across river bridges and back.",
      commonMistakes: [
        "Accepting impossible velocity spikes into historical trip trajectories.",
        "Discarding real movement when a vehicle emerges from a long tunnel.",
      ],
      practice: [
        "What is the maximum realistic speed for an urban bicycle courier?",
        "How does the Kalman filter combine GPS measurements with phone accelerometer data?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Real-Time Fleet Telemetry Pipeline showing streaming intake, geofence processor, and state transitions.",
    levels: [
      {
        title: "Level 1: Telemetry Pipeline",
        description: "Streaming flow from mobile devices through Kafka to Geofence and Cache.",
        mermaid: `graph TD
    Driver["50,000 Drivers"] -->|"GPS Pings (every 4s)"| Edge["Telemetry Edge Gateway"]
    Edge -->|"Stream Batches"| Kafka["Kafka Topic: driver-telemetry"]
    Kafka -->|"Consumer Group"| GeofenceWorker["Geofence & State Processor"]
    GeofenceWorker -->|"Update Coordinates"| RedisGeo["Redis Live Location Cache"]
    GeofenceWorker -->|"Arrival Event"| PushService["Customer Push Notification Queue"]
`,
      },
      {
        title: "Level 2: Geofence Intersection Logic",
        description: "Evaluating distance against destination perimeter.",
        mermaid: `graph TD
    Ping["New GPS Ping (driver, lat, lon)"] --> FetchTrip["Fetch Trip (dest_lat, dest_lon, radius, status)"]
    FetchTrip --> CheckStatus{"Status already ARRIVED?"}
    CheckStatus -->|"Yes"| UpdateCache["Update Location Cache Only"]
    CheckStatus -->|"No"| CalcDist["Compute Haversine Distance to Destination"]
    CalcDist --> BreachCheck{"Distance <= geofence_radius?"}
    BreachCheck -->|"No"| UpdateCache
    BreachCheck -->|"Yes"| TriggerArrival["Set status = ARRIVED & Emit Arrival Event"]
    TriggerArrival --> UpdateCache
`,
      },
      {
        title: "Level 3: Trip Lifecycle State Machine",
        description: "Standard progression of a delivery order.",
        mermaid: `graph TD
    Dispatched["DISPATCHED"] -->|"Driver starts moving"| EnRoute["EN_ROUTE"]
    EnRoute -->|"Breaches 200m destination geofence"| Arrived["ARRIVED"]
    Arrived -->|"Order handed to customer"| Completed["COMPLETED"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Circular Radius Geofence vs Complex Road Polygon",
      what: "Use circular Haversine radius checks (e.g. 200 meters) for pickup/drop arrival detection rather than intricate street polygon meshes.",
      why: "Circular checks require only a single distance calculation O(1), whereas point-in-polygon raycasting consumes significantly more CPU per ping.",
      problemSolved: "Allows a single server core to evaluate 50,000 geofence checks per second.",
      withoutIt:
        "Geofence processing lags behind real time by 30+ seconds during rush hour traffic.",
      alternatives: [
        "Arbitrary polygon raycasting (Point-in-Polygon).",
        "Geohash cell intersection.",
      ],
      tradeoff:
        "Circular fences can trigger early if a driver is on an elevated expressway directly above the customer's street.",
    },
    {
      title: "State Latching for Geofence Arrival",
      what: "Once a trip status transitions to 'ARRIVED', lock the state so subsequent pings do not re-trigger notifications.",
      why: "Drivers often maneuver, park, or make U-turns near the drop point, moving slightly in and out of the 200m circle.",
      problemSolved:
        "Prevents spamming customers with 4 separate 'Driver has arrived' buzzes in 2 minutes.",
      withoutIt:
        "Customer phone buzzes repeatedly while driver searches for an open parking space.",
      alternatives: [
        "Continuous distance proximity updates.",
        "Debounce timer requiring driver to remain inside geofence for 30 consecutive seconds.",
      ],
      tradeoff:
        "If a driver accidentally drives past without stopping, the trip remains in ARRIVED status until driver intervention.",
    },
  ],
  implementation: {
    behaviour:
      "A FleetTelemetryTracker class that ingests GPS pings, calculates distance to trip destinations, and triggers arrival transitions.",
    algorithm: [
      "1. haversine(lat1, lon1, lat2, lon2): calculate geodesic distance in km.",
      "2. ingest_ping(driver_id, trip_id, lat, lon, timestamp):",
      "   a. Retrieve trip metadata from trips table.",
      "   b. If trip is None or trip['status'] != 'EN_ROUTE': return {'arrived': False, 'status': trip['status']}.",
      "   c. Calculate dist_km = haversine(lat, lon, trip['dest_lat'], trip['dest_lon']).",
      "   d. If dist_km <= trip['geofence_radius_km']:",
      "      - trip['status'] = 'ARRIVED'",
      "      - return {'arrived': True, 'distance_km': round(dist_km, 3), 'status': 'ARRIVED'}",
      "   e. Else:",
      "      - return {'arrived': False, 'distance_km': round(dist_km, 3), 'status': 'EN_ROUTE'}",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Raw GPS Logger",
        detail: "Appends coordinate pings to a list without distance or geofence math.",
      },
      {
        level: "Level 1",
        title: "Proximity Distance Calculator",
        detail: "Computes geodesic distance between driver and customer destination.",
      },
      {
        level: "Level 2",
        title: "Geofence State Latching Engine",
        detail:
          "Automates EN_ROUTE -> ARRIVED transitions with once-and-only-once notification firing.",
      },
      {
        level: "Level 3",
        title: "Distributed Telemetry Mesh",
        detail:
          "Kafka partition balancing, Redis GEO sharding, and dead-reckoning trajectory smoothing.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "fleet_telemetry.py",
        code: `import math

class FleetTelemetryEngine:
    def __init__(self, trips: dict[str, dict]) -> None:
        self.trips = trips  # trip_id -> {dest_lat, dest_lon, geofence_radius_km, status}

    @staticmethod
    def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0
        p1, p2 = math.radians(lat1), math.radians(lat2)
        dp = math.radians(lat2 - lat1)
        dl = math.radians(lon2 - lon1)
        a = math.sin(dp / 2.0)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0)**2
        return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    def process_ping(self, trip_id: str, lat: float, lon: float) -> dict:
        trip = self.trips.get(trip_id)
        if not trip:
            return {"status": "UNKNOWN_TRIP", "arrived": False}

        if trip["status"] != "EN_ROUTE":
            return {"status": trip["status"], "arrived": False}

        dist = self.haversine(lat, lon, trip["dest_lat"], trip["dest_lon"])
        if dist <= trip.get("geofence_radius_km", 0.2):
            trip["status"] = "ARRIVED"
            return {"status": "ARRIVED", "arrived": True, "distance_km": round(dist, 3)}

        return {"status": "EN_ROUTE", "arrived": False, "distance_km": round(dist, 3)}`,
        explanations: [
          {
            code: 'if trip["status"] != "EN_ROUTE": return {"status": trip["status"], "arrived": False}',
            explanation:
              "Latches state so that trips already ARRIVED do not re-trigger notifications.",
          },
          {
            code: 'dist = self.haversine(lat, lon, trip["dest_lat"], trip["dest_lon"])',
            explanation: "Computes current distance to customer destination in kilometers.",
          },
          {
            code: 'if dist <= trip.get("geofence_radius_km", 0.2): trip["status"] = "ARRIVED"',
            explanation:
              "Flips trip state to ARRIVED when driver crosses the circular geofence threshold.",
          },
        ],
      },
    ],
    simulationNote: "Simulates live telemetry geofence processing in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "State Latching Invariant",
      brief:
        "Why is it essential to check `if trip['status'] != 'EN_ROUTE'` before evaluating geofence arrival?",
    },
    {
      level: "Modify",
      title: "Add Dynamic Radius Based on Speed",
      brief:
        "Modify the geofence radius to expand from 200m to 500m if vehicle speed exceeds 60 km/h, giving high-speed highway drivers earlier notification.",
    },
    {
      level: "Build",
      title: "Telemetry Trajectory Compression",
      brief:
        "Implement the Ramer-Douglas-Peucker algorithm to compress a 1,000-point vehicle trajectory down to 50 key inflection points.",
    },
    {
      level: "Think",
      title: "Battery Conservation on Mobile",
      brief:
        "How do rideshare driver apps balance 4-second GPS ping accuracy against mobile phone battery drainage and cellular data caps?",
    },
  ],
  reflection: [
    "Why are circular radius geofences preferred over complex polygon meshes for real-time telemetry?",
    "How does automated geofence milestone tracking improve customer experience compared to manual driver taps?",
    "What streaming architectures absorb millions of periodic GPS pings without overwhelming transactional databases?",
  ],
  techNotes: [
    {
      name: "Kafka Partitioning",
      kind: "Scale",
      note: "Partitioning telemetry streams by `driver_id` ensures that all pings from a given driver are processed sequentially in strict chronological order by the same consumer worker.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Ingest Telemetry Pings and Trigger Geofence Arrivals",
    brief:
      "Implement `track_fleet_telemetry`: given `trips` (dict of trip_id -> `{'dest_lat': float, 'dest_lon': float, 'radius_km': float, 'status': str}`) and `pings` (list of `{'trip_id': str, 'lat': float, 'lon': float, 'timestamp': int}`). For each ping, if the trip is currently 'EN_ROUTE' and driver's Haversine distance to destination <= radius_km, transition status to 'ARRIVED' and record an arrival event `{'trip_id': str, 'timestamp': int, 'distance_km': float}` (rounded to 3 decimal places). Return a dictionary with: `'arrivals'` (list of triggered arrival events) and `'final_trip_states'` (dict of trip_id -> final status).",
    functionName: "track_fleet_telemetry",
    signature: "def track_fleet_telemetry(trips: dict, pings: list[dict]) -> dict:",
    starterCode: `import math

def track_fleet_telemetry(trips: dict, pings: list[dict]) -> dict:
    # trips: {trip_id: {"dest_lat": float, "dest_lon": float, "radius_km": float, "status": str}}
    # pings: [{"trip_id": str, "lat": float, "lon": float, "timestamp": int}]
    # Return {"arrivals": list[dict], "final_trip_states": dict}
    r = 6371.0

    def haversine(lat1, lon1, lat2, lon2):
        p1, p2 = math.radians(lat1), math.radians(lat2)
        dp = math.radians(lat2 - lat1)
        dl = math.radians(lon2 - lon1)
        a = math.sin(dp / 2.0)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0)**2
        return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    arrivals = []
    # Make a shallow copy of statuses
    trip_status = {t_id: dict(data) for t_id, data in trips.items()}

    for p in pings:
        t_id = p["trip_id"]
        trip = trip_status.get(t_id)
        if not trip:
            continue
        if trip["status"] != "EN_ROUTE":
            continue

        dist = haversine(p["lat"], p["lon"], trip["dest_lat"], trip["dest_lon"])
        if dist <= trip.get("radius_km", 0.2):
            trip["status"] = "ARRIVED"
            arrivals.append({
                "trip_id": t_id,
                "timestamp": p["timestamp"],
                "distance_km": round(dist, 3)
            })

    final_states = {t_id: data["status"] for t_id, data in trip_status.items()}
    return {"arrivals": arrivals, "final_trip_states": final_states}
`,
    javaSignature:
      "public static Map<String, Object> trackFleetTelemetry(Map<String, Map<String, Object>> trips, List<Map<String, Object>> pings)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> trackFleetTelemetry(
        Map<String, Map<String, Object>> trips,
        List<Map<String, Object>> pings
    ) {
        Map<String, Map<String, Object>> tripStatus = new HashMap<>();
        for (Map.Entry<String, Map<String, Object>> e : trips.entrySet()) {
            tripStatus.put(e.getKey(), new HashMap<>(e.getValue()));
        }

        List<Map<String, Object>> arrivals = new ArrayList<>();

        for (Map<String, Object> p : pings) {
            String tId = (String) p.get("trip_id");
            Map<String, Object> trip = tripStatus.get(tId);
            if (trip == null) continue;

            String status = (String) trip.get("status");
            if (!"EN_ROUTE".equals(status)) continue;

            double pLat = ((Number) p.get("lat")).doubleValue();
            double pLon = ((Number) p.get("lon")).doubleValue();
            double dLat = ((Number) trip.get("dest_lat")).doubleValue();
            double dLon = ((Number) trip.get("dest_lon")).doubleValue();
            double radius = ((Number) trip.getOrDefault("radius_km", 0.2)).doubleValue();

            double dist = haversine(pLat, pLon, dLat, dLon);
            if (dist <= radius) {
                trip.put("status", "ARRIVED");
                Map<String, Object> arr = new HashMap<>();
                arr.put("trip_id", tId);
                arr.put("timestamp", p.get("timestamp"));
                arr.put("distance_km", Math.round(dist * 1000.0) / 1000.0);
                arrivals.add(arr);
            }
        }

        Map<String, String> finalStates = new HashMap<>();
        for (Map.Entry<String, Map<String, Object>> e : tripStatus.entrySet()) {
            finalStates.put(e.getKey(), (String) e.getValue().get("status"));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("arrivals", arrivals);
        result.put("final_trip_states", finalStates);
        return result;
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371.0;
        double p1 = Math.toRadians(lat1);
        double p2 = Math.toRadians(lat2);
        double dp = Math.toRadians(lat2 - lat1);
        double dl = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dp / 2.0) * Math.sin(dp / 2.0)
                 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2.0) * Math.sin(dl / 2.0);
        return 2.0 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    }
}`,
    mermaid: `graph TD
    Start["track_fleet_telemetry(trips, pings)"] --> LoopP["For each ping in pings"]
    LoopP --> CheckTrip{"Trip exists and status == 'EN_ROUTE'?"}
    CheckTrip -->|"No"| NextP["Skip to next ping"]
    CheckTrip -->|"Yes"| CalcDist["Compute Haversine distance(ping, dest)"]
    CalcDist --> Geofence{"Distance <= radius_km?"}
    Geofence -->|"No"| NextP
    Geofence -->|"Yes"| TriggerArrival["Set status = 'ARRIVED' & Append arrival event"]
    TriggerArrival --> NextP
    NextP --> AnyP{"More pings?"}
    AnyP -->|"Yes"| LoopP
    AnyP -->|"No"| Return["Return arrivals and final_trip_states"]
`,
    hints: [
      "Check status == 'EN_ROUTE' before calculating distance so already arrived trips are latched.",
      "Round distance_km to 3 decimal places.",
      "Use Haversine formula with earth radius 6371.0 km.",
    ],
    tests: [
      {
        name: "Driver approaches destination and breaches 200m geofence",
        args: [
          {
            TRIP_1: {
              dest_lat: 37.7749,
              dest_lon: -122.4194,
              radius_km: 0.25,
              status: "EN_ROUTE",
            },
          },
          [
            { trip_id: "TRIP_1", lat: 37.78, lon: -122.42, timestamp: 1000 }, // ~0.57 km away
            { trip_id: "TRIP_1", lat: 37.7755, lon: -122.419, timestamp: 1010 }, // ~0.07 km away (inside 0.25 km)
            { trip_id: "TRIP_1", lat: 37.775, lon: -122.4192, timestamp: 1020 }, // Still inside, should not trigger twice
          ],
        ],
        expected: {
          arrivals: [{ trip_id: "TRIP_1", timestamp: 1010, distance_km: 0.075 }],
          final_trip_states: { TRIP_1: "ARRIVED" },
        },
      },
      {
        name: "Driver remains outside geofence radius",
        args: [
          {
            TRIP_2: {
              dest_lat: 0.0,
              dest_lon: 0.0,
              radius_km: 0.1,
              status: "EN_ROUTE",
            },
          },
          [{ trip_id: "TRIP_2", lat: 0.01, lon: 0.01, timestamp: 500 }], // ~1.57 km away
        ],
        expected: {
          arrivals: [],
          final_trip_states: { TRIP_2: "EN_ROUTE" },
        },
      },
    ],
    explanationPrompt:
      "Explain how your telemetry tracker applies the Haversine distance metric to detect circular geofence breaches and latches trip state to prevent duplicate notifications.",
  },
};

// ----------------------------------------------------------------------------
// Case 45: Anycast Global VPN & Reverse Proxy
// ----------------------------------------------------------------------------
export const case45_anycastProxy = {
  id: "cs-anycast-proxy-045",
  slug: "anycast-vpn-reverse-proxy",
  index: "45",
  title: "How Does an Anycast Edge Reverse Proxy Terminate TLS and Route Across Healthy Upstreams?",
  shortTitle: "Anycast Edge Proxy",
  category: "Reliability & Scalability",
  subcategory: "Edge Anycast & Weighted Upstream Balancing",
  difficulty: "Intermediate",
  learnerLevel: "Builder",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "premium",
  rcCost: 60,
  summary:
    "Edge networks like Cloudflare and AWS Global Accelerator announce identical IP addresses across hundreds of global PoPs using BGP Anycast. Discover how edge reverse proxies terminate TLS near the user, track backend health with active probes, and route traffic using weighted round-robin algorithms.",
  learningObjectives: [
    "Explain BGP Anycast routing principles and near-user TLS termination benefits.",
    "Implement weighted round-robin upstream server selection.",
    "Model active health-check probes and dynamic failure threshold transitions.",
    "Execute graceful connection draining when an upstream server is decommissioned.",
  ],
  prerequisites: [
    "IP networking and BGP Anycast fundamentals",
    "Layer 4 / Layer 7 reverse proxy concepts",
    "Round-robin and weighted selection algorithms",
  ],
  engineeringConcepts: [
    "BGP Anycast Routing",
    "Weighted Round-Robin Balancing",
    "Active Health Probe Monitoring",
    "Graceful Connection Draining",
    "TLS Termination Edge Offload",
  ],
  technologies: ["Python", "Java", "BGP Anycast", "Nginx", "Envoy Proxy"],
  tech: ["Networking", "Reverse Proxy", "Load Balancer"],
  tags: ["networking", "anycast", "cloudflare", "proxy", "intermediate"],
  glossary: [
    {
      term: "BGP Anycast Routing",
      plainDefinition:
        "Announcing a single IP address from dozens of data centers worldwide so internet routers send packets to the nearest PoP.",
    },
    {
      term: "Weighted Round-Robin Balancing",
      plainDefinition:
        "Distributing traffic across backend servers proportional to their processing capacity weight.",
    },
    {
      term: "Active Health Probe Monitoring",
      plainDefinition:
        "Periodically sending synthetic health checks to backend nodes to detect failures before user traffic fails.",
    },
    {
      term: "Graceful Connection Draining",
      plainDefinition:
        "Allowing in-flight requests to complete while routing all new incoming requests to other healthy servers.",
    },
    {
      term: "TLS Termination Edge Offload",
      plainDefinition:
        "Completing the expensive cryptographic TLS handshake at the edge PoP near the client, accelerating connection setup.",
    },
  ],
  primers: [
    {
      concept: "Why Anycast Cuts Latency",
      minutes: 4,
      definition:
        "A client in Tokyo connecting to a server in Virginia must wait 160ms for every TCP/TLS handshake round trip. With Anycast, TLS terminates at the Tokyo PoP in 4ms, then traffic travels over private optimized backbones.",
      whyNeeded: "Reduces connection establishment from 500ms down to 10ms for global users.",
      analogy:
        "Calling a local telephone dispatch office in your city instead of dialing long-distance to a headquarters across the globe.",
      tinyExample: "nearest_pop = bgp_route(client_ip)  # routed by internet BGP hops",
    },
    {
      concept: "Weighted Round-Robin Upstream Selector",
      minutes: 4,
      definition:
        "If Server A has weight 3 and Server B has weight 1, Server A should receive 75% of incoming requests and Server B 25%. If Server A fails health checks, 100% routes to Server B.",
      whyNeeded:
        "Allows mixed fleets of high-capacity and low-capacity servers without overloading weaker machines.",
      analogy: "Assigning 3 tasks to a senior engineer for every 1 task assigned to an intern.",
      tinyExample:
        "healthy = [s for s in servers if s['healthy']]\ntarget = select_weighted(healthy)",
    },
  ],
  discover: {
    situation:
      "A global video gaming service hosted all servers in London. Players in Sydney and Tokyo suffered 320ms connection lag before a game even started due to 4 TCP/TLS round-trips across undersea cables. During a server crash, 50% of incoming player connections threw 502 Bad Gateway errors because the proxy had no health checks.",
    humanFlow: [
      "User connects to 198.51.100.1 (Anycast IP).",
      "Internet BGP routers steer packet to nearest Edge PoP (e.g. Tokyo).",
      "Edge Proxy terminates TLS handshake locally in 5ms.",
      "Edge Proxy queries Upstream Pool for a healthy backend origin.",
      "Request routes over private backbone to origin; responses stream back to client.",
    ],
    question:
      "How do you design an Anycast reverse proxy that routes traffic to healthy backends using weighted load balancing and dynamically ejects failing upstreams?",
    whyItExists: [
      "Internet latency is governed by the speed of light; terminating TLS near users cuts handshake delay.",
      "High availability requires automated ejection of failing servers without human operator intervention.",
      "Capacity management requires routing more traffic to powerful compute nodes.",
    ],
  },
  understand: {
    overview:
      "The Anycast Edge Proxy sits at the network boundary. BGP routes client packets to the nearest PoP. Inside the PoP, an Upstream Gateway tracks backend health via periodic active probes (consecutive failures threshold). Healthy upstreams receive requests selected via weighted round-robin distribution.",
    components: [
      {
        name: "Anycast BGP Edge",
        whatIsIt: "Edge point-of-presence announcing global IP prefixes.",
        whyItExists: "Terminates Layer 4 TCP and Layer 7 TLS near end users.",
        whatItDoes: "Absorbs DDoS attacks and terminates handshakes.",
      },
      {
        name: "Upstream Registry",
        whatIsIt: "Pool of origin backend servers with configured weights and status.",
        whyItExists: "Maintains cluster capacity metadata.",
        whatItDoes: "Stores server IDs, weights, and health flags.",
      },
      {
        name: "Active Health Checker",
        whatIsIt: "Background watchdog probing `/health` endpoints periodically.",
        whyItExists: "Detects degraded or crashed backends before user requests fail.",
        whatItDoes: "Increments failure counters and ejects servers exceeding threshold.",
      },
      {
        name: "Weighted Router",
        whatIsIt: "Balancing algorithm picking the next healthy target.",
        whyItExists: "Distributes load proportional to server capacity.",
        whatItDoes: "Executes weighted round-robin cycle over active healthy servers.",
      },
    ],
    analogy: {
      title: "Bank Tellers with Line Queue Manager",
      everyday: [
        "You enter a bank branch and take a ticket from the automated kiosk at the door (Edge Anycast entry).",
        "Behind the counter are 3 tellers: Teller 1 is an experienced veteran who handles 3 customers per cycle, Teller 2 is a trainee handling 1 customer per cycle (Weighted Balancing).",
        "If Teller 2 steps away for a break (Health Check Failure), the queue manager stops routing customers to window 2.",
      ],
      technical: [
        "Kiosk at entrance corresponds to the Anycast Edge PoP.",
        "Experienced veteran vs trainee corresponds to Server Weights.",
        "Teller stepping away corresponds to Upstream Health Probe Ejection.",
      ],
    },
    flow: [
      "Client sends HTTP request to Edge Proxy.",
      "Health Checker maintains server statuses: server marked UNHEALTHY if consecutive_failures >= 3.",
      "Filter upstream pool: select servers where is_healthy is True.",
      "If healthy pool is empty: return 503 Service Unavailable.",
      "Apply Weighted Round-Robin: select upstream proportional to weight.",
      "Forward request to selected upstream and return response to client.",
    ],
  },
  concepts: [
    {
      id: "concept-weighted-rr",
      name: "Weighted Round-Robin Balancing",
      difficulty: "Intermediate",
      simpleDefinition:
        "Distributing requests across servers such that a server with weight W receives W requests for every cycle.",
      whyItExists:
        "Prevents heterogeneous server fleets (e.g. 16-core vs 4-core instances) from being overloaded.",
      realWorldAnalogy:
        "A card dealer dealing 2 cards to player A and 1 card to player B each round.",
      technicalExplanation:
        "Expands weights into a distribution list or uses smooth weighted round-robin (Nginx algorithm) to distribute evenly.",
      caseApplication: "Sends 3x traffic to 32GB RAM nodes and 1x traffic to 8GB RAM nodes.",
      commonMistakes: [
        "Bursting all weight allocations consecutively (e.g. A, A, A, B instead of A, B, A, A), causing temporary spikes on server A.",
        "Failing to handle weight == 0 (maintenance mode).",
      ],
      practice: [
        "Given servers A (weight 2) and B (weight 1), write the 3-step round-robin dispatch sequence.",
        "What happens to the distribution when server A is marked unhealthy?",
      ],
    },
    {
      id: "concept-health-probe",
      name: "Active Health Probe Thresholds",
      difficulty: "Intermediate",
      simpleDefinition:
        "Requiring N consecutive failures to mark a server down, and M consecutive successes to restore it.",
      whyItExists:
        "Prevents server flapping (rapidly toggling healthy/unhealthy on a single dropped packet).",
      realWorldAnalogy:
        "A referee waiting for 3 consecutive warnings before disqualifying a player.",
      technicalExplanation:
        "State machine: if probe fails, failures += 1. If failures >= 3, is_healthy = False. If probe passes, successes += 1.",
      caseApplication: "Protects proxy stability from intermittent network glitches.",
      commonMistakes: [
        "Ejecting a server on a single failed probe.",
        "Immediately flooding a recovered server with 100% traffic without warm-up.",
      ],
      practice: [
        "Why is health check interval typically 5 to 10 seconds?",
        "What HTTP status code should a server return when entering graceful maintenance?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Anycast Edge Proxy showing weighted routing, active probes, and upstream pool management.",
    levels: [
      {
        title: "Level 1: Edge Proxy Interaction",
        description: "Global client connections routed to Edge PoPs and origin clusters.",
        mermaid: `graph TD
    Client["Global Users"] -->|"BGP Anycast"| PoP["Nearest Edge PoP"]
    PoP -->|"Terminate TLS"| Proxy["L7 Reverse Proxy"]
    Proxy -->|"Weighted Dispatch"| Upstreams["Origin Upstream Fleet"]
    Watchdog["Active Health Checker"] -->|"Periodic Probes"| Upstreams
    Watchdog -->|"Update State"| Proxy
`,
      },
      {
        title: "Level 2: Weighted Upstream Selection Pipeline",
        description: "Filtering healthy servers and applying weighted selection.",
        mermaid: `graph TD
    Request["Incoming HTTP Request"] --> Filter["Filter Upstreams where is_healthy == True"]
    Filter --> AnyHealthy{"Any healthy server left?"}
    AnyHealthy -->|"No"| Err503["Return 503 Service Unavailable"]
    AnyHealthy -->|"Yes"| WeightedRR["Weighted Round-Robin Selector"]
    WeightedRR --> Forward["Forward to Selected Upstream"]
`,
      },
      {
        title: "Level 3: Health Probe State Machine",
        description: "Transitions between Healthy and Unhealthy with failure counters.",
        mermaid: `graph TD
    Healthy["HEALTHY (failures = 0)"] -->|"Probe Fails"| Degraded["failures += 1"]
    Degraded -->|"failures >= 3"| Unhealthy["UNHEALTHY (Ejected from Pool)"]
    Degraded -->|"Probe Succeeds"| Healthy
    Unhealthy -->|"M Consecutive Successes"| Healthy
`,
      },
    ],
  },
  decisions: [
    {
      title: "Active Probing vs Passive Error Detection",
      what: "Use dedicated active synthetic health check probes in background threads rather than relying solely on failed user requests.",
      why: "Active probes detect that a server has crashed before real end users receive connection failures.",
      problemSolved:
        "Prevents real customers from experiencing 502 Bad Gateway errors when an origin node reboots.",
      withoutIt:
        "Hundreds of customer requests fail before the proxy realizes a backend server is dead.",
      alternatives: [
        "Passive error rate monitoring (circuit breaker on live requests).",
        "Manual operator toggling.",
      ],
      tradeoff: "Generates periodic synthetic HTTP traffic on backend origin servers.",
    },
    {
      title: "Consecutive Failure Threshold (3 Strikes)",
      what: "Require 3 consecutive failed probes before ejecting a server, rather than ejecting on the first failure.",
      why: "A single probe can time out due to a transient network switch hiccup; ejecting immediately causes server flapping.",
      problemSolved: "Eliminates pool instability caused by transient packet loss.",
      withoutIt: "Healthy servers are repeatedly ejected and restored every few minutes.",
      alternatives: ["Single-strike immediate ejection.", "Sliding window error percentage."],
      tradeoff:
        "Dead servers may remain in the pool for up to 3 probe intervals (e.g. 15 seconds) before complete ejection.",
    },
  ],
  implementation: {
    behaviour:
      "A ReverseProxyRouter class that tracks upstream health based on probe reports and routes requests using weighted round-robin.",
    algorithm: [
      "1. update_health(server_id, success):",
      "   a. If not success: failures[server_id] += 1; if failures[server_id] >= 3: is_healthy[server_id] = False.",
      "   b. If success: failures[server_id] = 0; is_healthy[server_id] = True.",
      "2. route_request():",
      "   a. Build healthy candidate list: for each server where is_healthy is True and weight > 0, replicate server_id by weight.",
      "   b. If healthy list is empty: return '503_SERVICE_UNAVAILABLE'.",
      "   c. Select next server: index = rr_cursor % len(healthy_list); rr_cursor += 1.",
      "   d. Return healthy_list[index].",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Random Proxy Forwarder",
        detail: "Forwards to random server with no weight or health checks. Fails on node crash.",
      },
      {
        level: "Level 1",
        title: "Simple Round-Robin with Health Checks",
        detail: "Ejects failed servers and cycles evenly among surviving nodes.",
      },
      {
        level: "Level 2",
        title: "Weighted Round-Robin with Consecutive Thresholds",
        detail: "Supports server weights and 3-strike failure dampening.",
      },
      {
        level: "Level 3",
        title: "Global Anycast Edge Controller",
        detail: "Combines BGP Geo-DNS steering, Envoy Layer 7 filters, and zero-downtime draining.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "anycast_proxy.py",
        code: `class AnycastReverseProxy:
    def __init__(self, upstreams: list[dict]) -> None:
        # upstreams: [{"id": str, "weight": int}]
        self.upstreams = {s["id"]: s["weight"] for s in upstreams}
        self.failures = {s["id"]: 0 for s in upstreams}
        self.healthy = {s["id"]: True for s in upstreams}
        self.cursor = 0

    def record_probe(self, server_id: str, success: bool) -> None:
        if server_id not in self.upstreams:
            return
        if success:
            self.failures[server_id] = 0
            self.healthy[server_id] = True
        else:
            self.failures[server_id] += 1
            if self.failures[server_id] >= 3:
                self.healthy[server_id] = False

    def route(self) -> str:
        # Build weighted candidate pool
        pool = []
        for s_id, weight in self.upstreams.items():
            if self.healthy[s_id] and weight > 0:
                pool.extend([s_id] * weight)

        if not pool:
            return "503_SERVICE_UNAVAILABLE"

        selected = pool[self.cursor % len(pool)]
        self.cursor += 1
        return selected`,
        explanations: [
          {
            code: "if self.failures[server_id] >= 3: self.healthy[server_id] = False",
            explanation: "Enforces 3-strike threshold to prevent premature flapping.",
          },
          {
            code: "pool.extend([s_id] * weight)",
            explanation: "Constructs weighted round-robin distribution pool.",
          },
          {
            code: 'if not pool: return "503_SERVICE_UNAVAILABLE"',
            explanation: "Safely returns 503 when all backend origins have failed health checks.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates weighted upstream selection and active probe tracking in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Flapping Prevention",
      brief:
        "Explain why requiring 3 consecutive failed probes prevents transient packet loss from kicking servers out of rotation.",
    },
    {
      level: "Modify",
      title: "Smooth Weighted Round-Robin",
      brief:
        "Implement Nginx's smooth weighted round-robin algorithm where server selections are interleaved (A, B, A, A) rather than grouped consecutively.",
    },
    {
      level: "Build",
      title: "Graceful Connection Draining",
      brief:
        "Add a drain_server(server_id) method that sets weight to 0 so no new requests land on the server while existing requests finish.",
    },
    {
      level: "Think",
      title: "BGP Anycast Route Flapping",
      brief:
        "What happens if an Anycast PoP router crashes mid-TCP connection, and how do TCP SYN proxies maintain session continuity?",
    },
  ],
  reflection: [
    "Why does Anycast routing combined with edge TLS termination provide massive latency gains?",
    "How does weighted round-robin ensure balanced resource utilization across asymmetric server hardware?",
    "Why must health check evaluators incorporate failure thresholds to avoid flap cascades?",
  ],
  techNotes: [
    {
      name: "BGP Anycast vs GeoDNS",
      kind: "Routing Protocol",
      note: "GeoDNS uses client DNS resolvers to steer traffic and suffers from DNS cache TTL lag (minutes). BGP Anycast routes at the network routing layer and fails over in sub-second time via BGP withdraw announcements.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Route Requests via Weighted Upstreams and Handle Health Probes",
    brief:
      "Implement `simulate_anycast_router`: given `servers` `[{'id': str, 'weight': int}]`, `probes` `[{'server_id': str, 'success': bool}]`, and `request_count` (int). Servers start healthy with 0 failures. If a server has 3 or more consecutive failed probes, mark it unhealthy. If a probe succeeds, reset its failure counter to 0 and restore healthy status. Route `request_count` requests using weighted round-robin across healthy servers with weight > 0 (replicate server ID by its weight, cycle with round-robin cursor). If no healthy servers exist, record '503'. Return a dictionary with: `'routed_requests'` (list of server IDs routed to) and `'unhealthy_servers'` (sorted list of server IDs currently unhealthy).",
    functionName: "simulate_anycast_router",
    signature:
      "def simulate_anycast_router(servers: list[dict], probes: list[dict], request_count: int) -> dict:",
    starterCode: `def simulate_anycast_router(servers: list[dict], probes: list[dict], request_count: int) -> dict:
    # servers: [{"id": str, "weight": int}]
    # probes: [{"server_id": str, "success": bool}]
    # request_count: int
    # Return {"routed_requests": list[str], "unhealthy_servers": list[str]}
    weights = {s["id"]: s.get("weight", 1) for s in servers}
    failures = {s["id"]: 0 for s in servers}
    healthy = {s["id"]: True for s in servers}

    for p in probes:
        s_id = p["server_id"]
        if s_id in failures:
            if p["success"]:
                failures[s_id] = 0
                healthy[s_id] = True
            else:
                failures[s_id] += 1
                if failures[s_id] >= 3:
                    healthy[s_id] = False

    # Build weighted round-robin pool maintaining server order
    pool = []
    for s in servers:
        s_id = s["id"]
        if healthy.get(s_id, False) and weights.get(s_id, 0) > 0:
            pool.extend([s_id] * weights[s_id])

    routed = []
    if not pool:
        routed = ["503"] * request_count
    else:
        for i in range(request_count):
            routed.append(pool[i % len(pool)])

    unhealthy_list = sorted([s_id for s_id, is_h in healthy.items() if not is_h])
    return {"routed_requests": routed, "unhealthy_servers": unhealthy_list}
`,
    javaSignature:
      "public static Map<String, Object> simulateAnycastRouter(List<Map<String, Object>> servers, List<Map<String, Object>> probes, int requestCount)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> simulateAnycastRouter(
        List<Map<String, Object>> servers,
        List<Map<String, Object>> probes,
        int requestCount
    ) {
        Map<String, Integer> weights = new HashMap<>();
        Map<String, Integer> failures = new HashMap<>();
        Map<String, Boolean> healthy = new HashMap<>();

        for (Map<String, Object> s : servers) {
            String sId = (String) s.get("id");
            int w = ((Number) s.getOrDefault("weight", 1)).intValue();
            weights.put(sId, w);
            failures.put(sId, 0);
            healthy.put(sId, true);
        }

        for (Map<String, Object> p : probes) {
            String sId = (String) p.get("server_id");
            boolean success = (boolean) p.get("success");
            if (failures.containsKey(sId)) {
                if (success) {
                    failures.put(sId, 0);
                    healthy.put(sId, true);
                } else {
                    int f = failures.get(sId) + 1;
                    failures.put(sId, f);
                    if (f >= 3) {
                        healthy.put(sId, false);
                    }
                }
            }
        }

        List<String> pool = new ArrayList<>();
        for (Map<String, Object> s : servers) {
            String sId = (String) s.get("id");
            if (healthy.getOrDefault(sId, false) && weights.getOrDefault(sId, 0) > 0) {
                int w = weights.get(sId);
                for (int i = 0; i < w; i++) {
                    pool.add(sId);
                }
            }
        }

        List<String> routed = new ArrayList<>();
        if (pool.isEmpty()) {
            for (int i = 0; i < requestCount; i++) routed.add("503");
        } else {
            for (int i = 0; i < requestCount; i++) {
                routed.add(pool.get(i % pool.size()));
            }
        }

        List<String> unhealthyList = new ArrayList<>();
        for (Map.Entry<String, Boolean> entry : healthy.entrySet()) {
            if (!entry.getValue()) {
                unhealthyList.add(entry.getKey());
            }
        }
        Collections.sort(unhealthyList);

        Map<String, Object> result = new HashMap<>();
        result.put("routed_requests", routed);
        result.put("unhealthy_servers", unhealthyList);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["simulate_anycast_router(...)"] --> ProbeLoop["Apply all probes to update failure counts"]
    ProbeLoop --> BuildPool["Build weighted pool from healthy servers with weight > 0"]
    BuildPool --> PoolCheck{"Pool empty?"}
    PoolCheck -->|"Yes"| Route503["routed = ['503'] * request_count"]
    PoolCheck -->|"No"| CycleRR["For i in range(request_count): append pool[i % len(pool)]"]
    Route503 --> Return["Return routed_requests and unhealthy_servers"]
    CycleRR --> Return
`,
    hints: [
      "Require 3 consecutive failed probes before flipping a server to unhealthy.",
      "Reset failures to 0 immediately upon a successful probe.",
      "Cycle through the weighted pool using index % pool_size.",
    ],
    tests: [
      {
        name: "Weighted 2-to-1 distribution between two healthy servers",
        args: [
          [
            { id: "S1", weight: 2 },
            { id: "S2", weight: 1 },
          ],
          [],
          6,
        ],
        expected: {
          routed_requests: ["S1", "S1", "S2", "S1", "S1", "S2"],
          unhealthy_servers: [],
        },
      },
      {
        name: "Server ejected after 3 failures, traffic diverts to survivor",
        args: [
          [
            { id: "S1", weight: 1 },
            { id: "S2", weight: 1 },
          ],
          [
            { server_id: "S1", success: false },
            { server_id: "S1", success: false },
            { server_id: "S1", success: false }, // 3 strikes -> S1 down
          ],
          4,
        ],
        expected: {
          routed_requests: ["S2", "S2", "S2", "S2"],
          unhealthy_servers: ["S1"],
        },
      },
      {
        name: "All servers down returns 503",
        args: [
          [{ id: "S1", weight: 1 }],
          [
            { server_id: "S1", success: false },
            { server_id: "S1", success: false },
            { server_id: "S1", success: false },
          ],
          2,
        ],
        expected: {
          routed_requests: ["503", "503"],
          unhealthy_servers: ["S1"],
        },
      },
    ],
    explanationPrompt:
      "Explain how your anycast router applies weighted round-robin distribution, executes 3-strike failure thresholds, and handles graceful degradation when servers fail.",
  },
};

// ----------------------------------------------------------------------------
// Case 46: CAPTCHA & Bot Defense Engine
// ----------------------------------------------------------------------------
export const case46_captchaDefense = {
  id: "cs-captcha-defense-046",
  slug: "captcha-bot-defense-engine",
  index: "46",
  title:
    "How Does an Adaptive Bot Mitigation Engine Challenge Automated Scrapers with Proof-of-Work?",
  shortTitle: "Bot Defense & CAPTCHA",
  category: "Security & Identity",
  subcategory: "Bot Detection & Proof-of-Work Challenges",
  difficulty: "Intermediate",
  learnerLevel: "Builder",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "premium",
  rcCost: 50,
  summary:
    "Web Application Firewalls (WAFs) like Cloudflare protect online platforms from automated credential stuffing and scraping bots. Discover how behavioral risk scoring triggers adaptive Proof-of-Work cryptographic puzzles that make large-scale bot attacks computationally expensive while keeping human browsing seamless.",
  learningObjectives: [
    "Design adaptive bot mitigation pipelines with behavioral risk scoring.",
    "Implement cryptographic Proof-of-Work (PoW) client puzzle generation and verification.",
    "Enforce sliding-window IP rate thresholds to distinguish scripts from humans.",
    "Issue cryptographic challenge bypass tokens with replay protection.",
  ],
  prerequisites: [
    "Cryptographic hashing (SHA-256)",
    "Rate limiting and sliding window counters",
    "Proof-of-Work concepts (difficulty leading zeros)",
  ],
  engineeringConcepts: [
    "Proof-of-Work Puzzle Verification",
    "Behavioral Threat Scoring",
    "Sliding Window Request Tracker",
    "Replay-Protected Bypass Tokens",
    "Adaptive Challenge Escalation",
  ],
  technologies: ["Python", "Java", "SHA-256", "Redis", "Cloudflare WAF"],
  tech: ["Cryptography", "Rate Limiter", "WAF"],
  tags: ["security", "captcha", "pow", "bot-defense", "intermediate"],
  glossary: [
    {
      term: "Proof-of-Work Puzzle Verification",
      plainDefinition:
        "Requiring the client to find a nonce where SHA256(challenge + nonce) starts with N leading zeros.",
    },
    {
      term: "Behavioral Threat Scoring",
      plainDefinition:
        "Evaluating client attributes (request velocity, user agent consistency) to assign a risk score from 0 to 100.",
    },
    {
      term: "Sliding Window Request Tracker",
      plainDefinition:
        "Tracking requests over the last 60 seconds to detect automated burst scripts.",
    },
    {
      term: "Replay-Protected Bypass Tokens",
      plainDefinition:
        "A signed clearance cookie issued upon solving a challenge that cannot be reused across different IP addresses.",
    },
    {
      term: "Adaptive Challenge Escalation",
      plainDefinition:
        "Allowing legitimate traffic freely, challenging suspicious traffic with PoW, and hard-blocking known malicious IPs.",
    },
  ],
  primers: [
    {
      concept: "Proof-of-Work as an Economic Deterrent",
      minutes: 4,
      definition:
        "Solving a puzzle takes 0.2 seconds of CPU for a human (barely noticeable in browser). But for an attacker sending 1,000,000 requests, it requires 200,000 CPU seconds, bankrupting their server cluster.",
      whyNeeded:
        "Deters scrapers without requiring humans to click on pictures of traffic lights and fire hydrants.",
      analogy:
        "Putting a heavy coin-drop turnstile at a park entrance: free visitors don't mind dropping a penny, but an army of robots cannot afford 10 million pennies.",
      tinyExample: "while not sha256(f'{challenge}{nonce}').startswith('000'):\n    nonce += 1",
    },
    {
      concept: "Leading Zero Hash Verification",
      minutes: 4,
      definition:
        "Generating the proof takes thousands of hash trials, but verifying the proof takes the server exactly one hash calculation in O(1) time.",
      whyNeeded:
        "Server validation must be computationally lightweight to avoid self-inflicted Denial of Service.",
      analogy:
        "Solving a Rubik's cube takes minutes of work, but a spectator can verify it is solved in a single glance.",
      tinyExample: "is_valid = sha256(f'{challenge}{nonce}').startswith('0' * difficulty)",
    },
  ],
  discover: {
    situation:
      "A concert ticketing platform was targeted by automated scalper botnets buying up 10,000 tickets in 3 seconds. The team added an image CAPTCHA, but real fans hated clicking blurry motorcycle pictures, and AI vision APIs solved the CAPTCHAs with 95% accuracy. Meanwhile, API scraping scripts bypassed the frontend entirely.",
    humanFlow: [
      "Client sends HTTP request to ticketing checkout API.",
      "Bot Engine inspects client request frequency over sliding 60-second window.",
      "If frequency is normal: request is passed immediately without challenge.",
      "If frequency is elevated: server returns 401 Challenge with a cryptographic seed and difficulty.",
      "Client browser solves SHA-256 PoW in web worker in 200ms and resubmits solution nonce.",
      "Server verifies hash in 1 microsecond and grants clearance token.",
    ],
    question:
      "How do you design an adaptive bot defense engine that challenges suspicious clients with verifiable Proof-of-Work puzzles without disrupting regular humans?",
    whyItExists: [
      "Visual CAPTCHAs degrade human user conversion while failing against modern vision models.",
      "Computational Proof-of-Work changes attacker economics by exhausting botnet CPU resources.",
      "O(1) server verification ensures defense infrastructure remains resilient under attack.",
    ],
  },
  understand: {
    overview:
      "The Bot Defense Engine consists of a Velocity Meter, a Challenge Generator, and a PoW Validator. Normal requests flow through cleanly. When velocity crosses threshold T, the gateway issues a challenge string. The client finds an integer nonce such that `sha256(challenge + nonce)` starts with D zeros. The validator verifies the hash in O(1) and issues a time-bounded clearance token.",
    components: [
      {
        name: "Request Velocity Meter",
        whatIsIt: "Sliding-window counter tracking request frequency per IP or session.",
        whyItExists: "Identifies automated burst patterns distinct from human browsing speeds.",
        whatItDoes: "Flags IPs exceeding rate limits for challenge escalation.",
      },
      {
        name: "PoW Challenge Generator",
        whatIsIt: "Service producing cryptographically random challenge strings.",
        whyItExists: "Provides unique, time-stamped puzzle inputs that cannot be precomputed.",
        whatItDoes: "Generates `{salt}:{timestamp}` seeds and specifies leading-zero difficulty.",
      },
      {
        name: "O(1) Hash Validator",
        whatIsIt: "Endpoint verifying client-submitted nonces.",
        whyItExists: "Confirms work was completed without spending server CPU.",
        whatItDoes: "Computes single SHA-256 hash and checks leading zeros prefix.",
      },
      {
        name: "Clearance Token Vault",
        whatIsIt: "HMAC signer issuing short-lived bypass cookies.",
        whyItExists: "Allows verified clients to browse freely for the next 15 minutes.",
        whatItDoes: "Issues signed tokens tied to client IP and user agent.",
      },
    ],
    analogy: {
      title: "The Bouncer and the Mechanical Key",
      everyday: [
        "A popular club bouncer lets casual patrons walk in one-by-one without friction.",
        "When an aggressive crowd rushes the door, the bouncer hands each person a block of wood and asks them to carve a specific notch before entering.",
        "A single human carves the notch in 30 seconds and enters. But a gang trying to rush 5,000 fake people inside is paralyzed by the carving requirement.",
      ],
      technical: [
        "Casual patrons correspond to Normal Low-Velocity Traffic.",
        "Carving the wooden notch corresponds to Client Proof-of-Work Computation.",
        "Bouncer inspecting the carved notch in 1 second corresponds to O(1) Server Hash Verification.",
      ],
    },
    flow: [
      "Client submits request with IP.",
      "Meter counts requests in sliding window: if count < rate_threshold, return 'ALLOW'.",
      "If count >= rate_threshold: check if request contains valid solution nonce for challenge.",
      "If no solution provided: return {'status': 'CHALLENGE', 'challenge': seed, 'difficulty': D}.",
      "If solution provided: verify sha256(challenge + nonce).startswith('0' * D).",
      "If verification passes: return 'ALLOW_VERIFIED'.",
      "If verification fails: return 'REJECT_INVALID_POW'.",
    ],
  },
  concepts: [
    {
      id: "concept-pow-asymmetric",
      name: "Asymmetric Verification Complexity",
      difficulty: "Intermediate",
      simpleDefinition:
        "A task that is computationally hard to compute (requires 2^D attempts) but trivially easy to check (1 attempt).",
      whyItExists:
        "Servers cannot afford to spend CPU verifying challenges under DDoS attacks; verification must be instantaneous O(1).",
      realWorldAnalogy:
        "Finding the secret combination to a safe takes thousands of tries, but testing a proposed combination takes 1 second.",
      technicalExplanation:
        "Client workload = O(2^D) SHA-256 operations. Server workload = O(1) single SHA-256 operation.",
      caseApplication:
        "Protects API gateways from being overwhelmed while validating bot defense puzzles.",
      commonMistakes: [
        "Making the puzzle symmetric so the server spends as much CPU checking as the client spends solving.",
        "Setting difficulty D too high (e.g. 8 zeros), locking out mobile devices for 30 seconds.",
      ],
      practice: [
        "How many hash attempts on average are required to find a hash with 4 leading hex zeros (16^4 = 65,536)?",
        "Why is difficulty 4 hex zeros (~0.05 seconds in JavaScript) ideal for browser bot mitigation?",
      ],
    },
    {
      id: "concept-replay-token",
      name: "Challenge Replay Protection",
      difficulty: "Intermediate",
      simpleDefinition:
        "Ensuring an attacker cannot reuse the same solved nonce across multiple requests or multiple machines.",
      whyItExists:
        "If a bot solves a puzzle once and shares the nonce with 10,000 scraper nodes, the defense is bypassed.",
      realWorldAnalogy:
        "A one-time movie theater ticket barcode that is invalidated the moment it is scanned at the turnstile.",
      technicalExplanation:
        "Challenge string incorporates `{ip}:{timestamp}:{random_salt}` and expires after 120 seconds.",
      caseApplication: "Binds the proof strictly to the specific requesting client session.",
      commonMistakes: [
        "Using a static global challenge string that all clients share.",
        "Allowing puzzles with timestamps older than 5 minutes.",
      ],
      practice: [
        "What happens if an attacker records your solved nonce and submits it from their own IP?",
        "How does embedding the client IP into the challenge string defeat token sharing?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the CAPTCHA & Adaptive Bot Defense Engine showing velocity tracking and asymmetric PoW verification.",
    levels: [
      {
        title: "Level 1: Edge Mitigation Flow",
        description: "Traffic inspection, rate monitoring, and challenge gate.",
        mermaid: `graph TD
    Client["Client Traffic"] --> Gateway["WAF Edge Gateway"]
    Gateway --> VelocityCheck{"Requests in last 60s > Threshold?"}
    VelocityCheck -->|"No"| Pass["Pass Traffic to API"]
    VelocityCheck -->|"Yes"| HasToken{"Has valid PoW Solution?"}
    HasToken -->|"No"| SendChallenge["Return HTTP 401 PoW Challenge"]
    HasToken -->|"Yes"| VerifyPoW["O(1) SHA-256 Hash Verification"]
    VerifyPoW -->|"Valid"| IssuePass["Issue 15-min Bypass Token & Pass"]
    VerifyPoW -->|"Invalid"| Block["HTTP 403 Forbidden"]
`,
      },
      {
        title: "Level 2: Proof-of-Work Asymmetry",
        description: "Comparison of client mining vs server verification workloads.",
        mermaid: `graph TD
    ClientWork["Client: Try Nonce 0, 1, 2, ... (65,536 hash calculations)"] --> Result["Find Nonce yielding '0000abc...'"]
    Result --> Submit["Submit (challenge, nonce) to Server"]
    Submit --> ServerWork["Server: Single SHA-256(challenge + nonce) in 1 microsecond"]
    ServerWork --> Check["Check startsWith('0000')"]
`,
      },
      {
        title: "Level 3: Adaptive Difficulty Escalation",
        description: "Escalating puzzle difficulty as attack severity increases.",
        mermaid: `graph TD
    Rate["Request Velocity"] --> Tier1{"Velocity < 30 req/min"}
    Tier1 -->|"Yes"| Direct["Free Pass (No Puzzle)"]
    Tier1 -->|"No"| Tier2{"Velocity < 100 req/min"}
    Tier2 -->|"Yes"| EasyPoW["Difficulty 3 Leading Zeros (0.02s)"]
    Tier2 -->|"No"| HardPoW["Difficulty 5 Leading Zeros (1.5s)"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Cryptographic Proof-of-Work vs Visual Image Classification",
      what: "Challenge suspicious traffic with computational SHA-256 puzzles executed in browser Web Workers rather than image selection puzzles.",
      why: "Visual puzzles create high friction for human users, fail against modern AI vision bots, and are inaccessible to screen-reader users.",
      problemSolved:
        "Preserves human checkout conversion while rendering high-volume botnet scraping economically unviable.",
      withoutIt:
        "Human customers abandon shopping carts in frustration while scrapers hire CAPTCHA-solving farms for $0.001 per solve.",
      alternatives: [
        "Visual 3x3 image selection CAPTCHA.",
        "Biometric mouse movement analysis (privacy intrusive).",
      ],
      tradeoff:
        "Consumes a small amount of battery/CPU on client mobile devices during challenge solving.",
    },
    {
      title: "O(1) Pre-Hash Verification with Embedded IP Salt",
      what: "Incorporate client IP and timestamp into the challenge string so the server can verify without maintaining state.",
      why: "Stateless verification prevents an attacker from exhausting server memory by requesting 1,000,000 puzzles without answering them.",
      problemSolved:
        "Eliminates memory exhaustion DoS attacks against the challenge generation service itself.",
      withoutIt:
        "Attackers flood the challenge endpoint to exhaust Redis memory with pending puzzle keys.",
      alternatives: ["Stateful challenge database keeping track of every issued puzzle."],
      tradeoff:
        "Requires HMAC signing of the challenge seed so clients cannot forge their own difficulty level.",
    },
  ],
  implementation: {
    behaviour:
      "A BotDefenseEngine class that tracks client request rates, issues PoW challenges when thresholds are breached, and verifies solutions in O(1).",
    algorithm: [
      "1. inspect_request(ip, timestamp, solution_nonce, challenge_str):",
      "   a. Append timestamp to request_history[ip]. Prune timestamps older than window_sec.",
      "   b. If len(request_history[ip]) <= max_rate_threshold: return {'status': 'ALLOW'}.",
      "   c. Else (rate threshold exceeded):",
      "      - If challenge_str is None or solution_nonce is None:",
      "        return {'status': 'CHALLENGE_REQUIRED', 'challenge': f'{ip}_{timestamp}', 'difficulty': difficulty}.",
      "      - Compute h = sha256(f'{challenge_str}_{solution_nonce}').hexdigest().",
      "      - If h.startswith('0' * difficulty): return {'status': 'ALLOW_VERIFIED'}.",
      "      - Else: return {'status': 'REJECT_INVALID_POW'}.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Static Rate Limiter",
        detail: "Hard blocks IPs exceeding rate limit without offering challenge bypass.",
      },
      {
        level: "Level 1",
        title: "PoW Puzzle Verifier",
        detail: "Verifies client SHA-256 nonce proofs with leading-zero difficulty checks.",
      },
      {
        level: "Level 2",
        title: "Adaptive Velocity Gate",
        detail:
          "Combines sliding-window velocity metering with automated PoW challenge escalation.",
      },
      {
        level: "Level 3",
        title: "Enterprise WAF Bot Engine",
        detail:
          "Adds browser fingerprinting, TLS JA3 hash inspection, and stateless HMAC challenge seeds.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "bot_defense.py",
        code: `import hashlib

class BotDefenseEngine:
    def __init__(self, rate_threshold: int = 5, difficulty: int = 3) -> None:
        self.rate_threshold = rate_threshold
        self.difficulty = difficulty
        self.history: dict[str, list[int]] = {}

    def inspect(
        self,
        ip: str,
        timestamp: int,
        nonce: str | None = None,
        challenge: str | None = None
    ) -> dict:
        if ip not in self.history:
            self.history[ip] = []
        # Sliding window 60s
        self.history[ip] = [t for t in self.history[ip] if timestamp - t <= 60]
        self.history[ip].append(timestamp)

        if len(self.history[ip]) <= self.rate_threshold:
            return {"status": "ALLOW"}

        if not challenge or not nonce:
            return {
                "status": "CHALLENGE_REQUIRED",
                "challenge": f"{ip}:{timestamp}",
                "difficulty": self.difficulty
            }

        # Verify PoW in O(1)
        digest = hashlib.sha256(f"{challenge}:{nonce}".encode()).hexdigest()
        prefix = "0" * self.difficulty
        if digest.startswith(prefix):
            return {"status": "ALLOW_VERIFIED"}
        return {"status": "REJECT_INVALID_POW"}`,
        explanations: [
          {
            code: 'if len(self.history[ip]) <= self.rate_threshold: return {"status": "ALLOW"}',
            explanation: "Permits normal low-frequency requests without requiring challenges.",
          },
          {
            code: 'digest = hashlib.sha256(f"{challenge}:{nonce}".encode()).hexdigest()',
            explanation:
              "Computes single SHA-256 hash in O(1) to verify client computational work.",
          },
          {
            code: 'if digest.startswith(prefix): return {"status": "ALLOW_VERIFIED"}',
            explanation:
              "Grants access when client has successfully mined the required leading zeros.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates adaptive bot detection and cryptographic PoW verification in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Attacker Cost Multiplier",
      brief:
        "Calculate the daily CPU energy cost for an attacker attempting 50,000,000 scraping requests against a difficulty 4 PoW defense.",
    },
    {
      level: "Modify",
      title: "Exponential Difficulty Escalation",
      brief:
        "Modify the difficulty setting so that if a client sends 50 requests in 1 minute, difficulty increases from 3 leading zeros to 5 leading zeros.",
    },
    {
      level: "Build",
      title: "Client-Side Web Worker Solver",
      brief:
        "Write a JavaScript snippet that runs inside a Web Worker to mine the nonce without freezing the main browser UI thread.",
    },
    {
      level: "Think",
      title: "Battery and Accessibility Impact",
      brief:
        "Why is silent background Proof-of-Work vastly superior for accessibility (blind users) compared to visual audio CAPTCHAs?",
    },
  ],
  reflection: [
    "How does Proof-of-Work change the economic equation for large-scale botnet operators?",
    "Why is asymmetric verification complexity essential for defense servers under attack?",
    "How does sliding-window rate tracking prevent burst scripts from flying under the radar?",
  ],
  techNotes: [
    {
      name: "Cloudflare Turnstile",
      kind: "Industry Standard",
      note: "Modern bot protections like Cloudflare Turnstile replace image CAPTCHAs with transparent browser cryptographic challenges and device trust assertions.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Evaluate Bot Velocity and Verify Proof-of-Work Nonces",
    brief:
      "Implement `evaluate_bot_defense`: given `requests` `[{'ip': str, 'timestamp': int, 'nonce': str|None, 'challenge': str|None}]`, `max_rate_threshold` (int per 60s sliding window), and `difficulty` (int representing count of leading '0' characters in SHA-256 hex string). For each request: prune IP timestamps where current `timestamp - past_t > 60`. If count of requests in window <= max_rate_threshold, status is 'ALLOW'. If count > max_rate_threshold, check if valid `challenge` and `nonce` are provided. If missing, status is 'CHALLENGE_REQUIRED'. If provided, compute `sha256(challenge + ':' + nonce).hexdigest()`. If it starts with `difficulty` zeros, status is 'ALLOW_VERIFIED'; otherwise 'REJECT_INVALID_POW'. Return list of statuses.",
    functionName: "evaluate_bot_defense",
    signature:
      "def evaluate_bot_defense(requests: list[dict], max_rate_threshold: int, difficulty: int) -> list[str]:",
    starterCode: `import hashlib

def evaluate_bot_defense(requests: list[dict], max_rate_threshold: int, difficulty: int) -> list[str]:
    # requests: [{"ip": str, "timestamp": int, "nonce": str|None, "challenge": str|None}]
    # Return list of statuses: "ALLOW" | "CHALLENGE_REQUIRED" | "ALLOW_VERIFIED" | "REJECT_INVALID_POW"
    history = {}
    statuses = []
    prefix = "0" * difficulty

    for r in requests:
        ip = r["ip"]
        ts = r["timestamp"]
        nonce = r.get("nonce")
        challenge = r.get("challenge")

        if ip not in history:
            history[ip] = []
        # Prune older than 60s
        history[ip] = [t for t in history[ip] if ts - t <= 60]
        history[ip].append(ts)

        if len(history[ip]) <= max_rate_threshold:
            statuses.append("ALLOW")
        else:
            if not challenge or not nonce:
                statuses.append("CHALLENGE_REQUIRED")
            else:
                target = f"{challenge}:{nonce}".encode("utf-8")
                digest = hashlib.sha256(target).hexdigest()
                if digest.startswith(prefix):
                    statuses.append("ALLOW_VERIFIED")
                else:
                    statuses.append("REJECT_INVALID_POW")

    return statuses
`,
    javaSignature:
      "public static List<String> evaluateBotDefense(List<Map<String, Object>> requests, int maxRateThreshold, int difficulty)",
    javaStarterCode: `import java.util.*;
import java.security.MessageDigest;

public class Solution {
    public static List<String> evaluateBotDefense(
        List<Map<String, Object>> requests,
        int maxRateThreshold,
        int difficulty
    ) {
        Map<String, List<Integer>> history = new HashMap<>();
        List<String> statuses = new ArrayList<>();
        String prefix = "0".repeat(difficulty);

        for (Map<String, Object> r : requests) {
            String ip = (String) r.get("ip");
            int ts = ((Number) r.get("timestamp")).intValue();
            String nonce = (String) r.get("nonce");
            String challenge = (String) r.get("challenge");

            history.computeIfAbsent(ip, k -> new ArrayList<>());
            List<Integer> times = history.get(ip);
            times.removeIf(t -> ts - t > 60);
            times.add(ts);

            if (times.size() <= maxRateThreshold) {
                statuses.add("ALLOW");
            } else {
                if (challenge == null || nonce == null || challenge.isEmpty() || nonce.isEmpty()) {
                    statuses.add("CHALLENGE_REQUIRED");
                } else {
                    String digest = sha256(challenge + ":" + nonce);
                    if (digest.startsWith(prefix)) {
                        statuses.add("ALLOW_VERIFIED");
                    } else {
                        statuses.add("REJECT_INVALID_POW");
                    }
                }
            }
        }

        return statuses;
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes("UTF-8"));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (Exception e) {
            return "";
        }
    }
}`,
    mermaid: `graph TD
    Start["evaluate_bot_defense(...)"] --> LoopReq["For each request in requests"]
    LoopReq --> PruneHistory["Prune IP timestamps where ts - t > 60"]
    PruneHistory --> RateCheck{"Window count <= max_rate_threshold?"}
    RateCheck -->|"Yes"| Allow["status = 'ALLOW'"]
    RateCheck -->|"No"| PoWCheck{"challenge and nonce present?"}
    PoWCheck -->|"No"| Challenge["status = 'CHALLENGE_REQUIRED'"]
    PoWCheck -->|"Yes"| Hash["Compute digest = sha256(challenge + ':' + nonce)"]
    Hash --> ZeroCheck{"digest.startswith('0' * difficulty)?"}
    ZeroCheck -->|"Yes"| Verified["status = 'ALLOW_VERIFIED'"]
    ZeroCheck -->|"No"| Reject["status = 'REJECT_INVALID_POW'"]
    Allow --> NextReq{"More requests?"}
    Challenge --> NextReq
    Verified --> NextReq
    Reject --> NextReq
    NextReq -->|"Yes"| LoopReq
    NextReq -->|"No"| Return["Return statuses"]
`,
    hints: [
      "Prune timestamps where current_timestamp - past_timestamp > 60.",
      "Hash format string is exactly f'{challenge}:{nonce}'.",
      "Check digest.startswith('0' * difficulty).",
    ],
    tests: [
      {
        name: "Low-frequency requests are allowed directly",
        args: [
          [
            { ip: "1.1.1.1", timestamp: 10 },
            { ip: "1.1.1.1", timestamp: 20 },
          ],
          3,
          2,
        ],
        expected: ["ALLOW", "ALLOW"],
      },
      {
        name: "Burst requests trigger challenge then allow on valid PoW",
        args: [
          [
            { ip: "2.2.2.2", timestamp: 10 },
            { ip: "2.2.2.2", timestamp: 15 },
            { ip: "2.2.2.2", timestamp: 20 }, // 3rd request reaches threshold 2
            // sha256("test_seed:3479") in hex starts with "000"
            // Let's test with a verified hash: sha256("test:2648") = 000f...
            { ip: "2.2.2.2", timestamp: 25, challenge: "test", nonce: "2648" },
          ],
          2,
          3,
        ],
        expected: ["ALLOW", "ALLOW", "CHALLENGE_REQUIRED", "ALLOW_VERIFIED"],
      },
      {
        name: "Invalid nonce is rejected",
        args: [
          [
            { ip: "3.3.3.3", timestamp: 10 },
            { ip: "3.3.3.3", timestamp: 20 },
            { ip: "3.3.3.3", timestamp: 30, challenge: "test", nonce: "wrong_nonce" },
          ],
          1,
          3,
        ],
        expected: ["ALLOW", "CHALLENGE_REQUIRED", "REJECT_INVALID_POW"],
      },
    ],
    explanationPrompt:
      "Explain how your bot defense engine enforces sliding-window velocity thresholds, issues challenges, and verifies cryptographic Proof-of-Work nonces in O(1) time.",
  },
};

// ----------------------------------------------------------------------------
// Case 47: Feature Flags & Canary Release Engine
// ----------------------------------------------------------------------------
export const case47_featureFlags = {
  id: "cs-feature-flags-047",
  slug: "feature-flags-canary-engine",
  index: "47",
  title:
    "How Does a Dynamic Feature Flag Engine Deterministically Bucket Users and Roll Out Canary Deployments?",
  shortTitle: "Feature Flags & Canary",
  category: "Reliability & Scalability",
  subcategory: "Dynamic Configuration & Canary Hashing",
  difficulty: "Intermediate",
  learnerLevel: "Builder",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "premium",
  rcCost: 60,
  summary:
    "Tech giants like Netflix, LaunchDarkly, and Meta roll out new features to 1% of users before gradually ramping up to 100%. Discover how dynamic feature flag engines evaluate millions of rules in sub-millisecond memory using MurmurHash deterministic bucketing, user targeting overrides, and instant kill-switches.",
  learningObjectives: [
    "Design an in-memory feature flag rule engine supporting percentage rollouts.",
    "Implement deterministic consistent bucketing using MurmurHash / integer hashing (0-99).",
    "Evaluate user targeting overrides (e.g. whitelist beta testers or internal employees).",
    "Model instant emergency kill-switches that disable features globally without code redeployment.",
  ],
  prerequisites: [
    "Hash functions and modulo arithmetic",
    "Rule evaluation engines and predicates",
    "Continuous deployment and canary release patterns",
  ],
  engineeringConcepts: [
    "Deterministic Hash Bucketing",
    "Percentage Rollout Ramp",
    "Targeting Whitelist Overrides",
    "Emergency Kill-Switch Invariant",
    "Local In-Memory Flag Evaluation",
  ],
  technologies: ["Python", "Java", "MurmurHash", "Redis", "LaunchDarkly"],
  tech: ["Feature Flags", "Hashing", "Canary Deployment"],
  tags: ["feature flags", "canary", "devops", "system design", "intermediate"],
  glossary: [
    {
      term: "Deterministic Hash Bucketing",
      plainDefinition:
        "Using a stable hash function to map a user ID to a bucket from 0 to 99 so the user always sees the exact same feature state.",
    },
    {
      term: "Percentage Rollout Ramp",
      plainDefinition:
        "Gradually increasing exposure (e.g. 1% -> 5% -> 25% -> 100%) while monitoring error telemetry.",
    },
    {
      term: "Targeting Whitelist Overrides",
      plainDefinition:
        "Explicitly enabling a feature for specific internal testing accounts regardless of percentage bucket.",
    },
    {
      term: "Emergency Kill-Switch Invariant",
      plainDefinition:
        "Instantly setting a feature flag to disabled globally to stop a production incident without a redeploy.",
    },
    {
      term: "Local In-Memory Flag Evaluation",
      plainDefinition:
        "Evaluating flag rules inside server memory without network RPC calls to achieve microsecond evaluation speed.",
    },
  ],
  primers: [
    {
      concept: "Deterministic Bucketing Invariant",
      minutes: 4,
      definition:
        "A user in the 5% canary must remain enabled when the flag ramps to 10%. If user bucket is 3, they are enabled for both. Never use random() — a user must not see a feature flip on and off on page refresh.",
      whyNeeded: "Inconsistent feature state corrupts user sessions and triggers confusion.",
      analogy:
        "Assigning students to exam halls based on the last two digits of their student ID card.",
      tinyExample:
        "bucket = int(hashlib.md5(f'{flag_key}:{user_id}').hexdigest(), 16) % 100\nis_enabled = bucket < rollout_pct",
    },
    {
      concept: "Evaluation Precedence Ladder",
      minutes: 4,
      definition:
        "Order of operations: 1. Is flag enabled globally? (If False -> False) 2. Is user in whitelist? (If True -> True) 3. Is user in blacklist? (If True -> False) 4. Does user bucket < rollout_pct? (Evaluate hash).",
      whyNeeded:
        "Guarantees that emergency kill-switches and internal beta testing override general percentage rules.",
      analogy:
        "Court of law jurisdiction: emergency presidential executive orders override standard traffic rules.",
      tinyExample:
        "if not flag['enabled']: return False\nif user in flag['whitelist']: return True\nreturn bucket < flag['pct']",
    },
  ],
  discover: {
    situation:
      "A banking app deployed a new payment checkout UI directly to 100% of production users at midnight. A subtle bug in Safari caused payment buttons to disappear, blocking $4,000,000 in transactions. Rolling back required rebuilding and redeploying a 2GB Docker container, taking 45 painful minutes while customer complaints overwhelmed support.",
    humanFlow: [
      "Engineering enables feature flag 'new-checkout' at 1% canary rollout.",
      "Telemetry monitors error rates and latency across canary bucket users.",
      "Internal engineers added to whitelist test the feature in production directly.",
      "Engineers ramp flag to 10%, 50%, and 100% as stability is proven.",
      "If errors spike, engineer flips kill-switch; feature reverts to old code instantly without redeploy.",
    ],
    question:
      "How do you design a feature flagging and canary release engine that evaluates deterministic user buckets, respects targeting whitelists, and supports instant kill-switches?",
    whyItExists: [
      "Decouples code deployment from feature release, eliminating risky high-stress midnight cutovers.",
      "Deterministic bucketing guarantees stable user experience across repeat visits.",
      "Sub-millisecond in-memory evaluation avoids adding latency to critical user paths.",
    ],
  },
  understand: {
    overview:
      "The Feature Flag Engine stores Flag Definitions containing status, percentage rollout, whitelists, and blacklists. An Evaluator processes context (user_id, attributes) against these rules. Deterministic hashing `hash(flag_key + user_id) % 100` assigns users to stable percentage buckets.",
    components: [
      {
        name: "Flag Configuration Store",
        whatIsIt: "Centralized configuration repository (backed by Redis or GitOps).",
        whyItExists: "Acts as authoritative source for active flag rules.",
        whatItDoes: "Stores rollout percentages, targeting lists, and kill-switch states.",
      },
      {
        name: "Deterministic Hash Bucketer",
        whatIsIt: "Hashing utility mapping `(flag_key, user_id)` to integer 0-99.",
        whyItExists: "Ensures stable, reproducible bucketing across distributed server nodes.",
        whatItDoes: "Computes modulo 100 bucket.",
      },
      {
        name: "Targeting Rule Evaluator",
        whatIsIt: "Hierarchical decision engine checking overrides and predicates.",
        whyItExists: "Enables special allowances for beta testers or enterprise tiers.",
        whatItDoes: "Checks whitelists before evaluating percentage math.",
      },
      {
        name: "Streaming Config Synchronizer",
        whatIsIt: "Server-Sent Events (SSE) or WebSocket daemon updating edge caches.",
        whyItExists: "Propagates kill-switch triggers to thousands of server instances in < 500ms.",
        whatItDoes: "Pushes updated JSON configs to local memory.",
      },
    ],
    analogy: {
      title: "Airport Priority Boarding Lanes",
      everyday: [
        "First Class passengers and First Responders board first regardless of seat number (Whitelist Targeting).",
        "General passengers board in numbered groups 1 through 5 printed deterministically on their boarding pass (Percentage Bucketing).",
        "If a maintenance inspection alarm sounds, boarding halts for everyone immediately (Kill-Switch).",
      ],
      technical: [
        "First Class priority corresponds to Targeting Whitelists.",
        "Numbered boarding groups correspond to Deterministic Hash Buckets.",
        "Maintenance inspection alarm corresponds to the Emergency Kill-Switch.",
      ],
    },
    flow: [
      "Client requests feature evaluation: evaluate(flag_key, user_id).",
      "Check 1: Global kill-switch — if flag.enabled is False, return False.",
      "Check 2: Whitelist — if user_id in flag.whitelist, return True.",
      "Check 3: Blacklist — if user_id in flag.blacklist, return False.",
      "Check 4: Percentage bucket — calculate bucket = hash(flag_key + ':' + user_id) % 100.",
      "If bucket < flag.percentage_rollout: return True.",
      "Else: return False.",
    ],
  },
  concepts: [
    {
      id: "concept-consistent-bucket",
      name: "Deterministic Hash Bucketing",
      difficulty: "Intermediate",
      simpleDefinition:
        "Using a stable hash function so that a given user always maps to the exact same bucket number between 0 and 99.",
      whyItExists:
        "Prevents feature state from flickering on repeat visits or across different microservice calls.",
      realWorldAnalogy:
        "A student's assigned locker number never changes throughout the school year.",
      technicalExplanation:
        "Bucket = hash(f'{flag_key}:{user_id}') % 100. Using flag_key in the seed prevents correlation across different flags.",
      caseApplication:
        "Guarantees that User 1042 experiences the new UI consistently across mobile and desktop.",
      commonMistakes: [
        "Hashing only user_id without flag_key, causing the same 5% of users to get every single risky canary feature.",
        "Using language-dependent hash() functions that change seeds across server restarts (like Python's default hash).",
      ],
      practice: [
        "Why must MD5 or MurmurHash be used instead of Python's built-in hash() function for flag bucketing?",
        "If flag A and flag B both hash on user_id alone, what happens to user exposure correlation?",
      ],
    },
    {
      id: "concept-kill-switch",
      name: "Kill-Switch Invariant",
      difficulty: "Intermediate",
      simpleDefinition:
        "A top-level boolean master switch that instantly disables a feature for all users without code deployment.",
      whyItExists: "Enables emergency containment of severe production bugs in seconds.",
      realWorldAnalogy: "The big red emergency stop button on an industrial factory conveyor belt.",
      technicalExplanation:
        "Evaluated first in the decision tree: if not flag.enabled: return False.",
      caseApplication: "Halts a runaway memory leak or payment gateway outage within 1 second.",
      commonMistakes: [
        "Placing the kill-switch check after whitelist checks, preventing engineers from disabling features completely.",
        "Requiring a 30-minute deployment pipeline to disable a broken feature.",
      ],
      practice: [
        "What is the difference between setting rollout percentage to 0% vs flipping the kill-switch?",
        "How do edge proxies propagate kill-switch signals to server fleets in sub-second time?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Dynamic Feature Flag & Canary Release Engine highlighting local in-memory evaluation and deterministic hashing.",
    levels: [
      {
        title: "Level 1: System Workflow",
        description: "Admin flag update flow and runtime application evaluation.",
        mermaid: `graph TD
    Admin["Release Engineer / PM"] -->|"Update Flag Config (1% -> 10%)"| Dashboard["LaunchDarkly / Feature Portal"]
    Dashboard -->|"Stream SSE Updates"| SyncService["Config Sync Bus"]
    SyncService -->|"Local In-Memory Cache"| AppServers["App Server Fleet"]
    AppServers -->|"Microsecond Evaluate(flag, user)"| Users["End Users"]
`,
      },
      {
        title: "Level 2: Evaluation Precedence Pipeline",
        description: "Sequential checks executed during flag evaluation.",
        mermaid: `graph TD
    EvalReq["evaluate(flag, user)"] --> CheckKill{"flag.is_enabled == True?"}
    CheckKill -->|"No"| RetFalse["Return False (Kill-Switch Active)"]
    CheckKill -->|"Yes"| CheckWhite{"user in whitelist?"}
    CheckWhite -->|"Yes"| RetTrue["Return True (Whitelist Override)"]
    CheckWhite -->|"No"| CheckBlack{"user in blacklist?"}
    CheckBlack -->|"Yes"| RetFalse
    CheckBlack -->|"No"| Hash["bucket = hash(flag + ':' + user) % 100"]
    Hash --> BucketCheck{"bucket < rollout_pct?"}
    BucketCheck -->|"Yes"| RetTrue
    BucketCheck -->|"No"| RetFalse
`,
      },
      {
        title: "Level 3: Deterministic Salted Bucketing",
        description: "Salting hash inputs to decorrelate exposure across distinct feature flags.",
        mermaid: `graph TD
    User["user_123"] --> SaltA["Hash('checkout_v2' + ':' + 'user_123') % 100 = 42"]
    User --> SaltB["Hash('dark_mode' + ':' + 'user_123') % 100 = 87"]
    SaltA --> CanaryA["Enabled in 50% rollout"]
    SaltB --> CanaryB["Disabled in 50% rollout"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "In-Memory Flag Evaluation vs Network Remote Procedure Call",
      what: "Evaluate flag rules in local process memory using synchronized JSON configuration caches, rather than making an HTTP/gRPC call per evaluation.",
      why: "A single user request may evaluate 30-50 feature flags across its lifecycle; network calls would add 100ms+ overhead.",
      problemSolved:
        "Eliminates latency penalties and prevents feature flag service outages from taking down core production apps.",
      withoutIt: "Every page view suffers a 15ms RPC round trip per feature flag query.",
      alternatives: [
        "Synchronous remote Redis lookup per flag call.",
        "REST API call to central feature flag service.",
      ],
      tradeoff:
        "Requires background streaming synchronization (SSE/WebSockets) to update local memory caches across server instances.",
    },
    {
      title: "Salting Hash Input with Flag Key",
      what: "Hash `f'{flag_key}:{user_id}'` rather than `user_id` alone when computing the percentage bucket.",
      why: "Decorrelates user buckets across distinct flags so the same 5% of early adopters do not absorb every single canary release.",
      problemSolved: "Distributes canary testing risk evenly across the entire user base.",
      withoutIt:
        "Users in bucket 0-4 endure every single unstable experiment, leading to high churn in that cohort.",
      alternatives: [
        "Unsalted hash on user_id alone.",
        "Random assignment stored in relational database per user.",
      ],
      tradeoff: "None; string concatenation overhead is negligible.",
    },
  ],
  implementation: {
    behaviour:
      "A FeatureFlagEngine class that evaluates flags against kill-switches, whitelists, blacklists, and deterministic percentage buckets.",
    algorithm: [
      "1. get_bucket(flag_key, user_id):",
      "   Compute MD5 hash of f'{flag_key}:{user_id}'. Convert first 8 hex characters to int, modulo 100.",
      "2. is_enabled(flag_key, user_id):",
      "   a. Retrieve flag config. If flag does not exist or flag['enabled'] is False: return False.",
      "   b. If user_id in flag.get('whitelist', []): return True.",
      "   c. If user_id in flag.get('blacklist', []): return False.",
      "   d. bucket = get_bucket(flag_key, user_id).",
      "   e. Return bucket < flag.get('percentage', 0).",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Hardcoded Boolean Flag",
        detail: "Global true/false switch requiring code redeploy to modify.",
      },
      {
        level: "Level 1",
        title: "Whitelist Override Engine",
        detail: "Supports user whitelisting for internal developer testing.",
      },
      {
        level: "Level 2",
        title: "Deterministic Canary Bucketing Engine",
        detail: "Adds salted MD5 percentage bucketing (0-99) with kill-switch precedence.",
      },
      {
        level: "Level 3",
        title: "Enterprise Experimentation Platform",
        detail:
          "Multi-variate A/B/n testing, automated metric regression rollbacks, and SSE flag streaming.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "feature_flag_engine.py",
        code: `import hashlib

class FeatureFlagEngine:
    def __init__(self, flags: dict[str, dict]) -> None:
        self.flags = flags  # {flag_key: {enabled, percentage, whitelist, blacklist}}

    @staticmethod
    def get_bucket(flag_key: str, user_id: str) -> int:
        key = f"{flag_key}:{user_id}".encode("utf-8")
        hex_digest = hashlib.md5(key).hexdigest()
        # Take first 8 chars to avoid int overflow
        return int(hex_digest[:8], 16) % 100

    def evaluate(self, flag_key: str, user_id: str) -> bool:
        flag = self.flags.get(flag_key)
        if not flag or not flag.get("enabled", False):
            return False

        if user_id in flag.get("whitelist", []):
            return True
        if user_id in flag.get("blacklist", []):
            return False

        bucket = self.get_bucket(flag_key, user_id)
        return bucket < flag.get("percentage", 0)`,
        explanations: [
          {
            code: 'if not flag or not flag.get("enabled", False): return False',
            explanation: "Enforces the global kill-switch as the first rule in evaluation order.",
          },
          {
            code: 'if user_id in flag.get("whitelist", []): return True',
            explanation: "Grants access to whitelisted testers regardless of percentage bucket.",
          },
          {
            code: 'bucket = self.get_bucket(flag_key, user_id); return bucket < flag.get("percentage", 0)',
            explanation:
              "Deterministically checks whether the user falls inside the canary rollout boundary.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates high-performance in-memory feature flag evaluation with MD5 bucketing.",
  },
  practice: [
    {
      level: "Understand",
      title: "Flag Salt Independence",
      brief:
        "Explain why hashing `flag_key + ':' + user_id` ensures that a user in the 1% canary for flag A is not automatically in the 1% canary for flag B.",
    },
    {
      level: "Modify",
      title: "Add Attribute Targeting",
      brief:
        "Extend the evaluation engine to support custom user attributes (e.g. `country == 'CA'` or `app_version >= '2.4.0'`).",
    },
    {
      level: "Build",
      title: "Canary Rollout Ramp Simulator",
      brief:
        "Build a simulator that takes 1,000 users and verifies that ramping from 10% to 20% strictly adds new users without removing any existing enabled users.",
    },
    {
      level: "Think",
      title: "Automated Telemetry Rollback",
      brief:
        "How would you connect Datadog APM 5xx error metrics to automatically trip a feature flag kill-switch if error rate exceeds 1%?",
    },
  ],
  reflection: [
    "Why must feature flag evaluation execute locally in memory rather than over network RPCs?",
    "How does deterministic bucketing prevent session flickering across repeated user visits?",
    "Why is salting the hash input with the flag key essential to fair canary testing across a user base?",
  ],
  techNotes: [
    {
      name: "MurmurHash3",
      kind: "Performance",
      note: "Production engines like LaunchDarkly use MurmurHash3 or CityHash rather than cryptographic hashes like MD5, delivering 10x faster execution without cryptographic overhead.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Evaluate Feature Flags with Deterministic Bucketing",
    brief:
      "Implement `evaluate_feature_flags`: given `flags` (dict of flag_key -> `{'enabled': bool, 'percentage': int, 'whitelist': list[str], 'blacklist': list[str]}`) and `evaluations` (list of `{'flag_key': str, 'user_id': str}`). For each evaluation, return boolean result: 1. If flag is missing or `enabled` is False, return False. 2. If user is in `whitelist`, return True. 3. If user is in `blacklist`, return False. 4. Otherwise compute bucket = `int(hashlib.md5((flag_key + ':' + user_id).encode()).hexdigest()[:8], 16) % 100`. Return `bucket < percentage`. Return list of booleans.",
    functionName: "evaluate_feature_flags",
    signature: "def evaluate_feature_flags(flags: dict, evaluations: list[dict]) -> list[bool]:",
    starterCode: `import hashlib

def evaluate_feature_flags(flags: dict, evaluations: list[dict]) -> list[bool]:
    # flags: {flag_key: {"enabled": bool, "percentage": int, "whitelist": list, "blacklist": list}}
    # evaluations: [{"flag_key": str, "user_id": str}]
    # Return list of bools
    results = []

    for ev in evaluations:
        f_key = ev["flag_key"]
        u_id = ev["user_id"]
        flag = flags.get(f_key)

        if not flag or not flag.get("enabled", False):
            results.append(False)
            continue

        whitelist = flag.get("whitelist", [])
        if u_id in whitelist:
            results.append(True)
            continue

        blacklist = flag.get("blacklist", [])
        if u_id in blacklist:
            results.append(False)
            continue

        pct = flag.get("percentage", 0)
        seed = f"{f_key}:{u_id}".encode("utf-8")
        bucket = int(hashlib.md5(seed).hexdigest()[:8], 16) % 100
        results.append(bucket < pct)

    return results
`,
    javaSignature:
      "public static List<Boolean> evaluateFeatureFlags(Map<String, Map<String, Object>> flags, List<Map<String, String>> evaluations)",
    javaStarterCode: `import java.util.*;
import java.security.MessageDigest;

public class Solution {
    public static List<Boolean> evaluateFeatureFlags(
        Map<String, Map<String, Object>> flags,
        List<Map<String, String>> evaluations
    ) {
        List<Boolean> results = new ArrayList<>();

        for (Map<String, String> ev : evaluations) {
            String fKey = ev.get("flag_key");
            String uId = ev.get("user_id");
            Map<String, Object> flag = flags.get(fKey);

            if (flag == null || !Boolean.TRUE.equals(flag.get("enabled"))) {
                results.add(false);
                continue;
            }

            List<String> whitelist = (List<String>) flag.getOrDefault("whitelist", Collections.emptyList());
            if (whitelist.contains(uId)) {
                results.add(true);
                continue;
            }

            List<String> blacklist = (List<String>) flag.getOrDefault("blacklist", Collections.emptyList());
            if (blacklist.contains(uId)) {
                results.add(false);
                continue;
            }

            int pct = ((Number) flag.getOrDefault("percentage", 0)).intValue();
            int bucket = getBucket(fKey, uId);
            results.add(bucket < pct);
        }

        return results;
    }

    private static int getBucket(String flagKey, String userId) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest((flagKey + ":" + userId).getBytes("UTF-8"));
            StringBuilder hex = new StringBuilder();
            for (int i = 0; i < 4; i++) { // First 8 hex chars (4 bytes)
                String h = Integer.toHexString(0xff & digest[i]);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            long val = Long.parseLong(hex.toString(), 16);
            return (int) (val % 100);
        } catch (Exception e) {
            return 99;
        }
    }
}`,
    mermaid: `graph TD
    Start["evaluate_feature_flags(...)"] --> LoopEv["For each evaluation (flag_key, user_id)"]
    LoopEv --> CheckEnabled{"flag exists & enabled == True?"}
    CheckEnabled -->|"No"| AddFalse["results.append(False)"]
    CheckEnabled -->|"Yes"| CheckWhite{"user in whitelist?"}
    CheckWhite -->|"Yes"| AddTrue["results.append(True)"]
    CheckWhite -->|"No"| CheckBlack{"user in blacklist?"}
    CheckBlack -->|"Yes"| AddFalse
    CheckBlack -->|"No"| Hash["bucket = md5(flag + ':' + user)[:8] % 100"]
    Hash --> CheckPct{"bucket < percentage?"}
    CheckPct -->|"Yes"| AddTrue
    CheckPct -->|"No"| AddFalse
    AddTrue --> NextEv{"More evaluations?"}
    AddFalse --> NextEv
    NextEv -->|"Yes"| LoopEv
    NextEv -->|"No"| Return["Return results"]
`,
    hints: [
      "Check enabled == False first to respect the emergency kill-switch.",
      "Check whitelist before blacklist, and blacklist before percentage bucketing.",
      "Ensure hash string is strictly f'{flag_key}:{user_id}'.",
    ],
    tests: [
      {
        name: "Kill switch overrides whitelist and percentage",
        args: [
          {
            DARK_MODE: {
              enabled: false,
              percentage: 100,
              whitelist: ["Alice"],
              blacklist: [],
            },
          },
          [{ flag_key: "DARK_MODE", user_id: "Alice" }],
        ],
        expected: [false],
      },
      {
        name: "Whitelist enables user outside percentage rollout",
        args: [
          {
            CANARY_V2: {
              enabled: true,
              percentage: 0, // 0% rollout
              whitelist: ["BetaTester"],
              blacklist: [],
            },
          },
          [
            { flag_key: "CANARY_V2", user_id: "BetaTester" },
            { flag_key: "CANARY_V2", user_id: "NormalUser" },
          ],
        ],
        expected: [true, false],
      },
      {
        name: "100% rollout enables non-blacklisted users",
        args: [
          {
            NEW_SEARCH: {
              enabled: true,
              percentage: 100,
              whitelist: [],
              blacklist: ["BannedUser"],
            },
          },
          [
            { flag_key: "NEW_SEARCH", user_id: "BannedUser" },
            { flag_key: "NEW_SEARCH", user_id: "Alice" },
          ],
        ],
        expected: [false, true],
      },
    ],
    explanationPrompt:
      "Explain how your feature flag evaluator enforces the precedence hierarchy, performs deterministic MD5 salt bucketing, and guarantees stable canary allocations.",
  },
};

// ----------------------------------------------------------------------------
// Case 48: News Aggregator & SimHash Deduplication
// ----------------------------------------------------------------------------
export const case48_simHashDedup = {
  id: "cs-simhash-dedup-048",
  slug: "news-aggregator-simhash-dedup",
  index: "48",
  title:
    "How Does a High-Throughput News Aggregator Group Near-Duplicate Articles with 64-bit SimHash?",
  shortTitle: "News Aggregator & SimHash",
  category: "Distributed Data & Storage",
  subcategory: "Locality-Sensitive Hashing & Near-Duplicate Detection",
  difficulty: "Intermediate",
  learnerLevel: "Builder",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "premium",
  rcCost: 50,
  summary:
    "News aggregators ingest 50,000 articles per hour from hundreds of publishers covering identical wire stories with minor editorial edits. Discover how Locality-Sensitive Hashing (SimHash) fingerprints text documents into 64-bit integers and finds near-duplicate stories using Hamming distance.",
  learningObjectives: [
    "Explain why cryptographic hashes (MD5, SHA-256) fail for near-duplicate text detection.",
    "Implement the 64-bit SimHash algorithm using tokenization, weighting, and bitwise vector summation.",
    "Calculate bitwise Hamming distance to quantify document similarity.",
    "Group incoming news articles into distinct story clusters in real time.",
  ],
  prerequisites: [
    "Bitwise operations (XOR, bit count, bit shifts)",
    "Text tokenization and frequency weights",
    "Locality-Sensitive Hashing (LSH) principles",
  ],
  engineeringConcepts: [
    "SimHash Fingerprinting",
    "Hamming Distance Metric",
    "Locality-Sensitive Hashing",
    "Near-Duplicate Document Clustering",
    "Cryptographic Avalanche vs LSH",
  ],
  technologies: ["Python", "Java", "SimHash", "Inverted Index", "Elasticsearch"],
  tech: ["SimHash", "LSH", "Deduplication"],
  tags: ["search", "nlp", "simhash", "dedup", "intermediate"],
  glossary: [
    {
      term: "SimHash Fingerprinting",
      plainDefinition:
        "A 64-bit fingerprinting algorithm where documents with similar text produce fingerprints with small bit differences.",
    },
    {
      term: "Hamming Distance Metric",
      plainDefinition:
        "The count of differing bit positions between two binary numbers (computed via bit_count(A ^ B)).",
    },
    {
      term: "Locality-Sensitive Hashing",
      plainDefinition:
        "A class of hash functions where similar input items map to identical or close hash buckets with high probability.",
    },
    {
      term: "Near-Duplicate Document Clustering",
      plainDefinition:
        "Grouping syndicated or lightly edited press releases under a single master headline in news readers.",
    },
    {
      term: "Cryptographic Avalanche vs LSH",
      plainDefinition:
        "SHA-256 changes 50% of bits when 1 character changes (avalanche effect). SimHash changes only 1-2 bits when text changes slightly.",
    },
  ],
  primers: [
    {
      concept: "Why SHA-256 Fails for Near-Duplicates",
      minutes: 4,
      definition:
        "If publisher B copies publisher A's 1,000-word article but fixes a single typo, SHA-256 produces completely uncorrelated hashes. SimHash preserves similarity: the 64-bit fingerprints differ by only 1 or 2 bits.",
      whyNeeded:
        "Aggregators cannot afford to display 40 identical syndications of the same Reuters wire story.",
      analogy:
        "Comparing DNA sequences: minor mutations still leave 99% of the genetic code identical.",
      tinyExample:
        "hamming_dist = bin(simhash1 ^ simhash2).count('1')\nis_duplicate = hamming_dist <= 3",
    },
    {
      concept: "How SimHash Is Built",
      minutes: 4,
      definition:
        "1. Tokenize document into words. 2. Hash each word to 64 bits. 3. Initialize 64-element vector V to 0. 4. For each bit i: add weight if bit is 1, subtract weight if bit is 0. 5. If V[i] > 0, final fingerprint bit i is 1, else 0.",
      whyNeeded:
        "Collapses variable-length documents into a fixed 64-bit integer while preserving term frequency importance.",
      analogy:
        "A tug-of-war on each of the 64 rope strands: words pull positive or negative based on their hashed bit value.",
      tinyExample:
        "v = [0]*64\nfor word in words: ...\nfingerprint = sum((1 << i) for i in range(64) if v[i] > 0)",
    },
  ],
  discover: {
    situation:
      "A news aggregator launched an election coverage portal. An Associated Press wire story about election results was syndicated across 350 local newspapers with minor changes like 'AP — Washington' changed to 'Special to The Daily Post'. The aggregator homepage showed 350 identical articles, pushing all other breaking news off the screen.",
    humanFlow: [
      "Aggregator ingests raw RSS feed articles from 500 publishers.",
      "SimHash engine strips HTML and computes 64-bit document fingerprint.",
      "Engine compares fingerprint against existing cluster centroids in memory.",
      "If Hamming distance <= 3 bits: article is linked as a syndicated duplicate under master story.",
      "If Hamming distance > 3 bits: article is published as a distinct new headline.",
    ],
    question:
      "How do you design a high-throughput news aggregator that detects near-duplicate articles and clusters them using 64-bit SimHash and Hamming distance?",
    whyItExists: [
      "Syndicated wire news clutters user feeds unless duplicate variants are collapsed into single threads.",
      "Pairwise text diff (e.g. Levenshtein) on millions of articles is computationally impossible O(N^2 * L^2).",
      "Bitwise Hamming distance on 64-bit integers executes in single CPU cycles using `popcount`.",
    ],
  },
  understand: {
    overview:
      "The SimHash Deduplication Engine tokenizes article text, assigns weights based on word frequency, and generates a 64-bit fingerprint vector. An Inverted Cluster Table indexes fingerprints. When a new article arrives, its fingerprint is XORed with active story fingerprints. If the differing bit count (Hamming distance) is <= 3, the article is declared a duplicate.",
    components: [
      {
        name: "Text Normalizer & Tokenizer",
        whatIsIt:
          "Text processing pipeline stripping punctuation, lowercase words, and stop words.",
        whyItExists: "Isolates core informational tokens from formatting noise.",
        whatItDoes: "Returns list of clean word strings.",
      },
      {
        name: "SimHash Fingerprinter",
        whatIsIt: "Algorithm transforming word tokens into a 64-bit integer.",
        whyItExists: "Creates locality-sensitive compact representations of full documents.",
        whatItDoes: "Sums bitwise weights and extracts final sign bits.",
      },
      {
        name: "Hamming Distance Comparator",
        whatIsIt: "Bitwise XOR and population count utility.",
        whyItExists: "Measures bit variance between two 64-bit fingerprints.",
        whatItDoes: "Computes `popcount(hash_A ^ hash_B)` in 1 CPU cycle.",
      },
      {
        name: "Story Cluster Manager",
        whatIsIt: "Cluster registry linking syndicated duplicates to canonical master stories.",
        whyItExists: "Aggregates diverse publisher perspectives under a single reader topic.",
        whatItDoes: "Stores primary story headline and child publisher URLs.",
      },
    ],
    analogy: {
      title: "Audio Fingerprinting at a Noisy Concert",
      everyday: [
        "Shazam identifies a song playing in a noisy restaurant even if patrons are chattering in the background.",
        "It doesn't compare raw audio wave files byte-by-byte; it extracts acoustic peak frequency fingerprints.",
        "Background chattering alters a few acoustic frequencies, but the core song fingerprint matches 95%+ of the master track.",
      ],
      technical: [
        "Acoustic frequency peaks correspond to SimHash 64-bit Feature Vectors.",
        "Background restaurant chatter corresponds to Minor Editorial Word Changes.",
        "Shazam track identification corresponds to Hamming Distance Duplicate Clustering.",
      ],
    },
    flow: [
      "Article text arrives: {id, title, content}.",
      "Tokenizer extracts word tokens.",
      "SimHash algorithm generates 64-bit fingerprint integer.",
      "Compare fingerprint with existing story cluster centroids:",
      "  - Compute dist = bin(fp ^ cluster.fp).count('1')",
      "  - If dist <= 3: assign article to matching cluster, stop.",
      "If no cluster has dist <= 3: create new Story Cluster with this article as centroid.",
      "Return cluster assignment.",
    ],
  },
  concepts: [
    {
      id: "concept-simhash-vector",
      name: "SimHash Bitwise Vector Aggregation",
      difficulty: "Intermediate",
      simpleDefinition:
        "Converting words into 64-bit hashes, summing weights in a 64-element array, and taking 1 if positive, 0 if negative.",
      whyItExists:
        "Ensures words that appear frequently dominate the fingerprint while preserving document semantics.",
      realWorldAnalogy:
        "A jury where each member votes on 64 separate questions: majority vote sets the verdict for each question.",
      technicalExplanation:
        "V = [0]*64. For token, w in counts: h = hash64(token). For i in 0..63: V[i] += w if (h & (1<<i)) else -w. Final = sum((1<<i) for i in 0..63 if V[i] > 0).",
      caseApplication: "Fingerprints news articles into 8-byte integers.",
      commonMistakes: [
        "Using 32-bit hashes which have high collision rates across large document corpora.",
        "Ignoring word frequency weighting (treating rare keywords same as common words).",
      ],
      practice: [
        "Why does a 64-element accumulator array produce an exact 64-bit integer output?",
        "If a document contains the exact same word repeated 100 times, how does the vector reflect it?",
      ],
    },
    {
      id: "concept-hamming-dist",
      name: "Hamming Distance Bit Metric",
      difficulty: "Intermediate",
      simpleDefinition: "The number of bit positions in which two binary numbers differ.",
      whyItExists:
        "Quantifies document similarity in a single hardware-accelerated CPU instruction (`POPCNT`).",
      realWorldAnalogy:
        "Comparing two 8-letter words: 'CAR' and 'CAT' have a Hamming distance of 1 letter.",
      technicalExplanation:
        "Distance = popcount(hash1 ^ hash2). Typically, distance <= 3 indicates near-duplicate content in 64-bit SimHash.",
      caseApplication: "Determines if an incoming article belongs to an existing news thread.",
      commonMistakes: [
        "Using subtraction instead of XOR (^).",
        "Setting Hamming threshold too high (e.g. 10), which incorrectly merges completely unrelated news stories.",
      ],
      practice: [
        "Calculate the Hamming distance between 0b1011 and 0b1000.",
        "Why is Hamming distance <= 3 considered the golden threshold for 64-bit news SimHash?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the News Aggregator SimHash Deduplication Engine showing text vectorization and Hamming cluster matching.",
    levels: [
      {
        title: "Level 1: Aggregator Pipeline",
        description: "Ingestion from RSS feeds into SimHash Dedup and Story Clusters.",
        mermaid: `graph TD
    Feeds["500 Publisher RSS Feeds"] -->|"Ingest Articles"| Crawler["Ingestion Crawler"]
    Crawler --> Normalizer["Text Tokenizer & Stopword Filter"]
    Normalizer --> SimHasher["64-bit SimHash Generator"]
    SimHasher --> DedupEngine["Hamming Distance Cluster Matcher"]
    DedupEngine -->|"dist <= 3"| ExistingCluster["Group under Existing Story Cluster"]
    DedupEngine -->|"dist > 3"| NewCluster["Create New Story Cluster Headline"]
`,
      },
      {
        title: "Level 2: SimHash Vector Computation",
        description: "64-element accumulator array and sign bit extraction.",
        mermaid: `graph TD
    Tokens["Tokens: ['election', 'results', 'senate']"] --> HashWords["Hash each token to 64 bits"]
    HashWords --> Accumulator["Accumulate in V[0..63]: +1 if bit=1, -1 if bit=0"]
    Accumulator --> SignCheck["For each bit i: fingerprint bit = (V[i] > 0 ? 1 : 0)"]
    SignCheck --> Fingerprint["64-bit Integer Fingerprint"]
`,
      },
      {
        title: "Level 3: Hamming Distance Evaluation",
        description: "XOR and population count matching.",
        mermaid: `graph TD
    NewFP["New Fingerprint FP1"] --> XOR["XOR = FP1 ^ ClusterFP"]
    ClusterFP["Cluster Fingerprint"] --> XOR
    XOR --> PopCount["Count 1-bits in XOR result (Hamming Distance)"]
    PopCount --> Threshold{"Distance <= 3 bits?"}
    Threshold -->|"Yes"| Duplicate["Mark as Near-Duplicate Article"]
    Threshold -->|"No"| Unique["Mark as Novel Story"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "64-bit SimHash over MinHash for Text Near-Duplicates",
      what: "Use 64-bit SimHash for full-text article deduplication rather than MinHash or shingling.",
      why: "SimHash compresses arbitrary text down to an 8-byte integer, enabling billions of pairwise comparisons per second in memory using hardware bitwise XOR instructions.",
      problemSolved:
        "Prevents CPU starvation when cross-referencing incoming wire articles against 100,000 recent stories.",
      withoutIt:
        "Comparing text strings requires expensive Levenshtein or Jaccard calculations that take 50ms per pair.",
      alternatives: [
        "MinHash with Jaccard similarity index.",
        "Exact MD5 hashing (fails on single-character edits).",
      ],
      tradeoff:
        "SimHash is less sensitive to word reordering than MinHash, but superior for finding syndicated rewrites.",
    },
    {
      title: "Hamming Distance Threshold of 3 Bits",
      what: "Declare two articles near-duplicates if and only if their 64-bit SimHash differs by 3 or fewer bits.",
      why: "Empirical research across news corpora shows distance <= 3 captures 99% of syndicated rewrites while maintaining < 0.1% false-positive grouping of unrelated stories.",
      problemSolved:
        "Prevents distinct news events covering the same topic from being mistakenly merged together.",
      withoutIt:
        "An article about a team winning is mistakenly merged with an article about a team losing.",
      alternatives: [
        "Distance threshold of 1 (too strict; misses edited syndications).",
        "Distance threshold of 7 (too loose; causes false-positive story merges).",
      ],
      tradeoff:
        "Heavily rewritten articles with > 30% new vocabulary will exceed 3 bits and spawn a separate cluster.",
    },
  ],
  implementation: {
    behaviour:
      "A SimHashDeduplicator class that computes 64-bit fingerprints from text tokens and groups articles into clusters within Hamming distance 3.",
    algorithm: [
      "1. hash64(token): compute a deterministic 64-bit integer hash for a string.",
      "2. simhash(tokens):",
      "   a. Initialize vector v = [0] * 64.",
      "   b. For each token in tokens:",
      "      - h = hash64(token).",
      "      - For i in 0..63: if (h >> i) & 1: v[i] += 1; else: v[i] -= 1.",
      "   c. fingerprint = 0.",
      "   d. For i in 0..63: if v[i] > 0: fingerprint |= (1 << i).",
      "   e. Return fingerprint.",
      "3. hamming_distance(fp1, fp2): return bin(fp1 ^ fp2).count('1').",
      "4. cluster_articles(articles):",
      "   a. Initialize clusters = [] (each cluster: {'id': cluster_id, 'centroid_fp': int, 'articles': []}).",
      "   b. For each article with tokens:",
      "      - fp = simhash(article['tokens']).",
      "      - Find first cluster where hamming_distance(fp, cluster['centroid_fp']) <= max_distance.",
      "      - If found: append article['id'] to cluster['articles'].",
      "      - Else: create new cluster with centroid_fp = fp, articles = [article['id']].",
      "   c. Return clusters.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Exact String Matcher",
        detail: "Matches articles only if text is 100% identical. Fails on single word changes.",
      },
      {
        level: "Level 1",
        title: "Hamming Distance Comparator",
        detail: "Calculates bitwise differences between precomputed 64-bit fingerprints.",
      },
      {
        level: "Level 2",
        title: "SimHash Fingerprinter & Cluster Matcher",
        detail:
          "Tokenizes text, builds 64-bit SimHash, and groups near-duplicates with distance <= 3.",
      },
      {
        level: "Level 3",
        title: "Hyperscale News Deduplication Index",
        detail:
          "Table-split SimHash inverted index (4 tables of 16-bit blocks) for O(1) million-document lookup.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "simhash_dedup.py",
        code: `import hashlib

class SimHashDedup:
    @staticmethod
    def hash64(token: str) -> int:
        h = hashlib.md5(token.encode("utf-8")).hexdigest()
        return int(h[:16], 16)  # 64-bit integer

    @classmethod
    def compute_simhash(cls, tokens: list[str]) -> int:
        v = [0] * 64
        for token in tokens:
            h = cls.hash64(token)
            for i in range(64):
                if (h >> i) & 1:
                    v[i] += 1
                else:
                    v[i] -= 1

        fingerprint = 0
        for i in range(64):
            if v[i] > 0:
                fingerprint |= (1 << i)
        return fingerprint

    @staticmethod
    def hamming_distance(fp1: int, fp2: int) -> int:
        return bin(fp1 ^ fp2).count("1")

    def cluster(self, articles: list[dict], threshold: int = 3) -> list[dict]:
        clusters: list[dict] = []
        for art in articles:
            fp = self.compute_simhash(art["tokens"])
            matched = False
            for c in clusters:
                if self.hamming_distance(fp, c["fp"]) <= threshold:
                    c["articles"].append(art["id"])
                    matched = True
                    break
            if not matched:
                clusters.append({
                    "cluster_id": f"cluster_{len(clusters)+1}",
                    "fp": fp,
                    "articles": [art["id"]]
                })
        return clusters`,
        explanations: [
          {
            code: "v[i] += 1 if (h >> i) & 1 else -1",
            explanation: "Aggregates positive and negative bit voting weights across all tokens.",
          },
          {
            code: "fingerprint |= (1 << i) if v[i] > 0",
            explanation: "Extracts majority sign bit to construct the final 64-bit SimHash.",
          },
          {
            code: 'return bin(fp1 ^ fp2).count("1")',
            explanation: "Calculates bitwise Hamming distance using XOR and bit population count.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates 64-bit SimHash generation and near-duplicate clustering in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Bitwise XOR Property",
      brief:
        "Explain why XORing two integers sets a bit to 1 if and only if the two integers differ at that specific bit position.",
    },
    {
      level: "Modify",
      title: "Add TF-IDF Token Weighting",
      brief:
        "Modify the vector accumulator loop so rare keywords add weight +3 or -3, while common words add only +1 or -1.",
    },
    {
      level: "Build",
      title: "4-Table Permutation Index",
      brief:
        "Implement Charikar's 4-table index split (dividing 64 bits into four 16-bit blocks) to find distance <= 3 matches in sub-millisecond hash lookups.",
    },
    {
      level: "Think",
      title: "Short Document Vulnerability",
      brief:
        "Why is SimHash highly accurate for 500-word news articles but prone to false-positives for 5-word tweets?",
    },
  ],
  reflection: [
    "Why does Locality-Sensitive Hashing behave opposite to cryptographic hashing algorithms like SHA-256?",
    "How does the 64-bit SimHash representation enable hardware-accelerated Hamming distance comparisons?",
    "What role does the Hamming threshold play in balancing cluster precision versus recall?",
  ],
  techNotes: [
    {
      name: "POPCNT Hardware Instruction",
      kind: "CPU Architecture",
      note: "Modern x86 and ARM processors include a native `POPCNT` instruction that counts non-zero bits in a 64-bit register in a single 1-nanosecond clock cycle.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Generate SimHash and Cluster Near-Duplicate Articles",
    brief:
      "Implement `deduplicate_news_stream`: given `articles` `[{'id': str, 'tokens': list[str]}]` and `max_hamming_distance` (int, default 3). Compute 64-bit SimHash for each article using `hash64(token) = int(hashlib.md5(token.encode()).hexdigest()[:16], 16)`. Group articles into clusters sequentially: assign article to the first cluster whose centroid SimHash has `hamming_distance <= max_hamming_distance`. If no cluster matches, create a new cluster with this article as centroid. Return a list of cluster dicts: `[{'cluster_id': str, 'articles': list[str]}]` where cluster_id is 'cluster_1', 'cluster_2', etc.",
    functionName: "deduplicate_news_stream",
    signature:
      "def deduplicate_news_stream(articles: list[dict], max_hamming_distance: int) -> list[dict]:",
    starterCode: `import hashlib

def deduplicate_news_stream(articles: list[dict], max_hamming_distance: int = 3) -> list[dict]:
    # articles: [{"id": str, "tokens": list[str]}]
    # Return list of {"cluster_id": str, "articles": list[str]}
    def hash64(token: str) -> int:
        return int(hashlib.md5(token.encode("utf-8")).hexdigest()[:16], 16)

    def simhash(tokens: list[str]) -> int:
        v = [0] * 64
        for t in tokens:
            h = hash64(t)
            for i in range(64):
                if (h >> i) & 1:
                    v[i] += 1
                else:
                    v[i] -= 1
        fp = 0
        for i in range(64):
            if v[i] > 0:
                fp |= (1 << i)
        return fp

    def hamming(fp1: int, fp2: int) -> int:
        return bin(fp1 ^ fp2).count("1")

    clusters = []
    for art in articles:
        fp = simhash(art["tokens"])
        matched = False
        for c in clusters:
            if hamming(fp, c["fp"]) <= max_hamming_distance:
                c["articles"].append(art["id"])
                matched = True
                break
        if not matched:
            c_id = f"cluster_{len(clusters) + 1}"
            clusters.append({
                "cluster_id": c_id,
                "fp": fp,
                "articles": [art["id"]]
            })

    return [{"cluster_id": c["cluster_id"], "articles": c["articles"]} for c in clusters]
`,
    javaSignature:
      "public static List<Map<String, Object>> deduplicateNewsStream(List<Map<String, Object>> articles, int maxHammingDistance)",
    javaStarterCode: `import java.util.*;
import java.security.MessageDigest;

public class Solution {
    public static List<Map<String, Object>> deduplicateNewsStream(
        List<Map<String, Object>> articles,
        int maxHammingDistance
    ) {
        List<Map<String, Object>> clusterStorage = new ArrayList<>();

        for (Map<String, Object> art : articles) {
            String artId = (String) art.get("id");
            List<String> tokens = (List<String>) art.get("tokens");
            long fp = computeSimhash(tokens);

            boolean matched = false;
            for (Map<String, Object> c : clusterStorage) {
                long cFp = (long) c.get("fp");
                if (hamming(fp, cFp) <= maxHammingDistance) {
                    List<String> artList = (List<String>) c.get("articles");
                    artList.add(artId);
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                Map<String, Object> newC = new HashMap<>();
                newC.put("cluster_id", "cluster_" + (clusterStorage.size() + 1));
                newC.put("fp", fp);
                List<String> artList = new ArrayList<>();
                artList.add(artId);
                newC.put("articles", artList);
                clusterStorage.add(newC);
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (Map<String, Object> c : clusterStorage) {
            Map<String, Object> item = new HashMap<>();
            item.put("cluster_id", c.get("cluster_id"));
            item.put("articles", c.get("articles"));
            results.add(item);
        }
        return results;
    }

    private static long computeSimhash(List<String> tokens) {
        int[] v = new int[64];
        for (String t : tokens) {
            long h = hash64(t);
            for (int i = 0; i < 64; i++) {
                if (((h >> i) & 1L) == 1L) {
                    v[i]++;
                } else {
                    v[i]--;
                }
            }
        }
        long fp = 0L;
        for (int i = 0; i < 64; i++) {
            if (v[i] > 0) {
                fp |= (1L << i);
            }
        }
        return fp;
    }

    private static long hash64(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(token.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                String hex = Integer.toHexString(0xff & digest[i]);
                if (hex.length() == 1) sb.append('0');
                sb.append(hex);
            }
            return Long.parseUnsignedLong(sb.toString(), 16);
        } catch (Exception e) {
            return 0L;
        }
    }

    private static int hamming(long fp1, long fp2) {
        return Long.bitCount(fp1 ^ fp2);
    }
}`,
    mermaid: `graph TD
    Start["deduplicate_news_stream(articles, max_dist)"] --> LoopArt["For each article in articles"]
    LoopArt --> SimHash["Compute 64-bit SimHash(article.tokens)"]
    SimHash --> LoopC["Compare with existing clusters"]
    LoopC --> HammingCheck{"hamming_distance(fp, cluster.fp) <= max_dist?"}
    HammingCheck -->|"Yes"| AddToCluster["Append article.id to matching cluster"]
    HammingCheck -->|"No"| NextC{"More clusters?"}
    NextC -->|"Yes"| LoopC
    NextC -->|"No"| NewCluster["Create new cluster with centroid = fp"]
    AddToCluster --> NextArt{"More articles?"}
    NewCluster --> NextArt
    NextArt -->|"Yes"| LoopArt
    NextArt -->|"No"| Return["Return formatted cluster list"]
`,
    hints: [
      "Use MD5 first 16 hex characters for 64-bit integer token hashing.",
      "Initialize 64-element accumulator array and take bit = 1 if v[i] > 0.",
      "Hamming distance is bin(fp1 ^ fp2).count('1').",
    ],
    tests: [
      {
        name: "Identical token articles grouped into same cluster",
        args: [
          [
            { id: "A1", tokens: ["breaking", "news", "spacex", "launches", "rocket"] },
            { id: "A2", tokens: ["breaking", "news", "spacex", "launches", "rocket"] },
          ],
          3,
        ],
        expected: [{ cluster_id: "cluster_1", articles: ["A1", "A2"] }],
      },
      {
        name: "Near duplicate with 1 minor word addition joins cluster",
        args: [
          [
            {
              id: "A1",
              tokens: [
                "senate",
                "passes",
                "bipartisan",
                "infrastructure",
                "bill",
                "today",
                "washington",
              ],
            },
            {
              id: "A2",
              tokens: ["senate", "passes", "bipartisan", "infrastructure", "bill", "today", "dc"],
            },
            {
              id: "A3",
              tokens: ["recipe", "delicious", "chocolate", "chip", "cookies", "baking", "oven"],
            },
          ],
          5,
        ],
        expected: [
          { cluster_id: "cluster_1", articles: ["A1", "A2"] },
          { cluster_id: "cluster_2", articles: ["A3"] },
        ],
      },
    ],
    explanationPrompt:
      "Explain how your deduplication engine constructs 64-bit SimHash fingerprints, measures Hamming distance, and groups near-duplicate news syndications into story clusters.",
  },
};

// ----------------------------------------------------------------------------
// Case 49: Smart Notification Digest & Quiet Hours
// ----------------------------------------------------------------------------
export const case49_notificationDigest = {
  id: "cs-notification-digest-049",
  slug: "smart-notification-digest-service",
  index: "49",
  title:
    "How Does a Smart Notification Service Batch High-Frequency Events and Respect User Quiet Hours?",
  shortTitle: "Smart Notification Digest Service",
  category: "Realtime & Communication",
  subcategory: "Notification Batching & Quiet Hours",
  difficulty: "Intermediate",
  learnerLevel: "Builder",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "premium",
  rcCost: 50,
  summary:
    "Platforms like LinkedIn, GitHub, and Instagram generate hundreds of social events (likes, comments, mentions) per user each day. Discover how notification engines batch repetitive events into intelligent digests (e.g. 'Alice and 14 others liked your post') while holding deliveries during user quiet hours.",
  learningObjectives: [
    "Design event batching and rollup windows to collapse high-frequency notifications.",
    "Enforce time-zone-aware user quiet hours (e.g. 10:00 PM to 8:00 AM local time).",
    "Model notification channel prioritization (Push, Email, In-App, SMS).",
    "Implement urgent override bypasses for critical security and account alerts.",
  ],
  prerequisites: [
    "Timezone offsets and UTC timestamp conversion",
    "Dictionary aggregation and grouping",
    "Priority queue or event buffer scheduling",
  ],
  engineeringConcepts: [
    "Event Rollup Aggregation",
    "Timezone Quiet Hours Guard",
    "Channel Escalation Routing",
    "Urgent Override Bypasses",
    "Idempotent Push Delivery",
  ],
  technologies: ["Python", "Java", "Redis", "Celery", "FCM / APNs"],
  tech: ["Batching", "Notification", "Timezones"],
  tags: ["notifications", "digest", "quiet-hours", "linkedin", "intermediate"],
  glossary: [
    {
      term: "Event Rollup Aggregation",
      plainDefinition:
        "Combining multiple similar events over a time window into a single composite message.",
    },
    {
      term: "Timezone Quiet Hours Guard",
      plainDefinition:
        "Holding non-critical notifications when the recipient's local wall clock falls within sleep hours.",
    },
    {
      term: "Channel Escalation Routing",
      plainDefinition:
        "Sending low-urgency events as daily email digests, medium events as in-app badges, and high-urgency as mobile push.",
    },
    {
      term: "Urgent Override Bypasses",
      plainDefinition:
        "Allowing critical security alerts (e.g. password resets, fraud alarms) to bypass quiet hours immediately.",
    },
    {
      term: "Idempotent Push Delivery",
      plainDefinition: "Ensuring duplicate alert triggers do not buzz user phones multiple times.",
    },
  ],
  primers: [
    {
      concept: "Rollup Notification Math",
      minutes: 4,
      definition:
        "If a post receives 50 likes in 10 minutes, do not send 50 push notifications. Aggregate by (user_id, post_id, event_type). Format as '{first_actor} and {N-1} others {action} your post'.",
      whyNeeded:
        "Sending 50 distinct push buzzes causes users to disable app notifications entirely.",
      analogy:
        "A postal delivery worker bringing all your letters once a day in one bundle instead of ringing your doorbell 15 times.",
      tinyExample:
        "if len(actors) == 1:\n    msg = f'{actors[0]} liked your post'\nelse:\n    msg = f'{actors[0]} and {len(actors)-1} others liked your post'",
    },
    {
      concept: "Timezone-Aware Quiet Hours",
      minutes: 4,
      definition:
        "Convert event UTC time to recipient's local time using their UTC offset. If local_hour >= 22 (10 PM) or local_hour < 8 (8 AM), hold notification in buffer until morning.",
      whyNeeded:
        "Waking up users at 3:00 AM with social media notifications leads to high uninstalls.",
      analogy: "Placing a 'Do Not Disturb' sign on a hotel room door.",
      tinyExample:
        "local_hour = (utc_hour + tz_offset) % 24\nis_quiet = local_hour >= 22 or local_hour < 8",
    },
  ],
  discover: {
    situation:
      "A developer platform sent individual push notifications for every GitHub star and comment. When a developer's repository went viral on Hacker News, their phone received 8,000 push buzzes throughout the night, completely draining their phone battery while they were asleep in Tokyo. The developer uninstalled the app and posted a viral complaint.",
    humanFlow: [
      "User configures notification preferences: quiet hours (22:00 to 08:00) and timezone.",
      "Followers perform social actions (likes, comments, stars).",
      "Notification engine routes events into a 15-minute rollup buffer.",
      "At window expiration, engine formats composite digest message.",
      "Engine checks recipient local time: if in quiet hours and not urgent, holds delivery until 08:00.",
    ],
    question:
      "How do you design a notification service that aggregates high-frequency social events into composite digests and respects recipient timezone quiet hours?",
    whyItExists: [
      "Social engagement requires timely notifications without overwhelming user attention.",
      "Global user bases require timezone-aware delivery to respect human sleep schedules.",
      "Emergency security alerts must immediately bypass all quiet-hour restrictions.",
    ],
  },
  understand: {
    overview:
      "The Notification Digest Service ingests raw events into an aggregation buffer keyed by `(user_id, target_id, action)`. When the batching window concludes, a Digest Formatter builds a rollup summary. A Quiet Hours Evaluator converts the current timestamp to the user's local hour; if in quiet hours and non-urgent, the message is queued for morning release.",
    components: [
      {
        name: "Event Intake Buffer",
        whatIsIt: "Time-windowed buffer collecting raw activity events.",
        whyItExists: "Absorbs bursty social spikes and groups related actions.",
        whatItDoes: "Stores actors and timestamps grouped by target entity.",
      },
      {
        name: "Rollup Digest Formatter",
        whatIsIt: "Text synthesis engine producing human-friendly summary copy.",
        whyItExists: "Condenses multiple notifications into a single readable string.",
        whatItDoes: "Formats '{actor} and {N-1} others liked your post'.",
      },
      {
        name: "Quiet Hours Evaluator",
        whatIsIt: "Timezone calculation service checking recipient local time.",
        whyItExists: "Enforces Do-Not-Disturb preferences across global timezones.",
        whatItDoes: "Calculates `(utc_hour + offset) % 24` and checks quiet window.",
      },
      {
        name: "Push Dispatch Gateway",
        whatIsIt: "Integration worker sending final packets to APNs / FCM / Email.",
        whyItExists: "Manages real-world delivery across vendor notification channels.",
        whatItDoes: "Sends HTTP payloads to Apple and Google push servers.",
      },
    ],
    analogy: {
      title: "Newspaper Morning Delivery",
      everyday: [
        "Reporters write individual news stories around the clock at all hours of the day and night.",
        "The newspaper printer doesn't deliver single-page articles to your doorstep every 20 minutes.",
        "All day's stories are printed into a single bundled morning edition delivered quietly at 7:00 AM.",
      ],
      technical: [
        "Individual reporter stories correspond to Raw Notification Events.",
        "Bundled newspaper edition corresponds to the Rollup Digest.",
        "7:00 AM morning delivery corresponds to the Quiet Hours Expiration Release.",
      ],
    },
    flow: [
      "Event arrives: {recipient_id, actor, target_id, action, is_urgent, timestamp_hour_utc}.",
      "If is_urgent is True: deliver immediately (bypass quiet hours and rollup).",
      "Else, append actor to rollup bucket: `(recipient_id, target_id, action)`.",
      "Format rollup copy: '{first_actor} and {count-1} others {action} your post'.",
      "Check recipient local time: local_hour = (timestamp_hour_utc + user_tz_offset) % 24.",
      "If 22 <= local_hour or local_hour < 8: status = 'HELD_FOR_QUIET_HOURS'.",
      "Else: status = 'SENT_DIGEST'.",
    ],
  },
  concepts: [
    {
      id: "concept-rollup-format",
      name: "Event Rollup Formatting",
      difficulty: "Intermediate",
      simpleDefinition:
        "Condensing multiple interactions on the same resource into a single summary string.",
      whyItExists:
        "Eliminates repetitive notification clutter and conserves screen real estate on mobile devices.",
      realWorldAnalogy:
        "Bank statement showing '5 ATM withdrawals totaling $200' rather than 5 separate notification alerts.",
      technicalExplanation:
        "Group by (recipient, target_id). If len(actors) == 1: '{actor} {action}'. If len(actors) > 1: '{actors[0]} and {len-1} others {action}'.",
      caseApplication:
        "Used by LinkedIn, Instagram, and Facebook for all high-frequency like/reaction notifications.",
      commonMistakes: [
        "Duplicate actor counting (e.g. if the same user unlikes and likes 3 times, counting them as 3 distinct people).",
        "Grammar bugs (e.g. 'Alice and 0 others liked your post').",
      ],
      practice: [
        "How do you deduplicate actors so unique people are counted rather than raw click events?",
        "Write the formatting logic for exactly 1, 2, and 3+ distinct actors.",
      ],
    },
    {
      id: "concept-quiet-hours-tz",
      name: "Timezone-Aware Quiet Hours",
      difficulty: "Intermediate",
      simpleDefinition:
        "Holding notifications when the recipient's local time falls between night hours (e.g. 10 PM to 8 AM).",
      whyItExists: "Prevents waking sleeping users with non-critical mobile alerts.",
      realWorldAnalogy:
        "Quiet hours in college dormitories or apartment buildings between 10 PM and 8 AM.",
      technicalExplanation:
        "local_hour = (utc_hour + tz_offset) % 24. If local_hour >= 22 or local_hour < 8: hold until 8 AM.",
      caseApplication: "Respects human biological circadian rhythms across global customer bases.",
      commonMistakes: [
        "Evaluating quiet hours against the server's UTC time instead of the recipient's local timezone.",
        "Blocking urgent 2-factor authentication codes during quiet hours.",
      ],
      practice: [
        "A user in Tokyo (UTC+9) has quiet hours 22 to 8. If an event occurs at 14:00 UTC, is it in quiet hours? (14 + 9 = 23 -> YES).",
        "Why must password reset codes have an `is_urgent = True` flag that skips quiet hour checks?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Smart Notification Digest Service showing rollup batching and timezone quiet hours gating.",
    levels: [
      {
        title: "Level 1: Notification Pipeline",
        description: "Event ingestion through Rollup Buffer, Quiet Hours Gate, and Push Dispatch.",
        mermaid: `graph TD
    App["User Social Interactions"] --> Ingestion["Notification Ingestion Service"]
    Ingestion --> UrgentCheck{"is_urgent == True?"}
    UrgentCheck -->|"Yes"| DirectPush["Immediate Push Dispatch"]
    UrgentCheck -->|"No"| RollupBuffer["15-Min Rollup Buffer"]
    RollupBuffer --> Format["Format Composite Message"]
    Format --> QuietCheck{"Recipient in Quiet Hours?"}
    QuietCheck -->|"Yes"| Hold["Hold in Morning Release Queue"]
    QuietCheck -->|"No"| Dispatch["Send Composite Push Alert"]
`,
      },
      {
        title: "Level 2: Rollup Batching Logic",
        description: "Collapsing multiple actor events into composite copy.",
        mermaid: `graph TD
    Events["3 Events on Post 42: Alice, Bob, Charlie liked"] --> Group["Group by (recipient, post_42, 'liked')"]
    Group --> UniqueActors["Deduplicate Unique Actors: ['Alice', 'Bob', 'Charlie']"]
    UniqueActors --> CountCheck{"Unique Actors Count"}
    CountCheck -->|"1"| Single["'Alice liked your post'"]
    CountCheck -->|"2"| Pair["'Alice and Bob liked your post'"]
    CountCheck -->|">2"| Plural["'Alice and 2 others liked your post'"]
`,
      },
      {
        title: "Level 3: Timezone Quiet Hours Math",
        description: "Calculating local recipient hour from UTC timestamp and offset.",
        mermaid: `graph TD
    UTC["utc_hour (0-23)"] --> Calc["local_hour = (utc_hour + tz_offset) % 24"]
    Calc --> Range{"local_hour >= 22 OR local_hour < 8?"}
    Range -->|"Yes"| InQuiet["Queue for 08:00 AM Morning Release"]
    Range -->|"No"| OutQuiet["Deliver Notification Immediately"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Rollup Batching with Time Window Buffers",
      what: "Buffer social notifications in 15-minute windows and synthesize composite messages rather than dispatching instantaneous alerts per event.",
      why: "Prevents notification fatigue and notification spam storms when a user's post receives hundreds of reactions.",
      problemSolved: "Reduces push notification volume by over 90% during viral social spikes.",
      withoutIt:
        "Users disable mobile app notifications or leave 1-star reviews about notification spam.",
      alternatives: [
        "Immediate dispatch for every single like.",
        "Daily batch email only (lacks real-time engagement).",
      ],
      tradeoff:
        "Users receive like notifications with a 15-minute delay rather than instantaneous alerts.",
    },
    {
      title: "Urgent Priority Bypass Invariant",
      what: "Exempt security alerts, two-factor authentication SMS, and account compromise notices from quiet hours and rollup batching.",
      why: "A user whose credit card was just used for a fraudulent transaction at 2:00 AM needs to be awakened immediately.",
      problemSolved:
        "Guarantees security and critical account integrity are never compromised by sleep schedules.",
      withoutIt:
        "Victims of account theft sleep through the incident because fraud alerts were held until 8:00 AM.",
      alternatives: ["Strict quiet hours with no bypasses."],
      tradeoff:
        "Requires strict governance over which team services are granted permission to set `is_urgent = True`.",
    },
  ],
  implementation: {
    behaviour:
      "A NotificationDigestService class that aggregates social events into rollup summaries and respects recipient timezone quiet hours.",
    algorithm: [
      "1. process_notifications(events, user_settings):",
      "   a. For each event (recipient_id, actor, target_id, action, is_urgent, utc_hour):",
      "   b. If is_urgent is True:",
      "      - Send immediately: {'recipient': recipient_id, 'message': f'{actor} {action}', 'status': 'SENT_IMMEDIATE'}.",
      "   c. Else: group actors by (recipient_id, target_id, action). Deduplicate actors.",
      "   d. For each group:",
      "      - Format copy: if count == 1: '{actor} {action}'. If count == 2: '{actor1} and {actor2} {action}'. If count > 2: '{actor1} and {count-1} others {action}'.",
      "      - Check quiet hours: local_hour = (utc_hour + user.tz_offset) % 24.",
      "      - If local_hour >= user.quiet_start or local_hour < user.quiet_end: status = 'HELD_QUIET_HOURS'.",
      "      - Else: status = 'SENT_DIGEST'.",
      "   e. Return list of notification outcome dicts.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Immediate Push Spammer",
        detail:
          "Sends a separate push alert for every single event regardless of hour or frequency.",
      },
      {
        level: "Level 1",
        title: "Rollup Message Formatter",
        detail: "Aggregates events into 'Alice and N others' summaries.",
      },
      {
        level: "Level 2",
        title: "Timezone Quiet Hours Gate",
        detail: "Adds local timezone conversion and holds night notifications until morning.",
      },
      {
        level: "Level 3",
        title: "Multi-Channel Omni-Notification Engine",
        detail:
          "Intelligent channel fallbacks (Push -> In-App -> Email), smart ML delivery timing, and quiet-hours batching.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "notification_digest.py",
        code: `class NotificationDigestEngine:
    @staticmethod
    def process_events(events: list[dict], user_prefs: dict) -> list[dict]:
        # user_prefs: {user_id: {"tz_offset": int, "quiet_start": int, "quiet_end": int}}
        urgent_dispatches = []
        regular_batches: dict[tuple, list[str]] = {}
        last_utc_hour = 0

        for ev in events:
            rec = ev["recipient"]
            last_utc_hour = ev.get("utc_hour", 0)
            if ev.get("is_urgent", False):
                urgent_dispatches.append({
                    "recipient": rec,
                    "message": f"URGENT: {ev['actor']} {ev['action']}",
                    "status": "SENT_IMMEDIATE"
                })
            else:
                key = (rec, ev["target_id"], ev["action"])
                if key not in regular_batches:
                    regular_batches[key] = []
                if ev["actor"] not in regular_batches[key]:
                    regular_batches[key].append(ev["actor"])

        results = list(urgent_dispatches)
        for (rec, target, action), actors in regular_batches.items():
            count = len(actors)
            if count == 1:
                msg = f"{actors[0]} {action}"
            elif count == 2:
                msg = f"{actors[0]} and {actors[1]} {action}"
            else:
                msg = f"{actors[0]} and {count - 1} others {action}"

            prefs = user_prefs.get(rec, {"tz_offset": 0, "quiet_start": 22, "quiet_end": 8})
            local_hour = (last_utc_hour + prefs.get("tz_offset", 0)) % 24
            is_quiet = local_hour >= prefs.get("quiet_start", 22) or local_hour < prefs.get("quiet_end", 8)

            results.append({
                "recipient": rec,
                "message": msg,
                "status": "HELD_QUIET_HOURS" if is_quiet else "SENT_DIGEST"
            })

        return results`,
        explanations: [
          {
            code: 'if ev.get("is_urgent", False): urgent_dispatches.append(...)',
            explanation:
              "Immediately dispatches critical security alerts, bypassing quiet hours and batching.",
          },
          {
            code: 'local_hour = (last_utc_hour + prefs.get("tz_offset", 0)) % 24',
            explanation:
              "Converts UTC time to the recipient's local wall clock hour using modulo 24 arithmetic.",
          },
          {
            code: 'is_quiet = local_hour >= prefs.get("quiet_start", 22) or local_hour < prefs.get("quiet_end", 8)',
            explanation:
              "Determines if notification falls within recipient's configured sleep window.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates social event rollup and timezone quiet hours routing in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Modulo 24 Timezone Arithmetic",
      brief:
        "Explain how `(utc_hour + tz_offset) % 24` cleanly handles negative offsets like New York (UTC-5) when utc_hour is 2: (2 - 5) % 24 = 21 (9:00 PM previous day).",
    },
    {
      level: "Modify",
      title: "Add Quiet Hours Day-of-Week Support",
      brief:
        "Modify the quiet hours check to support weekend schedules where users allow sleeping until 10:00 AM on Saturdays and Sundays.",
    },
    {
      level: "Build",
      title: "Morning Release Scheduler",
      brief:
        "Implement a release_morning_digests(utc_hour) worker that inspects held messages and dispatches all messages whose recipients have just reached local 08:00 AM.",
    },
    {
      level: "Think",
      title: "Un-roll Notification Updates",
      brief:
        "What happens if a user un-likes a post before the 15-minute rollup window expires, and how should the actor list be decremented?",
    },
  ],
  reflection: [
    "Why must notification engines combine duplicate actor events before generating digest copy?",
    "How does timezone-aware scheduling protect user attention and brand goodwill?",
    "Why is an urgent priority bypass essential for security and two-factor authentication alerts?",
  ],
  techNotes: [
    {
      name: "APNs Collapse IDs",
      kind: "Mobile Standards",
      note: "Apple Push Notification Service (APNs) supports an `apns-collapse-id` header that automatically updates an existing lock-screen notification in-place instead of creating a second notification banner.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Aggregate Notification Digests and Apply Quiet Hours",
    brief:
      "Implement `process_notification_digests`: given `events` `[{'recipient': str, 'actor': str, 'target_id': str, 'action': str, 'is_urgent': bool, 'utc_hour': int}]` and `user_profiles` `[{'id': str, 'tz_offset': int}]`. Default quiet hours are 22 (10 PM) to 8 (8 AM) local time: `local_hour = (utc_hour + tz_offset) % 24`, quiet if `local_hour >= 22 or local_hour < 8`. Urgent events immediately return `{'recipient': str, 'message': str, 'status': 'SENT_IMMEDIATE'}`. Non-urgent events group by `(recipient, target_id, action)` with deduplicated actors. Copy rules: count=1 -> '{actor} {action}', count=2 -> '{actor1} and {actor2} {action}', count>2 -> '{actor1} and {count-1} others {action}'. Status is 'HELD_QUIET_HOURS' if quiet, else 'SENT_DIGEST'. Return list of outcome dicts.",
    functionName: "process_notification_digests",
    signature:
      "def process_notification_digests(events: list[dict], user_profiles: list[dict]) -> list[dict]:",
    starterCode: `def process_notification_digests(events: list[dict], user_profiles: list[dict]) -> list[dict]:
    # events: [{"recipient": str, "actor": str, "target_id": str, "action": str, "is_urgent": bool, "utc_hour": int}]
    # user_profiles: [{"id": str, "tz_offset": int}]
    # Return list of {"recipient": str, "message": str, "status": str}
    tz_map = {u["id"]: u.get("tz_offset", 0) for u in user_profiles}
    urgent_results = []
    batches = {}  # (recipient, target_id, action) -> {"actors": list, "utc_hour": int}

    for ev in events:
        rec = ev["recipient"]
        actor = ev["actor"]
        action = ev["action"]
        is_urg = ev.get("is_urgent", False)
        utc_h = ev.get("utc_hour", 0)

        if is_urg:
            urgent_results.append({
                "recipient": rec,
                "message": f"URGENT: {actor} {action}",
                "status": "SENT_IMMEDIATE"
            })
        else:
            key = (rec, ev["target_id"], action)
            if key not in batches:
                batches[key] = {"actors": [], "utc_hour": utc_h}
            if actor not in batches[key]["actors"]:
                batches[key]["actors"].append(actor)
            batches[key]["utc_hour"] = utc_h

    regular_results = []
    for (rec, target, action), data in batches.items():
        actors = data["actors"]
        count = len(actors)
        if count == 1:
            msg = f"{actors[0]} {action}"
        elif count == 2:
            msg = f"{actors[0]} and {actors[1]} {action}"
        else:
            msg = f"{actors[0]} and {count - 1} others {action}"

        offset = tz_map.get(rec, 0)
        local_h = (data["utc_hour"] + offset) % 24
        is_quiet = (local_h >= 22 or local_h < 8)

        status = "HELD_QUIET_HOURS" if is_quiet else "SENT_DIGEST"
        regular_results.append({
            "recipient": rec,
            "message": msg,
            "status": status
        })

    return urgent_results + regular_results
`,
    javaSignature:
      "public static List<Map<String, String>> processNotificationDigests(List<Map<String, Object>> events, List<Map<String, Object>> userProfiles)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static List<Map<String, String>> processNotificationDigests(
        List<Map<String, Object>> events,
        List<Map<String, Object>> userProfiles
    ) {
        Map<String, Integer> tzMap = new HashMap<>();
        for (Map<String, Object> u : userProfiles) {
            String uId = (String) u.get("id");
            int off = ((Number) u.getOrDefault("tz_offset", 0)).intValue();
            tzMap.put(uId, off);
        }

        List<Map<String, String>> urgentResults = new ArrayList<>();
        Map<String, List<String>> batchActors = new LinkedHashMap<>();
        Map<String, Integer> batchUtc = new HashMap<>();
        Map<String, String> batchRec = new HashMap<>();
        Map<String, String> batchAction = new HashMap<>();

        for (Map<String, Object> ev : events) {
            String rec = (String) ev.get("recipient");
            String actor = (String) ev.get("actor");
            String targetId = (String) ev.get("target_id");
            String action = (String) ev.get("action");
            boolean isUrg = (boolean) ev.getOrDefault("is_urgent", false);
            int utcH = ((Number) ev.getOrDefault("utc_hour", 0)).intValue();

            if (isUrg) {
                Map<String, String> item = new HashMap<>();
                item.put("recipient", rec);
                item.put("message", "URGENT: " + actor + " " + action);
                item.put("status", "SENT_IMMEDIATE");
                urgentResults.add(item);
            } else {
                String key = rec + "::" + targetId + "::" + action;
                batchActors.computeIfAbsent(key, k -> new ArrayList<>());
                if (!batchActors.get(key).contains(actor)) {
                    batchActors.get(key).add(actor);
                }
                batchUtc.put(key, utcH);
                batchRec.put(key, rec);
                batchAction.put(key, action);
            }
        }

        List<Map<String, String>> regularResults = new ArrayList<>();
        for (String key : batchActors.keySet()) {
            List<String> actors = batchActors.get(key);
            String rec = batchRec.get(key);
            String action = batchAction.get(key);
            int utcH = batchUtc.get(key);

            int count = actors.size();
            String msg;
            if (count == 1) {
                msg = actors.get(0) + " " + action;
            } else if (count == 2) {
                msg = actors.get(0) + " and " + actors.get(1) + " " + action;
            } else {
                msg = actors.get(0) + " and " + (count - 1) + " others " + action;
            }

            int offset = tzMap.getOrDefault(rec, 0);
            int localH = ((utcH + offset) % 24 + 24) % 24;
            boolean isQuiet = (localH >= 22 || localH < 8);

            Map<String, String> item = new HashMap<>();
            item.put("recipient", rec);
            item.put("message", msg);
            item.put("status", isQuiet ? "HELD_QUIET_HOURS" : "SENT_DIGEST");
            regularResults.add(item);
        }

        List<Map<String, String>> finalRes = new ArrayList<>(urgentResults);
        finalRes.addAll(regularResults);
        return finalRes;
    }
}`,
    mermaid: `graph TD
    Start["process_notification_digests(...)"] --> LoopEv["For each event in events"]
    LoopEv --> CheckUrgent{"is_urgent == True?"}
    CheckUrgent -->|"Yes"| AddUrgent["Append URGENT SENT_IMMEDIATE"]
    CheckUrgent -->|"No"| AddBatch["Append unique actor to (rec, target, action) batch"]
    AddUrgent --> NextEv{"More events?"}
    AddBatch --> NextEv
    NextEv -->|"Yes"| LoopEv
    NextEv -->|"No"| LoopBatch["For each batch: format copy (1, 2, or N others)"]
    LoopBatch --> CalcTZ["local_hour = (utc_hour + tz_offset) % 24"]
    CalcTZ --> CheckQuiet{"local_hour >= 22 or local_hour < 8?"}
    CheckQuiet -->|"Yes"| SetHeld["status = 'HELD_QUIET_HOURS'"]
    CheckQuiet -->|"No"| SetSent["status = 'SENT_DIGEST'"]
    SetHeld --> Return["Return urgent + regular results"]
    SetSent --> Return
`,
    hints: [
      "Process urgent events immediately without grouping.",
      "Deduplicate actors in each batch so the same user is not counted twice.",
      "Compute local hour as (utc_hour + tz_offset) % 24 and check [22, 24) or [0, 8).",
    ],
    tests: [
      {
        name: "Rollup 3 likes into composite digest during active daytime hours",
        args: [
          [
            {
              recipient: "Alice",
              actor: "Bob",
              target_id: "P1",
              action: "liked your post",
              is_urgent: false,
              utc_hour: 12,
            },
            {
              recipient: "Alice",
              actor: "Charlie",
              target_id: "P1",
              action: "liked your post",
              is_urgent: false,
              utc_hour: 12,
            },
            {
              recipient: "Alice",
              actor: "Dave",
              target_id: "P1",
              action: "liked your post",
              is_urgent: false,
              utc_hour: 12,
            },
          ],
          [{ id: "Alice", tz_offset: 0 }], // UTC+0, local_hour = 12 (Daytime)
        ],
        expected: [
          {
            recipient: "Alice",
            message: "Bob and 2 others liked your post",
            status: "SENT_DIGEST",
          },
        ],
      },
      {
        name: "Non-urgent digest held during recipient quiet hours",
        args: [
          [
            {
              recipient: "Kenji",
              actor: "Sarah",
              target_id: "P2",
              action: "commented",
              is_urgent: false,
              utc_hour: 15,
            },
          ],
          [{ id: "Kenji", tz_offset: 9 }], // Tokyo UTC+9: (15 + 9) % 24 = 0 (Midnight -> Quiet)
        ],
        expected: [{ recipient: "Kenji", message: "Sarah commented", status: "HELD_QUIET_HOURS" }],
      },
      {
        name: "Urgent 2FA alert bypasses quiet hours immediately",
        args: [
          [
            {
              recipient: "Kenji",
              actor: "Security",
              target_id: "AUTH",
              action: "login from new device",
              is_urgent: true,
              utc_hour: 15,
            },
          ],
          [{ id: "Kenji", tz_offset: 9 }],
        ],
        expected: [
          {
            recipient: "Kenji",
            message: "URGENT: Security login from new device",
            status: "SENT_IMMEDIATE",
          },
        ],
      },
    ],
    explanationPrompt:
      "Explain how your notification service rolls up multiple social interactions, converts UTC timestamps to recipient local time, and handles urgent priority bypasses.",
  },
};

// ----------------------------------------------------------------------------
// Case 50: Async Video Transcoding & HLS Chunking Pipeline
// ----------------------------------------------------------------------------
export const case50_videoTranscoding = {
  id: "cs-video-transcoding-050",
  slug: "async-video-transcoding-pipeline",
  index: "50",
  title:
    "How Does a Video Streaming Pipeline Chunk Raw Uploads and Transcode to Adaptive Bitrate HLS?",
  shortTitle: "Video Transcoding Pipeline",
  category: "Reliability & Scalability",
  subcategory: "Distributed Video Transcoding & HLS Manifests",
  difficulty: "Intermediate",
  learnerLevel: "Builder",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "premium",
  rcCost: 60,
  summary:
    "Platforms like YouTube, Netflix, and TikTok ingest gigabytes of raw user-uploaded MP4 files and transcode them into multiple resolutions (1080p, 720p, 480p) sliced into 6-second HTTP Live Streaming (HLS) chunks. Discover how an asynchronous queue worker pipeline partitions video files and builds master M3U8 playlists.",
  learningObjectives: [
    "Design an asynchronous queue-worker video transcoding DAG.",
    "Split long video files into parallelizable chunk segments (GOP keyframe boundaries).",
    "Encode multi-resolution renditions (1080p, 720p, 360p) for Adaptive Bitrate Streaming (ABR).",
    "Generate valid HLS Master and Variant `.m3u8` playlist manifests.",
  ],
  prerequisites: [
    "Video containers (MP4), codecs (H.264), and keyframes (GOP)",
    "Asynchronous worker queues and S3 object storage",
    "HLS (HTTP Live Streaming) and playlist formats",
  ],
  engineeringConcepts: [
    "Adaptive Bitrate Streaming (ABR)",
    "HLS Chunking & M3U8 Playlists",
    "Parallel Segment Transcoding",
    "GOP Keyframe Alignment",
    "Asynchronous Queue-Worker DAG",
  ],
  technologies: ["Python", "Java", "FFmpeg", "HLS", "S3", "Celery"],
  tech: ["FFmpeg", "HLS", "Video Pipeline"],
  tags: ["video", "transcoding", "hls", "streaming", "intermediate"],
  glossary: [
    {
      term: "Adaptive Bitrate Streaming (ABR)",
      plainDefinition:
        "Dynamically adjusting video stream quality up or down based on client bandwidth to prevent buffering spinners.",
    },
    {
      term: "HLS Chunking & M3U8 Playlists",
      plainDefinition:
        "Slicing video into 6-second `.ts` or `.m4s` segments indexed by plain-text `.m3u8` playlist files.",
    },
    {
      term: "Parallel Segment Transcoding",
      plainDefinition:
        "Splitting a 60-minute video into 60 separate 1-minute tasks encoded concurrently across 60 worker nodes.",
    },
    {
      term: "GOP Keyframe Alignment",
      plainDefinition:
        "Ensuring chunk boundaries start on exact I-frame keyframes so chunks can be decoded independently.",
    },
    {
      term: "Asynchronous Queue-Worker DAG",
      plainDefinition:
        "An orchestration pipeline managing upload -> chunk -> transcode -> manifest generation stages.",
    },
  ],
  primers: [
    {
      concept: "How HLS Adaptive Bitrate Works",
      minutes: 4,
      definition:
        "Video players download a `master.m3u8` containing links to 1080p, 720p, and 480p variant playlists. If the user walks into an elevator and Wi-Fi weakens, the player requests the next 6-second chunk in 480p seamlessly without playback interruption.",
      whyNeeded: "Eliminates playback freezing when mobile network bandwidth fluctuates.",
      analogy:
        "A car engine switching automatically from 6th gear down to 3rd gear when climbing a steep hill.",
      tinyExample:
        "#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080\n1080p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720\n720p.m3u8",
    },
    {
      concept: "Segment Keyframe Slicing",
      minutes: 4,
      definition:
        "A video cannot be cut at an arbitrary millisecond. Slices must align with keyframes (I-frames) containing a full image, because P/B frames only store diffs from earlier frames.",
      whyNeeded: "Slicing mid-GOP causes visual glitch artifacts and decoding crashes.",
      analogy:
        "Cutting a physical book into chapters: cuts must happen at chapter page breaks, not in the middle of a sentence.",
      tinyExample: "segments = [f'segment_{i:03d}.ts' for i in range(total_chunks)]",
    },
  ],
  discover: {
    situation:
      "A video sharing platform tried to encode uploaded 4K videos on the main web server using a single FFmpeg process. Transcoding a 30-minute video took 25 minutes, freezing web server CPU and dropping client connections. When mobile viewers on cellular 4G tried to watch, their players constantly buffered because the video was only available in massive unchunked 4K MP4 files.",
    humanFlow: [
      "Creator uploads 2GB raw video file to S3 via pre-signed URL.",
      "S3 event triggers Ingestion Lambda, posting job to SQS queue.",
      "Worker pool splits video into 6-second segment chunks.",
      "Worker fleet transcode chunks in parallel across 1080p, 720p, 360p renditions.",
      "Manifest generator writes variant `.m3u8` files and `master.m3u8` playlist to S3.",
      "Video status flips to 'READY' and viewers stream via CDN.",
    ],
    question:
      "How do you design a scalable asynchronous video transcoding pipeline that chunks videos and generates multi-bitrate HLS playlist manifests?",
    whyItExists: [
      "Encoding video is computationally intensive and must be decoupled from client web requests.",
      "Parallel segment chunking reduces transcoding time from 30 minutes to 45 seconds.",
      "Adaptive Bitrate Streaming is the global standard for mobile video delivery across variable network speeds.",
    ],
  },
  understand: {
    overview:
      "The Video Transcoding Pipeline consists of an S3 Upload Bucket, an Orchestration Task Queue, a Transcoder Worker Pool, and an HLS Manifest Generator. The video duration is partitioned into fixed-length segments (e.g. 6 seconds). The Manifest Generator produces an HLS master playlist referencing variant playlists for each target resolution (1080p, 720p, 480p).",
    components: [
      {
        name: "Raw Ingestion Bucket",
        whatIsIt: "S3 object storage receiving original uncompressed video files.",
        whyItExists: "Stores master source files with high durability.",
        whatItDoes: "Receives direct client uploads via pre-signed URLs.",
      },
      {
        name: "Chunk Slicer Worker",
        whatIsIt: "FFmpeg process splitting video at keyframe intervals.",
        whyItExists: "Enables parallel encoding of discrete 6-second segments across many nodes.",
        whatItDoes: "Outputs segment index list: `[seg_0, seg_1, seg_2, ...]`.",
      },
      {
        name: "Parallel Encoding Fleet",
        whatIsIt: "Pool of GPU/CPU worker instances running concurrent FFmpeg jobs.",
        whyItExists: "Compresses chunks to target resolutions in parallel.",
        whatItDoes: "Encodes segment files at 1080p, 720p, 480p.",
      },
      {
        name: "HLS Manifest Builder",
        whatIsIt: "Generator writing master and variant `.m3u8` playlist files.",
        whyItExists:
          "Provides the index file video players consume to navigate chunks and switch bitrates.",
        whatItDoes: "Builds M3U8 text files containing chunk URLs and stream bandwidth headers.",
      },
    ],
    analogy: {
      title: "Translating an Encyclopedia into 3 Languages",
      everyday: [
        "A publisher wants to translate a 1,000-page encyclopedia into French, Spanish, and German.",
        "One translator working sequentially would take 3 years.",
        "Instead, the publisher rips the book into 50-page chapters and hires 60 translators simultaneously (Parallel Chunking).",
        "At the end, an editor compiles a Master Table of Contents linking to each chapter in every language (Master M3U8 Manifest).",
      ],
      technical: [
        "Ripping the encyclopedia into chapters corresponds to Segment Chunking.",
        "Translating chapters concurrently corresponds to Parallel Worker Transcoding.",
        "Master Table of Contents corresponds to the HLS Master M3U8 Playlist.",
      ],
    },
    flow: [
      "User uploads video: duration_sec, resolutions = ['1080p', '720p', '480p'], chunk_duration = 6s.",
      "Calculate total_chunks = ceil(duration_sec / chunk_duration).",
      "For each resolution, generate variant playlist text listing all `segment_{i}.ts` chunk URLs.",
      "Generate master playlist text referencing each variant resolution and bandwidth bitrates.",
      "Return generated playlists: `master.m3u8` and variant files.",
    ],
  },
  concepts: [
    {
      id: "concept-hls-manifest",
      name: "HLS Manifest Structure (.m3u8)",
      difficulty: "Intermediate",
      simpleDefinition:
        "A text file following the Extended M3U specification that tells media players where to find video chunk segments.",
      whyItExists:
        "Media players require plain HTTP-accessible indexes to stream chunks and switch resolutions.",
      realWorldAnalogy:
        "A restaurant tasting menu listing the sequence of small dishes coming to your table.",
      technicalExplanation:
        "Master manifest contains `#EXT-X-STREAM-INF` tags specifying BANDWIDTH and RESOLUTION. Variant manifests contain `#EXTINF` tags with chunk durations and file paths.",
      caseApplication:
        "Standard playback protocol for iOS Safari, Android ExoPlayer, and web Hls.js.",
      commonMistakes: [
        "Missing the mandatory `#EXTM3U` header on the first line.",
        "Forgetting `#EXT-X-ENDLIST` at the end of on-demand VOD variant playlists.",
      ],
      practice: [
        "What is the difference between a Master playlist and a Variant playlist in HLS?",
        "Why does live-streaming omit the `#EXT-X-ENDLIST` tag while video-on-demand includes it?",
      ],
    },
    {
      id: "concept-parallel-transcode",
      name: "Parallel Segment Chunking",
      difficulty: "Intermediate",
      simpleDefinition:
        "Dividing a single video into independent short segments so 50 servers can encode them concurrently.",
      whyItExists: "Reduces end-to-end turnaround time from 1 hour to 1 minute.",
      realWorldAnalogy:
        "50 construction workers each building 10 feet of a highway instead of 1 worker building the entire 500 feet.",
      technicalExplanation:
        "Number of chunks = ceil(duration / chunk_size). Each chunk is an independent task dispatched to an SQS queue.",
      caseApplication:
        "How YouTube and TikTok make newly uploaded videos available for viewing in seconds.",
      commonMistakes: [
        "Using variable chunk lengths that don't match across resolutions, causing audio desync when switching bitrates.",
        "Making chunks too short (e.g. 1 second), overwhelming browsers with thousands of HTTP requests.",
      ],
      practice: [
        "Why is 6 seconds considered the industry standard sweet spot for HLS chunk duration?",
        "What happens if chunk 4 is 5.8 seconds in 1080p but 6.2 seconds in 720p?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Asynchronous Video Transcoding Pipeline showing parallel segment workers and HLS manifest generation.",
    levels: [
      {
        title: "Level 1: Pipeline DAG",
        description: "Upload, chunking, parallel encoding, and manifest compilation.",
        mermaid: `graph TD
    Upload["Raw Video Upload to S3"] --> Trigger["S3 Event -> SQS Transcode Queue"]
    Trigger --> ChunkSplitter["Chunk Splitter: Partition into 6s Segments"]
    ChunkSplitter --> Workers["Parallel Worker Fleet (FFmpeg)"]
    Workers -->|"Encode 1080p, 720p, 480p"| EncodedChunks["Encoded .ts Segments in S3"]
    EncodedChunks --> ManifestGen["HLS Manifest Generator"]
    ManifestGen --> CDN["CloudFront CDN -> Viewer Player"]
`,
      },
      {
        title: "Level 2: HLS Playlist Hierarchy",
        description: "Master playlist referencing variant streams.",
        mermaid: `graph TD
    Master["master.m3u8"] --> Res1080["1080p.m3u8 (Bandwidth: 5Mbps)"]
    Master --> Res720["720p.m3u8 (Bandwidth: 2.5Mbps)"]
    Master --> Res480["480p.m3u8 (Bandwidth: 1Mbps)"]
    Res1080 --> Chunks1080["seg_000.ts, seg_001.ts, ..."]
    Res720 --> Chunks720["seg_000.ts, seg_001.ts, ..."]
    Res480 --> Chunks480["seg_000.ts, seg_001.ts, ..."]
`,
      },
      {
        title: "Level 3: Segment Worker Distribution",
        description: "Task queue distribution across parallel worker instances.",
        mermaid: `graph TD
    TaskQueue["Job Queue (SQS)"] --> W1["Worker 1: Chunks 0-9 (1080p)"]
    TaskQueue --> W2["Worker 2: Chunks 10-19 (1080p)"]
    TaskQueue --> W3["Worker 3: Chunks 0-9 (720p)"]
    W1 --> S3Out["Write Segments to S3"]
    W2 --> S3Out
    W3 --> S3Out
`,
      },
    ],
  },
  decisions: [
    {
      title: "6-Second Fixed Chunk Duration",
      what: "Standardize video chunk segment duration to exactly 6.0 seconds across all rendition resolutions.",
      why: "Provides fast initial video playback startup (player needs only one 6-second chunk to start playing) while keeping HTTP request overhead manageable.",
      problemSolved:
        "Prevents startup latency while avoiding the server request flood caused by 1-2 second micro-chunks.",
      withoutIt:
        "2-second chunks generate 1,800 HTTP requests per viewer for an hour-long movie, overloading CDNs.",
      alternatives: [
        "2-second chunks (used for low-latency live streaming).",
        "10-second chunks (legacy Apple HLS standard, slower startup).",
      ],
      tradeoff:
        "6 seconds requires keyframe intervals (GOP size) to divide evenly into 6 seconds (e.g. 2-second or 3-second GOPs).",
    },
    {
      title: "Asynchronous Queue-Worker Architecture with Pre-Signed S3 Uploads",
      what: "Have mobile clients upload directly to S3 via pre-signed URLs and orchestrate transcoding asynchronously via SQS/Celery worker queues.",
      why: "Web API servers never touch raw gigabyte video streams, insulating user-facing servers from bandwidth and memory exhaustion.",
      problemSolved:
        "Prevents web server crashes and timeout errors during high-volume creator uploads.",
      withoutIt:
        "Web servers run out of disk space and CPU trying to receive 4K uploads directly through HTTP POST bodies.",
      alternatives: [
        "Synchronous upload through API gateway.",
        "Client-side peer-to-peer transcoding.",
      ],
      tradeoff:
        "Requires polling or WebSocket push to inform creators when background transcoding finishes.",
    },
  ],
  implementation: {
    behaviour:
      "An HLSManifestBuilder class that calculates video chunk counts and generates valid Master and Variant M3U8 playlists.",
    algorithm: [
      "1. Calculate total_chunks = math.ceil(duration_sec / chunk_duration_sec).",
      "2. For each resolution (name, bandwidth, width, height):",
      "   a. Build variant playlist content:",
      "      - Line 1: #EXTM3U",
      "      - Line 2: #EXT-X-VERSION:3",
      "      - Line 3: #EXT-X-TARGETDURATION:chunk_duration_sec",
      "      - For i in 0..total_chunks-1: append #EXTINF:chunk_duration_sec, then segment_{i:03d}.ts",
      "      - Final line: #EXT-X-ENDLIST",
      "   b. Store in variants[name].",
      "3. Build master playlist content:",
      "   - Line 1: #EXTM3U",
      "   - For each resolution: append #EXT-X-STREAM-INF:BANDWIDTH=b,RESOLUTION=WxH, then {name}.m3u8",
      "4. Return {'total_chunks': total_chunks, 'master_playlist': master_text, 'variant_playlists': variants}.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Single File MP4 Exporter",
        detail: "Exports one giant monolithic MP4 file. Fails adaptive mobile streaming.",
      },
      {
        level: "Level 1",
        title: "Single-Resolution HLS Generator",
        detail: "Slices video into chunks and creates a single variant M3U8 playlist.",
      },
      {
        level: "Level 2",
        title: "Multi-Bitrate Adaptive HLS Builder",
        detail: "Generates Master and Variant M3U8 manifests across 1080p, 720p, 480p.",
      },
      {
        level: "Level 3",
        title: "Hyperscale Transcoding Cloud",
        detail:
          "Distributed SQS DAG, GPU NVENC hardware acceleration, and dynamic ABR per-title encoding.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "hls_pipeline.py",
        code: `import math

class HLSManifestGenerator:
    @staticmethod
    def generate_hls(
        video_id: str,
        duration_sec: float,
        resolutions: list[dict],
        chunk_sec: float = 6.0
    ) -> dict:
        # resolutions: [{"name": "1080p", "bandwidth": 5000000, "width": 1920, "height": 1080}]
        total_chunks = math.ceil(duration_sec / chunk_sec)
        variants = {}

        # 1. Generate Variant Playlists
        for res in resolutions:
            name = res["name"]
            lines = [
                "#EXTM3U",
                "#EXT-X-VERSION:3",
                f"#EXT-X-TARGETDURATION:{int(chunk_sec)}",
                "#EXT-X-MEDIA-SEQUENCE:0"
            ]
            for i in range(total_chunks):
                # Calculate actual duration of this chunk (last chunk might be shorter)
                c_dur = chunk_sec if (i < total_chunks - 1 or duration_sec % chunk_sec == 0) else round(duration_sec % chunk_sec, 2)
                lines.append(f"#EXTINF:{c_dur},")
                lines.append(f"{name}_seg_{i:03d}.ts")
            lines.append("#EXT-X-ENDLIST")
            variants[f"{name}.m3u8"] = "\\n".join(lines)

        # 2. Generate Master Playlist
        master_lines = ["#EXTM3U"]
        for res in resolutions:
            name = res["name"]
            bw = res["bandwidth"]
            w = res["width"]
            h = res["height"]
            master_lines.append(f"#EXT-X-STREAM-INF:BANDWIDTH={bw},RESOLUTION={w}x{h}")
            master_lines.append(f"{name}.m3u8")

        return {
            "total_chunks": total_chunks,
            "master_manifest": "\\n".join(master_lines),
            "variant_manifests": variants
        }`,
        explanations: [
          {
            code: "total_chunks = math.ceil(duration_sec / chunk_sec)",
            explanation:
              "Calculates the number of discrete chunk files needed to cover the entire video duration.",
          },
          {
            code: 'f"#EXT-X-STREAM-INF:BANDWIDTH={bw},RESOLUTION={w}x{h}"',
            explanation:
              "Specifies stream metadata in master manifest so video players can adaptively choose bitrates.",
          },
          {
            code: 'lines.append("#EXT-X-ENDLIST")',
            explanation:
              "Marks the end of on-demand variant playlist so player knows playback is finite.",
          },
        ],
      },
    ],
    simulationNote: "Simulates HLS playlist and chunk calculation in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Master vs Variant Playlist",
      brief:
        "Explain why media players first download `master.m3u8` to check available bandwidths before downloading `720p.m3u8`.",
    },
    {
      level: "Modify",
      title: "Add Byte-Range Offset Support",
      brief:
        "Modify the manifest generator to support single-file fragmented MP4s using `#EXT-X-BYTERANGE` tags instead of thousands of separate `.ts` files.",
    },
    {
      level: "Build",
      title: "Parallel Chunk Transcode DAG",
      brief:
        "Write an orchestration scheduler that splits a 100-chunk video into batches of 10 tasks and waits for all workers to report completion.",
    },
    {
      level: "Think",
      title: "Per-Title Encoding Optimization",
      brief:
        "Why does Netflix encode high-motion action movies with higher bitrates than low-motion talking-head podcasts at the same 1080p resolution?",
    },
  ],
  reflection: [
    "How does chunked segmenting enable massive parallel speedups in video transcoding pipelines?",
    "Why is Adaptive Bitrate Streaming (ABR) essential for smooth playback on cellular networks?",
    "What role do master and variant M3U8 playlists play in video player resolution switching?",
  ],
  techNotes: [
    {
      name: "CMAF (Common Media Application Format)",
      kind: "Industry Standard",
      note: "Modern streaming services use CMAF chunking with fMP4 fragments, allowing a single set of encoded video chunks to be served to both HLS (Apple) and DASH (Android/Chrome) players.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Build HLS Master and Variant M3U8 Playlist Manifests",
    brief:
      "Implement `build_hls_pipeline`: given `video_id` (str), `duration_sec` (float), `resolutions` (list of `{'name': str, 'bandwidth': int, 'width': int, 'height': int}`), and `chunk_sec` (float, default 6.0). Return a dictionary with: `'total_chunks'` (int = `math.ceil(duration_sec / chunk_sec)`), `'master_manifest'` (str containing `#EXTM3U` and `#EXT-X-STREAM-INF` entries pointing to `{name}.m3u8`), and `'variant_manifests'` (dict mapping `{name}.m3u8` to string content starting with `#EXTM3U`, `#EXT-X-VERSION:3`, `#EXT-X-TARGETDURATION:{int(chunk_sec)}`, `#EXT-X-MEDIA-SEQUENCE:0`, and for each chunk index `i`: `#EXTINF:{chunk_sec},` followed by `{name}_seg_{i:03d}.ts`, ending with `#EXT-X-ENDLIST`). Newlines should be `\\n`.",
    functionName: "build_hls_pipeline",
    signature:
      "def build_hls_pipeline(video_id: str, duration_sec: float, resolutions: list[dict], chunk_sec: float) -> dict:",
    starterCode: `import math

def build_hls_pipeline(video_id: str, duration_sec: float, resolutions: list[dict], chunk_sec: float = 6.0) -> dict:
    total_chunks = math.ceil(duration_sec / chunk_sec)
    variant_manifests = {}

    for res in resolutions:
        name = res["name"]
        lines = [
            "#EXTM3U",
            "#EXT-X-VERSION:3",
            f"#EXT-X-TARGETDURATION:{int(chunk_sec)}",
            "#EXT-X-MEDIA-SEQUENCE:0"
        ]
        for i in range(total_chunks):
            lines.append(f"#EXTINF:{chunk_sec},")
            lines.append(f"{name}_seg_{i:03d}.ts")
        lines.append("#EXT-X-ENDLIST")
        variant_manifests[f"{name}.m3u8"] = "\\n".join(lines)

    master_lines = ["#EXTM3U"]
    for res in resolutions:
        name = res["name"]
        bw = res["bandwidth"]
        w = res["width"]
        h = res["height"]
        master_lines.append(f"#EXT-X-STREAM-INF:BANDWIDTH={bw},RESOLUTION={w}x{h}")
        master_lines.append(f"{name}.m3u8")

    return {
        "total_chunks": total_chunks,
        "master_manifest": "\\n".join(master_lines),
        "variant_manifests": variant_manifests
    }
`,
    javaSignature:
      "public static Map<String, Object> buildHlsPipeline(String videoId, double durationSec, List<Map<String, Object>> resolutions, double chunkSec)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> buildHlsPipeline(
        String videoId,
        double durationSec,
        List<Map<String, Object>> resolutions,
        double chunkSec
    ) {
        int totalChunks = (int) Math.ceil(durationSec / chunkSec);
        Map<String, String> variantManifests = new HashMap<>();

        for (Map<String, Object> res : resolutions) {
            String name = (String) res.get("name");
            List<String> lines = new ArrayList<>();
            lines.add("#EXTM3U");
            lines.add("#EXT-X-VERSION:3");
            lines.add("#EXT-X-TARGETDURATION:" + ((int) chunkSec));
            lines.add("#EXT-X-MEDIA-SEQUENCE:0");

            for (int i = 0; i < totalChunks; i++) {
                lines.add("#EXTINF:" + chunkSec + ",");
                lines.add(String.format("%s_seg_%03d.ts", name, i));
            }
            lines.add("#EXT-X-ENDLIST");
            variantManifests.put(name + ".m3u8", String.join("\\n", lines));
        }

        List<String> masterLines = new ArrayList<>();
        masterLines.add("#EXTM3U");
        for (Map<String, Object> res : resolutions) {
            String name = (String) res.get("name");
            int bw = ((Number) res.get("bandwidth")).intValue();
            int w = ((Number) res.get("width")).intValue();
            int h = ((Number) res.get("height")).intValue();
            masterLines.add(String.format("#EXT-X-STREAM-INF:BANDWIDTH=%d,RESOLUTION=%dx%d", bw, w, h));
            masterLines.add(name + ".m3u8");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total_chunks", totalChunks);
        result.put("master_manifest", String.join("\\n", masterLines));
        result.put("variant_manifests", variantManifests);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["build_hls_pipeline(...)"] --> CalcChunks["total_chunks = ceil(duration / chunk_sec)"]
    CalcChunks --> LoopRes["For each resolution in resolutions"]
    LoopRes --> BuildVariant["Build variant playlist lines (#EXTINF:chunk_sec, name_seg_xxx.ts)"]
    BuildVariant --> NextRes{"More resolutions?"}
    NextRes -->|"Yes"| LoopRes
    NextRes -->|"No"| BuildMaster["Build master playlist (#EXT-X-STREAM-INF)"]
    BuildMaster --> Return["Return total_chunks, master_manifest, variant_manifests"]
`,
    hints: [
      "Calculate total_chunks = math.ceil(duration_sec / chunk_sec).",
      "Format chunk file names with 3-digit zero padding: f'{name}_seg_{i:03d}.ts'.",
      "Ensure master playlist links each variant as {name}.m3u8.",
    ],
    tests: [
      {
        name: "Standard 15-second video produces 3 chunks of 6s",
        args: [
          "VID_1",
          15.0,
          [
            { name: "1080p", bandwidth: 5000000, width: 1920, height: 1080 },
            { name: "720p", bandwidth: 2500000, width: 1280, height: 720 },
          ],
          6.0,
        ],
        expected: {
          total_chunks: 3,
          master_manifest:
            "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080\n1080p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720\n720p.m3u8",
          variant_manifests: {
            "1080p.m3u8":
              "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:6\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:6.0,\n1080p_seg_000.ts\n#EXTINF:6.0,\n1080p_seg_001.ts\n#EXTINF:6.0,\n1080p_seg_002.ts\n#EXT-X-ENDLIST",
            "720p.m3u8":
              "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:6\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:6.0,\n720p_seg_000.ts\n#EXTINF:6.0,\n720p_seg_001.ts\n#EXTINF:6.0,\n720p_seg_002.ts\n#EXT-X-ENDLIST",
          },
        },
      },
    ],
    explanationPrompt:
      "Explain how your video pipeline calculates chunk segment boundaries and formats HLS Master and Variant M3U8 playlists for Adaptive Bitrate Streaming.",
  },
};

// ============================================================================
// Batch 5 Export & Runner
// ============================================================================
export const batch5Cases = [
  case43_slackMessaging,
  case44_fleetTelemetry,
  case45_anycastProxy,
  case46_captchaDefense,
  case47_featureFlags,
  case48_simHashDedup,
  case49_notificationDigest,
  case50_videoTranscoding,
];

async function run() {
  let allPassed = true;
  console.log("=== Validating & Upserting Batch 5 (Cases 43 - 50) ===");
  for (const cs of batch5Cases) {
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
      ? "\n=== Batch 5 (Cases 43 - 50) Successfully Seeded to Convex DB! ==="
      : "\n=== Batch 5 FAILED — see errors above ===",
  );
  if (!allPassed) process.exit(1);
}

if (import.meta.main) {
  run().catch((err) => {
    console.error("Batch 5 Error:", err);
    process.exit(1);
  });
}
