import { z } from "zod";

export const publicEnvSchema = z.strictObject({
  VITE_API_BASE_URL: z.string().url(),
  VITE_CONVEX_URL: z.string().url(),
});

// Vite injects its own keys into import.meta.env (MODE, DEV, PROD, BASE_URL,
// SSR, plus anything matching VITE_*). Validating the raw object with a strict
// schema rejects those injected keys and blanks the app, so narrow to our
// allowlist first - then unknown keys are still a real error.
function pickPublicEnv(): Record<string, unknown> {
  const raw = import.meta.env as Record<string, unknown>;
  return {
    VITE_API_BASE_URL: raw.VITE_API_BASE_URL,
    VITE_CONVEX_URL: raw.VITE_CONVEX_URL,
  };
}

const parseResult = publicEnvSchema.safeParse(pickPublicEnv());

export const envError: string[] = parseResult.success
  ? []
  : parseResult.error.issues.map((issue) => {
      const key = issue.path[0] ?? "unknown";
      return `${key}: ${issue.message}`;
    });

function getEnv(): z.infer<typeof publicEnvSchema> {
  if (!parseResult.success) {
    throw new Error(
      `Missing or invalid environment variables: ${envError.join(", ")}`,
    );
  }
  return parseResult.data;
}

export const env = {
  get VITE_API_BASE_URL(): string {
    return getEnv().VITE_API_BASE_URL;
  },
  get VITE_CONVEX_URL(): string {
    return getEnv().VITE_CONVEX_URL;
  },
};

// Vite's build-mode flag, funneled through this module so no other file in
// src/ reads the Vite environment object directly (auth plan Task 3 check).
export const isDev: boolean = import.meta.env.DEV;
