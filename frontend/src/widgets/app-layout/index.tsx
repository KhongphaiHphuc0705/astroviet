import { Menu, X, LayoutDashboard, Settings } from "lucide-react";
import React from "react";

import { useUiStore } from "@shared/stores/uiStore";
import { Container } from "@shared/ui/Container";
import { SkipLink } from "@shared/ui/SkipLink";
import { Stack } from "@shared/ui/Stack";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileDrawerOpen = useUiStore((state) => state.mobileDrawerOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
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
        <Stack direction="horizontal" align="center" gap="4">
          {/* Mobile Hamburger */}
          <button
            className="-ml-2 p-2 text-primary lg:hidden"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            aria-label="Menu"
            aria-expanded={mobileDrawerOpen}
          >
            <Menu size={24} />
          </button>

          <div className="font-display text-heading-md font-bold text-accent-primary">
            AstroViet
          </div>
        </Stack>

        {/* User profile placeholder */}
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full border border-subtle bg-surface-raised" />
        </div>
      </Stack>

      {/* Main Area with Sidebar */}
      <Stack direction="horizontal" className="flex-1 items-stretch">
        {/* Desktop Sidebar */}
        <aside
          className={`sticky top-[64px] hidden h-[calc(100vh-64px)] flex-col overflow-y-auto border-r border-subtle bg-surface transition-all lg:flex ${
            sidebarCollapsed ? "w-[64px]" : "w-[240px]"
          }`}
        >
          <nav
            aria-label="Điều hướng chính"
            className="flex flex-1 flex-col gap-2 px-2 py-4"
          >
            <a
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-raised"
            >
              <LayoutDashboard size={20} className="shrink-0" />
              {!sidebarCollapsed && <span>Bảng điều khiển</span>}
            </a>
            <a
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-raised"
            >
              <Settings size={20} className="shrink-0" />
              {!sidebarCollapsed && <span>Cài đặt</span>}
            </a>
          </nav>

          <div className="flex justify-center border-t border-subtle p-4 lg:justify-start">
            <button
              onClick={toggleSidebar}
              className="flex w-full items-center justify-center text-left text-body-sm text-muted"
              aria-label={
                sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"
              }
            >
              {sidebarCollapsed ? "»" : "« Thu gọn"}
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        <div
          className={`fixed inset-0 z-drawer lg:hidden ${mobileDrawerOpen ? "flex" : "hidden"}`}
        >
          {/* Overlay */}
          <div
            className="bg-overlay/50 absolute inset-0"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
            data-testid="drawer-overlay"
          />

          {/* Drawer Content */}
          <div className="relative flex h-full w-[280px] flex-col bg-surface">
            <Stack
              direction="horizontal"
              justify="between"
              align="center"
              className="h-[64px] border-b border-subtle p-4"
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
            <nav
              aria-label="Điều hướng chính (Mobile)"
              className="flex flex-1 flex-col gap-2 p-4"
            >
              <a
                href="/"
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-raised"
              >
                <LayoutDashboard size={20} />
                <span>Bảng điều khiển</span>
              </a>
              <a
                href="/"
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-raised"
              >
                <Settings size={20} />
                <span>Cài đặt</span>
              </a>
            </nav>
          </div>
        </div>

        {/* Page Content */}
        <Container
          as="main"
          id="main-content"
          className="max-w-full flex-1 px-4 py-8 md:px-8"
        >
          {children}
        </Container>
      </Stack>
    </Stack>
  );
}
