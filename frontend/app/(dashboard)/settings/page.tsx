import { DashboardPageShell } from "@/components/layout/DashboardPageShell";
import { SettingsContent } from "@/components/settings/SettingsContent";

export default function SettingsPage() {
  return (
    <DashboardPageShell
      title="Settings"
      description="Manage your profile, password, theme, and chat history."
    >
      <SettingsContent />
    </DashboardPageShell>
  );
}
