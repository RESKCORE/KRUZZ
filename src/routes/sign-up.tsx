import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const Route = createFileRoute("/sign-up")({
  head: () => ({
    meta: [
      { title: "Sign Up — KRUZZ" },
      {
        name: "description",
        content:
          "Create your KRUZZ investigator account to track system architecture case studies and earn Reasoning Credits.",
      },
      { property: "og:title", content: "Sign Up — KRUZZ" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
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
      mode="sign-up"
      title="Begin Investigation"
      subtitle="Register your credentials for verified system architecture clearance"
    >
      <SignUpForm />
    </AuthLayout>
  );
}
