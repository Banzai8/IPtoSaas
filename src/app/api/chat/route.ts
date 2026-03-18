import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import OpenAI from "openai";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const userQuestion: string = messages[messages.length - 1]?.content ?? "";

  // Fetch knowledge/rules and embed the question in parallel
  const [knowledge, rules, embeddingResponse] = await Promise.all([
    convex.query(api.settings.get, { key: "knowledge" }),
    convex.query(api.settings.get, { key: "rules" }),
    openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userQuestion,
    }),
  ]);

  const questionEmbedding = embeddingResponse.data[0].embedding;

  // Vector search for relevant PDF chunks
  const relevantChunks = await convex.action(api.pdfChunks.searchSimilar, {
    embedding: questionEmbedding,
    limit: 5,
  }) as Array<{ text: string } | null>;

  // Determine source
  const hasPdfChunks = relevantChunks.length > 0;
  const hasKnowledge = Boolean(knowledge);
  let source: "knowledge_base" | "pdf" | "both" | "none";
  if (hasPdfChunks && hasKnowledge) source = "both";
  else if (hasPdfChunks) source = "pdf";
  else if (hasKnowledge) source = "knowledge_base";
  else source = "none";

  // Build system prompt — PDF chunks first, then knowledge base
  const pdfContext = hasPdfChunks
    ? `## Relevant PDF Content\n${relevantChunks
        .filter(Boolean)
        .map((c, i) => `[Chunk ${i + 1}]\n${c!.text}`)
        .join("\n\n")}`
    : "";

  const systemPrompt = `You are an AI assistant for an online marketing coaching business.

${pdfContext}

${knowledge ? `## Your Knowledge Base\n${knowledge}` : ""}

${rules ? `## Response Rules\n${rules}` : ""}

Always be helpful, professional, and focused on online marketing topics. Base your answers on the knowledge and rules provided above.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "Unexpected response type" }, { status: 500 });
  }

  await convex.mutation(api.conversations.save, {
    question: userQuestion,
    answer: content.text,
    source,
  });

  return NextResponse.json({ content: content.text, source });
}
