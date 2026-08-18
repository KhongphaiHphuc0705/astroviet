/**
 * Creates a safe redirect URL to pass to the Login page.
 * Prevents Open Redirect vulnerabilities by ensuring the target path is always relative.
 */
export const createSafeRedirectUrl = (
  pathname: string,
  search: string = "",
  hash: string = "",
): string => {
  // Combine all parts of the current location
  const fullPath = `${pathname}${search}${hash}`;

  // Ensure the path is relative and starts with a single slash
  // If it starts with multiple slashes (e.g. //example.com), strip them
  const safePath = fullPath.replace(/^\/+/, "/");

  return `/login?redirect=${encodeURIComponent(safePath)}`;
};
