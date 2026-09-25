import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "@shared/api/queryClient";
import { server } from "@test/msw-server";

import { updateBirthProfileSuccess } from "../api/mocks/handlers";

import { birthProfileKeys } from "./query-keys";
import { useUpdateBirthProfileMutation } from "./useUpdateBirthProfileMutation";

describe("useUpdateBirthProfileMutation", () => {
  it("calls update API and invalidates lists AND specific detail query on success", async () => {
    server.use(updateBirthProfileSuccess());
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateBirthProfileMutation(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        id: "123",
        input: { label: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: birthProfileKeys.lists(),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: birthProfileKeys.detail("123"),
    });
  });
});
