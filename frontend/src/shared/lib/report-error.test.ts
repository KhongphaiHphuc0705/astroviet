import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { reportError } from "./report-error";

describe("reportError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("gọi với Error thật → console.error được gọi đúng", () => {
    const testError = new Error("Test error message");
    expect(() => reportError(testError)).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[reportError]", testError);
  });

  it("gọi với giá trị không phải Error → không throw, vẫn log", () => {
    const nonErrorString = "This is a string error";
    expect(() => reportError(nonErrorString)).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[reportError]",
      nonErrorString,
    );

    const nonErrorObject = { detail: "Some error" };
    expect(() => reportError(nonErrorObject)).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[reportError]",
      nonErrorObject,
    );

    expect(() => reportError(undefined)).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[reportError]", undefined);
  });

  it("gọi có context → context xuất hiện trong log", () => {
    const testError = new Error("Test with context");
    expect(() => reportError(testError, "auth-module")).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[reportError] (auth-module)",
      testError,
    );
  });
});
