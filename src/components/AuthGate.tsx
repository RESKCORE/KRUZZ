import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, ShieldCheck, Sparkles } from "lucide-react";

interface AuthGateProps {
  title?: string;
  description?: string;
  returnTo?: string;
}

export function AuthGate({
  title = "Authentication Required",
  description = "This section is restricted to registered investigators. Sign in to sync your reasoning credits, track streak consistency, and access architecture workspaces.",
  returnTo = "/",
}: AuthGateProps) {
  return (
    <div className="flex min-h-[75vh] w-full flex-col items-center justify-center px-4 py-12 text-center">
      {/* Glow Backdrop (Acid Lime) */}
      <div className="relative w-full max-w-md">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 size-48 rounded-full bg-[#ccff00]/20 blur-3xl pointer-events-none" />

        <div className="glass-panel relative rounded-3xl p-8 border border-white/[0.1] shadow-[0_24px_48px_rgba(0,0,0,0.6)]">
          {/* Keyhole / Shield Icon */}
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#182608] to-[#0c1204] border border-[#ccff00]/40 text-[#ccff00]">
            <Lock className="size-6 text-[#ccff00]" />
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="size-1.5 rounded-full recording-dot" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#ccff00]">
              Access Perimeter
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#f5f5f5]">{title}</h2>

          <p className="mt-3 text-xs leading-relaxed text-[#b8b8b8]">{description}</p>

          <div className="mt-8 space-y-3">
            <Link
              to="/sign-in"
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] py-3 font-mono text-xs font-black text-[#080808] transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Sign In or Create Account
            </Link>

            <Link
              to={returnTo}
              className="neu-btn flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-xs font-medium text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Return to Showcase</span>
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-4 text-[11px] font-mono text-[#8a8a8a]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-[#ccff00]" />
              Cloud Verified
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="size-3.5 text-[#ccff00]" />
              Convex Storage
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
