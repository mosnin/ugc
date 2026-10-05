import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { SIGNUP_CREDITS } from "./lib/models";

/**
 * Login through Convex Auth: email + password, and Google when
 * AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are set on the deployment.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, ...(process.env.AUTH_GOOGLE_ID ? [Google] : [])],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId) return;
      // New account: grant the starter credits once, with a ledger entry.
      await ctx.db.patch(userId, { credits: SIGNUP_CREDITS });
      await ctx.db.insert("creditLedger", {
        userId,
        delta: SIGNUP_CREDITS,
        reason: "signup_bonus",
        at: Date.now(),
      });
    },
  },
});
