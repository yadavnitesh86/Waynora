import Button from "../ui/Button";
import ErrorText from "../ui/ErrorText";
import {
  RECOVERY_ACTION_LABEL,
  RECOVERY_COPY,
  type RecoveryKind,
} from "../../lib/chat/failure";

export interface RecoveryBlockProps {
  kind: RecoveryKind;
  onRetry: () => void;
}

/**
 * Inline SVG per the Phase 3 icon contract (16px, currentColor, 1.5 stroke).
 * `aria-hidden` because the headline already carries the meaning: colour is
 * never the sole signal (a11y contract 9).
 */
function WarningGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mt-3xs shrink-0 text-danger"
    >
      <path
        d="M8 1.75 14.5 13.25H1.5L8 1.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 6v3.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

/**
 * One component, seven kinds (CHAT-09, WAIT-05, PERSIST-09).
 *
 * Copy is verbatim from `RECOVERY_COPY` — never re-authored here, so the
 * displayed string and the persisted data-layer source stay identical. The
 * action is always deliberate: a visible, labelled secondary button; there is
 * no timer, no focus trigger, and no reload hook (QUAL-02, D-27).
 *
 * The block is set apart from the prompt it sits inside by a hairline, not by
 * another filled card — a failure inside a raised bubble should not look like
 * a separate piece of UI fighting the message for attention.
 */
export default function RecoveryBlock({ kind, onRetry }: RecoveryBlockProps) {
  const copy = RECOVERY_COPY[kind];

  return (
    <div className="mt-md border-t border-line/60 pt-md">
      <div className="flex items-start gap-2xs">
        <WarningGlyph />
        <ErrorText>{copy.headline}</ErrorText>
      </div>
      <p className="mt-2xs max-w-prose text-small leading-[1.5] text-ink-muted">
        {copy.body}
      </p>
      <div className="mt-sm">
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {RECOVERY_ACTION_LABEL}
        </Button>
      </div>
    </div>
  );
}
