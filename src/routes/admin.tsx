import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppChrome } from "@/components/AppChrome";
import { useAccount } from "@/lib/account";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  History,
  Laptop,
  Loader2,
  Mail,
  Radio,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Command & Operations Terminal — KRUZZ Admin" },
      {
        name: "description",
        content: "Administrative control center for platform announcements and email dispatch.",
      },
    ],
  }),
  component: AdminPage,
});

const TEMPLATES = [
  {
    name: "🚀 24 New Case Studies Live",
    type: "announcement",
    badge: "CURRICULUM EXPANSION",
    subject: "🚀 24 New Real-World Architecture Cases (36–59) Now Live on KRUZZ",
    title: "Level Up Your System Design: 59 Real-World Investigations",
    body: `<p>We've just expanded the KRUZZ curriculum from 35 to <strong>59 comprehensive case studies</strong> across 10 structured engineering tracks!</p>
<p>Here is what is newly available in the Arena:</p>
<ul>
  <li><strong>Track 7 (Free Tier)</strong>: Campus Placement Portal, Attendance Tracker, Splitwise Engine, and Online Chess.</li>
  <li><strong>Track 8 (Platform Scale)</strong>: Geospatial Matchmaking, Slack Channels & Threads, Video Transcoding, and Bot Defense.</li>
  <li><strong>Track 9 (Distributed AI & CRDTs)</strong>: Streaming LLM Guardrails, Vector Databases (RAG), Collaborative Spreadsheets, and Event-Sourced Payment Ledgers.</li>
</ul>
<p>Every case features progressive 3-level Mermaid blueprints, FAANG interview tags, and live in-browser Python & Java CodeArenas.</p>`,
    actionLabel: "Explore the Expanded Catalog",
    actionUrl: "https://kruzz.indevs.in/cases",
  },
  {
    name: "🎓 Campus Placement Alert",
    type: "challenge",
    badge: "CAMPUS READY",
    subject: "🎓 Track 0 Machine Coding (LLD) is 100% Free for College Students",
    title: "Master Low-Level Design & Inter-Campus Standings",
    body: `<p>Getting ready for upcoming campus placements and SDE 1 machine coding rounds?</p>
<p>All 12 foundational cases in <strong>Track 0 (Foundations OOP)</strong> and <strong>Track 7 (Campus LLD)</strong> are <strong>100% free forever</strong>.</p>
<p>Make sure to affiliate your university or college on your profile to represent your campus cohort in the global Inter-Campus Cup leaderboard!</p>`,
    actionLabel: "Start Track 0 Machine Coding",
    actionUrl: "https://kruzz.indevs.in/cases?category=Foundations+%28OOP%29",
  },
  {
    name: "⚡ Infrastructure & Performance Update",
    type: "update",
    badge: "SYSTEM UPDATE",
    subject: "⚡ Sub-100ms In-Browser CodeArena & Pyodide Optimization",
    title: "Faster Test Runners and Real-Time Verification",
    body: `<p>We have shipped major infrastructure updates to the KRUZZ execution engine:</p>
<ul>
  <li>Dual-language starter code and test assertion suites for both <strong>Python 3.12</strong> and <strong>Java 21</strong>.</li>
  <li>Optimized cold-start times for Pyodide WebAssembly in-browser test execution.</li>
  <li>Real-time telemetry and streak multiplier synchronization.</li>
</ul>
<p>Jump back into your active case study to maintain your daily streak!</p>`,
    actionLabel: "Resume Active Investigation",
    actionUrl: "https://kruzz.indevs.in/dashboard",
  },
];

