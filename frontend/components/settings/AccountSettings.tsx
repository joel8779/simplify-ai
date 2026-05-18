"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { userService } from "@/lib/services/user.service";

export function AccountSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await userService.getMe();
        if (cancelled) return;
        setName(profile.full_name ?? "");
        setEmail(profile.email);
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    setError(null);
    try {
      const profile = await userService.updateMe({
        full_name: name.trim() || null,
        email: email.trim(),
      });
      setName(profile.full_name ?? "");
      setEmail(profile.email);
      setStatus("Profile saved");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsSection
      title="Account"
      description="Your profile and sign-in details."
      delay={0}
    >
      <div className="space-y-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="settings-name">Display name</Label>
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            disabled={isLoading || isSaving}
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
            disabled={isLoading || isSaving}
          />
          <p className="text-xs text-muted-foreground">
            Used for sign-in.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          {status && (
            <span className="text-sm text-emerald-400 animate-fade-in">
              {status}
            </span>
          )}
          {error && (
            <span className="text-sm text-red-400 animate-fade-in">{error}</span>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}
