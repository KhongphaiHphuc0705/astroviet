/**
 * Helper function for exhaustive type checking.
 * Use this in the `default` case of a `switch` statement to ensure all cases are handled.
 *
 * @param x The value that should be of type `never`.
 * @throws Error if the function is called, meaning a case was not handled.
 */
export const assertNever = (x: never): never => {
  throw new Error(`Unexpected value. Should have been never, but got: ${String(x)}`);
};
