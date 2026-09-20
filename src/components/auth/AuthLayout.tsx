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
    <div className="relative min-h-screen w-full flex items-center justify-center grid-bg p-4 sm:p-6 md:p-10 select-none overflow-hidden text-black">
      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[1040px] rounded-[32px] border-2 border-black bg-white p-3.5 sm:p-4 md:p-5 shadow-xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 items-stretch">
          {/* LEFT COLUMN: Video Animation Showcase */}
          <div className="relative hidden md:flex items-center justify-center overflow-hidden rounded-[24px] border-2 border-black bg-black min-h-[520px] shadow-xs">
            <video
              src="/cat%20animation.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full max-h-[640px] object-contain select-none pointer-events-none"
            />
          </div>

          {/* RIGHT COLUMN: Clean Form Panel */}
          <div className="flex flex-col justify-center px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            {/* Top Brand Link */}
            <div className="flex items-center justify-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2.5 group cursor-pointer">
                <img
                  src="/logo.png"
                  alt="KRUZZ Logo"
                  className="size-7 rounded-lg object-contain transition-transform group-hover:scale-105"
                />
                <span className="font-mono text-xs font-black tracking-widest text-black transition-colors">
                  KRUZZ
                </span>
              </Link>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black font-sans">
                {title}
              </h1>
              <p className="mt-1.5 text-xs text-neutral-600 font-bold font-sans">{subtitle}</p>
            </div>

            {/* Dynamic Form Content */}
            <div className="w-full">{children}</div>

            {/* Bottom Footer Switch */}
            <div className="mt-6 pt-5 border-t-2 border-black/10 text-center">
              {mode === "sign-in" ? (
                <p className="text-xs text-neutral-600 font-medium">
                  Don't have an account?{" "}
                  <Link
                    to="/sign-up"
                    className="font-black text-black hover:underline underline-offset-4 transition-colors"
                  >
                    Sign Up
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-neutral-600 font-medium">
                  Already have an account?{" "}
                  <Link
                    to="/sign-in"
                    className="font-black text-black hover:underline underline-offset-4 transition-colors"
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
