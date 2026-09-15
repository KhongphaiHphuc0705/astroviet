import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  coordinateRefresh,
  setRefreshHandler,
  __resetRefreshCoordinatorForTests,
} from "./auth-refresh-coordinator";

describe("auth-refresh-coordinator", () => {
  beforeEach(() => {
    __resetRefreshCoordinatorForTests();
  });

  // 1. Single call: 1 caller → handler gọi đúng 1 lần.
  it("single call: calls handler exactly once", async () => {
    const handlerSpy = vi.fn().mockResolvedValue("new-token");
    setRefreshHandler(handlerSpy);

    const result = await coordinateRefresh();
    expect(result).toBe("new-token");
    expect(handlerSpy).toHaveBeenCalledTimes(1);
  });

  // 2. Concurrent calls: N caller đồng thời → handler gọi đúng 1 lần, tất cả nhận cùng kết quả.
  it("concurrent calls: deduplicates calls, returning the same result", async () => {
    // Return a delayed promise to simulate in-flight request
    let resolveHandler: (val: string) => void;
    const pendingPromise = new Promise<string>((resolve) => {
      resolveHandler = resolve;
    });

    const handlerSpy = vi.fn().mockReturnValue(pendingPromise);
    setRefreshHandler(handlerSpy);

    // Trigger multiple simultaneous calls
    const promise1 = coordinateRefresh();
    const promise2 = coordinateRefresh();
    const promise3 = coordinateRefresh();

    expect(handlerSpy).toHaveBeenCalledTimes(1);

    // Resolve the single in-flight request
    resolveHandler!("shared-token");

    const [res1, res2, res3] = await Promise.all([
      promise1,
      promise2,
      promise3,
    ]);

    expect(res1).toBe("shared-token");
    expect(res2).toBe("shared-token");
    expect(res3).toBe("shared-token");
    expect(handlerSpy).toHaveBeenCalledTimes(1); // Still only once
  });

  // 3. Refresh failure: N caller đồng thời, handler reject → tất cả nhận cùng lỗi.
  it("concurrent calls: propagates failure to all callers", async () => {
    let rejectHandler: (err: Error) => void;
    const pendingPromise = new Promise<string>((_, reject) => {
      rejectHandler = reject;
    });

    const handlerSpy = vi.fn().mockReturnValue(pendingPromise);
    setRefreshHandler(handlerSpy);

    const promise1 = coordinateRefresh();
    const promise2 = coordinateRefresh();

    const expectedError = new Error("refresh failed");
    rejectHandler!(expectedError);

    await expect(promise1).rejects.toThrow("refresh failed");
    await expect(promise2).rejects.toThrow("refresh failed");
    expect(handlerSpy).toHaveBeenCalledTimes(1);
  });

  // 4 & 5. Next independent cycle: sau khi hoàn tất, gọi lần nữa → gọi handler thêm 1 lần nữa.
  // Đồng thời kiểm chứng inFlight = null (no stale Promise).
  it("next cycle: processes a new request independently after the previous resolves", async () => {
    let callCount = 0;
    const handlerSpy = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(`token-${callCount}`);
    });
    setRefreshHandler(handlerSpy);

    // First cycle
    const result1 = await coordinateRefresh();
    expect(result1).toBe("token-1");
    expect(handlerSpy).toHaveBeenCalledTimes(1);

    // Second cycle
    const result2 = await coordinateRefresh();
    expect(result2).toBe("token-2");
    expect(handlerSpy).toHaveBeenCalledTimes(2);
  });

  it("next cycle: processes a new request independently after the previous rejects", async () => {
    let callCount = 0;
    const handlerSpy = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error("first failed"));
      }
      return Promise.resolve("token-2");
    });
    setRefreshHandler(handlerSpy);

    // First cycle
    await expect(coordinateRefresh()).rejects.toThrow("first failed");
    expect(handlerSpy).toHaveBeenCalledTimes(1);

    // Second cycle
    const result2 = await coordinateRefresh();
    expect(result2).toBe("token-2");
    expect(handlerSpy).toHaveBeenCalledTimes(2);
  });

  // 6. Handler registration: chưa setRefreshHandler → coordinateRefresh() reject.
  it("unregistered handler: rejects immediately if handler is not set", async () => {
    await expect(coordinateRefresh()).rejects.toThrow(
      "[auth-refresh-coordinator] No refresh handler registered.",
    );
  });
});
