"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils/cn";
import { SettingsSection } from "@/components/settings/SettingsSection";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted ? (theme ?? "dark") : "dark";

  return (
    <SettingsSection
      title="Appearance"
      description="Customize how Simplify looks on your device."
      delay={0.05}
    >
      <div className="space-y-4">
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((option) => {
              const isActive = active === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={!mounted}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm transition-all duration-200",
                    isActive
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border/50 bg-background/40 text-muted-foreground hover:border-border hover:bg-accent/40 hover:text-foreground",
                    !mounted && "pointer-events-none opacity-60"
                  )}
                >
                  <option.icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </SettingsSection>
  );
}
