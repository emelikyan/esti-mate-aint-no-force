import { NextRequest, NextResponse } from "next/server";
import { generateWorkshops } from "@/lib/claude";
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

    const workshops = await generateWorkshops(estimation);
    return NextResponse.json({ workshops });
  } catch (error) {
    console.error("[generate-workshops]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate workshops",
      },
      { status: 500 }
    );
  }
}
