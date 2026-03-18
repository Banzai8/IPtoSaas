import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("knowledgeEntries", {
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("knowledgeEntries").order("desc").collect();
  },
});

export const remove = mutation({
  args: { id: v.id("knowledgeEntries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
