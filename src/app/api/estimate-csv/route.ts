import { NextRequest, NextResponse } from "next/server";
import { buildCSVHydrationPrompt } from "@/lib/prompts";
import { generateEstimation, addConfidenceScores } from "@/lib/claude";
import { RateConfig } from "@/lib/types";
import { buildCostItemsFromCSV, CSVRow } from "@/lib/parse-csv";
import { DEFAULT_RATES } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: {
      csvRows: CSVRow[];
      projectName: string;
      rateConfig?: RateConfig;
    } = await request.json();

    if (!body.csvRows || body.csvRows.length === 0) {
      return NextResponse.json(
        { error: "No CSV rows provided." },
        { status: 400 }
      );
    }

    if (!body.projectName) {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    const rateConfig = body.rateConfig || DEFAULT_RATES;

    // Step 1: Build CostItems from CSV rows
    const costItems = buildCostItemsFromCSV(body.csvRows, rateConfig);

    if (costItems.length === 0) {
      return NextResponse.json(
        { error: "No valid cost items could be built from the CSV data." },
        { status: 400 }
      );
    }

    // Build a description from CSV rows for context
    const csvDescription = body.csvRows
      .filter((r) => !r.isTotal)
      .map((r) => {
        const label = r.row ? `${r.row} ` : "";
        let line = `${label}${r.feature}`;
        if (r.description) line += ` — ${r.description}`;
        if (r.assumption) line += ` (${r.assumption})`;
        return line;
      })
      .join("\n");

    // Step 2: Build hydration prompt and call AI
    const prompt = buildCSVHydrationPrompt(
      costItems,
      body.projectName,
      csvDescription,
      rateConfig
    );
    let estimation = await generateEstimation(prompt);

    // Safety net: Replace AI's costBreakdown with our original CSV-derived items
    estimation.costBreakdown = costItems;

    // Recalculate totalCost from the original items
    const totalAmount = costItems.reduce((s, i) => s + i.totalCost, 0);
    estimation.totalCost = { amount: totalAmount, currency: rateConfig.currency };

    // Set source
    estimation.source = "csv";

    // Step 3: Add confidence scores
    estimation = await addConfidenceScores(estimation);

    return NextResponse.json({ estimation });
  } catch (error) {
    console.error("CSV estimation error:", error);
    return NextResponse.json(
      { error: "Failed to generate estimation from CSV. Please try again." },
      { status: 500 }
    );
  }
}
