import { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { SocialButtons } from "./SocialButtons";
import { Checkbox } from "@/components/ui/checkbox";

const signUpSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email OTP Verification Step
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: true,
    },
  });

  const termsValue = watch("terms");
  const currentPassword = watch("password") || "";

  // Visual password requirement checks
  const hasMinLength = currentPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(currentPassword);
  const hasNumber = /[0-9]/.test(currentPassword);

  const onSubmit = async (data: SignUpFormData) => {
    if (!isLoaded || !signUp) return;

    try {
      setIsSubmitting(true);
      setFormError(null);

      // Create user in Clerk
      await signUp.create({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        emailAddress: data.email.trim(),
        password: data.password,
      });

      // Prepare email verification if required
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      toast.info("Verification code sent to your email!");
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string; longMessage?: string }> };
      const message =
        clerkError.errors?.[0]?.longMessage ||
        clerkError.errors?.[0]?.message ||
        (err instanceof Error
          ? err.message
          : "Failed to create account. Please check your details.");
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp || !verificationCode.trim()) return;

    try {
      setIsVerifying(true);
      setFormError(null);

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        toast.success("Account verified and created successfully!");
        navigate({ to: "/dashboard" });
      } else {
        console.warn("Verification status:", completeSignUp.status);
        setFormError("Verification incomplete. Please verify the code and try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message?: string; longMessage?: string }> };
      const message =
        clerkError.errors?.[0]?.longMessage ||
        clerkError.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Invalid verification code.");
      setFormError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  // ==========================================
  // Render: Email OTP Verification Step
  // ==========================================
  if (pendingVerification) {
    return (
      <div className="space-y-4">
        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-xl border border-[#ff3344]/30 bg-[#ff3344]/10 p-3 text-xs text-[#ff3344]"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="text-center space-y-1">
          <div className="mx-auto size-12 rounded-2xl bg-[#182608] border border-[#ccff00]/40 flex items-center justify-center text-[#ccff00] mb-3 shadow-[0_0_15px_rgba(204,255,0,0.2)]">
            <Mail className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-[#f5f5f5]">Verify Your Email</h2>
          <p className="text-xs text-[#8a8a8a] leading-relaxed">
            Enter the 6-digit verification code sent to your email to activate your investigator
            clearance.
          </p>
        </div>

        <form onSubmit={handleVerifyCode} className="space-y-4 pt-2">
          <div className="space-y-1.5 text-left">
            <label htmlFor="verify-code" className="block text-xs font-medium text-[#b8b8b8]">
              Verification Code
            </label>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold rounded-xl border border-white/10 bg-[#141414] py-3 text-[#ccff00] placeholder:text-[#444] transition-all focus:border-[#ccff00]/60 focus:bg-[#181818] focus:outline-none focus:ring-1 focus:ring-[#ccff00]/40"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || verificationCode.length < 6}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] py-2.5 font-sans text-sm font-bold text-[#080808] shadow-[0_0_20px_rgba(204,255,0,0.35)] transition-all duration-200 hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isVerifying ? (
              <Loader2 className="size-4 animate-spin text-[#080808]" />
            ) : (
              "Complete Registration"
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setPendingVerification(false);
              setFormError(null);
            }}
            className="w-full text-center text-xs text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors py-1 cursor-pointer"
          >
            Change Details / Back
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // Render: Standard Sign Up Form
  // ==========================================
  return (
    <div className="space-y-4">
      {/* Inline Form Error Announcement */}
      {formError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2.5 rounded-xl border border-[#ff3344]/30 bg-[#ff3344]/10 p-3 text-xs text-[#ff3344]"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Name Grid: First Name & Last Name */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1 text-left">
            <label htmlFor="firstName" className="block text-xs font-medium text-[#b8b8b8]">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8a8a8a] pointer-events-none" />
              <input
                id="firstName"
                type="text"
                autoFocus
                placeholder="Alex"
                {...register("firstName")}
                className="w-full rounded-xl border border-white/10 bg-[#141414] py-2 pl-8 pr-3 text-xs sm:text-sm text-[#f5f5f5] placeholder:text-[#555] transition-all duration-200 focus:border-[#ccff00]/60 focus:bg-[#181818] focus:outline-none focus:ring-1 focus:ring-[#ccff00]/40"
              />
            </div>
            {errors.firstName && (
              <p className="text-[10px] font-medium text-[#ff3344]">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1 text-left">
            <label htmlFor="lastName" className="block text-xs font-medium text-[#b8b8b8]">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Vance"
              {...register("lastName")}
              className="w-full rounded-xl border border-white/10 bg-[#141414] py-2 px-3 text-xs sm:text-sm text-[#f5f5f5] placeholder:text-[#555] transition-all duration-200 focus:border-[#ccff00]/60 focus:bg-[#181818] focus:outline-none focus:ring-1 focus:ring-[#ccff00]/40"
            />
            {errors.lastName && (
              <p className="text-[10px] font-medium text-[#ff3344]">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1 text-left">
          <label htmlFor="signUpEmail" className="block text-xs font-medium text-[#b8b8b8]">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8a8a8a] pointer-events-none" />
            <input
              id="signUpEmail"
              type="email"
              autoComplete="email"
              placeholder="alex@kruzz.dev"
              {...register("email")}
              className="w-full rounded-xl border border-white/10 bg-[#141414] py-2 pl-8 pr-3 text-xs sm:text-sm text-[#f5f5f5] placeholder:text-[#555] transition-all duration-200 focus:border-[#ccff00]/60 focus:bg-[#181818] focus:outline-none focus:ring-1 focus:ring-[#ccff00]/40"
            />
          </div>
          {errors.email && (
            <p className="text-[10px] font-medium text-[#ff3344]">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1 text-left">
          <label htmlFor="signUpPassword" className="block text-xs font-medium text-[#b8b8b8]">
            Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8a8a8a] pointer-events-none" />
            <input
              id="signUpPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("password")}
              className="w-full rounded-xl border border-white/10 bg-[#141414] py-2 pl-8 pr-9 text-xs sm:text-sm text-[#f5f5f5] placeholder:text-[#555] transition-all duration-200 focus:border-[#ccff00]/60 focus:bg-[#181818] focus:outline-none focus:ring-1 focus:ring-[#ccff00]/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[10px] font-medium text-[#ff3344]">{errors.password.message}</p>
          )}

          {/* Password Requirements Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
            <span
              className={`flex items-center gap-1 transition-colors ${
                hasMinLength ? "text-[#ccff00]" : "text-[#666]"
              }`}
            >
              <CheckCircle2 className="size-3" /> 8+ chars
            </span>
            <span
              className={`flex items-center gap-1 transition-colors ${
                hasUppercase ? "text-[#ccff00]" : "text-[#666]"
              }`}
            >
              <CheckCircle2 className="size-3" /> 1 uppercase
            </span>
            <span
              className={`flex items-center gap-1 transition-colors ${
                hasNumber ? "text-[#ccff00]" : "text-[#666]"
              }`}
            >
              <CheckCircle2 className="size-3" /> 1 number
            </span>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1 text-left">
          <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#b8b8b8]">
            Confirm Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8a8a8a] pointer-events-none" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              className="w-full rounded-xl border border-white/10 bg-[#141414] py-2 pl-8 pr-9 text-xs sm:text-sm text-[#f5f5f5] placeholder:text-[#555] transition-all duration-200 focus:border-[#ccff00]/60 focus:bg-[#181818] focus:outline-none focus:ring-1 focus:ring-[#ccff00]/40"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors p-1 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[10px] font-medium text-[#ff3344]">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="pt-1 text-left">
          <label className="flex items-start gap-2 text-[11px] text-[#8a8a8a] leading-tight cursor-pointer select-none">
            <Checkbox
              id="terms"
              checked={termsValue}
              onCheckedChange={(checked) => {
                if (checked === true) setValue("terms", true);
              }}
              className="mt-0.5 rounded border-white/20 data-[state=checked]:bg-[#ccff00] data-[state=checked]:text-[#080808]"
            />
            <span>
              I agree to the{" "}
              <a href="#" className="text-[#b8b8b8] underline hover:text-[#ccff00]">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#b8b8b8] underline hover:text-[#ccff00]">
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.terms && (
            <p className="mt-1 text-[10px] font-medium text-[#ff3344]">{errors.terms.message}</p>
          )}
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isLoaded}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] py-2.5 font-sans text-sm font-bold text-[#080808] shadow-[0_0_20px_rgba(204,255,0,0.35)] transition-all duration-200 hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin text-[#080808]" />
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Separator */}
      <div className="relative my-3 flex items-center justify-center">
        <div className="w-full border-t border-white/[0.08]" />
        <span className="absolute bg-[#0e0e0e] px-3 font-mono text-[10px] uppercase tracking-wider text-[#666]">
          or
        </span>
      </div>

      {/* OAuth Buttons */}
      <SocialButtons mode="sign-up" onError={(msg) => setFormError(msg)} />
    </div>
  );
}
