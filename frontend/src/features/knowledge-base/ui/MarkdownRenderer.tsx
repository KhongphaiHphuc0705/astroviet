import { useMemo, type JSX } from "react";
import Markdown, { type Components } from "react-markdown";
import { Link } from "react-router-dom";

import { cn } from "@shared/lib/cn";

import {
  classifyImageSrc,
  classifyLinkHref,
  normalizeHeadingLevel,
  validateImageAlt,
} from "../model/markdownPolicy";

export interface MarkdownRendererProps {
  readonly markdown: string;
  readonly isKnownSlug: (slug: string) => boolean;
  readonly className?: string;
}

function createMarkdownComponents(
  isKnownSlug: (slug: string) => boolean,
): Components {
  return {
    h1({ children }) {
      const norm = normalizeHeadingLevel(1);
      return (
        <h2
          data-heading-normalized-from={norm.originalLevel}
          className="mb-4 mt-8 text-heading-lg font-bold text-primary first:mt-0"
        >
          {children}
        </h2>
      );
    },

    h2({ children }) {
      return (
        <h2 className="mb-4 mt-8 text-heading-lg font-bold text-primary first:mt-0">
          {children}
        </h2>
      );
    },

    h3({ children }) {
      return (
        <h3 className="mb-3 mt-6 text-heading-md font-semibold text-primary">
          {children}
        </h3>
      );
    },

    h4({ children }) {
      return (
        <h4 className="mb-2 mt-4 text-heading-sm font-medium text-primary">
          {children}
        </h4>
      );
    },

    h5({ children }) {
      const norm = normalizeHeadingLevel(5);
      return (
        <h4
          data-heading-normalized-from={norm.originalLevel}
          className="mb-2 mt-4 text-heading-sm font-medium text-primary"
        >
          {children}
        </h4>
      );
    },

    h6({ children }) {
      const norm = normalizeHeadingLevel(6);
      return (
        <h4
          data-heading-normalized-from={norm.originalLevel}
          className="mb-2 mt-4 text-heading-sm font-medium text-primary"
        >
          {children}
        </h4>
      );
    },

    p({ children }) {
      return <p className="mb-4 leading-relaxed text-secondary">{children}</p>;
    },

    ul({ children }) {
      return (
        <ul className="my-4 list-disc space-y-1 pl-6 text-secondary">
          {children}
        </ul>
      );
    },

    ol({ children }) {
      return (
        <ol className="my-4 list-decimal space-y-1 pl-6 text-secondary">
          {children}
        </ol>
      );
    },

    li({ children }) {
      return <li className="leading-relaxed">{children}</li>;
    },

    blockquote({ children }) {
      return (
        <blockquote className="my-4 border-l-4 border-subtle pl-4 italic text-secondary">
          {children}
        </blockquote>
      );
    },

    hr() {
      return <hr className="my-6 border-subtle" />;
    },

    pre({ children }) {
      return (
        <pre className="my-4 overflow-x-auto rounded-md border border-subtle bg-surface-raised p-4 [&>code]:bg-transparent [&>code]:p-0">
          {children}
        </pre>
      );
    },

    code({ children }) {
      return (
        <code className="rounded-sm bg-surface-raised px-1.5 py-1 font-data text-data-sm text-primary">
          {children}
        </code>
      );
    },

    a({ href, children }) {
      const classified = classifyLinkHref(href, isKnownSlug);

      if (
        classified.type === "internal-article" ||
        classified.type === "internal-list"
      ) {
        return (
          <Link
            to={classified.to}
            className="font-medium text-accent-primary underline underline-offset-4 hover:text-accent-secondary"
          >
            {children}
          </Link>
        );
      }

      if (classified.type === "external") {
        return (
          <a
            href={classified.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent-primary underline underline-offset-4 hover:text-accent-secondary"
          >
            {children}
          </a>
        );
      }

      return (
        <span data-kb-fallback={`link:${classified.reason}`}>{children}</span>
      );
    },

    img({ src, alt }) {
      const classified = classifyImageSrc(src);
      const isAltValid = validateImageAlt(alt);

      if (classified.type === "local" && isAltValid) {
        return (
          <img
            src={classified.src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="my-4 h-auto max-w-full rounded-md"
          />
        );
      }

      const reason =
        classified.type === "rejected" ? classified.reason : "invalid-alt";

      return <span hidden data-kb-fallback={`image:${reason}`} />;
    },
  };
}

export function MarkdownRenderer({
  markdown,
  isKnownSlug,
  className,
}: MarkdownRendererProps): JSX.Element {
  const components = useMemo(
    () => createMarkdownComponents(isKnownSlug),
    [isKnownSlug],
  );

  return (
    <div className={cn(className)}>
      <Markdown skipHtml urlTransform={(url) => url} components={components}>
        {markdown}
      </Markdown>
    </div>
  );
}
