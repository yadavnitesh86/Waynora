import type { ReactNode } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { env } from "../lib/env";

let client: ConvexReactClient | null = null;

function getConvexClient(): ConvexReactClient {
  // Read through the validated env module — never the raw Vite environment
  // object directly. Creation is deferred to first render so a config problem
  // surfaces in the React tree instead of throwing at module import time.
  client ??= new ConvexReactClient(env.VITE_CONVEX_URL);
  return client;
}

/**
 * Makes the Convex session available to every route component.
 * Mounted inside <BrowserRouter> and outside <App /> in src/main.tsx.
 *
 * ConvexAuthProvider internally renders ConvexProviderWithAuth, so children
 * can use Convex hooks (useQuery, useConvexAuth) directly - no plain
 * ConvexProvider wrapper (it would not send auth tokens).
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={getConvexClient()}>{children}</ConvexAuthProvider>;
}
