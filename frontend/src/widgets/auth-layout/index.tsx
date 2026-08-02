import React from "react";

import { Container } from "@shared/ui/Container";
import { Stack } from "@shared/ui/Stack";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      className="min-h-screen bg-canvas text-primary"
      align="center"
      justify="center"
    >
      <Container size="narrow" className="py-12">
        <Stack align="center" gap="8">
          {/* Logo */}
          <div className="font-display text-display-lg font-bold text-accent-primary">
            AstroViet
          </div>

          {/* Form Content */}
          <div className="w-full max-w-md rounded-lg border border-subtle bg-surface p-8 shadow-level-2">
            {children}
          </div>
        </Stack>
      </Container>
    </Stack>
  );
}
