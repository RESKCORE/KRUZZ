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

        <div className="text-center space-y-1">
          <div className="mx-auto size-12 rounded-2xl bg-neutral-100 border-2 border-black flex items-center justify-center text-black mb-3 shadow-xs">
            <Mail className="size-6" />
          </div>
          <h2 className="text-lg font-black text-black">Verify Your Email</h2>
          <p className="text-xs text-neutral-600 leading-relaxed font-bold">
            Enter the 6-digit verification code sent to your email to activate your investigator
            clearance.
          </p>
        </div>

        <form onSubmit={handleVerifyCode} className="space-y-4 pt-2">
          <div className="space-y-1.5 text-left">
            <label htmlFor="verify-code" className="block text-xs font-black text-black">
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
              className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold rounded-xl border-2 border-black bg-white py-3 text-black placeholder:text-neutral-400 transition-all focus:outline-none focus:ring-2 focus:ring-black/20 shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || verificationCode.length < 6}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-2.5 font-sans text-sm font-black text-white hover:bg-neutral-800 border-2 border-black shadow-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isVerifying ? (
              <Loader2 className="size-4 animate-spin text-white" />
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
            className="w-full text-center text-xs text-neutral-600 hover:text-black font-bold transition-colors py-1 cursor-pointer"
          >
            Back to Registration Form
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // Render: Standard Sign Up Form
  // ==========================================
  return (
    <div className="space-y-3 text-black">
      {formError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2.5 rounded-xl border-2 border-red-500 bg-red-50 p-2.5 text-xs text-red-700 font-bold"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Name Fields (2-Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1 text-left">
            <label htmlFor="firstName" className="block text-xs font-black text-black">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500 pointer-events-none" />
              <input
                id="firstName"
                type="text"
                autoFocus
                placeholder="Alex"
                {...register("firstName")}
                className="w-full rounded-xl border-2 border-black bg-white py-2 pl-8 pr-3 text-xs sm:text-sm text-black placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 shadow-xs"
              />
            </div>
            {errors.firstName && (
              <p className="text-[10px] font-bold text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1 text-left">
            <label htmlFor="lastName" className="block text-xs font-black text-black">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Vance"
              {...register("lastName")}
              className="w-full rounded-xl border-2 border-black bg-white py-2 px-3 text-xs sm:text-sm text-black placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 shadow-xs"
            />
            {errors.lastName && (
              <p className="text-[10px] font-bold text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1 text-left">
          <label htmlFor="signUpEmail" className="block text-xs font-black text-black">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500 pointer-events-none" />
            <input
              id="signUpEmail"
              type="email"
              autoComplete="email"
              placeholder="alex@kruzz.dev"
              {...register("email")}
              className="w-full rounded-xl border-2 border-black bg-white py-2 pl-8 pr-3 text-xs sm:text-sm text-black placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 shadow-xs"
            />
          </div>
          {errors.email && (
            <p className="text-[10px] font-bold text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1 text-left">
          <label htmlFor="signUpPassword" className="block text-xs font-black text-black">
            Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500 pointer-events-none" />
            <input
              id="signUpPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("password")}
              className="w-full rounded-xl border-2 border-black bg-white py-2 pl-8 pr-9 text-xs sm:text-sm text-black placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[10px] font-bold text-red-600">{errors.password.message}</p>
          )}

          {/* Password Requirements Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
            <span
              className={`flex items-center gap-1 transition-colors ${
                hasMinLength ? "text-black font-black" : "text-neutral-400"
              }`}
            >
              <CheckCircle2 className="size-3" /> 8+ chars
            </span>
            <span
              className={`flex items-center gap-1 transition-colors ${
                hasUppercase ? "text-black font-black" : "text-neutral-400"
              }`}
            >
              <CheckCircle2 className="size-3" /> 1 uppercase
            </span>
            <span
              className={`flex items-center gap-1 transition-colors ${
                hasNumber ? "text-black font-black" : "text-neutral-400"
              }`}
            >
              <CheckCircle2 className="size-3" /> 1 number
            </span>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1 text-left">
          <label htmlFor="confirmPassword" className="block text-xs font-black text-black">
            Confirm Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500 pointer-events-none" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              className="w-full rounded-xl border-2 border-black bg-white py-2 pl-8 pr-9 text-xs sm:text-sm text-black placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors p-1 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[10px] font-bold text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="pt-1 text-left">
          <label className="flex items-start gap-2 text-[11px] text-neutral-600 leading-tight cursor-pointer select-none font-medium">
            <Checkbox
              id="terms"
              checked={termsValue}
              onCheckedChange={(checked) => {
                if (checked === true) setValue("terms", true);
              }}
              className="mt-0.5 rounded border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
            />
            <span>
              I agree to the{" "}
              <a href="#" className="text-black font-bold underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-black font-bold underline">
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.terms && (
            <p className="mt-1 text-[10px] font-bold text-red-600">{errors.terms.message}</p>
          )}
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isLoaded}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-black py-2.5 font-sans text-sm font-black text-white hover:bg-neutral-800 border-2 border-black shadow-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin text-white" /> : "Create Account"}
        </button>
      </form>

      {/* Separator */}
      <div className="relative my-3 flex items-center justify-center">
        <div className="w-full border-t-2 border-black/10" />
        <span className="absolute bg-white px-3 font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
          or
        </span>
      </div>

      {/* OAuth Buttons */}
      <SocialButtons mode="sign-up" onError={(msg) => setFormError(msg)} />
    </div>
  );
}
