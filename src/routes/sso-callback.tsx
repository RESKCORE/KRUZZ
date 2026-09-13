import { createFileRoute } from "@tanstack/react-router";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/sso-callback")({
  head: () => ({
    meta: [{ title: "Verifying Authentication — KRUZZ" }, { name: "robots", content: "noindex" }],
  }),
  component: SSOCallbackPage,
});

function SSOCallbackPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center grid-bg p-4 text-center">
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4 rounded-3xl border border-white/10 bg-[#0e0e0e]/95 p-8 shadow-2xl backdrop-blur-xl max-w-sm w-full">
        <Loader2 className="size-8 animate-spin text-[#ccff00]" />
        <h2 className="text-base font-bold text-[#f5f5f5] font-sans">
          Verifying Identity Clearance
        </h2>
        <p className="text-xs text-[#8a8a8a] font-mono">
          Synchronizing OAuth token with KRUZZ perimeter...
        </p>
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
