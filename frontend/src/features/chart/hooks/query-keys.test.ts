import { describe, expect, it } from "vitest";

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
});
