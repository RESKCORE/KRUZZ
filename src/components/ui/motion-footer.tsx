"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Compass, LayoutDashboard } from "lucide-react";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  
  /* Dynamic Variables using standard shadcn/tailwind tokens */
  --pill-bg-1: color-mix(in oklch, var(--foreground, #f5f5f5) 3%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground, #f5f5f5) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background, #0d0d0d) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground, #f5f5f5) 10%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background, #0d0d0d) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground, #f5f5f5) 8%, transparent);
  
  --pill-bg-1-hover: color-mix(in oklch, #ccff00 15%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, #ccff00 5%, transparent);
  --pill-border-hover: color-mix(in oklch, #ccff00 40%, transparent);
  --pill-shadow-hover: color-mix(in oklch, #ccff00 25%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground, #f5f5f5) 20%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px color-mix(in oklch, #ccff00 50%, transparent)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px color-mix(in oklch, #ccff00 80%, transparent)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 40s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Theme-adaptive Grid Background */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, color-mix(in oklch, var(--foreground, #f5f5f5) 3%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground, #f5f5f5) 3%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

/* Theme-adaptive Aurora Glow (Electric Acid Lime) */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    color-mix(in oklch, #ccff00 18%, transparent) 0%, 
    color-mix(in oklch, #a3e635 12%, transparent) 40%, 
    transparent 70%
  );
}

/* Glass Pill Theming */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: #f5f5f5;
}

/* Giant Background Text Masking */
.footer-giant-bg-text {
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground, #f5f5f5) 5%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, #ccff00 12%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Metallic Text Glow */
.footer-text-glow {
  background: linear-gradient(180deg, #ffffff 0%, color-mix(in oklch, var(--foreground, #f5f5f5) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, #ccff00 25%, transparent));
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency)
// -------------------------------------------------------------------------
export interface MagneticButtonProps {
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
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
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
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
// 3. MARQUEE TICKER ITEM
// -------------------------------------------------------------------------
const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>System Architecture Decoded</span> <span className="text-[#ccff00]/80">✦</span>
    <span>Convex Cloud Persistence</span> <span className="text-[#d4ff00]/80">✦</span>
    <span>8-Section Progressive Method</span> <span className="text-[#ccff00]/80">✦</span>
    <span>Interactive Code Sandbox</span> <span className="text-[#d4ff00]/80">✦</span>
    <span>Zero Syntax Trivia</span> <span className="text-[#ccff00]/80">✦</span>
  </div>
);

// -------------------------------------------------------------------------
// 4. MAIN CINEMATIC FOOTER COMPONENT
// -------------------------------------------------------------------------
export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    // React strict mode compatible GSAP context cleanup
    const ctx = gsap.context(() => {
      const scroller = document.getElementById("notch-nav-scroll-container") || window;

      // Background Parallax
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            scroller,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        },
      );

      // Staggered Content Reveal
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            scroller,
            start: "top 70%",
            end: "bottom bottom",
            scrub: 1,
          },
        },
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    // 1. Target the notch navigation scroll container
    const notchScroller = document.getElementById("notch-nav-scroll-container");
    if (notchScroller) {
      notchScroller.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 2. Target any parent element with overflow-y-auto
    const anyScrollParent = wrapperRef.current?.closest(".overflow-y-auto");
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
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* 
        The "Curtain Reveal" Wrapper:
        It sits in standard flow. Because it has clip-path, its contents
        are ONLY visible within its bounding box. 
      */}
      <div
        ref={wrapperRef}
        className="relative h-screen w-full"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        {/* The actual footer stays fixed to the viewport underneath everything */}
        <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-[#0a0a0a] text-[#f5f5f5] cinematic-footer-wrapper">
          {/* Ambient Light & Grid Background */}
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant background text */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
          >
            KRUZZ
          </div>

          {/* 1. Diagonal Sleek Marquee (Top of footer) */}
          <div className="absolute top-12 left-0 w-full overflow-hidden border-y border-white/[0.08] bg-[#0d0d0d]/70 backdrop-blur-md py-4 z-10 -rotate-2 scale-110 shadow-2xl">
            <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-bold tracking-[0.3em] text-[#8a8a8a] uppercase">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* 2. Main Center Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-20 w-full max-w-5xl mx-auto">
            <h2
              ref={headingRef}
              className="text-5xl md:text-7xl lg:text-8xl font-black footer-text-glow tracking-tighter mb-10 text-center"
            >
              Ready to investigate?
            </h2>

            {/* Interactive Magnetic Pills Layout */}
            <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
              {/* Primary Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <MagneticButton
                  as={Link}
                  to="/cases"
                  className="footer-glass-pill px-8 py-4.5 rounded-full text-white font-bold text-sm md:text-base flex items-center gap-3 border border-white/20 hover:border-[#ccff00]/60 group hover:scale-105 transition-all shadow-[0_0_20px_rgba(204,255,0,0.15)]"
                >
                  <Compass className="size-5 text-[#ccff00] group-hover:rotate-45 transition-transform" />
                  <span className="text-white font-bold tracking-tight">Enter Arena Centre</span>
                </MagneticButton>

                <MagneticButton
                  as={Link}
                  to="/dashboard"
                  className="footer-glass-pill px-8 py-4.5 rounded-full text-[#f5f5f5] font-bold text-sm md:text-base flex items-center gap-3 border border-white/10 hover:border-white/30 group hover:scale-105 transition-all"
                >
                  <LayoutDashboard className="size-5 text-[#8a8a8a] group-hover:text-[#ccff00] transition-colors" />
                  <span>Open Dashboard</span>
                </MagneticButton>
              </div>

              {/* Secondary Navigation Links */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-6 w-full mt-2">
                <MagneticButton
                  as={Link}
                  to="/cases/$slug"
                  params={{ slug: "atm-machine" }}
                  className="footer-glass-pill px-6 py-3 rounded-full text-[#8a8a8a] font-medium text-xs md:text-sm hover:text-[#f5f5f5]"
                >
                  Case 01 · ATM Machine
                </MagneticButton>
                <MagneticButton
                  as={Link}
                  to="/method"
                  className="footer-glass-pill px-6 py-3 rounded-full text-[#8a8a8a] font-medium text-xs md:text-sm hover:text-[#f5f5f5]"
                >
                  The 8-Section Method
                </MagneticButton>
                <MagneticButton
                  as={Link}
                  to="/store"
                  className="footer-glass-pill px-6 py-3 rounded-full text-[#8a8a8a] font-medium text-xs md:text-sm hover:text-[#f5f5f5]"
                >
                  RC Rewards Store
                </MagneticButton>
                <MagneticButton
                  as={Link}
                  to="/profile"
                  className="footer-glass-pill px-6 py-3 rounded-full text-[#8a8a8a] font-medium text-xs md:text-sm hover:text-[#f5f5f5]"
                >
                  Investigator Profile
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar / Credits */}
          <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <div className="text-[#8a8a8a] text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1">
              © 2026 KRUZZ. All rights reserved.
            </div>

            {/* "Made with Love" Badge */}
            <div className="footer-glass-pill px-6 py-3 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default border-white/[0.08]">
              <span className="text-[#8a8a8a] text-[10px] md:text-xs font-bold uppercase tracking-widest">
                Crafted with
              </span>
              <span className="animate-footer-heartbeat text-sm md:text-base text-[#ccff00]">
                ❤
              </span>
              <span className="text-[#8a8a8a] text-[10px] md:text-xs font-bold uppercase tracking-widest">
                by
              </span>
              <span className="text-[#f5f5f5] font-black text-xs md:text-sm tracking-normal ml-1">
                KRUZZ
              </span>
            </div>

            {/* Back to top with GSAP magnetic physics */}
            <MagneticButton
              as="button"
              type="button"
              onClick={scrollToTop}
              className="size-12 rounded-full footer-glass-pill flex items-center justify-center text-[#8a8a8a] hover:text-[#ccff00] hover:border-[#ccff00]/50 group order-3 cursor-pointer"
              title="Back to top"
              aria-label="Back to top"
            >
              <svg
                className="size-5 transform group-hover:-translate-y-1.5 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}
