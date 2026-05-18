"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/auth.service";
import { cn } from "@/lib/utils/cn";

interface LogoutButtonProps {
  collapsed?: boolean;
  className?: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "icon";
  allDevices?: boolean;
  onLoggedOut?: () => void;
}

export function LogoutButton({
  collapsed = false,
  className,
  variant = "ghost",
  size = collapsed ? "icon" : "sm",
  allDevices = false,
  onLoggedOut,
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authService.logout({ allDevices });
    sessionStorage.setItem(
      "simplify_logout_success",
      allDevices ? "Logged out from all devices" : "Logged out successfully"
    );
    onLoggedOut?.();
    router.replace("/");
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        "text-muted-foreground hover:bg-red-500/10 hover:text-red-300",
        !collapsed && "justify-start gap-2",
        className
      )}
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label={collapsed ? "Logout" : undefined}
      title={collapsed ? "Logout" : undefined}
    >
      <LogOut className="h-4 w-4" />
      {!collapsed && (isLoggingOut ? "Logging out..." : "Logout")}
    </Button>
  );
}
