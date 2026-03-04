import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/lib/parse-document";
import { buildRfpPrompt } from "@/lib/prompts";
import { generateEstimation, addConfidenceScores } from "@/lib/claude";
import { PracticeEstimation } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const startDate = formData.get("startDate") as string | null;
    const practicesJson = formData.get("practices") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const documentText = await parseDocument(buffer, file.type);

    if (!documentText.trim()) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from the document. If this is a scanned PDF, please use the questionnaire instead.",
        },
        { status: 400 }
      );
    }

    const truncatedText = documentText.slice(0, 100_000);

    let practices: PracticeEstimation[] = [];
    if (practicesJson) {
      try {
        practices = JSON.parse(practicesJson);
      } catch {
        // ignore parse errors
      }
    }

    // Step 1: Generate estimation
    const prompt = buildRfpPrompt(
      truncatedText,
      startDate || undefined,
      practices
    );
    let estimation = await generateEstimation(prompt);

    // Step 2: Agentic loop — review and add confidence scores
    estimation = await addConfidenceScores(estimation);

    return NextResponse.json({ estimation });
  } catch (error) {
    console.error("RFP estimation error:", error);
    return NextResponse.json(
      { error: "Failed to generate estimation. Please try again." },
      { status: 500 }
    );
  }
}
