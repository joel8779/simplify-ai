"use client";

import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { DangerZoneSettings } from "@/components/settings/DangerZoneSettings";

export function SettingsContent() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <AccountSettings />
      <SecuritySettings />
      <AppearanceSettings />
      <DangerZoneSettings />
    </div>
  );
}
