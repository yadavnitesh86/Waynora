import type { RefObject } from "react";
import { Button } from "../ui";
import { formatTimestamp } from "./ConversationItem";

export interface ChatTopBarProps {
  /** The active conversation's title — this IS the route `<h1>`. */
  title: string;
  /**
   * Quiet supporting line: how much is in the thread and when it last moved.
   * Derived from real conversation data only — never a capability claim.
   */
  meta: string;
  /** Drawer / collapse state, shared with the sidebar. */
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  /** The mobile drawer trigger, so closing the drawer can hand focus back. */
  hamburgerRef: RefObject<HTMLButtonElement>;
}

/**
 * The chat surface's own top bar.
 *
 * It replaces the shared `PageHeader` here because a chat column needs a
 * working header, not a marketing one: a `text-h1` display heading competes
 * with both the app shell above it and the itinerary below it. This bar
 * still owns the route `<h1>` (C-03), but at a workspace scale, with a quiet
 * meta line and the one control a chat page cannot do without: history access.
 *
 * The chat page is a fixed-height app shell whose only scrolling region is
 * the message list, so this bar is a plain full-width header row — nothing
 * here needs to stick, because nothing behind it scrolls.
 *
 * It deliberately carries no "New chat" button: the sidebar's primary action
 * is always reachable (a drawer on mobile, a persistent panel on desktop),
 * and a second button with the same label and the same intent is both a
 * duplicate-CTA design fault and, to a screen reader, two indistinguishable
 * "New chat" controls. One action, one place.
 */
export default function ChatTopBar({
  title,
  meta,
  sidebarOpen,
  onOpenSidebar,
  hamburgerRef,
}: ChatTopBarProps) {
  return (
    <header
      className={[
        "flex flex-wrap items-center gap-sm border-b border-line/60 px-md py-sm",
      ].join(" ")}
    >
      {/* QUAL-04: the drawer trigger lives here on small screens only; the
          desktop panel has its own collapse toggle inside the nav. The
          reversed control appears when the panel is collapsed, so a desktop
          user can always bring history back. */}
      <Button
        ref={hamburgerRef}
        variant="ghost"
        size="sm"
        aria-label="Open chat history"
        aria-expanded={sidebarOpen}
        onClick={onOpenSidebar}
        className="md:hidden"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.75 4h10.5M2.75 8h10.5M2.75 12h10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </Button>

      {!sidebarOpen ? (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Show chat history"
          onClick={onOpenSidebar}
          className="hidden md:inline-flex"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="2.25"
              y="2.25"
              width="11.5"
              height="11.5"
              rx="1.75"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M6.75 2.25v11.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </Button>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-xs">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
            aria-hidden="true"
          />
          <h1 className="truncate font-display text-h3 font-semibold tracking-tight text-ink">
            {title}
          </h1>
        </div>
        {meta === "" ? null : (
          <p className="mt-3xs truncate text-caption text-ink-muted">{meta}</p>
        )}
      </div>
    </header>
  );
}

/**
 * The meta line under the top-bar title.
 *
 * Honest by construction: it counts the messages that are actually stored
 * and stamps the conversation's own `updatedAt` (UTC, matching the sidebar),
 * so the line can never claim progress the app has not made.
 */
export function buildChatMeta(
  messageCount: number,
  updatedAt: string | undefined,
): string {
  // An empty thread has nothing worth stamping — saying "0 messages ·
  // updated …" puts the thread's creation date in a slot that reads as
  // "last activity". The reassurance about local storage is the useful
  // thing to say instead.
  if (messageCount === 0) {
    return "Your chat stays in this browser";
  }
  const turns =
    messageCount === 1 ? "1 message" : `${messageCount} messages`;
  if (updatedAt === undefined) {
    return `${turns} · saved in this browser`;
  }
  const stamp = formatTimestamp(updatedAt);
  return stamp === ""
    ? `${turns} · saved in this browser`
    : `${turns} · updated ${stamp}`;
}
