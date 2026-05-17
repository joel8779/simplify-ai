"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "@/components/settings/SettingsSection";

const NOTIFICATIONS = [
  {
    id: "chat-complete",
    label: "Chat responses",
    description: "Email when a long-running answer finishes processing.",
    defaultChecked: true,
  },
  {
    id: "document-ready",
    label: "Document indexing",
    description: "Notify when uploaded files are ready to query.",
    defaultChecked: true,
  },
  {
    id: "weekly-digest",
    label: "Weekly digest",
    description: "Summary of your workspace activity and top queries.",
    defaultChecked: false,
  },
  {
    id: "product-updates",
    label: "Product updates",
    description: "Occasional emails about new features and improvements.",
    defaultChecked: true,
  },
] as const;

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      NOTIFICATIONS.map((n) => [n.id, n.defaultChecked])
    )
  );

  return (
    <SettingsSection
      title="Notifications"
      description="Choose what you want to hear about via email."
      delay={0.1}
    >
      <div className="space-y-4">
        {NOTIFICATIONS.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/30 px-4 py-3 transition-colors hover:border-border/60"
          >
            <Checkbox
              id={item.id}
              checked={prefs[item.id]}
              onCheckedChange={(checked) =>
                setPrefs((prev) => ({
                  ...prev,
                  [item.id]: checked === true,
                }))
              }
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <Label htmlFor={item.id} className="cursor-pointer font-medium">
                {item.label}
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
