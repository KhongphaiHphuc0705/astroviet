import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import { deleteBirthProfileSuccess } from "../api/mocks/handlers";

import { birthProfileKeys } from "./query-keys";
import { useDeleteBirthProfileMutation } from "./useDeleteBirthProfileMutation";

describe("useDeleteBirthProfileMutation", () => {
  it("calls delete API and invalidates lists but not detail on success", async () => {
    server.use(deleteBirthProfileSuccess());
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteBirthProfileMutation(), {
      wrapper,
    });

    act(() => {
      result.current.mutate("123");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: birthProfileKeys.lists(),
    });
    // Detail should not be invalidated or removed
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: birthProfileKeys.detail("123"),
    });
  });
});
