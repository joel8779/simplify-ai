import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Reset password"
        subtitle="Password reset flow — connect your auth API"
      />
      <Button asChild className="w-full">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </AuthCard>
  );
}
