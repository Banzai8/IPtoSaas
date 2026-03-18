import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import OpenAI from "openai";
// Dynamic import avoids pdf-parse attempting to load test files at module init time
const getPdfParse = () => import("pdf-parse").then((m) => m.default);

export const maxDuration = 60;

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_SIZE = 4000;    // characters (~1000 tokens)
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = start + CHUNK_SIZE;
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Invalid file — must be a PDF" }, { status: 400 });
  }

  // Step 1: Create document record
  const docId = await convex.mutation(api.pdfDocuments.create, {
    filename: file.name,
  });
  await convex.mutation(api.pdfDocuments.updateProgress, {
    id: docId,
    progress: 10,
  });

  try {
    // Step 2: Extract text
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParse = await getPdfParse();
    const parsed = await pdfParse(buffer);
    const rawText = parsed.text.trim();

    if (!rawText) {
      await convex.mutation(api.pdfDocuments.updateProgress, {
        id: docId,
        progress: 0,
        status: "error",
      });
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    await convex.mutation(api.pdfDocuments.updateProgress, {
      id: docId,
      progress: 30,
    });

    // Step 3: Chunk text
    const chunks = chunkText(rawText);

    await convex.mutation(api.pdfDocuments.updateProgress, {
      id: docId,
      progress: 50,
      totalChunks: chunks.length,
    });

    // Step 4: Embed each chunk and save
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i]);
      await convex.mutation(api.pdfChunks.addChunk, {
        documentId: docId,
        text: chunks[i],
        chunkIndex: i,
        embedding,
      });

      const progress = 50 + Math.round(((i + 1) / chunks.length) * 45);
      await convex.mutation(api.pdfDocuments.updateProgress, {
        id: docId,
        progress,
      });
    }

    // Step 5: Mark complete
    await convex.mutation(api.pdfDocuments.updateProgress, {
      id: docId,
      progress: 100,
      status: "ready",
    });

    return NextResponse.json({ success: true, docId, chunkCount: chunks.length });
  } catch (err) {
    await convex.mutation(api.pdfDocuments.updateProgress, {
      id: docId,
      progress: 0,
      status: "error",
    });
    console.error("PDF processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
