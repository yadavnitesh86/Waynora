import { z } from "zod";

export const publicEnvSchema = z.strictObject({
  VITE_API_BASE_URL: z.string().url(),
  VITE_CONVEX_URL: z.string().url(),
});

const parseResult = publicEnvSchema.safeParse(import.meta.env);

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
