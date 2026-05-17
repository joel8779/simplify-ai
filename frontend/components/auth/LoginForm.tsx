"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { FormField } from "@/components/auth/FormField";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth.schema";
import { cn } from "@/lib/utils/cn";
import { authService } from "@/lib/services/auth.service";
import { ApiError } from "@/lib/api/client";

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.06, duration: 0.35 },
  }),
};

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [form, setForm] = useState<LoginFormValues>({
    email: "",
    password: "",
    remember: false,
  });

  const handleChange = (field: keyof LoginFormValues, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof LoginFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.login({
        email: form.email,
        password: form.password,
      });
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        const message = (error.data as any)?.message || error.message || "Login failed";
        setErrors({ email: message });
      } else {
        setErrors({ email: "An unexpected error occurred" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to continue to your AI workspace"
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
          <FormField id="email" label="Email" error={errors.email}>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              disabled={isLoading}
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="h-11 border-white/10 bg-white/5 transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>
        </motion.div>

        <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
          <FormField id="password" label="Password" error={errors.password}>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="h-11 border-white/10 bg-white/5 transition-colors focus:border-primary/50 focus:bg-white/[0.07]"
            />
          </FormField>
        </motion.div>

        <motion.div
          custom={2}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={form.remember}
              onCheckedChange={(checked) =>
                handleChange("remember", checked === true)
              }
              disabled={isLoading}
            />
            <Label
              htmlFor="remember"
              className="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Forgot password?
          </Link>
        </motion.div>

        <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
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
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </motion.div>
      </form>

      <AuthDivider />
      <SocialAuthButtons disabled={isLoading} />

      <motion.p
        className="mt-8 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          Create account
        </Link>
      </motion.p>
    </AuthCard>
  );
}
