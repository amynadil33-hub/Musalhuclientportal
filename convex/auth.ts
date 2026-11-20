import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import {
  convexAuth,
  createAccount,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { Scrypt } from "lucia";

function ownerEmail() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("OWNER_EMAIL is not configured");
  return email;
}

function normalizedEmail(value: unknown) {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) throw new Error("InvalidEmail");
  return email;
}

function passwordValue(value: unknown) {
  const password = String(value ?? "");
  if (password.length < 8) throw new Error("InvalidPassword");
  return password;
}

const passwordProvider = ConvexCredentials({
  id: "password",
  authorize: async (params, ctx) => {
    const flow = String(params.flow ?? "");
    const email = normalizedEmail(params.email);
    const password = passwordValue(params.password);

    if (flow === "signUp") {
      // Account creation runs in its own committed mutation. Returning null
      // deliberately avoids creating a session for a pending account.
      await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret: password },
        profile: { email },
      });
      return null;
    }

    if (flow !== "signIn") {
      throw new Error("UnsupportedAuthFlow");
    }

    const { user } = await retrieveAccount(ctx, {
      provider: "password",
      account: { id: email, secret: password },
    });

    const isOwner =
      String(user.email ?? "")
        .trim()
        .toLowerCase() === ownerEmail();
    if (!isOwner) {
      if (user.approvalStatus === "rejected") {
        throw new Error("AccountRejected");
      }
      if (user.approvalStatus !== "approved") {
        throw new Error("AccountPendingApproval");
      }
    }

    return { userId: user._id };
  },
  crypto: {
    async hashSecret(password) {
      return await new Scrypt().hash(password);
    },
    async verifySecret(password, hash) {
      return await new Scrypt().verify(hash, password);
    },
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [passwordProvider],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, args) {
      if (args.existingUserId !== null) return;

      const email = args.profile.email?.trim().toLowerCase();
      const isOwner = email === ownerEmail();
      await ctx.db.patch(args.userId, {
        role: isOwner ? "owner" : "member",
        approvalStatus: isOwner ? "approved" : "pending",
        ...(isOwner ? { approvedAt: Date.now() } : {}),
      });
    },
  },
});
