import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

// Helper for any future server function (queries/mutations/actions) that
// needs the authenticated user's Id. Password provider only — password
// reset, email verification, and OAuth are deferred per CONTEXT D-11.
export { getAuthUserId };

// The signed-in user's document, or null when signed out. Consumed by the
// SPA through `useConvexQuery(api.auth.currentUser)` in src/auth/useCurrentUser.ts.
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});
