import { NextRequest, NextResponse } from "next/server";
import { buildQuestionnairePrompt } from "@/lib/prompts";
import { generateEstimation, addConfidenceScores } from "@/lib/claude";
import { QuestionnaireAnswers, PracticeEstimation } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: {
      answers: QuestionnaireAnswers;
      practices?: PracticeEstimation[];
    } = await request.json();

    if (!body.answers || !body.answers.projectDescription) {
      return NextResponse.json(
        { error: "Project description is required." },
        { status: 400 }
      );
    }

    // Step 1: Generate estimation
    const prompt = buildQuestionnairePrompt(body.answers, body.practices);
    let estimation = await generateEstimation(prompt);

    // Step 2: Agentic loop — review and add confidence scores
    estimation = await addConfidenceScores(estimation, body.practices);

    // Debug: log timeline/costBreakdown phase matching
    const timelinePhases = estimation.timeline.map(t => t.phase);
    const costPhases = [...new Set(estimation.costBreakdown.map(c => c.phase))];
    console.log("[DEBUG] Timeline phases:", timelinePhases);
    console.log("[DEBUG] Cost breakdown phases:", costPhases);
    console.log("[DEBUG] Timeline items:", estimation.timeline.map(t => `${t.phase} W${t.startWeek}-W${t.endWeek}`));
    console.log("[DEBUG] Confidence scores:", estimation.costBreakdown.map((c, i) => `[${i}] ${c.confidence}`).join(", "));

    return NextResponse.json({ estimation });
  } catch (error) {
    console.error("Questionnaire estimation error:", error);
    return NextResponse.json(
      { error: "Failed to generate estimation. Please try again." },
      { status: 500 }
    );
  }
}
