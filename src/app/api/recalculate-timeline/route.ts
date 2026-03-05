import { NextRequest, NextResponse } from "next/server";
import { recalculateTimeline } from "@/lib/claude";
import { Estimation } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { estimation } = (await req.json()) as { estimation: Estimation };

    if (!estimation) {
      return NextResponse.json(
        { error: "Missing estimation data" },
        { status: 400 }
      );
    }

    const result = await recalculateTimeline(estimation);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[recalculate-timeline]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to recalculate timeline",
      },
      { status: 500 }
    );
  }
}
