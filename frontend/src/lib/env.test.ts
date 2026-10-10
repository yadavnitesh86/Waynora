import { describe, expect, it } from "vitest";
import { env, publicEnvSchema } from "./env";

/**
 * Regression for the blank-page bug: `publicEnvSchema` was a `strictObject`
 * validated directly against `import.meta.env`, but Vite always injects its
 * own keys (MODE, DEV, PROD, BASE_URL, SSR). strictObject rejected them as
 * unrecognized, so `getEnv()` threw at the first `env.*` read - which happens
 * during AuthProvider render, blanking the entire app.
 *
 * Vitest's `import.meta.env` carries the same injected keys, so importing and
 * reading `env` here reproduces the original condition exactly.
 */
describe("public env validation", () => {
  it("resolves both allowed keys against a real Vite env object", () => {
    expect(env.VITE_API_BASE_URL).toBeTruthy();
    expect(env.VITE_CONVEX_URL).toBeTruthy();
  });

  it("still accepts exactly the two-key object", () => {
    const result = publicEnvSchema.safeParse({
      VITE_API_BASE_URL: "http://localhost:8000",
      VITE_CONVEX_URL: "https://example.convex.cloud",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a real unknown app key rather than silently allowing it", () => {
    const result = publicEnvSchema.safeParse({
      VITE_API_BASE_URL: "http://localhost:8000",
      VITE_CONVEX_URL: "https://example.convex.cloud",
      VITE_SECRET_OOPS: "x",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing or malformed URL", () => {
    expect(
      publicEnvSchema.safeParse({
        VITE_API_BASE_URL: "not-a-url",
        VITE_CONVEX_URL: "https://example.convex.cloud",
      }).success,
    ).toBe(false);
  });
});
