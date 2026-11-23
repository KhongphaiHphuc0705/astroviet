import { useEffect, useMemo, useRef } from "react";

import { env } from "@shared/config/env";
import { reportError } from "@shared/lib/report-error";

import { resolveSiteUrlDetailed } from "../model/siteUrl";

export interface UseKnowledgeSiteUrlOptions {
  readonly rawSiteUrl?: string | undefined;
  readonly isDev?: boolean;
}

/**
 * Resolves the normalized client `siteUrl` for Knowledge Base pages (Listing & Detail)
 * and reports invalid `VITE_SITE_URL` values at most once per mount (D-F6.4-01).
 */
export function useKnowledgeSiteUrl(
  options?: UseKnowledgeSiteUrlOptions,
): string | undefined {
  const rawSiteUrl =
    options && "rawSiteUrl" in options ? options.rawSiteUrl : env.VITE_SITE_URL;
  const isDev =
    options?.isDev !== undefined ? options.isDev : import.meta.env.DEV;

  const resolution = useMemo(
    () => resolveSiteUrlDetailed(rawSiteUrl, { isDev }),
    [rawSiteUrl, isDev],
  );

  const reportedErrorRef = useRef<Error | null>(null);
  useEffect(() => {
    if (
      resolution.invalidError &&
      reportedErrorRef.current !== resolution.invalidError
    ) {
      reportedErrorRef.current = resolution.invalidError;
      reportError(resolution.invalidError, "knowledge:invalid-site-url");
    }
  }, [resolution.invalidError]);

  return resolution.siteUrl;
}
