import {
  Moon,
  Sun,
  Monitor,
  LayoutTemplate,
  LayoutPanelLeft,
  UserCircle,
} from "lucide-react";
import { useState } from "react";

import { usePreferenceStore } from "@shared/stores/preferenceStore";
import { Alert } from "@shared/ui/Alert";
import { Avatar } from "@shared/ui/Avatar";
import { Badge } from "@shared/ui/Badge";
import { Button } from "@shared/ui/Button";
import { Card } from "@shared/ui/Card";
import { Checkbox } from "@shared/ui/Checkbox";
import { Container } from "@shared/ui/Container";
import { Divider } from "@shared/ui/Divider";
import { Grid } from "@shared/ui/Grid";
import { Input } from "@shared/ui/Input";
import { Label } from "@shared/ui/Label";
import { Modal } from "@shared/ui/Modal";
import { RadioGroup } from "@shared/ui/Radio";
import { Section } from "@shared/ui/Section";
import { Select } from "@shared/ui/Select";
import { Skeleton } from "@shared/ui/Skeleton";
import { Spinner } from "@shared/ui/Spinner";
import { Stack } from "@shared/ui/Stack";
import { Switch } from "@shared/ui/Switch";
import { Textarea } from "@shared/ui/Textarea";
import { AppLayout } from "@widgets/app-layout";
import { AuthLayout } from "@widgets/auth-layout";
import { MarketingLayout } from "@widgets/marketing-layout";

