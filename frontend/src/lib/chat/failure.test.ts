// @vitest-environment node
// The failure taxonomy is a pure mapping module (no DOM, no React),
// so it runs in the node environment like the chat domain tests.
import { describe, expect, it } from "vitest";
import {
  mapRequestFailure,
  RECOVERY_ACTION_LABEL,
  RECOVERY_COPY,
  type RequestFailureKind,
} from "./failure";
import type { AskErrorKind } from "../errors";

describe("mapRequestFailure", () => {
  it("passes network, http, and malformed through unchanged", () => {
    expect(mapRequestFailure("network", null)).toBe("network");
    expect(mapRequestFailure("http", null)).toBe("http");
    expect(mapRequestFailure("malformed", null)).toBe("malformed");
  });

  it("maps a budget-timer abort to timeout", () => {
    expect(mapRequestFailure("abort", "timeout")).toBe("timeout");
  });

  it("maps a user stop to aborted", () => {
    expect(mapRequestFailure("abort", "user")).toBe("aborted");
  });

  it("defaults an abort with no source to timeout (conservative)", () => {
    expect(mapRequestFailure("abort", null)).toBe("timeout");
  });

  it("maps config to unexpected", () => {
    expect(mapRequestFailure("config", null)).toBe("unexpected");
  });

  it("covers every AskErrorKind x abortSource combination", () => {
    const cases: Array<
      [AskErrorKind, "timeout" | "user" | null, RequestFailureKind]
    > = [
      ["network", "timeout", "network"],
      ["network", "user", "network"],
      ["network", null, "network"],
      ["timeout", "timeout", "timeout"],
      ["timeout", "user", "timeout"],
      ["timeout", null, "timeout"],
      ["http", "timeout", "http"],
      ["http", "user", "http"],
      ["http", null, "http"],
      ["malformed", "timeout", "malformed"],
      ["malformed", "user", "malformed"],
      ["malformed", null, "malformed"],
      ["abort", "timeout", "timeout"],
      ["abort", "user", "aborted"],
      ["abort", null, "timeout"],
      ["config", "timeout", "unexpected"],
      ["config", "user", "unexpected"],
      ["config", null, "unexpected"],
    ];

    for (const [askKind, abortSource, expected] of cases) {
      expect(mapRequestFailure(askKind, abortSource)).toBe(expected);
    }
  });
});

describe("RECOVERY_COPY", () => {
  it("has exactly the seven recovery keys", () => {
    expect(Object.keys(RECOVERY_COPY).sort()).toEqual([
      "aborted",
      "http",
      "malformed",
      "network",
      "reload-recovery",
      "timeout",
      "unexpected",
    ]);
  });

  it("carries the verbatim network copy", () => {
    expect(RECOVERY_COPY.network).toEqual({
      headline: "We couldn't reach the server.",
      body: "Check your connection and try again. Your request is saved below, and nothing was lost.",
    });
  });

  it("carries the verbatim timeout copy", () => {
    expect(RECOVERY_COPY.timeout).toEqual({
      headline: "This request took too long.",
      body: "Your trip may still be building on our side. Because it timed out here, trying again would start a second, separate plan. Your request is saved below — try again when you're ready.",
    });
  });

  it("carries the verbatim http copy", () => {
    expect(RECOVERY_COPY.http).toEqual({
      headline: "Something went wrong on our side.",
      body: "Your request is saved below and your conversation is intact. Try again when you're ready.",
    });
  });

  it("carries the verbatim malformed copy", () => {
    expect(RECOVERY_COPY.malformed).toEqual({
      headline: "We received a response we couldn't read.",
      body: "Your request is saved below and your conversation is intact. Try again when you're ready.",
    });
  });

  it("carries the verbatim unexpected copy", () => {
    expect(RECOVERY_COPY.unexpected).toEqual({
      headline: "Something unexpected happened.",
      body: "Your request is saved below and your conversation is intact. Try again when you're ready.",
    });
  });

  it("carries the verbatim aborted copy (supersedes CUSTOMER_MESSAGES.abort on screen)", () => {
    expect(RECOVERY_COPY.aborted).toEqual({
      headline: "Waiting stopped.",
      body: "Your trip may still be building on our side. Your request is saved below — trying again would start a second, separate plan.",
    });
  });

  it("carries the verbatim reload-recovery copy", () => {
    expect(RECOVERY_COPY["reload-recovery"]).toEqual({
      headline: "This request was still running when you left.",
      body: "We can't tell whether it finished, so nothing was restarted for you. Your request is saved below — try again when you're ready.",
    });
  });
});

describe("RECOVERY_ACTION_LABEL", () => {
  it("is Try again", () => {
    expect(RECOVERY_ACTION_LABEL).toBe("Try again");
  });
});
