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

type ChunkDoc = { _id: string; documentId: string; text: string; chunkIndex: number; embedding: number[]; _creationTime: number };

export const searchSimilar = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
    minScore: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<ChunkDoc[]> => {
    const limit = args.limit ?? 5;
    const minScore = args.minScore ?? 0.6; // only return genuinely relevant chunks
    const results = await ctx.vectorSearch("pdfChunks", "by_embedding", {
      vector: args.embedding,
      limit,
    });
    // Filter by relevance score before fetching full documents
    const relevant = results.filter((r) => r._score >= minScore);
    const chunks: Array<ChunkDoc | null> = await Promise.all(
      relevant.map((r): Promise<ChunkDoc | null> =>
        ctx.runQuery(api.pdfChunks.getById, { id: r._id })
      )
    );
    return chunks.filter((c): c is ChunkDoc => c !== null);
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
