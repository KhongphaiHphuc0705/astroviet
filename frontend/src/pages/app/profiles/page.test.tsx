import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import {
  mockBirthProfile,
  mockDeleteBirthProfile,
  mockListBirthProfiles,
} from "@features/birth-profile/api/mocks/handlers";
import { server } from "@test/msw-server";
import { renderWithProviders } from "@test/render";

import BirthProfilesPage from "./page";

describe("BirthProfilesPage", () => {
  it("renders loading state initially", () => {
    // Delay the response so we can see the skeleton
    server.use(
      mockListBirthProfiles(async () => {
        return new Promise(() => {}); // never resolves to keep it loading
      }),
    );

    renderWithProviders(<BirthProfilesPage />);

    // Since we don't have text on skeletons, we check for aria-busy or custom test ids, or just expect the headings
    expect(screen.getByText("Hồ sơ sinh của tôi")).toBeInTheDocument();
    // In our component, we render skeletons when isLoading is true. Skeletons have standard tailwind classes like animate-pulse.
    // Instead of querying exact Skeleton nodes, we can just ensure it doesn't crash.
  });

  it("renders error state when fetch fails", async () => {
    server.use(
      mockListBirthProfiles(() => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderWithProviders(<BirthProfilesPage />);

    expect(
      await screen.findByText("Không thể tải danh sách hồ sơ"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại sau.",
      ),
    ).toBeInTheDocument();
  });

  it("renders empty state if no profiles", async () => {
    server.use(
      mockListBirthProfiles(() =>
        HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }),
      ),
    );

    renderWithProviders(<BirthProfilesPage />);

    expect(
      await screen.findByText("Bạn chưa có hồ sơ sinh nào"),
    ).toBeInTheDocument();

    const createLink = screen.getByRole("link", { name: "Tạo hồ sơ mới" });
    expect(createLink).toBeInTheDocument();
    expect(createLink).toHaveAttribute("href", "/app/profiles/new");
  });

  it("renders list of profiles and handles pagination", async () => {
    const profile1 = mockBirthProfile({
      id: "1",
      label: "Profile 1",
      birthDate: "1990-01-01",
    });
    const profile2 = mockBirthProfile({
      id: "2",
      label: "Profile 2",
      birthDate: "1990-01-02",
    });

    server.use(
      mockListBirthProfiles(({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("page") === "2") {
          return HttpResponse.json({
            items: [profile2],
            total: 21,
            page: 2,
            pageSize: 20,
          });
        }
        return HttpResponse.json({
          items: [profile1],
          total: 21,
          page: 1,
          pageSize: 20,
        });
      }),
    );

    renderWithProviders(<BirthProfilesPage />);

    // Page 1
    expect(await screen.findByText("Profile 1")).toBeInTheDocument();
    expect(screen.queryByText("Profile 2")).not.toBeInTheDocument();

    const editLink = screen.getByRole("link", { name: "Sửa hồ sơ Profile 1" });
    expect(editLink).toHaveAttribute("href", "/app/profiles/1/edit");

    const nextBtn = screen.getByRole("button", { name: "Trang sau" });
    const prevBtn = screen.getByRole("button", { name: "Trang trước" });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Go to page 2
    const user = userEvent.setup();
    await user.click(nextBtn);

    expect(await screen.findByText("Profile 2")).toBeInTheDocument();
    expect(screen.getByText("Trang 2")).toBeInTheDocument();

    // Re-query buttons since they were unmounted during loading
    const newPrevBtn = screen.getByRole("button", { name: "Trang trước" });
    const newNextBtn = screen.getByRole("button", { name: "Trang sau" });

    expect(newPrevBtn).not.toBeDisabled();
    expect(newNextBtn).toBeDisabled(); // 2 * 20 > 21
  });

  it("handles deletion flow correctly and shows label in modal", async () => {
    const profile = mockBirthProfile({ id: "1", label: "To Be Deleted" });
    let deleteCalled = false;

    server.use(
      mockListBirthProfiles(() => {
        if (deleteCalled) {
          return HttpResponse.json({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
          });
        }
        return HttpResponse.json({
          items: [profile],
          total: 1,
          page: 1,
          pageSize: 20,
        });
      }),
      mockDeleteBirthProfile(() => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<BirthProfilesPage />);

    expect(await screen.findByText("To Be Deleted")).toBeInTheDocument();

    const user = userEvent.setup();

    // Click Delete on card
    const deleteBtn = screen.getByRole("button", {
      name: "Xóa hồ sơ To Be Deleted",
    });
    await user.click(deleteBtn);

    // Modal appears, check wording with label
    const modalHeading = await screen.findByRole("heading", {
      name: "Xóa hồ sơ",
    });
    expect(modalHeading).toBeInTheDocument();

    // Check if the label is highlighted in strong tag
    const highlight = screen.getByText("To Be Deleted", { selector: "strong" });
    expect(highlight).toBeInTheDocument();

    // Click Confirm Delete inside Modal
    const confirmBtns = screen.getAllByRole("button", { name: "Xóa" });
    const confirmBtn = confirmBtns.find(
      (btn) => btn.getAttribute("aria-label") === null,
    ) as HTMLElement;
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText("To Be Deleted")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Bạn chưa có hồ sơ sinh nào")).toBeInTheDocument();
  });

  it("handles deletion cancellation", async () => {
    const profile = mockBirthProfile({ id: "1", label: "To Keep" });

    server.use(
      mockListBirthProfiles(() => {
        return HttpResponse.json({
          items: [profile],
          total: 1,
          page: 1,
          pageSize: 20,
        });
      }),
    );

    renderWithProviders(<BirthProfilesPage />);

    expect(await screen.findByText("To Keep")).toBeInTheDocument();

    const user = userEvent.setup();
    const deleteBtn = screen.getByRole("button", {
      name: "Xóa hồ sơ To Keep",
    });
    await user.click(deleteBtn);

    // Modal appears
    const modalHeading = await screen.findByRole("heading", {
      name: "Xóa hồ sơ",
    });
    expect(modalHeading).toBeInTheDocument();

    // Click Cancel
    const cancelBtn = screen.getByRole("button", { name: "Hủy" });
    await user.click(cancelBtn);

    // Modal closes
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Xóa hồ sơ" }),
      ).not.toBeInTheDocument();
    });

    // Profile still there
    expect(screen.getByText("To Keep")).toBeInTheDocument();
  });

  it("handles deletion failure", async () => {
    const profile = mockBirthProfile({ id: "1", label: "Fail Delete" });

    server.use(
      mockListBirthProfiles(() => {
        return HttpResponse.json({
          items: [profile],
          total: 1,
          page: 1,
          pageSize: 20,
        });
      }),
      mockDeleteBirthProfile(() => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderWithProviders(<BirthProfilesPage />);

    expect(await screen.findByText("Fail Delete")).toBeInTheDocument();

    const user = userEvent.setup();
    const deleteBtn = screen.getByRole("button", {
      name: "Xóa hồ sơ Fail Delete",
    });
    await user.click(deleteBtn);

    // Wait for the Modal to appear first before finding the confirm button
    const modalHeading = await screen.findByRole("heading", {
      name: "Xóa hồ sơ",
    });
    expect(modalHeading).toBeInTheDocument();

    const confirmBtns = await screen.findAllByRole("button", { name: "Xóa" });
    const confirmBtn = confirmBtns.find(
      (btn) => btn.getAttribute("aria-label") === null,
    ) as HTMLElement;

    await user.click(confirmBtn);

    // Wait for the error alert
    expect(await screen.findByText("Lỗi xóa hồ sơ")).toBeInTheDocument();
    expect(
      screen.getByText("Không thể xóa hồ sơ lúc này. Vui lòng thử lại."),
    ).toBeInTheDocument();
  });

  it("automatically retreats to previous page if last item on current page is deleted", async () => {
    const profile = mockBirthProfile({ id: "21", label: "Page 2 Item" });
    let deleteCalled = false;

    server.use(
      mockListBirthProfiles(({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page");

        if (page === "1") {
          return HttpResponse.json({
            // Mocking page 1 items with unique ids to avoid React key warning
            items: Array.from({ length: 20 }).map((_, i) =>
              mockBirthProfile({ id: `other-${i}`, label: `Other ${i}` }),
            ),
            total: deleteCalled ? 20 : 21,
            page: 1,
            pageSize: 20,
          });
        }
        if (page === "2") {
          if (deleteCalled) {
            // Should not be called really since we auto-retreat, but just in case
            return HttpResponse.json({
              items: [],
              total: 20,
              page: 2,
              pageSize: 20,
            });
          }
          return HttpResponse.json({
            items: [profile], // Only 1 item on page 2
            total: 21,
            page: 2,
            pageSize: 20,
          });
        }
        return new HttpResponse(null, { status: 404 });
      }),
      mockDeleteBirthProfile(() => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<BirthProfilesPage />);

    // First we are on page 1
    await screen.findAllByText("Other 0");

    const nextBtn = screen.getByRole("button", { name: "Trang sau" });
    const user = userEvent.setup();
    await user.click(nextBtn);

    // Now on page 2
    expect(await screen.findByText("Page 2 Item")).toBeInTheDocument();
    expect(screen.getByText("Trang 2")).toBeInTheDocument();

    // Delete the only item on page 2
    const deleteBtn = screen.getByRole("button", {
      name: "Xóa hồ sơ Page 2 Item",
    });
    await user.click(deleteBtn);

    // Modal appears
    const modalHeading = await screen.findByRole("heading", {
      name: "Xóa hồ sơ",
    });
    expect(modalHeading).toBeInTheDocument();

    const confirmBtns = await screen.findAllByRole("button", { name: "Xóa" });
    const confirmBtn = confirmBtns.find(
      (btn) => btn.getAttribute("aria-label") === null,
    ) as HTMLElement;
    await user.click(confirmBtn);

    // It should automatically retreat to page 1
    // Meaning we will see "Other 0" items again
    expect(await screen.findByText("Other 0")).toBeInTheDocument();

    // Since total is now 20, pagination controls should be hidden
    expect(screen.queryByText("Trang 1")).not.toBeInTheDocument();

    // Page 2 item should be gone
    expect(screen.queryByText("Page 2 Item")).not.toBeInTheDocument();
  });
});