function AdminPage() {
  const { user, profile, isAuthenticated } = useAccount();
  const adminCheck = useQuery(api.admin.checkIsAdmin, isAuthenticated ? {} : "skip");
  const stats = useQuery(api.admin.getAdminStats, adminCheck?.isAdmin ? {} : "skip");
  const broadcasts = useQuery(api.admin.listBroadcasts, adminCheck?.isAdmin ? {} : "skip");
  const sendBroadcastMutation = useMutation(api.admin.sendBroadcastEmail);

  const [activeTab, setActiveTab] = useState<"broadcast" | "history" | "users">("broadcast");

  const defaultTemplate = TEMPLATES[0]!;

  // Form State
  const [subject, setSubject] = useState(defaultTemplate.subject);
  const [title, setTitle] = useState(defaultTemplate.title);
  const [body, setBody] = useState(defaultTemplate.body);
  const [alertType, setAlertType] = useState<string>("announcement");
  const [badgeText, setBadgeText] = useState(defaultTemplate.badge);
  const [actionLabel, setActionLabel] = useState(defaultTemplate.actionLabel);
  const [actionUrl, setActionUrl] = useState(defaultTemplate.actionUrl);
  const [testEmail, setTestEmail] = useState("reddysantosh1310@gmail.com");

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 1. Loading Security Check
  if (adminCheck === undefined && isAuthenticated) {
    return (
      <AppChrome>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center text-black">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-black border-t-transparent shadow-xs" />
          <p className="font-mono text-xs uppercase tracking-widest text-black font-black">
            Verifying Cryptographic Admin Authority...
          </p>
        </div>
      </AppChrome>
    );
  }

  // 2. Access Denied State (Not logged in or not admin)
  if (!isAuthenticated || !adminCheck?.isAdmin) {
    return (
      <AppChrome>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center text-black">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl border-2 border-black bg-red-50 text-red-600 shadow-[0_8px_0_0_#000]">
            <ShieldAlert className="size-8 stroke-[2.5]" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-red-100 px-3.5 py-1 font-mono text-[11px] font-black uppercase text-red-950 mb-3">
            <span>403 · Restricted Terminal</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
            Unauthorized Access
          </h1>
          <p className="mt-3 text-sm text-neutral-700 leading-relaxed font-medium max-w-md mx-auto">
            This administrative dispatch console is restricted exclusively to authorized platform
            operators (
            <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded border border-black/20 text-xs font-black">
              reddysantosh1310@gmail.com
            </code>
            ).
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-xl border-2 border-black bg-black px-6 py-3 font-mono text-xs font-black text-white hover:bg-neutral-800 shadow-xs transition-all"
            >
              Return to Command Center
            </Link>
            <Link
              to="/cases"
              className="rounded-xl border-2 border-black bg-white px-6 py-3 font-mono text-xs font-black text-black hover:bg-neutral-100 shadow-xs transition-all"
            >
              Browse Public Case Studies
            </Link>
          </div>
        </div>
      </AppChrome>
    );
  }

  // Handle template selection
  function handleSelectTemplate(tpl: (typeof TEMPLATES)[0]) {
    setSubject(tpl.subject);
    setTitle(tpl.title);
    setBody(tpl.body);
    setAlertType(tpl.type);
    setBadgeText(tpl.badge);
    setActionLabel(tpl.actionLabel);
    setActionUrl(tpl.actionUrl);
    toast.success(`Loaded template: "${tpl.name}"`);
  }

  // Send Test Email Handler
  async function handleSendTest() {
    if (!subject.trim() || !title.trim() || !body.trim()) {
      toast.error("Subject, Title, and Body cannot be empty");
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await sendBroadcastMutation({
        subject,
        title,
        body,
        type: alertType,
        badge: badgeText,
        actionLabel,
        actionUrl,
        isTest: true,
        testEmail: testEmail.trim() || "reddysantosh1310@gmail.com",
      });

      toast.success(
        `Test preview sent successfully to ${res.targetEmail}! Check your inbox in a moment.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to dispatch test email");
    } finally {
      setIsSendingTest(false);
    }
  }

  // Send Production Broadcast to All Users
  async function handleConfirmBroadcast() {
    setShowConfirmModal(false);
    setIsSendingBroadcast(true);

    try {
      const res = await sendBroadcastMutation({
        subject,
        title,
        body,
        type: alertType,
        badge: badgeText,
        actionLabel,
        actionUrl,
        isTest: false,
      });

      toast.success(
        `🚀 Broadcast successfully dispatched to all ${res.recipientCount} registered investigators!`,
      );
      setActiveTab("history");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed to send");
    } finally {
      setIsSendingBroadcast(false);
    }
  }

  return (
    <AppChrome>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8 text-black">
        {/* 1. Admin Top Terminal Header */}
        <div className="border-b-2 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-black">
              <span className="size-2.5 rounded-full bg-black ring-2 ring-black/20 animate-pulse" />
              <span className="tracking-widest uppercase font-black">
                OPERATIONAL COMMAND · ADMIN ACCESS VERIFIED
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-black">
              System Operations & Email Dispatch
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-700 font-medium max-w-2xl">
              Authoritative broadcasting pipeline powered by Resend. Send verified updates,
              curriculum drops, and incident alerts to every registered investigator on KRUZZ.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border-2 border-black bg-black px-3.5 py-1.5 font-mono text-xs font-black text-white shadow-xs flex items-center gap-1.5">
              <Shield className="size-3.5" />
              <span>Admin: reddysantosh1310</span>
            </span>
          </div>
        </div>

        {/* 2. Real-time Telemetry Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="font-mono text-[10px] uppercase font-bold text-black">
                Total Users
              </span>
              <Users className="size-4 text-black" />
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-black text-black">
              {stats?.totalUsers ?? "..."}
            </p>
            <p className="font-mono text-[10px] text-neutral-600 font-bold mt-1">
              Registered Accounts
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="font-mono text-[10px] uppercase font-bold text-black">
                Deliverable Emails
              </span>
              <Mail className="size-4 text-black" />
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-black text-black">
              {stats?.emailSubscribersCount ?? "..."}
            </p>
            <p className="font-mono text-[10px] text-neutral-600 font-bold mt-1">
              Confirmed Email Targets
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="font-mono text-[10px] uppercase font-bold text-black">
                Curriculum Scope
              </span>
              <GraduationCap className="size-4 text-black" />
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-black text-black">
              {stats?.totalCases ?? 59}
            </p>
            <p className="font-mono text-[10px] text-neutral-600 font-bold mt-1">
              Live Production Cases
            </p>
          </div>

          <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="font-mono text-[10px] uppercase font-bold text-black">
                Pipeline Status
              </span>
              <Radio className="size-4 text-emerald-600 animate-pulse" />
            </div>
            <p className="font-mono text-base sm:text-lg font-black text-emerald-700">
              Resend Active
            </p>
            <p className="font-mono text-[10px] text-neutral-600 font-bold mt-1">
              noreply@kruzz.indevs.in
            </p>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="flex items-center gap-2 border-b-2 border-black/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("broadcast")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-black transition-all cursor-pointer border-2 ${
              activeTab === "broadcast"
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white text-black border-transparent hover:border-black/30"
            }`}
          >
            <Send className="size-3.5" />
            <span>Broadcast Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-black transition-all cursor-pointer border-2 ${
              activeTab === "history"
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white text-black border-transparent hover:border-black/30"
            }`}
          >
            <History className="size-3.5" />
            <span>Dispatch History ({broadcasts?.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-black transition-all cursor-pointer border-2 ${
              activeTab === "users"
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white text-black border-transparent hover:border-black/30"
            }`}
          >
            <Users className="size-3.5" />
            <span>Learner Directory ({stats?.totalUsers ?? 0})</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: BROADCAST STUDIO
           ========================================================================= */}
        {activeTab === "broadcast" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Composer Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Quick Template Selector */}
              <div className="rounded-3xl border-2 border-black bg-neutral-50 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="size-3.5" />
                    <span>Quick Pre-Fill Templates:</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 font-bold">
                    Click to load
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className="rounded-xl border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-black hover:bg-black hover:text-white transition-all cursor-pointer shadow-2xs"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Broadcast Composition Panel */}
              <div className="rounded-3xl border-2 border-black bg-white p-6 shadow-xs space-y-5">
                <h3 className="font-black text-base text-black flex items-center gap-2 border-b-2 border-black/10 pb-3">
                  <Mail className="size-4" />
                  <span>Compose Dispatch</span>
                </h3>

                {/* Alert Type Selector */}
                <div>
                  <label className="block font-mono text-xs font-black uppercase text-black mb-1.5">
                    Alert Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        id: "announcement",
                        label: "Announcement",
                        color: "bg-blue-50 border-blue-900",
                      },
                      {
                        id: "update",
                        label: "System Update",
                        color: "bg-emerald-50 border-emerald-900",
                      },
                      {
                        id: "challenge",
                        label: "Challenge Drop",
                        color: "bg-amber-50 border-amber-900",
                      },
                      { id: "alert", label: "Urgent Notice", color: "bg-red-50 border-red-900" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setAlertType(t.id);
                          setBadgeText(t.label.toUpperCase());
                        }}
                        className={`rounded-xl p-2.5 font-mono text-xs font-bold border-2 transition-all cursor-pointer text-center ${
                          alertType === t.id
                            ? "bg-black text-white border-black shadow-xs font-black"
                            : "bg-neutral-50 text-black border-black/20 hover:border-black"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Line */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-mono text-xs font-black uppercase text-black">
                      Subject Line (Inbox Title)
                    </label>
                    <span className="font-mono text-[10px] text-neutral-500 font-bold">
                      {subject.length} chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. 🚀 24 New Real-World Architecture Cases Live on KRUZZ"
                    className="w-full rounded-xl bg-neutral-50 border-2 border-black px-4 py-2.5 text-xs font-bold text-black outline-none focus:bg-white"
                  />
                </div>

                {/* Heading / Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                      Email Header Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Level Up Your System Design"
                      className="w-full rounded-xl bg-neutral-50 border-2 border-black px-4 py-2 text-xs font-bold text-black outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-black uppercase text-black mb-1">
                      Pill Badge (Optional)
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="e.g. CURRICULUM DROP"
                      className="w-full rounded-xl bg-neutral-50 border-2 border-black px-4 py-2 text-xs font-mono font-bold text-black outline-none focus:bg-white uppercase"
                    />
                  </div>
                </div>

                {/* Body Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-mono text-xs font-black uppercase text-black">
                      Email Body Content (HTML or Text)
                    </label>
                    <span className="font-mono text-[10px] text-neutral-500 font-bold">
                      Supports &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your email announcement here..."
                    className="w-full rounded-xl bg-neutral-50 border-2 border-black p-3.5 font-mono text-xs leading-relaxed text-black outline-none focus:bg-white resize-y"
                  />
                </div>

                {/* Optional Call to Action Button */}
                <div className="rounded-2xl border-2 border-black/10 bg-neutral-50 p-4 space-y-3">
                  <p className="font-mono text-xs font-black text-black uppercase">
                    Call To Action Button (Optional)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Button Label (e.g. Explore Catalog)"
                      value={actionLabel}
                      onChange={(e) => setActionLabel(e.target.value)}
                      className="rounded-xl bg-white border-2 border-black px-3.5 py-2 text-xs font-medium text-black outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Button URL (e.g. https://kruzz.indevs.in/cases)"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      className="rounded-xl bg-white border-2 border-black px-3.5 py-2 text-xs font-medium text-black outline-none"
                    />
                  </div>
                </div>

                {/* Dispatch Controls */}
                <div className="pt-4 border-t-2 border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Test Box */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@gmail.com"
                      className="rounded-xl bg-neutral-50 border-2 border-black px-3 py-2 text-xs font-mono font-medium text-black outline-none w-56"
                    />
                    <button
                      type="button"
                      onClick={handleSendTest}
                      disabled={isSendingTest || isSendingBroadcast}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black text-black hover:bg-neutral-100 disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {isSendingTest ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                      <span>Send Test</span>
                    </button>
                  </div>

                  {/* Production Send to All */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isSendingBroadcast || isSendingTest}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-black px-6 py-2.5 font-mono text-xs font-black text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shadow-xs transition-all hover:-translate-y-px"
                  >
                    {isSendingBroadcast ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Radio className="size-3.5" />
                    )}
                    <span>Broadcast to All Users ({stats?.emailSubscribersCount ?? 0})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Live Side-by-Side Preview */}
            <div className="lg:col-span-5 sticky top-24 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Eye className="size-3.5" />
                  <span>Live Inbox Preview</span>
                </span>
                <span className="rounded bg-black text-white px-2 py-0.5 font-mono text-[9px] font-black uppercase">
                  Mobile & Desktop Compatible
                </span>
              </div>

              {/* Mock Email Frame */}
              <div className="rounded-3xl border-2 border-black bg-neutral-100 p-4 shadow-[0_8px_0_0_#000]">
                {/* Email Client Header bar */}
                <div className="rounded-2xl border border-black/20 bg-white p-3 mb-3 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-[11px] text-neutral-500">
                    <span>
                      From: <strong>KRUZZ &lt;noreply@kruzz.indevs.in&gt;</strong>
                    </span>
                    <span>Just now</span>
                  </div>
                  <p className="font-bold text-black text-xs truncate">
                    Subject: {subject || "No subject specified"}
                  </p>
                </div>

                {/* Email Body Template */}
                <div className="rounded-2xl border-2 border-black bg-white overflow-hidden shadow-2xs">
                  {/* Brand Top Bar */}
                  <div className="bg-black text-white px-4 py-3 flex items-center justify-between border-b-2 border-black">
                    <span className="font-mono font-black text-sm tracking-wider">KRUZZ</span>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
                      · System Architecture
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    {badgeText && (
                      <span className="inline-block rounded-md border border-black/30 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-black tracking-wider">
                        {badgeText}
                      </span>
                    )}

                    <h2 className="text-lg font-black text-black leading-snug">
                      {title || "Untitled Announcement"}
                    </h2>

                    <div
                      className="text-xs text-neutral-800 leading-relaxed space-y-2 font-sans"
                      dangerouslySetInnerHTML={{
                        __html: body || "<p>Empty email body preview...</p>",
                      }}
                    />

                    {actionLabel && actionUrl && (
                      <div className="pt-3">
                        <span className="inline-block rounded-xl border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black text-white shadow-xs">
                          {actionLabel} &rarr;
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Email Footer */}
                  <div className="bg-neutral-50 border-t border-black/10 p-3 font-mono text-[9px] text-neutral-500 leading-normal">
                    <p className="font-bold text-black">
                      KRUZZ — Real-World System Architecture Platform
                    </p>
                    <p>Sent to registered investigators on kruzz.indevs.in.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: BROADCAST AUDIT HISTORY
           ========================================================================= */}
        {activeTab === "history" && (
          <div className="rounded-3xl border-2 border-black bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-black">Historical Broadcast Audit Log</h3>
                <p className="text-xs text-neutral-600 font-medium">
                  Verified log of all production broadcasts and test preview dispatches.
                </p>
              </div>
              <span className="font-mono text-xs text-black font-bold">
                {broadcasts?.length ?? 0} Records Found
              </span>
            </div>

            {!broadcasts || broadcasts.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 font-mono text-xs">
                No broadcasts have been sent yet. Use the Broadcast Studio to dispatch your first
                alert!
              </div>
            ) : (
              <div className="divide-y-2 divide-black/10">
                {broadcasts.map((b) => (
                  <div
                    key={b._id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                            b.status === "sent"
                              ? "bg-emerald-100 text-emerald-950 border-emerald-900"
                              : "bg-neutral-100 text-neutral-800 border-black/30"
                          }`}
                        >
                          {b.status === "sent" ? "PRODUCTION DISPATCH" : "TEST PREVIEW"}
                        </span>
                        <span className="font-mono text-xs font-bold text-neutral-500">
                          {new Date(b.sentAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-black">{b.subject}</h4>
                      <p className="font-mono text-[11px] text-neutral-600">
                        Header: &ldquo;{b.title}&rdquo; · Dispatched by {b.sentBy}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-mono text-xs font-black text-black">
                          {b.recipientCount} {b.recipientCount === 1 ? "Recipient" : "Recipients"}
                        </p>
                        {b.testEmail && (
                          <p className="font-mono text-[10px] text-neutral-500 truncate max-w-[20ch]">
                            {b.testEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: REGISTERED LEARNERS DIRECTORY
           ========================================================================= */}
        {activeTab === "users" && (
          <div className="rounded-3xl border-2 border-black bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-black">Registered Learner Directory</h3>
                <p className="text-xs text-neutral-600 font-medium">
                  Verified roster of investigators across all campuses and tiers.
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-600 font-bold">
                Showing latest {stats?.recentUsers?.length ?? 0} of {stats?.totalUsers ?? 0}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black text-black font-black uppercase text-[10px] tracking-wider bg-neutral-50">
                    <th className="py-2.5 px-3">Investigator</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Rank / RC</th>
                    <th className="py-2.5 px-3">Campus Affiliation</th>
                    <th className="py-2.5 px-3 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {stats?.recentUsers?.map((u) => (
                    <tr key={u._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-3 font-black text-black flex items-center gap-2">
                        <span>{u.name}</span>
                        {u.role === "admin" && (
                          <span className="rounded bg-black text-white px-1.5 py-0.2 font-mono text-[9px] font-black uppercase">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-neutral-700 font-medium">
                        {u.email !== "No email stored" ? (
                          <span className="text-black font-bold">{u.email}</span>
                        ) : (
                          <span className="text-neutral-400 italic">No email</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-black">{u.rank}</span> ·{" "}
                        <span className="font-black text-neutral-600">{u.points} RC</span>
                      </td>
                      <td className="py-3 px-3 text-neutral-700">
                        {u.university ? (
                          <span className="inline-flex items-center gap-1 font-bold text-black">
                            <GraduationCap className="size-3" />
                            <span>{u.university}</span>
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-500 font-medium">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Confirmation Modal Before Production Broadcast */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
            <div className="w-full max-w-lg rounded-3xl border-2 border-black bg-white p-6 shadow-[0_12px_0_0_#000] text-black space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-amber-500 text-white shrink-0 border-2 border-black">
                  <AlertTriangle className="size-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">Confirm Production Broadcast</h3>
                  <p className="text-xs text-neutral-600 font-medium">
                    This will send live operational emails via Resend.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-black/10 bg-neutral-50 p-4 font-mono text-xs space-y-2">
                <p>
                  <strong>Subject:</strong> {subject}
                </p>
                <p>
                  <strong>Recipients:</strong> {stats?.emailSubscribersCount ?? 0} registered
                  investigators
                </p>
                <p>
                  <strong>Sender:</strong> KRUZZ &lt;noreply@kruzz.indevs.in&gt;
                </p>
              </div>

              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                Are you sure you want to broadcast this dispatch to every user on KRUZZ? Ensure you
                have sent and verified a test email first.
              </p>

              <div className="pt-3 border-t-2 border-black/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="rounded-xl border-2 border-black bg-white px-4 py-2 font-mono text-xs font-bold text-black hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBroadcast}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-black px-5 py-2 font-mono text-xs font-black text-white hover:bg-neutral-800 shadow-xs cursor-pointer"
                >
                  <Send className="size-3.5" />
                  <span>Yes, Broadcast Now</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppChrome>
  );
}
