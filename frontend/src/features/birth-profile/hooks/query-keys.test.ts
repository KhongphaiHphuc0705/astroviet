import { describe, expect, it } from "vitest";

import { birthProfileKeys } from "./query-keys";

describe("birthProfileKeys", () => {
  it("generates correct lists key", () => {
    expect(birthProfileKeys.lists()).toEqual(["profiles"]);
  });

  it("generates correct list key with and without params", () => {
    expect(birthProfileKeys.list()).toEqual(["profiles", undefined]);
    const paramsA = { page: 1, pageSize: 10 };
    const paramsB = { page: 2, pageSize: 20 };
    expect(birthProfileKeys.list(paramsA)).toEqual(["profiles", paramsA]);
    expect(birthProfileKeys.list(paramsA)).not.toEqual(
      birthProfileKeys.list(paramsB),
    );
  });

  it("generates correct detail key", () => {
    expect(birthProfileKeys.detail("123")).toEqual(["profile", "123"]);
    expect(birthProfileKeys.detail("123")).not.toEqual(
      birthProfileKeys.detail("456"),
    );
  });

  it("maintains separation between list and detail namespaces", () => {
    const listKey = birthProfileKeys.lists();
    const detailKey = birthProfileKeys.detail("123");
    expect(listKey[0]).not.toEqual(detailKey[0]);
  });
});
