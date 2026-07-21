import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

function getOwnerEmail() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new ConvexError({
      message: "OWNER_EMAIL is not configured",
      code: "CONFIGURATION_ERROR",
    });
  }
  return email;
}

async function requireOwner(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({ message: "Unauthenticated", code: "UNAUTHENTICATED" });
  }
  const user = await ctx.db.get(userId);
  if (user?.email?.trim().toLowerCase() !== getOwnerEmail()) {
    throw new ConvexError({ message: "Owner access required", code: "FORBIDDEN" });
  }
  return { userId, user };
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId === null ? null : await ctx.db.get(userId);
  },
});

export const listTeamAccounts = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireOwner(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .filter((user) => user._id !== userId)
      .map((user) => ({
        _id: user._id,
        email: user.email ?? "Unknown email",
        name: user.name,
        approvalStatus: user.approvalStatus ?? "pending",
        createdAt: user._creationTime,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const setTeamAccountApproval = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx);
    if (args.userId === owner.userId) {
      throw new ConvexError({ message: "The owner account cannot be changed", code: "FORBIDDEN" });
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({ message: "Team account not found", code: "NOT_FOUND" });
    }
    if (user.email?.trim().toLowerCase() === getOwnerEmail()) {
      throw new ConvexError({ message: "The owner account cannot be changed", code: "FORBIDDEN" });
    }

    await ctx.db.patch(args.userId, {
      role: "member",
      approvalStatus: args.status,
      approvedAt: args.status === "approved" ? Date.now() : undefined,
      approvedBy: args.status === "approved" ? owner.userId : undefined,
    });

    if (args.status === "rejected") {
      const sessions = await ctx.db
        .query("authSessions")
        .withIndex("userId", (q) => q.eq("userId", args.userId))
        .collect();
      for (const session of sessions) {
        const refreshTokens = await ctx.db
          .query("authRefreshTokens")
          .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
          .collect();
        for (const token of refreshTokens) await ctx.db.delete(token._id);
        await ctx.db.delete(session._id);
      }
    }
  },
});
