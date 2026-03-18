import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const addChunk = mutation({
  args: {
    documentId: v.id("pdfDocuments"),
    text: v.string(),
    chunkIndex: v.number(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pdfChunks", {
      documentId: args.documentId,
      text: args.text,
      chunkIndex: args.chunkIndex,
      embedding: args.embedding,
    });
  },
});

export const getById = query({
  args: { id: v.id("pdfChunks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const searchSimilar = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const results = await ctx.vectorSearch("pdfChunks", "by_embedding", {
      vector: args.embedding,
      limit,
    });
    const chunks = await Promise.all(
      results.map((r) => ctx.runQuery(api.pdfChunks.getById, { id: r._id }))
    );
    return chunks.filter(Boolean);
  },
});

export const deleteByDocument = mutation({
  args: { documentId: v.id("pdfDocuments") },
  handler: async (ctx, args) => {
    const chunks = await ctx.db
      .query("pdfChunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
    await Promise.all(chunks.map((c) => ctx.db.delete(c._id)));
  },
});
