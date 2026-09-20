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
    <div className="flex min-h-[75vh] w-full flex-col items-center justify-center px-4 py-12 text-center text-black">
      <div className="relative w-full max-w-md">
        <div className="relative rounded-3xl p-8 border-2 border-black bg-white shadow-xs">
          {/* Keyhole / Shield Icon */}
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-neutral-100 border-2 border-black text-black shadow-xs">
            <Lock className="size-6 text-black" />
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="size-2 rounded-full bg-black" />
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black">
              Access Perimeter
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-black">{title}</h2>

          <p className="mt-3 text-xs leading-relaxed text-neutral-600">{description}</p>

          <div className="mt-8 space-y-3">
            <Link
              to="/sign-in"
              className="flex w-full items-center justify-center rounded-xl bg-black py-3 font-mono text-xs font-black text-white hover:bg-neutral-800 border-2 border-black shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Sign In or Create Account
            </Link>

            <Link
              to={returnTo}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-xs font-bold text-black border-2 border-black bg-white hover:bg-neutral-100 transition-colors shadow-xs"
            >
              <ArrowLeft className="size-3.5" />
              <span>Return to Showcase</span>
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t-2 border-black/10 flex items-center justify-center gap-4 text-[11px] font-mono text-neutral-600 font-bold">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-black" />
              Cloud Verified
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="size-3.5 text-black" />
              Convex Storage
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
