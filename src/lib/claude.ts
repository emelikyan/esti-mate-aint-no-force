import Anthropic from "@anthropic-ai/sdk";
import { Estimation, PracticeEstimation, CostItem, Phase, TimelineItem, Workshop } from "./types";
import { buildConfidencePrompt, buildRefinePrompt, buildDecomposePrompt, buildRecalculateTimelinePrompt, buildWorkshopsPrompt } from "./prompts";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
});

function extractAndParseJSON(text: string): Estimation {
  const raw = text.trim();

  // Try 1: extract content from a code fence anywhere in the response
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // fall through
    }
  }

  // Try 2: extract the outermost { … } (handles preamble/postamble text)
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    } catch {
      // fall through to repair
    }
  }

  // Try 3: attempt repair on the JSON portion (handles truncated responses)
  let repaired = firstBrace !== -1 ? raw.slice(firstBrace) : raw;
  repaired = repaired.replace(/,\s*"[^"]*$/, ""); // trailing incomplete key
  repaired = repaired.replace(/,\s*$/, "");        // trailing comma

  const bracketStack: string[] = [];
  let inString = false;
  let escape = false;
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
    console.error("[extractAndParseJSON] All parse attempts failed. Raw response start:", raw.slice(0, 300));
    throw new Error(
      "Failed to parse estimation response from AI. The response may have been truncated."
    );
  }
}

export async function generateEstimation(prompt: string): Promise<Estimation> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
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
    model: "claude-sonnet-4-6",
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
    model: "claude-sonnet-4-6",
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

export async function recalculateTimeline(
  estimation: Estimation
): Promise<{ phases: Phase[]; timeline: TimelineItem[] }> {
  const prompt = buildRecalculateTimelinePrompt(estimation);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let jsonStr = textBlock.text.trim();

  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  } else {
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }
  }

  const parsed = JSON.parse(jsonStr);
  return {
    phases: (parsed.phases || []) as Phase[],
    timeline: (parsed.timeline || []) as TimelineItem[],
  };
}

export async function generateWorkshops(estimation: Estimation): Promise<Workshop[]> {
  const prompt = buildWorkshopsPrompt(estimation);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const raw = textBlock.text.trim();

  // Try 1: content inside a code fence
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      return (Array.isArray(parsed) ? parsed : []) as Workshop[];
    } catch {
      // fall through
    }
  }

  // Try 2: find the first [ that starts an array of objects ([ followed by whitespace then {)
  // This avoids picking up [ from preamble text like "[project name]"
  const arrayStart = raw.search(/\[\s*\{/);
  const lastBracket = raw.lastIndexOf("]");
  if (arrayStart !== -1 && lastBracket > arrayStart) {
    try {
      const parsed = JSON.parse(raw.slice(arrayStart, lastBracket + 1));
      return (Array.isArray(parsed) ? parsed : []) as Workshop[];
    } catch {
      // fall through
    }
  }

  // Try 3: Claude wrapped it in an object { workshops: [...] }
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      const arr = parsed.workshops ?? parsed.items ?? parsed.data ?? [];
      return (Array.isArray(arr) ? arr : []) as Workshop[];
    } catch {
      // fall through
    }
  }

  console.error("[generateWorkshops] All parse attempts failed. Raw start:", raw.slice(0, 500));
  throw new Error("Could not parse workshop list from AI response.");
}
