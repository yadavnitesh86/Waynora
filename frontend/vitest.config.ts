import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // jsdom needs an explicit URL or `localStorage` is unavailable, which makes
    // @convex-dev/auth throw on mount. A real browser always has it, so setting
    // a URL means the auth path under test matches production behaviour.
    environmentOptions: { jsdom: { url: "http://localhost:5173" } },
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
