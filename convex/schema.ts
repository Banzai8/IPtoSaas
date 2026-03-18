import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  accessPasswords: defineTable({
    password: v.string(),
    expiryDate: v.string(), // ISO date string "YYYY-MM-DD"
    createdAt: v.number(),
  }),

  conversations: defineTable({
    question: v.string(),
    answer: v.string(),
    source: v.string(), // "knowledge_base" | "pdf" | "both" | "none"
    askedAt: v.number(),
  }),

  pdfDocuments: defineTable({
    filename: v.string(),
    status: v.string(),    // "processing" | "ready" | "error"
    progress: v.number(),  // 0–100
    totalChunks: v.number(),
    uploadedAt: v.number(),
  }),

  pdfChunks: defineTable({
    documentId: v.id("pdfDocuments"),
    text: v.string(),
    chunkIndex: v.number(),
    embedding: v.array(v.float64()),
  })
    .index("by_document", ["documentId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // text-embedding-3-small
      filterFields: [],
    }),
});
