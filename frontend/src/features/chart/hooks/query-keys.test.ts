import { hashKey } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { createQueryClient } from "@shared/api/queryClient";

import { chartKeys } from "./query-keys";

describe("chartKeys", () => {
  it("all", () => {
    expect(chartKeys.all()).toEqual(["charts"]);
  });

  it("lists", () => {
    expect(chartKeys.lists()).toEqual(["charts", "list"]);
  });

  it("list", () => {
    const params = { page: 1 };
    expect(chartKeys.list(params)).toEqual(["charts", "list", params]);
  });

  it("details", () => {
    expect(chartKeys.details()).toEqual(["charts", "detail"]);
  });

  it("detail", () => {
    expect(chartKeys.detail("123")).toEqual(["charts", "detail", "123"]);
  });

  it("lists() is a prefix of list(p)", () => {
    const listKeys = chartKeys.list({ page: 1 });
    const listsKeys = chartKeys.lists();
    expect(listKeys.slice(0, listsKeys.length)).toEqual(listsKeys);
  });

  it("lists() is NOT a prefix of detail(id)", () => {
    const detailKeys = chartKeys.detail("123");
    const listsKeys = chartKeys.lists();
    expect(detailKeys.slice(0, listsKeys.length)).not.toEqual(listsKeys);
  });

  it("hashKey is equal regardless of object property order", () => {
    const key1 = chartKeys.list({ page: 1, pageSize: 20 });
    const key2 = chartKeys.list({ pageSize: 20, page: 1 });
    expect(hashKey(key1)).toBe(hashKey(key2));
  });

  it("invalidateQueries(lists()) does not make detail stale", () => {
    const queryClient = createQueryClient();

    // Add dummy data
    queryClient.setQueryData(chartKeys.list({ page: 1 }), { data: "list" });
    queryClient.setQueryData(chartKeys.detail("123"), { data: "detail" });

    expect(
      queryClient.getQueryState(chartKeys.list({ page: 1 }))?.isInvalidated,
    ).toBe(false);
    expect(
      queryClient.getQueryState(chartKeys.detail("123"))?.isInvalidated,
    ).toBe(false);

    // invalidate lists
    queryClient.invalidateQueries({ queryKey: chartKeys.lists() });

    expect(
      queryClient.getQueryState(chartKeys.list({ page: 1 }))?.isInvalidated,
    ).toBe(true);
    // Detail should not be invalidated!
    expect(
      queryClient.getQueryState(chartKeys.detail("123"))?.isInvalidated,
    ).toBe(false);
  });
});
