import { DashboardPageShell } from "@/components/layout/DashboardPageShell";
import { SettingsContent } from "@/components/settings/SettingsContent";

export default function SettingsPage() {
  return (
    <DashboardPageShell
      title="Settings"
      description="Manage your account, preferences, and connected documents."
    >
      <SettingsContent />
    </DashboardPageShell>
  );
}
