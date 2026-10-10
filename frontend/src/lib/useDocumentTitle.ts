import { useEffect } from "react";

export interface UseDocumentTitleOptions {
  /**
   * Skip the " · Waynora" suffix. The homepage keeps the bare wordmark so the
   * tab reads exactly "Waynora".
   */
  skipTitleSuffix?: boolean;
}

const TITLE_SUFFIX = " · Waynora";
const DESCRIPTION_SELECTOR = 'meta[name="description"]';

/**
 * Per-route document metadata.
 *
 * Sets `<title>` and, when a description is supplied, `<meta name="description">`,
 * restoring both to their previous values on unmount. No-ops when there is no
 * DOM (SSR-free environments and jsdom tests that render without a document).
 */
export function useDocumentTitle(
  title: string,
  metaDescription?: string,
  options?: UseDocumentTitleOptions,
) {
  const skipTitleSuffix = options?.skipTitleSuffix === true;
  const nextTitle = skipTitleSuffix ? title : `${title}${TITLE_SUFFIX}`;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousTitle = document.title;
    const existingMeta = document.querySelector<HTMLMetaElement>(
      DESCRIPTION_SELECTOR,
    );
    const hadMeta = existingMeta !== null;
    const previousDescription = existingMeta?.getAttribute("content") ?? null;

    document.title = nextTitle;

    if (metaDescription !== undefined) {
      const meta = existingMeta ?? document.createElement("meta");
      if (!hadMeta) {
        meta.setAttribute("name", "description");
      }
      meta.setAttribute("content", metaDescription);
      if (!hadMeta) {
        document.head.appendChild(meta);
      }
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription !== undefined) {
        const meta = document.querySelector<HTMLMetaElement>(DESCRIPTION_SELECTOR);
        if (meta === null) {
          return;
        }
        if (hadMeta) {
          meta.setAttribute("content", previousDescription ?? "");
        } else {
          meta.remove();
        }
      }
    };
  }, [nextTitle, metaDescription]);
}
