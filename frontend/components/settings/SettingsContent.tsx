"use client";

import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { ConnectedDocumentsSettings } from "@/components/settings/ConnectedDocumentsSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { DangerZoneSettings } from "@/components/settings/DangerZoneSettings";

export function SettingsContent() {
  return (
    <div className="space-y-6">
      <AccountSettings />
      <AppearanceSettings />
      <NotificationSettings />
      <ConnectedDocumentsSettings />
      <DangerZoneSettings />
    </div>
  );
}
