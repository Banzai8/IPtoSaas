import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("accessPasswords").order("desc").collect();
  },
});

export const add = mutation({
  args: { password: v.string(), expiryDate: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("accessPasswords", {
      password: args.password,
      expiryDate: args.expiryDate,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("accessPasswords") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getByPassword = query({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accessPasswords")
      .filter((q) => q.eq(q.field("password"), args.password))
      .first();
  },
});
