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
import { ApiError } from "@/lib/api/client";
import { authService } from "@/lib/services/auth.service";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth.schema";
import { cn } from "@/lib/utils/cn";

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.05, duration: 0.35 },
  }),
};

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [requestErrors, setRequestErrors] = useState<
    Partial<Record<keyof ForgotPasswordFormValues, string>>
  >({});
  const [resetErrors, setResetErrors] = useState<
    Partial<Record<keyof ResetPasswordFormValues, string>>
  >({});
  const [email, setEmail] = useState("");
  const [resetForm, setResetForm] = useState({
    otp: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (step !== "reset") return;
    const timer = window.setInterval(() => {
      setExpiresIn((value) => Math.max(0, value - 1));
      setResendIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const apiMessage = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) {
      return (error.data as any)?.message || error.message || fallback;
    }
    return fallback;
  };

  const applyRateLimit = (error: unknown) => {
    if (error instanceof ApiError) {
      const retryAfter = (error.data as any)?.details?.retry_after_seconds;
      if (typeof retryAfter === "number") {
        setResendIn(retryAfter);
      }
    }
  };

  const requestCode = async (targetEmail: string) => {
    const response = await authService.forgotPassword(targetEmail);
    setEmail(response.email);
    setExpiresIn(response.expires_in_seconds);
    setResendIn(response.resend_after_seconds);
    setResetForm({ otp: "", password: "", confirmPassword: "" });
    setResetErrors({});
    setNotice("We sent a password reset code to your email.");
    setStep("reset");
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setRequestErrors({ email: result.error.errors[0]?.message });
      return;
    }

    setIsRequesting(true);
    setRequestErrors({});
    try {
      await requestCode(result.data.email);
    } catch (error) {
      setRequestErrors({
        email: apiMessage(error, "Unable to send reset code"),
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleResetChange = (field: keyof typeof resetForm, value: string) => {
    setResetForm((prev) => ({ ...prev, [field]: value }));
    if (resetErrors[field]) {
      setResetErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = resetPasswordSchema.safeParse(resetForm);
    if (!result.success) {
      const fieldErrors: typeof resetErrors = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof ResetPasswordFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setResetErrors(fieldErrors);
      return;
    }

    setIsResetting(true);
    try {
      await authService.resetPassword({
        email,
        otp: result.data.otp,
        new_password: result.data.password,
      });
      sessionStorage.setItem(
        "simplify_logout_success",
        "Password updated. Sign in with your new password."
      );
      router.push("/login");
    } catch (error) {
      setResetErrors({
        otp: apiMessage(error, "Unable to reset password"),
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setNotice(null);
    setResetErrors({});
    try {
      const response = await authService.forgotPassword(email);
      setExpiresIn(response.expires_in_seconds);
      setResendIn(response.resend_after_seconds);
      setNotice("A fresh code is on its way.");
    } catch (error) {
      applyRateLimit(error);
      setResetErrors({
        otp: apiMessage(error, "Unable to resend code"),
      });
    } finally {
      setIsResending(false);
    }
  };

  if (step === "reset") {
    return (
      <AuthCard>
        <AuthHeader
          title="Set a new password"
          subtitle={`Enter the 6 digit code sent to ${email}`}
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

        {notice && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {notice}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4" noValidate>
          <FormField id="reset-otp" label="Verification code" error={resetErrors.otp}>
            <Input
              id="reset-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              disabled={isResetting}
              value={resetForm.otp}
              onChange={(e) =>
                handleResetChange("otp", e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="h-12 border-white/10 bg-white/5 text-center text-lg font-semibold tracking-[0.45em] transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>

          <FormField
            id="new-password"
            label="New password"
            error={resetErrors.password}
          >
            <PasswordInput
              id="new-password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              disabled={isResetting}
              value={resetForm.password}
              onChange={(e) => handleResetChange("password", e.target.value)}
              className="h-11 border-white/10 bg-white/5 transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>

          <FormField
            id="confirm-new-password"
            label="Confirm password"
            error={resetErrors.confirmPassword}
          >
            <PasswordInput
              id="confirm-new-password"
              placeholder="Repeat password"
              autoComplete="new-password"
              disabled={isResetting}
              value={resetForm.confirmPassword}
              onChange={(e) => handleResetChange("confirmPassword", e.target.value)}
              className="h-11 border-white/10 bg-white/5 transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>

          <Button
            type="submit"
            className={cn(
              "h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600",
              "font-medium shadow-lg shadow-violet-500/20 transition-all",
              "hover:from-blue-500 hover:to-violet-500 hover:shadow-violet-500/30"
            )}
            disabled={isResetting || expiresIn === 0}
          >
            {isResetting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating password...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setNotice(null);
            }}
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Use another email
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
        title="Reset password"
        subtitle="Enter your email and we will send you a reset code"
      />

      <form onSubmit={handleRequest} className="space-y-5" noValidate>
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
          <FormField id="forgot-email" label="Email" error={requestErrors.email}>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              disabled={isRequesting}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setRequestErrors({});
              }}
              className="h-11 border-white/10 bg-white/5 transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>
        </motion.div>

        <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
          <Button
            type="submit"
            className={cn(
              "h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600",
              "font-medium shadow-lg shadow-violet-500/20 transition-all",
              "hover:from-blue-500 hover:to-violet-500 hover:shadow-violet-500/30"
            )}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending code...
              </>
            ) : (
              "Send reset code"
            )}
          </Button>
        </motion.div>
      </form>

      <motion.p
        className="mt-6 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        Remembered it?{" "}
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
