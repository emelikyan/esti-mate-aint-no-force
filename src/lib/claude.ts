import Anthropic from "@anthropic-ai/sdk";
import { Estimation } from "./types";
import { buildConfidencePrompt } from "./prompts";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
});

export async function generateEstimation(prompt: string): Promise<Estimation> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
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

  const estimation: Estimation = JSON.parse(jsonStr);

  // Ensure new fields have defaults if Claude omits them
  estimation.assumptions = estimation.assumptions || [];
  estimation.limitations = estimation.limitations || [];
  estimation.customComponents = estimation.customComponents || [];

  return estimation;
}

export async function addConfidenceScores(
  estimation: Estimation
): Promise<Estimation> {
  const prompt = buildConfidencePrompt(estimation);

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
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
    const scores: { index: number; confidence: number }[] =
      JSON.parse(jsonStr);

    for (const score of scores) {
      if (
        score.index >= 0 &&
        score.index < estimation.costBreakdown.length
      ) {
        estimation.costBreakdown[score.index].confidence = Math.min(
          100,
          Math.max(0, Math.round(score.confidence))
        );
      }
    }
  } catch {
    // If confidence parsing fails, leave defaults (0)
    console.error("Failed to parse confidence scores, using defaults");
  }

  return estimation;
}
