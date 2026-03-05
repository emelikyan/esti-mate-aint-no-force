import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/lib/parse-document";
import { buildRfpPrompt } from "@/lib/prompts";
import { PracticeEstimation, RateConfig } from "@/lib/types";

export const runtime = "nodejs";

/** GET returns JSON so you can confirm the route is hit (e.g. fetch("/api/estimate-rfp")) */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "estimate-rfp route is reachable",
    hasKey: !!process.env.ANTHROPIC_API_KEY?.trim(),
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const startDate = formData.get("startDate") as string | null;
    const practicesJson = formData.get("practices") as string | null;
    const rateConfigJson = formData.get("rateConfig") as string | null;

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

    let rateConfig: RateConfig | undefined;
    if (rateConfigJson) {
      try {
        rateConfig = JSON.parse(rateConfigJson);
      } catch {
        // ignore parse errors
      }
    }

    // Step 1: Generate estimation (dynamic import so load errors are caught here)
    const { generateEstimation, addConfidenceScores } = await import(
      "@/lib/claude"
    );
    const prompt = buildRfpPrompt(
      truncatedText,
      startDate || undefined,
      practices,
      rateConfig
    );
    let estimation = await generateEstimation(prompt);

    // Step 2: Agentic loop — review and add confidence scores
    estimation = await addConfidenceScores(estimation, practices);

    // Debug: log timeline/costBreakdown phase matching
    const timelinePhases = estimation.timeline.map(t => t.phase);
    const costPhases = [...new Set(estimation.costBreakdown.map(c => c.phase))];
    console.log("[DEBUG] Timeline phases:", timelinePhases);
    console.log("[DEBUG] Cost breakdown phases:", costPhases);
    console.log("[DEBUG] Timeline items:", estimation.timeline.map(t => `${t.phase} W${t.startWeek}-W${t.endWeek}`));
    console.log("[DEBUG] Confidence scores:", estimation.costBreakdown.map((c, i) => `[${i}] ${c.confidence}`).join(", "));

    return NextResponse.json({ estimation });
  } catch (error) {
    console.error("RFP estimation error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error:
          "Failed to generate estimation. Please try again.",
        detail: message,
      },
      { status: 500 }
    );
  }
}
