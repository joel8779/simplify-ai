"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Mail, RotateCcw } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { FormField } from "@/components/auth/FormField";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  signupSchema,
  type SignupFormValues,
} from "@/lib/validations/auth.schema";
import { cn } from "@/lib/utils/cn";
import { authService } from "@/lib/services/auth.service";
import { ApiError } from "@/lib/api/client";

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.05, duration: 0.35 },
  }),
};

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupFormValues, string>>
  >({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false as boolean,
  });

  useEffect(() => {
    if (step !== "verify") return;
    const timer = window.setInterval(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
      setResendIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof SignupFormValues]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof SignupFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.signup({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setExpiresIn(response.expires_in_seconds);
      setResendIn(response.resend_after_seconds);
      setOtp("");
      setOtpError(null);
      setOtpNotice("We sent a verification code to your email.");
      setStep("verify");
    } catch (error) {
      if (error instanceof ApiError) {
        const message = (error.data as any)?.message || error.message || "Signup failed";
        setErrors({ email: message });
      } else {
        setErrors({ email: "An unexpected error occurred" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6 digit code from your email");
      return;
    }

    setIsVerifying(true);
    setOtpError(null);
    try {
      await authService.verifyOtp({ email: form.email, otp });
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setOtpError((error.data as any)?.message || error.message || "Invalid code");
      } else {
        setOtpError("An unexpected error occurred");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setOtpError(null);
    setOtpNotice(null);
    try {
      const response = await authService.resendOtp(form.email);
      setExpiresIn(response.expires_in_seconds);
      setResendIn(response.resend_after_seconds);
      setOtpNotice("A fresh code is on its way.");
    } catch (error) {
      if (error instanceof ApiError) {
        const retryAfter = (error.data as any)?.details?.retry_after_seconds;
        if (typeof retryAfter === "number") {
          setResendIn(retryAfter);
        }
        setOtpError((error.data as any)?.message || error.message || "Unable to resend code");
      } else {
        setOtpError("An unexpected error occurred");
      }
    } finally {
      setIsResending(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (step === "verify") {
    return (
      <AuthCard>
        <AuthHeader
          title="Verify your email"
          subtitle={`Enter the 6 digit code sent to ${form.email}`}
        />

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
          <div>
            <p className="font-medium text-blue-100">Check your inbox</p>
            <p className="mt-1 text-blue-100/75">
              This code expires in {formatTimer(expiresIn)}.
            </p>
          </div>
        </div>

        {otpNotice && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {otpNotice}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5" noValidate>
          <FormField id="otp" label="Verification code" error={otpError || undefined}>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              disabled={isVerifying}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                setOtpError(null);
              }}
              className="h-12 border-white/10 bg-white/5 text-center text-lg font-semibold tracking-[0.45em] transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>

          <Button
            type="submit"
            className={cn(
              "h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600",
              "font-medium shadow-lg shadow-violet-500/20 transition-all",
              "hover:from-blue-500 hover:to-violet-500 hover:shadow-violet-500/30"
            )}
            disabled={isVerifying || otp.length !== 6 || expiresIn === 0}
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify and continue"
            )}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <button
            type="button"
            onClick={() => setStep("signup")}
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Edit signup details
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendIn > 0}
            className="inline-flex items-center justify-center gap-2 rounded-sm font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isResending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            {resendIn > 0 ? `Resend in ${formatTimer(resendIn)}` : "Resend code"}
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Create your account"
        subtitle="Start chatting with your documents in minutes"
      />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
          <FormField id="name" label="Full name" error={errors.name}>
            <Input
              id="name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              disabled={isLoading}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              aria-invalid={!!errors.name}
              className="h-11 border-white/10 bg-white/5 transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>
        </motion.div>

        <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
          <FormField id="signup-email" label="Email" error={errors.email}>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              disabled={isLoading}
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={!!errors.email}
              className="h-11 border-white/10 bg-white/5 transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>
        </motion.div>

        <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
          <FormField id="signup-password" label="Password" error={errors.password}>
            <PasswordInput
              id="signup-password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              disabled={isLoading}
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              aria-invalid={!!errors.password}
              className="h-11 border-white/10 bg-white/5 transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>
        </motion.div>

        <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
          <FormField
            id="confirmPassword"
            label="Confirm password"
            error={errors.confirmPassword}
          >
            <PasswordInput
              id="confirmPassword"
              placeholder="Repeat password"
              autoComplete="new-password"
              disabled={isLoading}
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              aria-invalid={!!errors.confirmPassword}
              className="h-11 border-white/10 bg-white/5 transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>
        </motion.div>

        <motion.div
          custom={4}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="flex items-start gap-2 pt-1"
        >
          <Checkbox
            id="terms"
            checked={form.terms}
            onCheckedChange={(checked) => handleChange("terms", checked === true)}
            disabled={isLoading}
            aria-invalid={!!errors.terms}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label
              htmlFor="terms"
              className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-primary hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
            </Label>
            {errors.terms && (
              <p className="text-xs text-red-400" role="alert">
                {errors.terms}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible">
          <Button
            type="submit"
            className={cn(
              "h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600",
              "font-medium shadow-lg shadow-violet-500/20 transition-all",
              "hover:from-blue-500 hover:to-violet-500 hover:shadow-violet-500/30"
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </motion.div>
      </form>

      <motion.p
        className="mt-6 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          Sign in
        </Link>
      </motion.p>
    </AuthCard>
  );
}
