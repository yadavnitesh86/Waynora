import { describe, expect, it } from "vitest";
import { publicEnvSchema } from "./env";

/**
 * The public environment allowlist (CONTEXT D-03): exactly two `VITE_*` keys,
 * both validated URLs, and nothing else. A strict object means an extra key
 * is a parse error rather than silently passing through.
 */
describe("publicEnvSchema boundary", () => {
  it("accepts both public URLs", () => {
    expect(
      publicEnvSchema.safeParse({
        VITE_API_BASE_URL: "http://localhost:8000",
        VITE_CONVEX_URL: "https://example.convex.cloud",
      }).success,
    ).toBe(true);
  });

  it("rejects a payload missing VITE_CONVEX_URL", () => {
    expect(
      publicEnvSchema
        .safeParse({ VITE_API_BASE_URL: "http://localhost:8000" }).success,
    ).toBe(false);
  });

  it("rejects a non-URL base", () => {
    expect(
      publicEnvSchema.safeParse({
        VITE_API_BASE_URL: "not-a-url",
        VITE_CONVEX_URL: "https://example.convex.cloud",
      }).success,
    ).toBe(false);
  });

  it("rejects any extra key, including a secret-shaped one", () => {
    expect(
      publicEnvSchema.safeParse({
        VITE_API_BASE_URL: "http://localhost:8000",
        VITE_CONVEX_URL: "https://example.convex.cloud",
        VITE_SECRET: "hunter2",
      }).success,
    ).toBe(false);
  });
});
