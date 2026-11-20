import type { JSX } from "react";
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

export function MarkdownRenderer({
  markdown,
  isKnownSlug,
  className,
}: MarkdownRendererProps): JSX.Element {
  const components: Components = {
    h1({ children, ...props }) {
      const norm = normalizeHeadingLevel(1);
      return (
        <h2
          data-heading-normalized-from={norm.originalLevel}
          className="text-2xl mb-4 mt-8 font-bold tracking-tight text-primary first:mt-0"
          {...props}
        >
          {children}
        </h2>
      );
    },

    h2({ children, ...props }) {
      return (
        <h2
          className="text-2xl mb-4 mt-8 font-bold tracking-tight text-primary first:mt-0"
          {...props}
        >
          {children}
        </h2>
      );
    },

    h3({ children, ...props }) {
      return (
        <h3
          className="text-xl mb-3 mt-6 font-semibold tracking-tight text-primary"
          {...props}
        >
          {children}
        </h3>
      );
    },

    h4({ children, ...props }) {
      return (
        <h4 className="text-lg mb-2 mt-4 font-medium text-primary" {...props}>
          {children}
        </h4>
      );
    },

    h5({ children, ...props }) {
      const norm = normalizeHeadingLevel(5);
      return (
        <h4
          data-heading-normalized-from={norm.originalLevel}
          className="text-lg mb-2 mt-4 font-medium text-primary"
          {...props}
        >
          {children}
        </h4>
      );
    },

    h6({ children, ...props }) {
      const norm = normalizeHeadingLevel(6);
      return (
        <h4
          data-heading-normalized-from={norm.originalLevel}
          className="text-lg mb-2 mt-4 font-medium text-primary"
          {...props}
        >
          {children}
        </h4>
      );
    },

    p({ children, ...props }) {
      return (
        <p className="mb-4 leading-relaxed text-secondary" {...props}>
          {children}
        </p>
      );
    },

    ul({ children, ...props }) {
      return (
        <ul className="mb-4 list-disc space-y-1 pl-6 text-secondary" {...props}>
          {children}
        </ul>
      );
    },

    ol({ children, ...props }) {
      return (
        <ol
          className="mb-4 list-decimal space-y-1 pl-6 text-secondary"
          {...props}
        >
          {children}
        </ol>
      );
    },

    li({ children, ...props }) {
      return (
        <li className="leading-relaxed" {...props}>
          {children}
        </li>
      );
    },

    blockquote({ children, ...props }) {
      return (
        <blockquote
          className="border-primary/40 my-4 border-l-4 pl-4 italic text-muted"
          {...props}
        >
          {children}
        </blockquote>
      );
    },

    hr({ ...props }) {
      return <hr className="border-border my-6" {...props} />;
    },

    pre({ children, ...props }) {
      return (
        <pre
          className="border-border bg-surface-muted font-mono text-sm my-4 overflow-x-auto rounded-lg border p-4 [&>code]:bg-transparent [&>code]:p-0"
          {...props}
        >
          {children}
        </pre>
      );
    },

    code({ children, ...props }) {
      return (
        <code
          className="rounded bg-surface-muted py-0.5 font-mono text-sm px-1.5 text-primary"
          {...props}
        >
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
            className="hover:text-primary-hover font-medium text-primary underline underline-offset-4"
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
            className="hover:text-primary-hover font-medium text-primary underline underline-offset-4"
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
            className="rounded my-4 h-auto max-w-full"
          />
        );
      }

      const reason =
        classified.type === "rejected" ? classified.reason : "invalid-alt";

      return <span hidden data-kb-fallback={`image:${reason}`} />;
    },
  };

  return (
    <div className={cn("prose-container", className)}>
      <Markdown skipHtml urlTransform={(url) => url} components={components}>
        {markdown}
      </Markdown>
    </div>
  );
}
