import Anthropic from "@anthropic-ai/sdk";
import { Estimation, PracticeEstimation, CostItem } from "./types";
import { buildConfidencePrompt, buildRefinePrompt, buildDecomposePrompt } from "./prompts";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
});

function extractAndParseJSON(text: string): Estimation {
  let jsonStr = text.trim();

  // Strip markdown code fences
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  // Try parsing as-is first
  try {
    return JSON.parse(jsonStr);
  } catch {
    // If truncated, try to find the last complete object/array and close brackets
  }

  // Try to repair truncated JSON by closing open brackets
  let repaired = jsonStr;

  // Remove any trailing incomplete string (ends mid-value)
  repaired = repaired.replace(/,\s*"[^"]*$/, "");
  repaired = repaired.replace(/,\s*$/, "");

  // Count open/close brackets
  const opens: Record<string, number> = { "{": 0, "[": 0 };
  const closes: Record<string, string> = { "}": "{", "]": "[" };
  let inString = false;
  let escape = false;

  for (const char of repaired) {
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{" || char === "[") opens[char]++;
    if (char === "}" || char === "]") opens[closes[char]]--;
  }

  // Close any open brackets in reverse order
  const bracketStack: string[] = [];
  inString = false;
  escape = false;
  for (const char of repaired) {
    if (escape) { escape = false; continue; }
    if (char === "\\") { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === "{") bracketStack.push("}");
    if (char === "[") bracketStack.push("]");
    if (char === "}" || char === "]") bracketStack.pop();
  }

  repaired += bracketStack.reverse().join("");

  try {
    return JSON.parse(repaired);
  } catch {
    throw new Error(
      "Failed to parse estimation response from AI. The response may have been truncated."
    );
  }
}

export async function generateEstimation(prompt: string): Promise<Estimation> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16384,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const estimation = extractAndParseJSON(textBlock.text);

  // Ensure new fields have defaults if Claude omits them
  estimation.assumptions = estimation.assumptions || [];
  estimation.limitations = estimation.limitations || [];
  estimation.customComponents = estimation.customComponents || [];
  estimation.costBreakdown = (estimation.costBreakdown || []).map((item) => ({
    ...item,
    phase: item.phase || "Implementation",
    confidence: item.confidence || 0,
    roles: item.roles || [],
    totalHours: item.totalHours || 0,
    totalMD: item.totalMD || 0,
    totalCost: item.totalCost || 0,
    optimisticHours: item.optimisticHours || undefined,
    pessimisticHours: item.pessimisticHours || undefined,
    confirmed: false,
  }));

  // Normalize totalCost — support both old { min, max } and new { amount, currency }
  if (estimation.totalCost && typeof estimation.totalCost === "object") {
    const tc = estimation.totalCost as Record<string, unknown>;
    if (tc.amount == null && tc.min != null) {
      // Old format: convert min/max to single amount
      estimation.totalCost = {
        amount: (tc.max as number) || (tc.min as number) || 0,
        currency: (tc.currency as string) || "USD",
      };
    } else if (tc.amount == null) {
      estimation.totalCost = { amount: 0, currency: (tc.currency as string) || "USD" };
    }
  }

  return estimation;
}

export async function addConfidenceScores(
  estimation: Estimation,
  practices?: PracticeEstimation[]
): Promise<Estimation> {
  const prompt = buildConfidencePrompt(estimation, practices);

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return estimation;
  }

  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(jsonStr);
    // Handle both array format and object with array property
    const scores: {
      index: number;
      confidence: number;
      optimisticHours?: number;
      pessimisticHours?: number;
    }[] = Array.isArray(parsed) ? parsed : (parsed.scores || parsed.items || []);

    for (const score of scores) {
      if (
        score.index >= 0 &&
        score.index < estimation.costBreakdown.length
      ) {
        estimation.costBreakdown[score.index].confidence = Math.min(
          100,
          Math.max(0, Math.round(score.confidence))
        );
        if (score.optimisticHours != null) {
          estimation.costBreakdown[score.index].optimisticHours =
            Math.round(score.optimisticHours);
        }
        if (score.pessimisticHours != null) {
          estimation.costBreakdown[score.index].pessimisticHours =
            Math.round(score.pessimisticHours);
        }
      }
    }
  } catch {
    console.error("Failed to parse confidence scores. Raw response:", jsonStr.slice(0, 500));
  }

  return estimation;
}

export async function refineItem(
  estimation: Estimation,
  item: CostItem,
  action: "refine" | "decompose",
  userNotes?: string,
  practices?: PracticeEstimation[]
): Promise<CostItem[]> {
  const prompt =
    action === "refine"
      ? buildRefinePrompt(estimation, item, userNotes, practices)
      : buildDecomposePrompt(estimation, item, practices);

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr);

  // Refine returns a single object, decompose returns an array
  const items: CostItem[] = Array.isArray(parsed) ? parsed : [parsed];

  // Normalize each returned item
  return items.map((i) => ({
    ...i,
    phase: i.phase || item.phase,
    confidence: Math.min(100, Math.max(0, Math.round(i.confidence || 0))),
    roles: i.roles || [],
    totalHours: i.totalHours || 0,
    totalMD: i.totalMD || 0,
    totalCost: i.totalCost || 0,
    optimisticHours: i.optimisticHours || undefined,
    pessimisticHours: i.pessimisticHours || undefined,
    confirmed: false,
  }));
}
