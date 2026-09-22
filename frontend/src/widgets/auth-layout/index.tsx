import React from "react";

import { Container } from "@shared/ui/Container";
import { Stack } from "@shared/ui/Stack";

import bgImage from "../../assets/background/pngtree-15731971.jpg";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      className="relative min-h-screen overflow-hidden bg-canvas text-primary"
      align="center"
      justify="center"
    >
      {/* Background Image */}
      <div
        className="z-0 absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        {/* Optional overlay to darken/lighten the background slightly for better contrast */}
        <div className="bg-black/50 dark:bg-black/75 absolute inset-0" />
      </div>

      <Container size="narrow" className="z-10 relative py-12">
        <Stack align="center" gap="8">
          {/* Logo */}
          <h1 className="text-white font-display text-display-lg font-bold drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
            AstroViet
          </h1>

          {/* Form Content */}
          <div className="rounded-xl border-white/10 bg-white/50 dark:border-white/10 dark:bg-black/60 w-full max-w-md border p-8 shadow-level-4 backdrop-blur-xl">
            {children}
          </div>
        </Stack>
      </Container>
    </Stack>
  );
}
