import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignInForm } from "@/components/auth/SignInForm";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Log In — KRUZZ" },
      {
        name: "description",
        content:
          "Access your verified KRUZZ investigator dossier, cloud streaks, and reasoning credits.",
      },
      { property: "og:title", content: "Log In — KRUZZ" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate({ to: "/dashboard" });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <AuthLayout
      mode="sign-in"
      title="Welcome Back!"
      subtitle="Enter your investigator credentials below"
    >
      <SignInForm />
    </AuthLayout>
  );
}
