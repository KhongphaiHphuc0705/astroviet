import { Menu, X } from "lucide-react";
import React from "react";

import { useUiStore } from "@shared/stores/uiStore";
import { Container } from "@shared/ui/Container";
import { SkipLink } from "@shared/ui/SkipLink";
import { Stack } from "@shared/ui/Stack";
// Design System Spec: widgets được phép import shared, không import features.

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const mobileDrawerOpen = useUiStore((state) => state.mobileDrawerOpen);
  const setMobileDrawerOpen = useUiStore((state) => state.setMobileDrawerOpen);

  return (
    <Stack className="min-h-screen bg-canvas text-primary">
      <SkipLink />

      {/* Navbar */}
      <Stack
        as="header"
        direction="horizontal"
        align="center"
        justify="between"
        className="sticky top-0 z-sticky h-[64px] border-b border-subtle bg-surface px-4 md:px-8"
      >
        <div className="font-display text-heading-md font-bold">AstroViet</div>

        {/* Desktop Nav */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-6 lg:flex"
        >
          <a href="/" className="text-body-md hover:text-accent-secondary">
            Trang chủ
          </a>
          <a href="/" className="text-body-md hover:text-accent-secondary">
            Giới thiệu
          </a>
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="p-2 text-primary lg:hidden"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          aria-label="Menu"
          aria-expanded={mobileDrawerOpen}
        >
          <Menu size={24} />
        </button>
      </Stack>

      {/* Mobile Drawer (Placeholder) */}
      <div
        className={`fixed inset-0 z-drawer flex-col bg-surface p-4 lg:hidden ${mobileDrawerOpen ? "flex" : "hidden"}`}
      >
        <Stack
          direction="horizontal"
          justify="between"
          align="center"
          className="mb-8 h-[32px]"
        >
          <div className="font-display text-heading-md font-bold">
            AstroViet
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Đóng menu"
            className="-mr-2 p-2"
          >
            <X size={24} />
          </button>
        </Stack>
        {/* TODO(M6): thay bằng Drawer component thật, thêm focus trap */}
        <nav
          aria-label="Điều hướng chính (Mobile)"
          className="flex flex-col gap-4"
        >
          <a href="/" className="text-body-md">
            Trang chủ
          </a>
          <a href="/" className="text-body-md">
            Giới thiệu
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <Container as="main" id="main-content" className="flex-1 py-8">
        {children}
      </Container>

      {/* Footer */}
      <Stack
        as="footer"
        className="mt-auto border-t border-subtle py-8"
        align="center"
      >
        <p className="text-body-sm text-muted">
          © 2026 AstroViet. All rights reserved.
        </p>
      </Stack>
    </Stack>
  );
}
