import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BRAND_NAME } from "@/lib/constants/brand";
import { ROUTES } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  href?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-sm" },
  md: { box: "h-9 w-9", icon: "h-4 w-4", text: "text-base" },
  lg: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-lg" },
} as const;

export function Logo({
  href = ROUTES.home,
  showLabel = true,
  size = "md",
  className,
}: LogoProps) {
  const s = sizeMap[size];

  const content = (
    <>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-violet-500/20",
          s.box
        )}
      >
        <Sparkles className={cn("text-white", s.icon)} />
      </div>
      {showLabel && (
        <span
          className={cn("font-semibold tracking-tight text-foreground", s.text)}
        >
          {BRAND_NAME}
        </span>
      )}
    </>
  );

  if (!href) {
    return (
      <div className={cn("flex items-center gap-2", className)}>{content}</div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 transition-opacity hover:opacity-90",
        className
      )}
      aria-label={`${BRAND_NAME} home`}
    >
      {content}
    </Link>
  );
}
