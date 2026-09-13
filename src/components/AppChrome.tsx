import { type ReactNode, useMemo } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { NotchNav, type NotchItemData } from "@/components/ui/adaptive-notch-navigation-bar";
import { RCBadge, StreakBadge } from "@/components/RCWallet";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { BookOpen, Home, LayoutDashboard, ShoppingBag, Swords, User } from "lucide-react";
import { useAccount } from "@/lib/account";
import { AuthGate } from "@/components/AuthGate";

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
        <div className="flex items-center">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "size-7 ring-1.5 ring-[#ccff00]/60 shadow-[0_0_10px_rgba(204,255,0,0.35)]",
              },
            }}
          />
        </div>
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
