import { NextRequest, NextResponse } from "next/server";
import { refineItem } from "@/lib/claude";
import { CostItem, Estimation, PracticeEstimation } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: {
      estimation: {
        summary: string;
        projectName: string;
        costBreakdown: CostItem[];
      };
      itemIndex: number;
      action: "refine" | "decompose";
      userNotes?: string;
      practices?: PracticeEstimation[];
    } = await request.json();

    if (!body.estimation || body.itemIndex == null || !body.action) {
      return NextResponse.json(
        { error: "estimation, itemIndex, and action are required." },
        { status: 400 }
      );
    }

    const item = body.estimation.costBreakdown[body.itemIndex];
    if (!item) {
      return NextResponse.json(
        { error: `Invalid itemIndex: ${body.itemIndex}` },
        { status: 400 }
      );
    }

    // Build a minimal Estimation object for context
    const contextEstimation = {
      projectName: body.estimation.projectName,
      summary: body.estimation.summary,
      costBreakdown: body.estimation.costBreakdown,
    } as Estimation;

    const items = await refineItem(
      contextEstimation,
      item,
      body.action,
      body.userNotes,
      body.practices
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Refine/decompose error:", error);
    return NextResponse.json(
      { error: "Failed to refine item. Please try again." },
      { status: 500 }
    );
  }
}
