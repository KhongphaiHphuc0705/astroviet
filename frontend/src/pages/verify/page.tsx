import { Moon, Sun, Monitor } from "lucide-react";
import React from "react";

import { usePreferenceStore } from "@shared/stores/preferenceStore";

export default function VerifyPage() {
  const preference = usePreferenceStore((state) => state.preference);
  const resolvedTheme = usePreferenceStore((state) => state.resolvedTheme);
  const setPreference = usePreferenceStore((state) => state.setPreference);

  return (
    <div className="min-h-screen bg-canvas p-8 font-ui text-primary">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-display-lg font-bold">
            M3 Theme & Asset Verification
          </h1>
          <div className="flex items-center gap-2 rounded-md bg-surface-raised p-1 shadow-level-1">
            <button
              onClick={() => setPreference("light")}
              className={`py-1.5 flex items-center gap-2 rounded-md px-3 transition-colors ${
                preference === "light"
                  ? "bg-accent-primary text-on-accent"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <Sun size={16} /> Light
            </button>
            <button
              onClick={() => setPreference("dark")}
              className={`py-1.5 flex items-center gap-2 rounded-md px-3 transition-colors ${
                preference === "dark"
                  ? "bg-accent-primary text-on-accent"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <Moon size={16} /> Dark
            </button>
            <button
              onClick={() => setPreference("system")}
              className={`py-1.5 flex items-center gap-2 rounded-md px-3 transition-colors ${
                preference === "system"
                  ? "bg-accent-primary text-on-accent"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <Monitor size={16} /> System
            </button>
          </div>
        </div>
        <p className="text-body-sm text-muted">
          Current Preference:{" "}
          <strong className="text-primary">{preference}</strong> | Resolved
          Theme: <strong className="text-primary">{resolvedTheme}</strong>
        </p>

        <section className="space-y-4">
          <h2 className="border-b border-subtle pb-2 text-heading-lg font-semibold">
            1. Colors & Typography
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-lg bg-surface p-6 shadow-level-2">
              <h3 className="font-display text-heading-md font-bold text-accent-primary">
                Primary Accent
              </h3>
              <p className="text-body-sm text-secondary">
                This card uses{" "}
                <code className="rounded bg-surface-raised px-1">
                  bg-surface
                </code>
                ,{" "}
                <code className="rounded bg-surface-raised px-1">
                  shadow-level-2
                </code>
                , and{" "}
                <code className="rounded bg-surface-raised px-1">
                  rounded-lg
                </code>
                .
              </p>
              <div className="text-label text-muted">Muted text here.</div>
            </div>

            <div className="space-y-4 rounded-lg border border-strong bg-surface-raised p-6 shadow-level-3">
              <h3 className="font-display text-heading-md font-bold text-accent-secondary">
                Secondary Accent
              </h3>
              <p className="text-body-md text-primary">
                This is on{" "}
                <code className="rounded bg-surface px-1">
                  bg-surface-raised
                </code>{" "}
                with{" "}
                <code className="rounded bg-surface px-1">border-strong</code>.
              </p>
            </div>

            <div className="space-y-4 rounded-lg bg-surface p-6 shadow-level-4 md:col-span-2">
              <h3 className="font-display text-heading-md font-bold">
                Highest Elevation (Level 4)
              </h3>
              <p className="text-body-md text-primary">
                This card uses{" "}
                <code className="rounded bg-surface-raised px-1">
                  shadow-level-4
                </code>{" "}
                to demonstrate the highest elevation (e.g., Modals, Drawers).
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-subtle pb-2 text-heading-lg font-semibold">
            2. Feedback Colors
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-md bg-success px-4 py-2 font-medium text-on-accent">
              Success
            </div>
            <div className="rounded-md bg-warning px-4 py-2 font-medium text-on-accent">
              Warning
            </div>
            <div className="rounded-md bg-danger px-4 py-2 font-medium text-on-accent">
              Danger
            </div>
            <div className="rounded-md bg-info px-4 py-2 font-medium text-on-accent">
              Info
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-subtle pb-2 text-heading-lg font-semibold">
            3. Typography & Spacing
          </h2>
          <div className="space-y-6">
            <div>
              <div className="font-display text-display-xl">
                Newsreader Display
              </div>
              <div className="font-ui text-secondary">Inter UI Font</div>
              <div className="mt-2 font-data text-accent-primary">
                IBM Plex Mono: 15&deg;23&apos;47&quot;
              </div>
            </div>

            <div className="flex items-end gap-4">
              <div className="h-4 w-4 rounded-none bg-subtle"></div>
              <div className="h-8 w-8 rounded-sm bg-subtle"></div>
              <div className="h-12 w-12 rounded-md bg-subtle"></div>
              <div className="h-16 w-16 rounded-lg bg-subtle"></div>
              <div className="h-20 w-20 rounded-full bg-subtle"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
