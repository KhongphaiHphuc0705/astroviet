import {
  Moon,
  Sun,
  Monitor,
  LayoutTemplate,
  LayoutPanelLeft,
  UserCircle,
} from "lucide-react";
import React, { useState } from "react";

import { usePreferenceStore } from "@shared/stores/preferenceStore";
import { Button } from "@shared/ui/Button";
import { Checkbox } from "@shared/ui/Checkbox";
import { Container } from "@shared/ui/Container";
import { Grid } from "@shared/ui/Grid";
import { Input } from "@shared/ui/Input";
import { Section } from "@shared/ui/Section";
import { Stack } from "@shared/ui/Stack";
import { Switch } from "@shared/ui/Switch";
import { Textarea } from "@shared/ui/Textarea";
import { AppLayout } from "@widgets/app-layout";
import { AuthLayout } from "@widgets/auth-layout";
import { MarketingLayout } from "@widgets/marketing-layout";

export default function VerifyPage() {
  const [view, setView] = useState<"theme" | "app" | "marketing" | "auth">(
    "theme",
  );
  const preference = usePreferenceStore((state) => state.preference);
  const resolvedTheme = usePreferenceStore((state) => state.resolvedTheme);
  const setPreference = usePreferenceStore((state) => state.setPreference);

  if (view === "app") {
    return (
      <AppLayout>
        <button
          onClick={() => setView("theme")}
          className="mb-4 text-accent-secondary hover:underline"
        >
          ← Quay lại Verify
        </button>
        <h1 className="font-display text-display-lg font-bold">
          App Layout Demo
        </h1>
        <p className="mt-4 text-body-md text-secondary">
          This demonstrates the AppLayout with sidebar and navbar.
        </p>
        <Grid columns={{ xs: "1", md: "3" }} gap="6" className="mt-8">
          <div className="h-32 rounded-md border border-subtle bg-surface-raised" />
          <div className="h-32 rounded-md border border-subtle bg-surface-raised" />
          <div className="h-32 rounded-md border border-subtle bg-surface-raised" />
        </Grid>
      </AppLayout>
    );
  }

  if (view === "marketing") {
    return (
      <MarketingLayout>
        <button
          onClick={() => setView("theme")}
          className="mb-4 text-accent-secondary hover:underline"
        >
          ← Quay lại Verify
        </button>
        <Section
          spacing="compact"
          className="mt-4 rounded-lg border border-subtle bg-surface-raised"
        >
          <h1 className="text-center font-display text-display-xl font-bold">
            Marketing Layout Demo
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-body-lg text-secondary">
            This demonstrates the MarketingLayout with sticky header.
          </p>
        </Section>
      </MarketingLayout>
    );
  }

  if (view === "auth") {
    return (
      <AuthLayout>
        <button
          onClick={() => setView("theme")}
          className="text-sm mb-4 block text-secondary hover:underline"
        >
          ← Quay lại Verify
        </button>
        <h2 className="mb-6 text-center font-display text-heading-lg font-bold">
          Welcome Back
        </h2>
        <Stack gap="4">
          <div className="h-10 rounded-md border border-subtle bg-canvas" />
          <div className="h-10 rounded-md border border-subtle bg-canvas" />
          <button className="mt-4 h-10 rounded-md bg-accent-primary font-medium text-on-accent">
            Log In
          </button>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <div className="min-h-screen bg-canvas p-8 font-ui text-primary">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-display-lg font-bold">
            M3/M4 Verification
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
            1. Layout Components (M4)
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setView("app")}
              className="flex items-center gap-3 rounded-md border border-subtle bg-surface p-4 shadow-level-2 transition-colors hover:border-accent-secondary"
            >
              <LayoutPanelLeft className="text-accent-primary" size={24} />
              <span className="text-heading-sm font-medium">App Layout</span>
            </button>
            <button
              onClick={() => setView("marketing")}
              className="flex items-center gap-3 rounded-md border border-subtle bg-surface p-4 shadow-level-2 transition-colors hover:border-accent-secondary"
            >
              <LayoutTemplate className="text-accent-primary" size={24} />
              <span className="text-heading-sm font-medium">
                Marketing Layout
              </span>
            </button>
            <button
              onClick={() => setView("auth")}
              className="flex items-center gap-3 rounded-md border border-subtle bg-surface p-4 shadow-level-2 transition-colors hover:border-accent-secondary"
            >
              <UserCircle className="text-accent-primary" size={24} />
              <span className="text-heading-sm font-medium">Auth Layout</span>
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-subtle pb-2 text-heading-lg font-semibold">
            2. Layout Primitives (M4)
          </h2>
          <div className="space-y-6">
            <Container
              size="narrow"
              paddingX={false}
              className="border border-dashed border-accent-secondary bg-surface p-4 text-center"
            >
              Narrow Container (768px max-width) without paddingX
            </Container>

            <div>
              <p className="mb-2 text-body-sm text-secondary">
                Responsive Stack (vertical on mobile, horizontal on md+):
              </p>
              <Stack
                direction={{ xs: "vertical", md: "horizontal" }}
                gap="4"
                align="center"
                className="rounded-md border border-subtle bg-surface-raised p-4"
              >
                <div className="w-full flex-1 border border-subtle bg-canvas p-4 text-center">
                  Stack Item 1
                </div>
                <div className="w-full flex-1 border border-subtle bg-canvas p-4 text-center">
                  Stack Item 2
                </div>
              </Stack>
            </div>

            <div>
              <p className="mb-2 text-body-sm text-secondary">
                Auto-fit Grid (min-width 200px):
              </p>
              <Grid columns="auto-fit" minItemWidth="200px" gap="4">
                <div className="flex h-24 items-center justify-center rounded-md border border-subtle bg-surface-raised">
                  1
                </div>
                <div className="flex h-24 items-center justify-center rounded-md border border-subtle bg-surface-raised">
                  2
                </div>
                <div className="flex h-24 items-center justify-center rounded-md border border-subtle bg-surface-raised">
                  3
                </div>
                <div className="flex h-24 items-center justify-center rounded-md border border-subtle bg-surface-raised">
                  4
                </div>
                <div className="flex h-24 items-center justify-center rounded-md border border-subtle bg-surface-raised">
                  5
                </div>
              </Grid>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-subtle pb-2 text-heading-lg font-semibold">
            3. Colors & Elevation (M3)
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
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-subtle pb-2 text-heading-lg font-semibold">
            4. Feedback Colors (M3)
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
            5. Typography & Spacing (M3)
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

        <section className="space-y-4">
          <h2 className="border-b border-subtle pb-2 text-heading-lg font-semibold">
            6. Form Controls (M5)
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Stack gap="4" className="rounded-lg bg-surface p-6 shadow-level-2">
              <h3 className="font-display text-heading-md font-bold text-accent-primary">
                Text Inputs
              </h3>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                type="email"
              />
              <Input
                label="Password"
                placeholder="Enter password"
                type="password"
                error="Password too short"
              />
              <Input
                label="Username (Success)"
                placeholder="username"
                success
                helperText="Available!"
              />
              <Input
                label="Disabled Input"
                placeholder="Cannot type here"
                disabled
              />
              <Input
                label="Read-only Input"
                placeholder="Cannot edit this"
                readOnly
                value="Read only text"
              />
              <Input
                label="Filled Variant"
                variant="filled"
                placeholder="Filled input..."
              />
              <Textarea
                label="Bio (AutoResize)"
                placeholder="Type a long text..."
                autoResize
                maxLength={200}
              />
            </Stack>

            <Stack gap="4" className="rounded-lg bg-surface p-6 shadow-level-2">
              <h3 className="font-display text-heading-md font-bold text-accent-secondary">
                Toggles & Buttons
              </h3>
              <div className="flex gap-4">
                <Checkbox label="Accept Terms" />
                <Checkbox label="Disabled" disabled />
              </div>
              <div className="flex gap-4">
                <Switch label="Email Notifications" />
                <Switch label="SMS (Disabled)" disabled />
              </div>
              <Stack gap="3" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="link" href="#">
                    Link as Anchor
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button isLoading>Loading</Button>
                  <Button iconOnly aria-label="Icon">
                    🌟
                  </Button>
                </div>
              </Stack>
            </Stack>
          </div>
        </section>
      </div>
    </div>
  );
}
