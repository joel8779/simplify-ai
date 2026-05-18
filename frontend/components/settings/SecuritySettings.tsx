"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { authService } from "@/lib/services/auth.service";
import { userService } from "@/lib/services/user.service";

export function SecuritySettings() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setIsChanging(true);
    setStatus(null);
    setError(null);
    try {
      await userService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setStatus("Password updated");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsChanging(false);
    }
  };

  const handleLogout = async (allDevices = false) => {
    if (allDevices) {
      setIsLoggingOutAll(true);
    } else {
      setIsLoggingOut(true);
    }
    await authService.logout({ allDevices });
    sessionStorage.setItem(
      "simplify_logout_success",
      allDevices ? "Logged out from all devices" : "Logged out successfully"
    );
    router.replace("/");
  };

  return (
    <SettingsSection
      title="Security"
      description="Update your password or sign out."
      delay={0.05}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isChanging}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isChanging}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleChangePassword}
            disabled={
              isChanging ||
              currentPassword.trim().length === 0 ||
              newPassword.trim().length < 8
            }
          >
            {isChanging ? "Updating..." : "Change password"}
          </Button>
          {status && <span className="text-sm text-emerald-400">{status}</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border/40 bg-background/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Logout</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              End this session on the current device.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => handleLogout(false)}
            disabled={isLoggingOut || isLoggingOutAll}
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border/40 bg-background/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Logout from all devices
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Invalidate every active Simplify session for this account.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => handleLogout(true)}
            disabled={isLoggingOut || isLoggingOutAll}
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOutAll ? "Logging out..." : "Logout all"}
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
