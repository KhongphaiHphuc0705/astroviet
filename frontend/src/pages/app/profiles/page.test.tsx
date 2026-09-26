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
    expect(
      screen.getByRole("link", { name: "Tạo hồ sơ mới" }),
    ).toBeInTheDocument();
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

  it("handles deletion flow correctly", async () => {
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

    // Modal appears
    expect(
      await screen.findByText(
        "Bạn có chắc chắn muốn xóa hồ sơ vĩnh viễn không? Hành động này không thể hoàn tác.",
      ),
    ).toBeInTheDocument();

    // Click Confirm Delete inside Modal
    const confirmBtns = screen.getAllByRole("button", { name: "Xóa" });
    // There are 2 "Xóa" buttons: one on the card, one in the modal. The one in the modal is the last one or we can query by some specific attribute.
    // Actually, the card "Xóa" button has aria-label "Xóa hồ sơ To Be Deleted", so the modal one only has name "Xóa".
    const confirmBtn = confirmBtns.find(
      (btn) => btn.getAttribute("aria-label") === null,
    ) as HTMLElement;
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText("To Be Deleted")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Bạn chưa có hồ sơ sinh nào")).toBeInTheDocument();
  });
});
