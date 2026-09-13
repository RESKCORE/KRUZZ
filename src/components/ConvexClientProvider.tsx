import { type ReactNode, useMemo } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convexUrl =
  (import.meta.env["VITE_CONVEX_URL"] as string | undefined) ||
  "https://flippant-gull-225.convex.cloud";
const clerkPubKey =
  (import.meta.env["VITE_CLERK_PUBLISHABLE_KEY"] as string | undefined) ||
  "pk_test_YWJzb2x1dGUtZWxmLTI3LmNsZXJrLmFjY291bnRzLmRldiQ";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    if (!convexUrl) {
      throw new Error(
        "Missing VITE_CONVEX_URL. Configure the Convex deployment before starting the app.",
      );
    }
    return new ConvexReactClient(convexUrl);
  }, []);

  if (!clerkPubKey) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY. Configure Clerk before starting the app.");
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
