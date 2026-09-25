import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import {
  mockSearchLocations,
  searchLocationsSuccess,
} from "../api/mocks/handlers";

import { useLocationSearchQuery } from "./useLocationSearchQuery";

describe("useLocationSearchQuery", () => {
  const createWrapper = () => {
    const queryClient = createQueryClient();
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("fetches after debounce when ready", async () => {
    server.use(searchLocationsSuccess());
    const { result, rerender } = renderHook(
      (props: { query: string; date: string | undefined }) =>
        useLocationSearchQuery(props),
      {
        wrapper: createWrapper(),
        initialProps: { query: "", date: "2000-01-01" },
      },
    );

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");

    rerender({ query: "Ho", date: "2000-01-01" });
    expect(result.current.fetchStatus).toBe("idle");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toBeDefined();
  });

  it("does not fetch if date is undefined", async () => {
    let callCount = 0;
    server.use(
      mockSearchLocations(async () => {
        callCount++;
        return new Response(JSON.stringify([]), { status: 200 });
      }),
    );

    const { result } = renderHook(
      () => useLocationSearchQuery({ query: "Ho Chi Minh", date: undefined }),
      { wrapper: createWrapper() },
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(callCount).toBe(0);
  });

  it("does not fetch if query is less than 2 characters", async () => {
    let callCount = 0;
    server.use(
      mockSearchLocations(async () => {
        callCount++;
        return new Response(JSON.stringify([]), { status: 200 });
      }),
    );

    const { result } = renderHook(
      () => useLocationSearchQuery({ query: "H", date: "2000-01-01" }),
      { wrapper: createWrapper() },
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(callCount).toBe(0);
  });

  it("only fires one API request when query changes rapidly within debounce window", async () => {
    let callCount = 0;
    server.use(
      mockSearchLocations(async () => {
        callCount++;
        return new Response(JSON.stringify([]), { status: 200 });
      }),
    );

    const { result, rerender } = renderHook(
      (props: { query: string; date: string | undefined }) =>
        useLocationSearchQuery(props),
      {
        wrapper: createWrapper(),
        initialProps: { query: "", date: "2000-01-01" },
      },
    );

    // Rapidly change query, advancing time but not enough to trigger the 300ms debounce
    rerender({ query: "Ho", date: "2000-01-01" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ query: "Ho C", date: "2000-01-01" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ query: "Ho Chi", date: "2000-01-01" });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ query: "Ho Chi Minh", date: "2000-01-01" });

    // Complete the remaining 300ms for the final query
    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(callCount).toBe(1);
    expect(result.current.data).toBeDefined();
  });
});
