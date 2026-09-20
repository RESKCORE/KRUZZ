import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, KeyRound, Loader2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SocialButtons } from "./SocialButtons";
import { Checkbox } from "@/components/ui/checkbox";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm({ redirect }: { redirect?: string } = {}) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password sub-flow states
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMeValue = watch("rememberMe");

  const onSubmit = async (data: SignInFormData) => {
    if (!isLoaded || !signIn) return;

    try {
      setIsSubmitting(true);
      setFormError(null);

      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Welcome back to KRUZZ!");
        navigate({ to: (redirect || "/dashboard") as "/" });
      } else {
        console.warn("Sign in incomplete:", result.status);
        setFormError(`Sign in status: ${result.status}. Additional authentication required.`);
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string; longMessage?: string }> };
      const message =
        clerkError.errors?.[0]?.longMessage ||
        clerkError.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Invalid credentials. Please try again.");
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger password reset email
  const handleRequestPasswordReset = async () => {
    if (!isLoaded || !signIn || !resetEmail.trim()) {
      setFormError("Please enter your registered email address.");
      return;
    }

    try {
      setResetLoading(true);
      setFormError(null);
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: resetEmail.trim(),
      });
      setResetStep("verify");
      toast.success("Reset code sent to your email!");
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string; longMessage?: string }> };
      const message =
        clerkError.errors?.[0]?.longMessage ||
        clerkError.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Failed to send reset code.");
      setFormError(message);
    } finally {
      setResetLoading(false);
    }
  };

  // Complete password reset
  const handleVerifyPasswordReset = async () => {
    if (!isLoaded || !signIn) return;

    if (!resetCode.trim() || newPassword.length < 8) {
      setFormError("Please enter the verification code and a password of at least 8 characters.");
      return;
    }

    try {
      setResetLoading(true);
      setFormError(null);

      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode.trim(),
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setResetSuccess(true);
        toast.success("Password reset successful! Logging you in...");
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 1200);
      } else {
        setFormError("Unable to complete reset. Please try requesting a new code.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string; longMessage?: string }> };
      const message =
        clerkError.errors?.[0]?.longMessage ||
        clerkError.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Failed to reset password.");
      setFormError(message);
    } finally {
      setResetLoading(false);
    }
  };

  // ==========================================
  // Render: Forgot Password Sub-flow
  // ==========================================
  if (isResetMode) {
    return (
      <div className="space-y-4 text-black">
        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-xl border-2 border-red-500 bg-red-50 p-3 text-xs text-red-700 font-bold"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {resetSuccess ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <CheckCircle2 className="size-12 text-black animate-bounce" />
            <h3 className="text-base font-black text-black">Password Reset Complete!</h3>
            <p className="text-xs text-neutral-600 font-bold">Redirecting to your dashboard...</p>
          </div>
        ) : resetStep === "request" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="block text-xs font-black text-black">
                Account Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                <input
                  id="reset-email"
                  type="email"
                  autoFocus
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border-2 border-black bg-white py-2.5 pl-9 pr-4 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={resetLoading || !resetEmail}
              onClick={handleRequestPasswordReset}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-black py-2.5 font-mono text-xs font-black text-white hover:bg-neutral-800 border-2 border-black shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {resetLoading ? (
                <Loader2 className="size-4 animate-spin text-white" />
              ) : (
                "Send Reset Code"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setFormError(null);
              }}
              className="w-full text-center text-xs text-neutral-600 hover:text-black font-bold transition-colors py-1 cursor-pointer"
            >
              Back to Log In
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="reset-code" className="block text-xs font-black text-black">
                Verification Code from Email
              </label>
              <input
                id="reset-code"
                type="text"
                autoFocus
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border-2 border-black bg-white py-2.5 px-3.5 text-sm text-black font-mono placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-password" className="block text-xs font-black text-black">
                New Password (min 8 chars)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-black bg-white py-2.5 pl-9 pr-4 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={resetLoading}
              onClick={handleVerifyPasswordReset}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-black py-2.5 font-mono text-xs font-black text-white hover:bg-neutral-800 border-2 border-black shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {resetLoading ? (
                <Loader2 className="size-4 animate-spin text-white" />
              ) : (
                "Set New Password & Log In"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setResetStep("request");
                setFormError(null);
              }}
              className="w-full text-center text-xs text-neutral-600 hover:text-black font-bold transition-colors py-1 cursor-pointer"
            >
              Back
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // Render: Standard Sign In Form
  // ==========================================
  return (
    <div className="space-y-4 text-black">
      {/* Inline Form Error Announcement */}
      {formError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2.5 rounded-xl border-2 border-red-500 bg-red-50 p-3 text-xs text-red-700 font-bold"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="email" className="block text-xs font-black text-black">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-500 pointer-events-none" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="hello@example.com"
              {...register("email")}
              className="w-full rounded-xl border-2 border-black bg-white py-2.5 pl-10 pr-4 text-sm text-black placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 shadow-xs"
            />
          </div>
          {errors.email && (
            <p className="text-[11px] font-bold text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field with Eye Toggle */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="password" className="block text-xs font-black text-black">
            Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-500 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className="w-full rounded-xl border-2 border-black bg-white py-2.5 pl-10 pr-11 text-sm text-black placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors p-1 cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-bold text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <label className="flex items-center gap-2 text-neutral-600 font-bold hover:text-black cursor-pointer select-none">
            <Checkbox
              id="rememberMe"
              checked={Boolean(rememberMeValue)}
              onCheckedChange={(checked) => setValue("rememberMe", Boolean(checked))}
              className="rounded border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
            />
            <span>Remember me</span>
          </label>

          <button
            type="button"
            onClick={() => {
              setIsResetMode(true);
              setFormError(null);
            }}
            className="text-xs text-neutral-600 font-bold hover:text-black hover:underline transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isLoaded}
          className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-black py-2.5 font-sans text-sm font-black text-white hover:bg-neutral-800 border-2 border-black shadow-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin text-white" /> : "Log in"}
        </button>
      </form>

      {/* Separator */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-full border-t-2 border-black/10" />
        <span className="absolute bg-white px-3 font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
          or
        </span>
      </div>

      {/* OAuth Buttons */}
      <SocialButtons mode="sign-in" onError={(msg) => setFormError(msg)} />
    </div>
  );
}
