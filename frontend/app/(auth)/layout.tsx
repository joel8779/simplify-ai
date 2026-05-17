import { AuthBackground } from "@/components/auth/AuthBackground";
import { AuthBackLink } from "@/components/auth/AuthBackLink";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4 sm:p-6">
      <AuthBackground />
      <AuthBackLink />
      <div className="relative z-10 w-full max-w-[440px]">{children}</div>
    </div>
  );
}
