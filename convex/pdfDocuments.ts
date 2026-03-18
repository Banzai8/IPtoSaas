import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { filename: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pdfDocuments", {
      filename: args.filename,
      status: "processing",
      progress: 0,
      totalChunks: 0,
      uploadedAt: Date.now(),
    });
  },
});

export const updateProgress = mutation({
  args: {
    id: v.id("pdfDocuments"),
    progress: v.number(),
    status: v.optional(v.string()),
    totalChunks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { progress: args.progress };
    if (args.status !== undefined) patch.status = args.status;
    if (args.totalChunks !== undefined) patch.totalChunks = args.totalChunks;
    await ctx.db.patch(args.id, patch);
  },
});

export const getById = query({
  args: { id: v.id("pdfDocuments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pdfDocuments").order("desc").collect();
  },
});

export const remove = mutation({
  args: { id: v.id("pdfDocuments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
