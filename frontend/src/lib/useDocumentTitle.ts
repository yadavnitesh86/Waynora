import { useEffect } from "react";

export function useDocumentTitle(title: string, metaDescription?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} · Waynora`;

    if (metaDescription) {
      let metaTag = document.querySelector('meta[name="description"]');
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("name", "description");
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute("content", metaDescription);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, metaDescription]);
}
