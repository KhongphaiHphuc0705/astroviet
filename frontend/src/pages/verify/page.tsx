import React, { useState } from "react";

export default function VerifyPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div className="min-h-screen bg-canvas p-8 font-ui text-text-primary">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl font-bold">
            M2 Design Token Verification
          </h1>
          <button
            onClick={toggleTheme}
            className="rounded-md bg-accent-primary px-4 py-2 text-text-on-accent shadow-level-1 transition-opacity duration-fast hover:opacity-90"
          >
            Toggle Theme (Current: {theme})
          </button>
        </div>

        <section className="space-y-4">
          <h2 className="border-b border-border-subtle pb-2 text-2xl font-semibold">
            1. Colors & Typography
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-lg bg-surface p-6 shadow-level-2">
              <h3 className="font-display text-xl font-bold text-accent-primary">
                Primary Accent
              </h3>
              <p className="text-sm text-text-secondary">
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
              <div className="text-xs text-text-muted">Muted text here.</div>
            </div>

            <div className="space-y-4 rounded-lg border border-border-strong bg-surface-raised p-6 shadow-level-3">
              <h3 className="font-display text-xl font-bold text-accent-secondary">
                Secondary Accent
              </h3>
              <p className="text-base text-text-primary">
                This is on{" "}
                <code className="rounded bg-surface px-1">
                  bg-surface-raised
                </code>{" "}
                with{" "}
                <code className="rounded bg-surface px-1">
                  border-border-strong
                </code>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-border-subtle pb-2 text-2xl font-semibold">
            2. Feedback Colors
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="text-white rounded-md bg-success px-4 py-2 font-medium">
              Success
            </div>
            <div className="text-white rounded-md bg-warning px-4 py-2 font-medium">
              Warning
            </div>
            <div className="text-white rounded-md bg-danger px-4 py-2 font-medium">
              Danger
            </div>
            <div className="text-white rounded-md bg-info px-4 py-2 font-medium">
              Info
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-border-subtle pb-2 text-2xl font-semibold">
            3. Element Colors (Data)
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="text-white rounded-full bg-element-fire px-4 py-2 font-medium">
              Fire
            </div>
            <div className="text-white rounded-full bg-element-earth px-4 py-2 font-medium">
              Earth
            </div>
            <div className="text-white rounded-full bg-element-air px-4 py-2 font-medium">
              Air
            </div>
            <div className="text-white rounded-full bg-element-water px-4 py-2 font-medium">
              Water
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-border-subtle pb-2 text-2xl font-semibold">
            4. Typography & Spacing
          </h2>
          <div className="space-y-6">
            <div>
              <div className="font-display text-[var(--space-10)]">
                Newsreader Display (40px spacing equivalent)
              </div>
              <div className="font-ui text-text-secondary">Inter UI Font</div>
              <div className="mt-2 font-data tracking-widest text-accent-primary">
                IBM Plex Mono: 15&deg;23&apos;47&quot;
              </div>
            </div>

            <div className="flex items-end gap-4">
              <div className="h-4 w-4 rounded-none bg-border-subtle"></div>
              <div className="h-8 w-8 rounded-sm bg-border-subtle"></div>
              <div className="h-12 w-12 rounded-md bg-border-subtle"></div>
              <div className="h-16 w-16 rounded-lg bg-border-subtle"></div>
              <div className="h-20 w-20 rounded-full bg-border-subtle"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
