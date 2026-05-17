"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "@/components/settings/SettingsSection";

export function AccountSettings() {
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@company.com");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SettingsSection
      title="Account"
      description="Your profile and sign-in details."
      delay={0}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="settings-name">Display name</Label>
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input
            id="settings-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          <p className="text-xs text-muted-foreground">
            Used for sign-in and notification delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button onClick={handleSave}>Save changes</Button>
          {saved && (
            <span className="text-sm text-emerald-400 animate-fade-in">
              Changes saved
            </span>
          )}
        </div>

        <div className="border-t border-border/40 pt-4">
          <p className="text-sm font-medium">Password</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last changed 3 months ago.
          </p>
          <Button variant="outline" size="sm" className="mt-3">
            Change password
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
