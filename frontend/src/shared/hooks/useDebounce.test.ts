import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300));
    expect(result.current).toBe("initial");
  });

  it("should delay updating the value", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 300 },
      },
    );

    rerender({ value: "updated", delay: 300 });

    // Value should not update immediately
    expect(result.current).toBe("initial");

    // Advance time by 299ms
    vi.advanceTimersByTime(299);
    expect(result.current).toBe("initial");

    // Advance time by 1ms (total 300ms)
    vi.advanceTimersByTime(1);
    expect(result.current).toBe("updated");
  });
});
