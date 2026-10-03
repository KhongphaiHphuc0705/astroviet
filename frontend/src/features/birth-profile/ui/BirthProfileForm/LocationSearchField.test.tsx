import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { server } from "@test/msw-server";

import { mockSearchLocations } from "../../api/mocks/handlers";

import { LocationSearchField } from "./LocationSearchField";
import type { BirthProfileFormValues } from "./types";

function TestForm({ birthDate }: { birthDate: string }) {
  const { control } = useForm<BirthProfileFormValues>({
    defaultValues: { birthLocation: null },
  });
  return <LocationSearchField control={control} birthDate={birthDate} />;
}

describe("LocationSearchField", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const renderComponent = (birthDate: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TestForm birthDate={birthDate} />
      </QueryClientProvider>,
    );
  };

  it("is disabled when birthDate is empty or invalid", () => {
    const { rerender } = renderComponent("");
    const input = screen.getByRole("combobox");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute(
      "placeholder",
      "Vui lòng nhập ngày sinh trước",
    );

    rerender(
      <QueryClientProvider client={queryClient}>
        <TestForm birthDate="invalid-date" />
      </QueryClientProvider>,
    );
    expect(input).toBeDisabled();
  });

  it("is enabled when birthDate is valid", () => {
    renderComponent("1995-05-12");
    const input = screen.getByRole("combobox");
    expect(input).not.toBeDisabled();
    expect(input).toHaveAttribute(
      "placeholder",
      "Nhập địa điểm (vd: Ho Chi Minh)...",
    );
  });

  it("debounce search and show suggestions", async () => {
    server.use(
      mockSearchLocations(async () => {
        return new Response(
          JSON.stringify([
            {
              placeName: "Ho Chi Minh City",
              latitude: 10,
              longitude: 106,
              historicalTimezoneId: "Asia/Ho_Chi_Minh",
            },
          ]),
          { status: 200 },
        );
      }),
    );

    renderComponent("1995-05-12");
    const input = screen.getByRole("combobox");

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(input, "Hoc");

    // initially no suggestions (debounce 300ms)
    expect(screen.queryByRole("listbox")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText("Ho Chi Minh City")).toBeInTheDocument();
    });
  });

  it("shows empty state when no results found", async () => {
    server.use(
      mockSearchLocations(async () => {
        return new Response(JSON.stringify([]), { status: 200 });
      }),
    );

    renderComponent("1995-05-12");
    const input = screen.getByRole("combobox");

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(input, "xyz");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Không tìm thấy địa điểm phù hợp"),
      ).toBeInTheDocument();
    });
  });

  it("selects a location and displays the read-only view", async () => {
    server.use(
      mockSearchLocations(async () => {
        return new Response(
          JSON.stringify([
            {
              placeName: "Hanoi",
              latitude: 21,
              longitude: 105,
              historicalTimezoneId: "Asia/Ho_Chi_Minh",
            },
          ]),
          { status: 200 },
        );
      }),
    );

    renderComponent("1995-05-12");
    const input = screen.getByRole("combobox");

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(input, "Han");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const option = await screen.findByText("Hanoi");
    await user.click(option);

    expect(screen.getByText("Hanoi")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Đổi địa điểm" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("selects a location using keyboard navigation", async () => {
    server.use(
      mockSearchLocations(async () => {
        return new Response(
          JSON.stringify([
            {
              placeName: "Da Nang",
              latitude: 16,
              longitude: 108,
              historicalTimezoneId: "Asia/Ho_Chi_Minh",
            },
          ]),
          { status: 200 },
        );
      }),
    );

    renderComponent("1995-05-12");
    const input = screen.getByRole("combobox");

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(input, "Dan");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText("Da Nang")).toBeInTheDocument();
    });

    // Hit ArrowDown to trigger lines 108-110 on input
    await user.keyboard("{ArrowDown}");

    // Focus moves to the first suggestion via Tab, then select with Enter
    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByText("Da Nang")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Đổi địa điểm" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("displays error alert and allows retry", async () => {
    let callCount = 0;
    server.use(
      mockSearchLocations(async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(JSON.stringify({ message: "Server error" }), {
            status: 500,
          });
        }
        return new Response(
          JSON.stringify([
            {
              placeName: "Nha Trang",
              latitude: 12,
              longitude: 109,
              historicalTimezoneId: "Asia/Ho_Chi_Minh",
            },
          ]),
          { status: 200 },
        );
      }),
    );

    renderComponent("1995-05-12");
    const input = screen.getByRole("combobox");

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(input, "Nha");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText("Lỗi tra cứu")).toBeInTheDocument();
    });

    // Click retry
    const retryBtn = screen.getByRole("button", { name: "Thử lại" });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Nha Trang")).toBeInTheDocument();
    });
  });

  it("closes dropdown on click outside", async () => {
    server.use(
      mockSearchLocations(async () => {
        return new Response(
          JSON.stringify([
            {
              placeName: "Ho Chi Minh City",
              latitude: 10,
              longitude: 106,
              historicalTimezoneId: "Asia/Ho_Chi_Minh",
            },
          ]),
          { status: 200 },
        );
      }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <div data-testid="outside">Outside</div>
        <TestForm birthDate="1995-05-12" />
      </QueryClientProvider>,
    );
    const input = screen.getByRole("combobox");

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(input, "Hoc");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText("Ho Chi Minh City")).toBeInTheDocument();
    });

    // Click outside
    await user.click(screen.getByTestId("outside"));

    expect(screen.queryByText("Ho Chi Minh City")).not.toBeInTheDocument();
  });

  it("resets to search mode when clicking Đổi địa điểm", async () => {
    server.use(
      mockSearchLocations(async () => {
        return new Response(
          JSON.stringify([
            {
              placeName: "Hanoi",
              latitude: 21,
              longitude: 105,
              historicalTimezoneId: "Asia/Ho_Chi_Minh",
            },
          ]),
          { status: 200 },
        );
      }),
    );

    renderComponent("1995-05-12");
    const input = screen.getByRole("combobox");

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(input, "Han");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const option = await screen.findByText("Hanoi");
    await user.click(option);

    expect(screen.getByText("Hanoi")).toBeInTheDocument();
    const changeBtn = screen.getByRole("button", { name: "Đổi địa điểm" });

    await user.click(changeBtn);

    // After click, combobox is back
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: "Đổi địa điểm" }),
    ).not.toBeInTheDocument();
  });
});
