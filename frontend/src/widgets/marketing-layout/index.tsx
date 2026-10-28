import { Menu, X } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

import { useAuthStore } from "@shared/stores/authStore";
import { useUiStore } from "@shared/stores/uiStore";
import { Button } from "@shared/ui/Button";
import { Container } from "@shared/ui/Container";
import { SkipLink } from "@shared/ui/SkipLink";
import { Stack } from "@shared/ui/Stack";
// Design System Spec: widgets được phép import shared, không import features.

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((state) => state.status);
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
        <Link
          to="/"
          className="font-display text-heading-md font-bold text-primary transition-colors hover:text-accent-secondary"
        >
          AstroViet
        </Link>

        {/* Desktop Nav */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-6 lg:flex"
        >
          <Link
            to="/"
            className="text-body-md transition-colors hover:text-accent-secondary"
          >
            Trang chủ
          </Link>
          <Link
            to="/"
            className="text-body-md transition-colors hover:text-accent-secondary"
          >
            Giới thiệu
          </Link>

          <div className="ml-2 flex items-center gap-3">
            {status === "authenticated" ? (
              <Button as={Link} to="/app" variant="primary" size="sm">
                Vào ứng dụng
              </Button>
            ) : (
              <>
                <Button as={Link} to="/login" variant="ghost" size="sm">
                  Đăng nhập
                </Button>
                <Button as={Link} to="/register" variant="primary" size="sm">
                  Đăng ký
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Nav Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          {status === "authenticated" ? (
            <Button as={Link} to="/app" variant="primary" size="sm">
              Vào app
            </Button>
          ) : (
            <Button as={Link} to="/login" variant="ghost" size="sm">
              Đăng nhập
            </Button>
          )}

          <button
            className="p-2 text-primary"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            aria-label="Menu"
            aria-expanded={mobileDrawerOpen}
          >
            <Menu size={24} />
          </button>
        </div>
      </Stack>

      {/* Mobile Drawer (Placeholder) */}
      {/* TODO(Core): Thay thế bằng component Drawer thật có focus trap (Backlog M4) */}
      <div
        className={`fixed inset-0 z-drawer flex-col bg-surface p-4 lg:hidden ${mobileDrawerOpen ? "flex" : "hidden"}`}
      >
        <Stack
          direction="horizontal"
          justify="between"
          align="center"
          className="mb-8 h-[32px]"
        >
          <Link
            to="/"
            onClick={() => setMobileDrawerOpen(false)}
            className="font-display text-heading-md font-bold"
          >
            AstroViet
          </Link>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Đóng menu"
            className="-mr-2 p-2"
          >
            <X size={24} />
          </button>
        </Stack>
        <nav
          aria-label="Điều hướng chính (Mobile)"
          className="flex flex-col gap-4"
        >
          <Link
            to="/"
            className="text-body-md"
            onClick={() => setMobileDrawerOpen(false)}
          >
            Trang chủ
          </Link>
          <Link
            to="/"
            className="text-body-md"
            onClick={() => setMobileDrawerOpen(false)}
          >
            Giới thiệu
          </Link>

          <div className="my-2 border-t border-subtle pt-4">
            {status === "authenticated" ? (
              <Button
                as={Link}
                to="/app"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setMobileDrawerOpen(false)}
              >
                Vào ứng dụng
              </Button>
            ) : (
              <Stack gap="3">
                <Button
                  as={Link}
                  to="/login"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  Đăng nhập
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  Đăng ký
                </Button>
              </Stack>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <Container
        as="main"
        id="main-content"
        tabIndex={-1}
        className="flex-1 py-8 focus:outline-none"
      >
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
