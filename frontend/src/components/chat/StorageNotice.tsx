/**
 * PERSIST-05 / D-20 — storage overflow notice.
 *
 * Not an error: `role="status"` (polite), never `role="alert"`. It is shown
 * when the retention caps evict the active conversation on write, sits above
 * the composer, carries no action button, and never blocks or cancels the
 * request — the conversation simply stays available in memory for this tab
 * only, and that is exactly what the body copy says.
 */
export default function StorageNotice() {
  return (
    <div
      role="status"
      className="mb-md rounded-xl border border-line bg-surface px-md py-sm"
    >
      {/* A caption-weight label rather than an <h2>/<h3>: the Phase 3 type
          table puts the storage-notice heading at 13px caption size, and a
          heading element here would sit between the route <h1> and the
          message captions without a real place in the outline. */}
      <p className="text-caption font-semibold text-ink">
        This chat couldn&apos;t be saved.
      </p>
      <p className="mt-2xs max-w-prose text-small leading-[1.5] text-ink-muted">
        Your browser&apos;s storage for Waynora is full. This conversation stays
        available until you close the tab, but it won&apos;t be here next time.
      </p>
    </div>
  );
}
