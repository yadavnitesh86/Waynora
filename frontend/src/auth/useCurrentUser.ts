import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
}

/**
 * Session state for route guards and headers.
 *
 * While the auth handshake is resolving (`isLoading: true`) this always
 * reports `isLoading: true` — callers MUST branch on `isLoading` before
 * `isAuthenticated` so a still-resolving session is never treated as a
 * resolved "signed out" (TM-05, CONTEXT D-10).
 */
export function useAuthState(): AuthState {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.auth.currentUser);

  if (isLoading) {
    return { isAuthenticated: false, isLoading: true, userId: null };
  }

  return {
    isAuthenticated,
    isLoading: false,
    userId: isAuthenticated && user ? user._id : null,
  };
}

/**
 * The current user's document.
 * - `undefined` while the query is loading
 * - `null` when signed out
 * - the `users` document when signed in
 */
export function useCurrentUser(): Doc<"users"> | null | undefined {
  return useQuery(api.auth.currentUser);
}
