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
    source: v.string(), // "knowledge_base" | "pdf" | "none"
    askedAt: v.number(),
  }),
});
