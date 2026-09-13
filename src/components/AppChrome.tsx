import { type ReactNode, useMemo, useState, useRef, useEffect } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { NotchNav, type NotchItemData } from "@/components/ui/adaptive-notch-navigation-bar";
import { RCBadge, StreakBadge } from "@/components/RCWallet";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import { BookOpen, Home, LayoutDashboard, ShoppingBag, Swords, User, Settings, LogOut, ChevronRight } from "lucide-react";
import { useAccount } from "@/lib/account";
import { AuthGate } from "@/components/AuthGate";

function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut({ redirectUrl: "/" });
    router.navigate({ to: "/" });
  };

  const displayName = user?.fullName || user?.username || "Learner";
  const displayEmail = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex size-8 items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer ${
          open
            ? "border-[#ccff00]/60 bg-[#182608] text-[#ccff00] shadow-[0_0_12px_rgba(204,255,0,0.3)]"
            : "border-white/[0.08] bg-white/[0.03] text-[#8a8a8a] hover:border-white/20 hover:text-[#f5f5f5] hover:bg-white/[0.06]"
        }`}
        aria-label="User Settings"
        aria-expanded={open}
      >
        <Settings className="size-4 stroke-[2]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/[0.1] bg-[#0d0f0d]/95 p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.7)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="border-b border-white/[0.06] px-3 py-2.5">
            <p className="truncate text-xs font-bold text-[#f5f5f5]">{displayName}</p>
            {displayEmail && (
              <p className="truncate font-mono text-[10px] text-[#8a8a8a]">{displayEmail}</p>
            )}
          </div>

          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[#b8b8b8] transition-colors hover:bg-white/[0.06] hover:text-[#f5f5f5]"
            >
              <span className="flex items-center gap-2">
                <User className="size-3.5 text-[#ccff00]" />
                Profile
              </span>
              <ChevronRight className="size-3 text-[#555]" />
            </Link>
          </div>

          <div className="border-t border-white/[0.06] pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#ff5555] transition-colors hover:bg-[#201010] hover:text-[#ff7777] cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface AppChromeProps {
  children: ReactNode;
}

const MEMBER_NAV_ITEMS: NotchItemData[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "arena", label: "Arena Centre", icon: Swords },
  { id: "store", label: "Store", icon: ShoppingBag, badge: "RC" },
  { id: "profile", label: "Profile", icon: User },
];

const GUEST_NAV_ITEMS: NotchItemData[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "arena", label: "Arena Centre", icon: Swords },
  { id: "method", label: "Methodology", icon: BookOpen },
];

export function AppChrome({ children }: AppChromeProps) {
  const router = useRouter();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { isAuthenticated } = useAccount();

  const isMemberRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/cases/") || // dossiers gated; /cases catalog stays public
    pathname.startsWith("/store") ||
    pathname.startsWith("/profile");

  const navItems = isAuthenticated ? MEMBER_NAV_ITEMS : GUEST_NAV_ITEMS;

  const activeId = useMemo(() => {
    if (pathname.startsWith("/profile")) return "profile";
    if (pathname.startsWith("/store")) return "store";
    if (pathname.startsWith("/cases")) return "arena";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/method")) return "method";
    return isAuthenticated ? "dashboard" : "home";
  }, [pathname, isAuthenticated]);

  const handleActiveChange = (id: string) => {
    switch (id) {
      case "home":
        router.navigate({ to: "/" });
        break;
      case "dashboard":
        router.navigate({ to: "/dashboard" });
        break;
      case "arena":
        router.navigate({ to: "/cases" });
        break;
      case "store":
        router.navigate({ to: "/store" });
        break;
      case "profile":
        router.navigate({ to: "/profile" });
        break;
      case "method":
        router.navigate({ to: "/method" });
        break;
    }
  };

  const LogoSlot = (
    <Link
      to={isAuthenticated ? "/dashboard" : "/"}
      className="flex items-center gap-2.5 group cursor-pointer"
    >
      <img
        src="/logo.png"
        alt="KRUZZ Logo"
        className="size-8 rounded-lg object-contain transition-transform duration-200 group-hover:scale-105"
      />
      <span className="hidden sm:inline font-mono text-xs font-black tracking-widest text-[#f5f5f5] group-hover:text-[#ccff00] transition-colors">
        KRUZZ
      </span>
    </Link>
  );

  const RightContentSlot = (
    <div className="flex items-center gap-2">
      <StreakBadge />
      <RCBadge />

      <SignedOut>
        <Link
          to="/sign-in"
          className="rounded-lg bg-gradient-to-r from-[#d4ff00] to-[#ccff00] px-3 py-1.5 font-mono text-[10px] font-bold text-[#080808] shadow-[0_0_10px_rgba(204,255,0,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          Sign In
        </Link>
      </SignedOut>

      <SignedIn>
        <SettingsDropdown />
      </SignedIn>
    </div>
  );

  return (
    <NotchNav
      items={navItems}
      activeId={activeId}
      position="top"
      logo={LogoSlot}
      rightContent={RightContentSlot}
      showLogo={true}
      showRightContent={true}
      onActiveChange={handleActiveChange}
    >
      <div className="w-full flex-1 min-h-full">
        {isMemberRoute && !isAuthenticated ? (
          <AuthGate
            title="Investigator Clearance Required"
            description="Dashboard, Store, and Profile dossiers are bound to registered accounts. Sign in to access your cloud progression, Reasoning Credits, and system architecture workspaces."
            returnTo="/cases"
          />
        ) : (
          children
        )}
      </div>
    </NotchNav>
  );
}
