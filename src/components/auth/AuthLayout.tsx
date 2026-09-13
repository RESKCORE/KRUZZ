import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: ReactNode;
  mode: "sign-in" | "sign-up";
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, mode, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center grid-bg p-4 sm:p-6 md:p-10 select-none overflow-hidden">
      {/* Ambient Electric Lime Auroras */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-[#ccff00]/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 size-[400px] rounded-full bg-[#d4ff00]/5 blur-[120px] pointer-events-none" />

      {/* Main Glass Card Container (Matching template 2-column structure) */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[1040px] rounded-[32px] border border-white/10 bg-[#0e0e0e]/95 p-3.5 sm:p-4 md:p-5 shadow-[0_32px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 items-stretch">
          {/* =========================================================================
              LEFT COLUMN: 3D Obsidian & Electric Acid Lime Architectural Showcase
              (Inspired by 3D character/graphic panel in user design template)
             ========================================================================= */}
          {/* =========================================================================
              LEFT COLUMN: Video Animation Showcase
              (Clean, seamlessly integrated, perfectly proportioned, no text overlays)
             ========================================================================= */}
          <div className="relative hidden md:flex items-center justify-center overflow-hidden rounded-[24px] border border-white/[0.08] bg-black min-h-[520px] shadow-inner">
            {/* Video Player (Seamless pitch black background, perfectly proportioned) */}
            <video
              src="/cat%20animation.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full max-h-[640px] object-contain select-none pointer-events-none"
            />
          </div>

          {/* =========================================================================
              RIGHT COLUMN: Clean Form Panel (Exact structure from design template)
             ========================================================================= */}
          <div className="flex flex-col justify-center px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            {/* Top Brand Link */}
            <div className="flex items-center justify-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2.5 group cursor-pointer">
                <img
                  src="/logo.png"
                  alt="KRUZZ Logo"
                  className="size-7 rounded-lg object-contain transition-transform group-hover:scale-105"
                />
                <span className="font-mono text-xs font-black tracking-widest text-[#f5f5f5] group-hover:text-[#ccff00] transition-colors">
                  KRUZZ
                </span>
              </Link>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f5f5f5] font-sans">
                {title}
              </h1>
              <p className="mt-1.5 text-xs text-[#8a8a8a] font-sans">{subtitle}</p>
            </div>

            {/* Dynamic Form Content */}
            <div className="w-full">{children}</div>

            {/* Bottom Footer Switch */}
            <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
              {mode === "sign-in" ? (
                <p className="text-xs text-[#8a8a8a]">
                  Don't have an account?{" "}
                  <Link
                    to="/sign-up"
                    className="font-semibold text-[#ccff00] hover:underline underline-offset-4 transition-colors"
                  >
                    Sign Up
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-[#8a8a8a]">
                  Already have an account?{" "}
                  <Link
                    to="/sign-in"
                    className="font-semibold text-[#ccff00] hover:underline underline-offset-4 transition-colors"
                  >
                    Log In
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
