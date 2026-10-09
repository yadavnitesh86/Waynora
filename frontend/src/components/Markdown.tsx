import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function urlTransform(url: string): string {
  // Allow http:, https:, mailto:
  if (/^(https?:|mailto:)/i.test(url)) {
    return url;
  }
  // Allow relative/anchor URLs
  if (url.startsWith("#") || url.startsWith("/")) {
    return url;
  }
  // Block javascript:, data:, vbscript:, blob:, file:, and any other scheme
  return "";
}

const allowedElements = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "strong",
  "em",
  "code",
  "pre",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "br",
  "hr",
  "img",
];

interface MarkdownProps {
  content: string;
}

export const Markdown = memo(function Markdown({ content }: MarkdownProps) {
  return (
    <div aria-live="polite" className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={urlTransform}
        allowedElements={allowedElements}
        components={{
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith("http://") || href?.startsWith("https://");
            return (
              <a
                href={href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...props}
              >
                {children}
              </a>
            );
          },
          h1({ children, ...props }) {
            return <h1 className="font-display text-h1 font-semibold leading-[1.1] mt-0 mb-md" {...props}>{children}</h1>;
          },
          h2({ children, ...props }) {
            return <h2 className="font-display text-h2 font-semibold leading-[1.2] mt-lg mb-sm" {...props}>{children}</h2>;
          },
          h3({ children, ...props }) {
            return <h3 className="font-sans text-h3 font-semibold leading-[1.3] mt-md mb-sm" {...props}>{children}</h3>;
          },
          p({ children, ...props }) {
            return <p className="mb-md text-body leading-[1.65]" {...props}>{children}</p>;
          },
          ul({ children, ...props }) {
            return <ul className="pl-lg mb-md list-disc" {...props}>{children}</ul>;
          },
          ol({ children, ...props }) {
            return <ol className="pl-lg mb-md list-decimal" {...props}>{children}</ol>;
          },
          li({ children, ...props }) {
            return <li className="mb-2xs" {...props}>{children}</li>;
          },
          code({ children, className, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="font-mono text-small bg-surface-raised rounded-sm px-2xs py-3xs" {...props}>
                  {children}
                </code>
              );
            }
            return <code className={className} {...props}>{children}</code>;
          },
          pre({ children, ...props }) {
            return <pre className="font-mono text-small bg-surface rounded-md p-md overflow-x-auto mb-md" {...props}>{children}</pre>;
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote className="border-l-[3px] border-accent pl-md mb-md text-ink-muted italic" {...props}>
                {children}
              </blockquote>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto mb-md rounded-sm">
                <table className="w-full border-collapse text-small" {...props}>{children}</table>
              </div>
            );
          },
          th({ children, ...props }) {
            return <th className="text-left font-semibold uppercase tracking-[0.06em] text-small border-b border-line px-md py-sm" {...props}>{children}</th>;
          },
          td({ children, ...props }) {
            return <td className="border-b border-line px-md py-sm" {...props}>{children}</td>;
          },
          img({ src, alt, ...props }) {
            return <img src={src} alt={alt ?? ""} className="rounded-md shadow-sm max-w-full" {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
