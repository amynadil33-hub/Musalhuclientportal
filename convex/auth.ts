import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

function ownerEmail() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("OWNER_EMAIL is not configured");
  return email;
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return { email: String(params.email).trim().toLowerCase() };
      },
    }),
  ],
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
    async beforeSessionCreation(ctx, { userId }) {
      const user = await ctx.db.get(userId);
      if (!user) throw new Error("AccountNotFound");

      const isOwner = user.email?.trim().toLowerCase() === ownerEmail();
      if (isOwner) {
        if (user.role !== "owner" || user.approvalStatus !== "approved") {
          await ctx.db.patch(userId, {
            role: "owner",
            approvalStatus: "approved",
            approvedAt: user.approvedAt ?? Date.now(),
          });
        }
        return;
      }

      if (user.approvalStatus === "rejected") {
        throw new Error("AccountRejected");
      }
      if (user.approvalStatus !== "approved") {
        throw new Error("AccountPendingApproval");
      }
    },
  },
});
