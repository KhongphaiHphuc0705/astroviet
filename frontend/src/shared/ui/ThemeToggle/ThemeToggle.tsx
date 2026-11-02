import { Moon, Sun } from "lucide-react";

import { cn } from "@shared/lib/cn";
import { usePreferenceStore } from "@shared/stores/preferenceStore";

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const resolvedTheme = usePreferenceStore((state) => state.resolvedTheme);
  const preference = usePreferenceStore((state) => state.preference);
  const setPreference = usePreferenceStore((state) => state.setPreference);

  const currentTheme = preference === "system" ? resolvedTheme : preference;
  const isDark = currentTheme === "dark";

  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    setPreference(nextTheme);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Giao diện tối"
      title={
        isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
      onClick={handleToggle}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center justify-between rounded-full border border-subtle bg-surface-raised px-1.5 transition-colors hover:border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        className,
      )}
    >
      <Sun
        size={14}
        aria-hidden="true"
        className={cn(
          "text-muted transition-opacity",
          isDark ? "opacity-40" : "opacity-0",
        )}
      />
      <Moon
        size={14}
        aria-hidden="true"
        className={cn(
          "text-muted transition-opacity",
          isDark ? "opacity-0" : "opacity-40",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow-level-1 transition-transform",
          isDark
            ? "translate-x-6 text-accent-primary"
            : "translate-x-0 text-accent-primary",
        )}
      >
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </span>
    </button>
  );
}
