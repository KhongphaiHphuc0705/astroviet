/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import "vitest";

declare module "vitest" {
  export interface Assertion<T = any> {
    toHaveNoViolations(): void;
  }
  export interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
