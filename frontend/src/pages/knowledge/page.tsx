import { useEffect, useMemo, useRef, type JSX } from "react";

import {
  buildKnowledgeListPageMeta,
  knowledgeContentService,
  KnowledgeListView,
  resolveSiteUrlDetailed,
} from "@features/knowledge-base";
import { env } from "@shared/config/env";
import { usePageMeta } from "@shared/hooks/usePageMeta";
import { reportError } from "@shared/lib/report-error";

/**
 * KnowledgePage component (/knowledge)
 *
 * Public listing page for the Astrology Knowledge Base.
 * Displays heading, intro description, and the reactive KnowledgeListView.
 *
 * Data is retrieved synchronously via `knowledgeContentService.listArticles()`
 * without raw Markdown rendering or client-side fetch waterfalls.
 */
export default function KnowledgePage(): JSX.Element {
  const articles = useMemo(() => knowledgeContentService.listArticles(), []);

  const siteUrlResolution = useMemo(
    () =>
      resolveSiteUrlDetailed(env.VITE_SITE_URL, {
        isDev: import.meta.env.DEV,
      }),
    [],
  );

  const reportedSiteUrlRef = useRef(false);
  useEffect(() => {
    if (siteUrlResolution.invalidError && !reportedSiteUrlRef.current) {
      reportedSiteUrlRef.current = true;
      reportError(siteUrlResolution.invalidError, "knowledge:invalid-site-url");
    }
  }, [siteUrlResolution.invalidError]);

  const pageMeta = useMemo(
    () => buildKnowledgeListPageMeta(siteUrlResolution.siteUrl),
    [siteUrlResolution.siteUrl],
  );
  usePageMeta(pageMeta);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-heading-lg font-bold text-primary md:text-display-lg">
          Kiến thức chiêm tinh
        </h1>
        <p className="mt-2 max-w-container-narrow text-[16px] leading-relaxed text-secondary">
          Tìm hiểu các khái niệm nền tảng của chiêm tinh phương Tây: hành tinh,
          cung hoàng đạo, nhà và góc chiếu.
        </p>
      </header>

      <KnowledgeListView articles={articles} />
    </div>
  );
}