export default function VerifyPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
                preference === "light"
                  ? "bg-accent-primary text-on-accent"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <Sun size={16} /> Light
            </button>
            <button
              onClick={() => setPreference("dark")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
                preference === "dark"
                  ? "bg-accent-primary text-on-accent"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <Moon size={16} /> Dark
            </button>
            <button
              onClick={() => setPreference("system")}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors ${
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
              <div className="select-country-demo">
                <Select
                  label="Country Selection (Select)"
                  placeholder="Choose a country"
                  options={[
                    { label: "Vietnam", value: "vn" },
                    { label: "United States", value: "us" },
                    { label: "Japan", value: "jp" },
                    { label: "Unavailable Region", value: "x", disabled: true },
                  ]}
                />
              </div>
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

              <div className="mt-2 border-t border-subtle pt-4">
                <RadioGroup
                  label="Notification Frequency"
                  orientation="horizontal"
                  options={[
                    { label: "Daily", value: "daily" },
                    { label: "Weekly", value: "weekly" },
                  ]}
                />
              </div>
              <div className="mt-2 border-t border-subtle pt-4">
                <RadioGroup
                  label="Subscription Plan (Card Variant)"
                  variant="card"
                  defaultValue="pro"
                  options={[
                    {
                      label: "Free",
                      value: "free",
                      description: "Basic features",
                    },
                    { label: "Pro", value: "pro", description: "$10/mo" },
                  ]}
                />
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

        <section className="space-y-4">
          <h2 className="border-b border-subtle pb-2 text-heading-lg font-semibold">
            7. Display, Feedback & Overlay (M6)
          </h2>
          <div className="space-y-8 rounded-lg bg-surface p-6 shadow-level-2">
            <div>
              <h3 className="mb-4 text-heading-md font-bold text-primary">
                Divider
              </h3>
              <Stack gap="6">
                <div>
                  <p className="mb-2 text-body-sm text-secondary">
                    Horizontal Solid:
                  </p>
                  <Divider />
                </div>
                <div>
                  <p className="mb-2 text-body-sm text-secondary">
                    Horizontal Dashed with Label:
                  </p>
                  <Divider variant="dashed" label="OR" />
                </div>
                <div>
                  <p className="mb-2 text-body-sm text-secondary">
                    Signature Ring Variant:
                  </p>
                  <Divider variant="ring" />
                </div>
                <div className="flex h-32 gap-6">
                  <div className="rounded flex-1 bg-surface-raised p-4">
                    Left
                  </div>
                  <Divider orientation="vertical" />
                  <div className="rounded flex-1 bg-surface-raised p-4">
                    Right
                  </div>
                </div>
              </Stack>
            </div>

            <div className="border-t border-subtle pt-6">
              <h3 className="mb-4 text-heading-md font-bold text-primary">
                Badge
              </h3>
              <Stack gap="6">
                <div>
                  <p className="mb-2 text-body-sm text-secondary">
                    Variants (md):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="neutral">Neutral</Badge>
                    <Badge variant="accent">Accent</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-body-sm text-secondary">
                    With Dot / Size (sm):
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success" dot>
                      Active
                    </Badge>
                    <Badge variant="danger" dot size="sm">
                      Failed (sm)
                    </Badge>
                    <Badge variant="neutral" dot>
                      Neutral
                    </Badge>
                    <Badge variant="outline" dot size="sm">
                      Draft (sm)
                    </Badge>
                  </div>
                </div>
              </Stack>
            </div>

            <div className="border-t border-subtle pt-6">
              <h3 className="mb-4 text-heading-md font-bold text-primary">
                Spinner
              </h3>
              <Stack gap="6">
                <div>
                  <p className="mb-2 text-body-sm text-secondary">Sizes:</p>
                  <div className="flex items-center gap-8">
                    <Spinner size="xs" />
                    <Spinner size="sm" />
                    <Spinner size="md" />
                    <Spinner size="lg" />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-body-sm text-secondary">
                    Inherits color (text-accent-primary):
                  </p>
                  <div className="flex items-center gap-8 text-accent-primary">
                    <Spinner size="md" />
                  </div>
                </div>
              </Stack>
            </div>

            <div className="border-t border-subtle pt-6">
              <h3 className="mb-4 text-heading-md font-bold text-primary">
                Skeleton
              </h3>
              <Stack gap="6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Skeleton className="rounded-xl h-32 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </Stack>
            </div>

            <div className="border-t border-subtle pt-6">
              <h3 className="mb-4 text-heading-md font-bold text-primary">
                Avatar
              </h3>
              <Stack gap="6">
                <div>
                  <p className="mb-2 text-body-sm text-secondary">
                    Sizes & Initials:
                  </p>
                  <div className="flex items-center gap-6">
                    <Avatar name="Extra Small Avatar" size="xs" />
                    <Avatar name="Small Avatar" size="sm" />
                    <Avatar name="Medium Avatar" size="md" />
                    <Avatar name="Large Avatar" size="lg" />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-body-sm text-secondary">
                    Image & Loading:
                  </p>
                  <div className="flex items-center gap-6">
                    <Avatar
                      name="Huu Phuc"
                      src="https://i.pravatar.cc/150?u=a042581f4e29026024d"
                    />
                    <Avatar name="Loading State" isLoading />
                    <Avatar
                      name="Broken Link"
                      src="https://broken-link.com/img.jpg"
                    />
                  </div>
                </div>
              </Stack>
            </div>

            <div className="border-t border-subtle pt-6">
              <h3 className="mb-4 text-heading-md font-bold text-primary">
                Card
              </h3>
              <Stack gap="6">
                <div className="flex w-[350px] flex-col gap-6">
                  <Card
                    padding="md"
                    variant="default"
                    className="flex flex-col gap-6"
                  >
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-display text-heading-md font-semibold leading-none tracking-tight">
                        Create project
                      </h3>
                      <p className="text-body-sm text-secondary">
                        Deploy your new project in one-click.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Name of your project" />
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Button variant="secondary">Cancel</Button>
                      <Button>Deploy</Button>
                    </div>
                  </Card>

                  <Card
                    padding="md"
                    variant="raised"
                    interactive
                    className="flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-display text-heading-md font-semibold">
                        Interactive Card
                      </h3>
                      <p className="text-body-sm text-secondary">
                        Click me to see hover effects.
                      </p>
                    </div>
                  </Card>
                </div>
              </Stack>
            </div>

            {/* Alert Section */}
            <div className="flex flex-col gap-6 border-t border-subtle pt-10">
              <h3 className="font-display text-heading-lg font-semibold text-primary">
                Alert
              </h3>
              <Stack gap="6">
                <div className="flex max-w-[600px] flex-col gap-4">
                  <Alert
                    variant="info"
                    title="Information"
                    description="This is an informational alert with role='status'."
                  />
                  <Alert
                    variant="success"
                    title="Success"
                    description="Your changes have been saved successfully!"
                    onDismiss={() => {}}
                  />
                  <Alert
                    variant="warning"
                    title="Warning: Data might be incomplete"
                    description="Birth time is missing, Ascendant might be inaccurate. (role='alert')"
                  />
                  <Alert
                    variant="danger"
                    title="Authentication Error"
                    description="Incorrect email or password. Please try again."
                    actions={
                      <Button variant="secondary" size="sm">
                        Try Again
                      </Button>
                    }
                  />
                </div>
              </Stack>
            </div>
            {/* Modal Section */}
            <div className="flex flex-col gap-6 border-t border-subtle pt-10">
              <h3 className="font-display text-heading-lg font-semibold text-primary">
                Modal
              </h3>
              <Stack gap="6">
                <div>
                  <Button onClick={() => setIsModalOpen(true)}>
                    Open Modal
                  </Button>
                </div>
              </Stack>
            </div>
          </div>
        </section>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Deletion"
        description="Are you sure you want to delete this chart? This action cannot be undone."
        variant="danger"
        size="sm"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setIsModalOpen(false)}>
              Delete Chart
            </Button>
          </>
        }
      >
        <p className="text-body-md text-primary">
          This is a demonstration of the <strong>Modal</strong> component with{" "}
          <code>role=&quot;dialog&quot;</code>, a complete focus trap, and
          responsive fullscreen behavior on mobile devices (except for{" "}
          <code>size=&quot;sm&quot;</code>).
        </p>
      </Modal>
    </div>
  );
}
