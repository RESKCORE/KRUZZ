"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  Compass,
  LayoutDashboard,
  ArrowRight,
  ArrowUp,
  Terminal,
  Code2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// -------------------------------------------------------------------------
// 1. INLINE KEYFRAME ANIMATIONS FOR TICKER & BADGES
// -------------------------------------------------------------------------
const FOOTER_STYLES = `
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.animate-marquee-infinite {
  display: flex;
  width: max-content;
  animation: marquee-scroll 35s linear infinite;
}

.animate-marquee-infinite:hover {
  animation-play-state: paused;
}

@keyframes footer-heart-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.25); }
}

.animate-footer-heart {
  display: inline-block;
  animation: footer-heart-pulse 1.8s ease-in-out infinite;
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (GSAP Physics)
// -------------------------------------------------------------------------
export interface MagneticButtonProps {
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as = "button", ...props }, forwardedRef) => {
    const Component = as as React.ElementType;
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.25,
            y: y * 0.25,
            scale: 1.03,
            ease: "power2.out",
            duration: 0.3,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            scale: 1,
            ease: "elastic.out(1, 0.4)",
            duration: 0.8,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as unknown as EventListener);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as unknown as EventListener);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement | null) => {
          (localRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) {
            (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
          }
        }}
        className={cn("cursor-pointer", className as string)}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. TELEMETRY MARQUEE ITEM
// -------------------------------------------------------------------------
const MarqueeContent = () => (
  <div className="flex items-center gap-8 px-4 font-mono text-xs font-black tracking-widest text-black uppercase">
    <span>System Architecture Decoded</span>
    <span className="text-black/30 font-normal">✦</span>
    <span>Convex Cloud Persistence</span>
    <span className="text-black/30 font-normal">✦</span>
    <span>8-Section Progressive Method</span>
    <span className="text-black/30 font-normal">✦</span>
    <span>Multi-Language CodeSandbox (Python · Java · C)</span>
    <span className="text-black/30 font-normal">✦</span>
    <span>59 FAANG-Tagged Case Studies</span>
    <span className="text-black/30 font-normal">✦</span>
    <span>Track 0: Machine Coding (LLD)</span>
    <span className="text-black/30 font-normal">✦</span>
    <span>Zero Syntax Trivia</span>
    <span className="text-black/30 font-normal">✦</span>
  </div>
);

// -------------------------------------------------------------------------
// 4. MAIN CINEMATIC FOOTER COMPONENT
// -------------------------------------------------------------------------
export function CinematicFooter() {
  const scrollToTop = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    // 1. Target the notch navigation scroll container
    const notchScroller = document.getElementById("notch-nav-scroll-container");
    if (notchScroller) {
      notchScroller.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 2. Target any parent element with overflow-y-auto
    const anyScrollParent = notchScroller?.closest(".overflow-y-auto");
    if (anyScrollParent && anyScrollParent !== notchScroller) {
      anyScrollParent.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 3. Fallback to standard window / document scroll
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />

      <footer className="w-full relative mt-16 text-black">
        {/* ========================================================================= */}
        {/* A. FULL-WIDTH HORIZONTAL MARQUEE STRIP (Border to Border)                 */}
        {/* ========================================================================= */}
        <div className="w-full border-y-2 border-black bg-neutral-100 py-3 overflow-hidden select-none">
          <div className="animate-marquee-infinite">
            <MarqueeContent />
            <MarqueeContent />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* B. MAIN FOOTER CONTENT CONTAINER                                          */}
        {/* ========================================================================= */}
        <div className="mx-auto max-w-[1240px] px-5 sm:px-6 pt-10 pb-12">
          {/* ======================================================================= */}
          {/* 1. HERO CALL-TO-ACTION CARD ("Ready to investigate?")                   */}
          {/* ======================================================================= */}
          <section className="kruzz-dark-preserve relative rounded-3xl border-2 border-black bg-black text-white p-8 sm:p-12 lg:p-16 overflow-hidden shadow-xs text-center">
            {/* Subtle Engineering Dot Grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-25 select-none"
              style={{
                backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* Giant Full-Card Watermark (Centered directly behind the main text area) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
              <span
                className="font-mono font-black text-[24vw] md:text-[20vw] lg:text-[17vw] tracking-tighter uppercase leading-none whitespace-nowrap select-none"
                style={{
                  color: "rgba(255, 255, 255, 0.045)",
                  WebkitTextStroke: "1px rgba(255, 255, 255, 0.03)",
                }}
              >
                KRUZZ
              </span>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              {/* Clearance Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-mono text-[11px] font-bold text-white mb-6">
                <Terminal className="size-3.5 stroke-[2.5]" />
                <span>Campus Placement & Production Engineering Loop</span>
              </div>

              {/* Bold High-Contrast Headline */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Ready to investigate?
              </h2>

              <p className="mt-4 text-sm sm:text-base text-neutral-300 max-w-[58ch] leading-relaxed font-normal">
                Stop memorizing syntax drills. Step into the arena and master machine coding and
                distributed systems through reverse-engineering real FAANG production architectures.
              </p>

              {/* Primary & Secondary Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 w-full">
                <MagneticButton
                  as={Link}
                  to="/cases"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white text-black px-7 py-3.5 text-sm font-black hover:bg-neutral-200 transition-all hover:-translate-y-0.5 shadow-sm group"
                >
                  <Compass className="size-4 stroke-[2.5] text-black group-hover:rotate-45 transition-transform" />
                  <span>Enter Arena Centre</span>
                  <ArrowRight className="size-4 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
                </MagneticButton>

                <MagneticButton
                  as={Link}
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 px-6 py-3.5 text-sm font-bold transition-all hover:-translate-y-0.5"
                >
                  <LayoutDashboard className="size-4 stroke-[2]" />
                  <span>Open Dashboard</span>
                </MagneticButton>
              </div>

              {/* Quick Jump Pills Row */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
                <Link
                  to="/cases/$slug"
                  params={{ slug: "atm-machine" }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 px-3.5 py-1.5 font-mono text-[11px] font-bold text-white transition-all hover:scale-105"
                >
                  <span className="rounded bg-white text-black px-1.5 py-0.2 text-[9px] font-black uppercase">
                    Free
                  </span>
                  <span>Case 01 · ATM Machine</span>
                </Link>

                <Link
                  to="/cases"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 px-3.5 py-1.5 font-mono text-[11px] font-bold text-white transition-all hover:scale-105"
                >
                  <span>Track 0: Machine Coding (LLD)</span>
                </Link>

                <Link
                  to="/method"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 px-3.5 py-1.5 font-mono text-[11px] font-bold text-white transition-all hover:scale-105"
                >
                  <span>How It Works (8-Section Method)</span>
                </Link>

                <Link
                  to="/store"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 px-3.5 py-1.5 font-mono text-[11px] font-bold text-white transition-all hover:scale-105"
                >
                  <span>RC Rewards Store</span>
                </Link>

                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 px-3.5 py-1.5 font-mono text-[11px] font-bold text-white transition-all hover:scale-105"
                >
                  <span>Investigator Profile</span>
                </Link>
              </div>
            </div>
          </section>

          {/* ======================================================================= */}
          {/* 2. STRUCTURED MULTI-COLUMN FOOTER DIRECTORY                             */}
          {/* ======================================================================= */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b-2 border-black/10">
            {/* Column 1 & 2: Brand, Mission & Telemetry */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <img
                  src="/logo.png"
                  alt="KRUZZ Logo"
                  className="size-8 rounded-lg object-contain transition-transform group-hover:scale-105"
                />
                <span className="font-mono text-base font-black tracking-widest text-black">
                  KRUZZ
                </span>
              </Link>

              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-sm">
                Master <strong>Low-Level Design (Machine Coding)</strong> and{" "}
                <strong>Real-World Distributed Architectures</strong>. 59 production systems
                reverse-engineered for campus placement & FAANG technical rounds.
              </p>

              {/* Live Telemetry Status Pill */}
              <div className="inline-flex items-center gap-2 rounded-xl border border-black/20 bg-neutral-100 px-3 py-1.5 font-mono text-xs text-black font-bold">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>59 Case Dossiers Active · DB Persisted</span>
              </div>

              {/* Tech Stack Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {["TypeScript", "Python", "Java", "C", "Convex Cloud", "TanStack Start"].map(
                  (tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-black/20 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-700"
                    >
                      {tech}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* Column 3: Machine Coding (Track 0) */}
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                <Code2 className="size-3.5 stroke-[2.5]" />
                <span>Machine Coding (LLD)</span>
              </h3>
              <ul className="space-y-2 text-xs font-bold text-neutral-600">
                <li>
                  <Link
                    to="/cases/$slug"
                    params={{ slug: "atm-machine" }}
                    className="hover:text-black hover:underline transition-colors flex items-center justify-between"
                  >
                    <span>Case 01 · ATM Machine</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-black text-white">
                      FREE
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cases/$slug"
                    params={{ slug: "parking-lot-system" }}
                    className="hover:text-black hover:underline transition-colors"
                  >
                    Case 02 · Parking Lot System
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cases/$slug"
                    params={{ slug: "api-rate-limiter" }}
                    className="hover:text-black hover:underline transition-colors"
                  >
                    Case 03 · Rate Limiter
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cases/$slug"
                    params={{ slug: "snake-and-ladder-game" }}
                    className="hover:text-black hover:underline transition-colors"
                  >
                    Case 04 · Snake & Ladder
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cases/$slug"
                    params={{ slug: "elevator-system" }}
                    className="hover:text-black hover:underline transition-colors"
                  >
                    Case 05 · Elevator System
                  </Link>
                </li>
                <li className="pt-1">
                  <Link
                    to="/cases"
                    className="text-black font-black underline underline-offset-4 hover:text-neutral-700"
                  >
                    View All 59 Cases →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Curriculum & Method */}
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                <ShieldCheck className="size-3.5 stroke-[2.5]" />
                <span>Curriculum & Method</span>
              </h3>
              <ul className="space-y-2 text-xs font-bold text-neutral-600">
                <li>
                  <Link to="/method" className="hover:text-black hover:underline transition-colors">
                    The 8-Section Method
                  </Link>
                </li>
                <li>
                  <Link to="/method" className="hover:text-black hover:underline transition-colors">
                    5-Stage Reasoning Chain
                  </Link>
                </li>
                <li>
                  <Link to="/cases" className="hover:text-black hover:underline transition-colors">
                    Campus Placement Prep
                  </Link>
                </li>
                <li>
                  <Link to="/cases" className="hover:text-black hover:underline transition-colors">
                    FAANG Interview Loops
                  </Link>
                </li>
                <li>
                  <Link to="/cases" className="hover:text-black hover:underline transition-colors">
                    Interactive Code Sandbox
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5: Investigator Clearance */}
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                <Sparkles className="size-3.5 stroke-[2.5]" />
                <span>Clearance & Platform</span>
              </h3>
              <ul className="space-y-2 text-xs font-bold text-neutral-600">
                <li>
                  <Link to="/cases" className="hover:text-black hover:underline transition-colors">
                    Arena Centre
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    className="hover:text-black hover:underline transition-colors"
                  >
                    Personal Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/leaderboard"
                    className="hover:text-black hover:underline transition-colors"
                  >
                    Campus Leaderboard
                  </Link>
                </li>
                <li>
                  <Link to="/store" className="hover:text-black hover:underline transition-colors">
                    RC Rewards Store
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="hover:text-black hover:underline transition-colors"
                  >
                    Investigator Profile
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* 3. BOTTOM UTILITY, COPYRIGHT & BACK TO TOP BAR                          */}
          {/* ======================================================================= */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
            {/* Copyright */}
            <div className="text-neutral-500 font-bold tracking-tight text-center md:text-left order-2 md:order-1">
              © 2026 KRUZZ. All rights reserved. Zero syntax memorization.
            </div>

            {/* "Crafted With Love" Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-neutral-100 px-4 py-1.5 font-mono text-xs font-bold text-black order-1 md:order-2">
              <span>Crafted with</span>
              <span className="animate-footer-heart text-red-500 text-sm">❤</span>
              <span>by</span>
              <span className="font-black text-black">KRUZZ</span>
              <span className="text-neutral-500 font-medium">for campus engineers</span>
            </div>

            {/* Back to top magnetic button */}
            <MagneticButton
              as="button"
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3.5 py-1.5 font-mono text-xs font-black text-black hover:bg-black hover:text-white transition-all cursor-pointer shadow-xs group order-3"
              title="Back to top"
              aria-label="Back to top"
            >
              <span>Back to top</span>
              <ArrowUp className="size-3.5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
            </MagneticButton>
          </div>
        </div>
      </footer>
    </>
  );
}
