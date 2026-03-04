import { QuestionnaireAnswers, PracticeEstimation, Estimation, RateConfig } from "./types";
import { getEstimatedEndDate, DEFAULT_RATES, HOURS_PER_MD } from "./constants";

function buildCostInstructions(rateConfig: RateConfig): string {
  return `
IMPORTANT: For the cost breakdown, use a role-based structure. Each cost line item must include a "roles" array with hours split across these 5 roles:
- CS (Consultant): rate ${rateConfig.currency} ${rateConfig.csRate}/hr
- Dev (Developer): rate ${rateConfig.currency} ${rateConfig.devRate}/hr
- AR (Architect): rate ${rateConfig.currency} ${rateConfig.arRate}/hr
- PM (Project Manager): PM hours = ${rateConfig.pmPercent}% of (CS + Dev + AR hours for that line item), rate is calculated as weighted average of CS/Dev/AR rates
- QA (QA Engineer): QA hours = ${rateConfig.qaPercent}% of (CS + Dev + AR hours for that line item), rate is calculated as weighted average of CS/Dev/AR rates

For each role entry: cost = hours * rate
totalHours = sum of all role hours
totalMD = totalHours / ${HOURS_PER_MD}
totalCost = sum of all role costs

Currency is "${rateConfig.currency}".

IMPORTANT: Not every line item needs all roles. Use only the roles relevant to that task. For example, a "Requirements Analysis" line might have CS and AR but no Dev. A "Frontend Development" line would be primarily Dev with some AR. PM and QA should be distributed across line items proportionally.`;
}

const ESTIMATION_INSTRUCTIONS_TEMPLATE = (rateConfig: RateConfig) => `
Produce a comprehensive project estimation in JSON format. Be realistic and thorough.
If information is vague, make reasonable assumptions and list them in the assumptions array.

IMPORTANT: Group ALL cost items into exactly three phases:
- "Blueprint" - Discovery, requirements gathering, architecture design, UX/UI design, project planning
- "Implementation" - Development, coding, integration, unit testing, code reviews
- "UAT & Go-Live" - User acceptance testing, bug fixing, deployment, training, documentation, post-launch support
${buildCostInstructions(rateConfig)}

Return ONLY valid JSON matching this exact structure (no markdown, no code fences, just raw JSON):
{
  "projectName": "string - inferred project name",
  "summary": "string - 2-3 sentence executive summary of the project and estimation",
  "phases": [
    {
      "name": "string - phase name",
      "description": "string - what happens in this phase",
      "durationWeeks": number,
      "order": number
    }
  ],
  "timeline": [
    {
      "phase": "string - matching a phase name above",
      "startWeek": number,
      "endWeek": number,
      "startDate": "string - actual start date in YYYY-MM-DD format if start date was provided, otherwise empty string",
      "endDate": "string - actual end date in YYYY-MM-DD format if start date was provided, otherwise empty string",
      "milestones": ["string - key milestone descriptions"]
    }
  ],
  "costBreakdown": [
    {
      "phase": "Blueprint" | "Implementation" | "UAT & Go-Live",
      "category": "string - e.g. Requirements Analysis, Architecture Design, Frontend Development, QA Testing",
      "description": "string - what this cost covers",
      "roles": [
        {
          "role": "CS" | "Dev" | "AR" | "PM" | "QA",
          "hours": number,
          "rate": number,
          "cost": number
        }
      ],
      "totalHours": number,
      "totalMD": number,
      "totalCost": number,
      "confidence": 0,
      "startDate": "string - YYYY-MM-DD if start date was provided, otherwise omit",
      "endDate": "string - YYYY-MM-DD if start date was provided, otherwise omit"
    }
  ],
  "totalCost": { "amount": number, "currency": "${rateConfig.currency}" },
  "team": [
    {
      "role": "string - e.g. Senior Full-Stack Developer",
      "count": number,
      "responsibilities": ["string"],
      "requiredSkills": ["string"]
    }
  ],
  "risks": [
    {
      "title": "string",
      "description": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "likelihood": "low" | "medium" | "high",
      "mitigation": "string - how to mitigate this risk"
    }
  ],
  "deliverables": [
    {
      "name": "string",
      "description": "string",
      "phase": "string - matching a phase name above",
      "type": "document" | "software" | "design" | "infrastructure" | "other"
    }
  ],
  "assumptions": [
    "string - each assumption made during the estimation process"
  ],
  "limitations": [
    "string - each potential limitation or constraint identified"
  ],
  "customComponents": [
    {
      "name": "string - component/module name",
      "description": "string - what it does and why it's needed",
      "complexity": "low" | "medium" | "high",
      "estimatedHours": number
    }
  ]
}

Include at least:
- 4-6 project phases with timeline
- 3-5 cost items per cost phase (Blueprint, Implementation, UAT & Go-Live)
- 4-6 team roles
- 6-10 risks
- 8-12 deliverables
- 5-10 assumptions
- 3-6 limitations
- List ALL custom components/modules that need to be built based on the project requirements`;

function buildPracticeContext(practices: PracticeEstimation[]): string {
  if (!practices || practices.length === 0) return "";

  const examples = practices
    .map(
      (p, i) =>
        `<historical_project_${i + 1}>
Project: ${p.projectName}
Type: ${p.projectType}
Description: ${p.description}
Actual Timeline: ${p.actualTimeline}
Actual Cost: $${p.actualCost.toLocaleString()}
Team Size: ${p.teamSize}
Tech Stack: ${p.techStack}
Lessons Learned: ${p.lessonsLearned}${p.csMD != null ? `\nConsultant MDs: ${p.csMD}` : ""}${p.devMD != null ? `\nDeveloper MDs: ${p.devMD}` : ""}${p.arMD != null ? `\nArchitect MDs: ${p.arMD}` : ""}${p.pmMD != null ? `\nPM MDs: ${p.pmMD}` : ""}${p.qaMD != null ? `\nQA MDs: ${p.qaMD}` : ""}${p.totalMD != null ? `\nTotal MDs: ${p.totalMD}` : ""}
</historical_project_${i + 1}>`
    )
    .join("\n\n");

  return `

IMPORTANT: The following are REAL completed projects with ACTUAL costs and timelines. Use these as calibration data to make your estimates more realistic and grounded in practice. Adjust your estimates to align with these real-world benchmarks:

${examples}

`;
}

function buildStartDateContext(startDate?: string): string {
  if (!startDate) return "";
  return `
The project is planned to start on ${startDate}. Calculate actual calendar dates (YYYY-MM-DD format) for all timeline startDate and endDate fields based on this start date. Also calculate startDate and endDate for each cost breakdown line item. Assume 5 working days per week.
`;
}

export function buildRfpPrompt(
  documentText: string,
  startDate?: string,
  practices?: PracticeEstimation[],
  rateConfig?: RateConfig
): string {
  const rates = rateConfig || DEFAULT_RATES;
  return `You are an expert software project estimator and technical consultant with decades of experience.
You have been given the following RFP (Request for Proposal) document text.
Analyze it thoroughly and produce a detailed project estimation.
${buildPracticeContext(practices || [])}${buildStartDateContext(startDate)}
<rfp_document>
${documentText}
</rfp_document>

${ESTIMATION_INSTRUCTIONS_TEMPLATE(rates)}`;
}

export function buildQuestionnairePrompt(
  answers: QuestionnaireAnswers,
  practices?: PracticeEstimation[]
): string {
  const estimatedEnd = getEstimatedEndDate(answers.startDate, answers.timeline);
  const rates = answers.rateConfig || DEFAULT_RATES;
  return `You are an expert software project estimator and technical consultant with decades of experience.
A potential client has answered questions about their project.
Analyze their responses and produce a detailed project estimation.
${buildPracticeContext(practices || [])}${buildStartDateContext(answers.startDate)}
<project_details>
Project Type: ${answers.projectType}
Technological Stack: ${answers.techStack?.length ? answers.techStack.join(", ") : "Not specified"}
Description: ${answers.projectDescription}
Target Audience: ${answers.targetAudience}
Key Features: ${answers.keyFeatures}
Platform Requirements: ${answers.platformRequirements}
Integrations: ${answers.integrations}
Design Requirements: ${answers.designRequirements}
Potential Start Date: ${answers.startDate || "Not specified"}
Desired Timeline: ${answers.timeline}
${estimatedEnd ? `Estimated End Date: ${estimatedEnd}` : ""}
Budget Range: ${answers.budgetRange}
Team Preferences: ${answers.teamPreferences}
Additional Notes: ${answers.additionalNotes}
</project_details>

${ESTIMATION_INSTRUCTIONS_TEMPLATE(rates)}`;
}

export function buildConfidencePrompt(estimation: Estimation, practices?: PracticeEstimation[]): string {
  const costLines = estimation.costBreakdown.map((item, i) => ({
    index: i,
    phase: item.phase,
    category: item.category,
    description: item.description,
    roles: item.roles,
    totalHours: item.totalHours,
    totalMD: item.totalMD,
    totalCost: item.totalCost,
  }));

  let practiceContext = "";
  if (practices && practices.length > 0) {
    const practiceSummaries = practices.map((p) => {
      let summary = `- ${p.projectName} (${p.projectType}): ${p.description?.slice(0, 200)}`;
      if (p.totalMD) summary += ` | Total MDs: ${p.totalMD}`;
      if (p.actualCost) summary += ` | Cost: $${p.actualCost.toLocaleString()}`;
      const roleParts: string[] = [];
      if (p.csMD) roleParts.push(`CS: ${p.csMD} MD`);
      if (p.devMD) roleParts.push(`Dev: ${p.devMD} MD`);
      if (p.arMD) roleParts.push(`AR: ${p.arMD} MD`);
      if (p.pmMD) roleParts.push(`PM: ${p.pmMD} MD`);
      if (p.qaMD) roleParts.push(`QA: ${p.qaMD} MD`);
      if (roleParts.length > 0) summary += ` | Roles: ${roleParts.join(", ")}`;
      return summary;
    }).join("\n");

    practiceContext = `

IMPORTANT - Historical Practice Data for Calibration:
Compare each line item against these REAL completed projects. If a similar scope/category exists in practice data, use the actual hours/costs to calibrate confidence. Items that closely match historical data should receive +10-15% confidence boost.

${practiceSummaries}
`;
  }

  return `You are a senior project estimation reviewer. Your job is to critically evaluate each line item in a cost breakdown and assign a confidence score from 0-100 based on how reliable and accurate the estimate is.

Consider these factors for each line item:
- Is the scope well-defined? (higher confidence)
- Are the role-based rates realistic for the market? (higher confidence)
- Is the hour distribution across roles reasonable? (higher confidence)
- Is there ambiguity or risk that could blow up the estimate? (lower confidence)
- Is this a common, well-understood type of work? (higher confidence)
- Is this novel or experimental work? (lower confidence)
${practiceContext}
Here is the project summary:
${estimation.summary}

Here are the cost line items to review:
${JSON.stringify(costLines, null, 2)}

Return ONLY a valid JSON array of objects. For each item include:
- index: the line item index
- confidence: score 0-100
- optimisticHours: best-case hours (typically 70-85% of totalHours for well-defined work, 50-70% for uncertain)
- pessimisticHours: worst-case hours (typically 120-150% of totalHours for well-defined work, 150-250% for uncertain)

[
  { "index": 0, "confidence": 85, "optimisticHours": 32, "pessimisticHours": 56 },
  { "index": 1, "confidence": 70, "optimisticHours": 24, "pessimisticHours": 60 },
  ...
]

Be critical and realistic. Most items should be between 50-90. Only give 90+ for very well-defined, standard work. Give below 50 for highly uncertain items.`;
}

export function buildRefinePrompt(
  estimation: Estimation,
  item: import("./types").CostItem,
  userNotes?: string,
  practices?: PracticeEstimation[]
): string {
  let practiceContext = "";
  if (practices && practices.length > 0) {
    practiceContext = `\n\nHistorical project data for calibration:\n${practices.map((p) => `- ${p.projectName}: ${p.description?.slice(0, 150)} (Total MDs: ${p.totalMD || "N/A"}, Cost: $${p.actualCost?.toLocaleString() || "N/A"})`).join("\n")}`;
  }

  return `You are a senior project estimation expert. Re-evaluate the following cost line item with more detail and precision. Provide an improved estimate with higher confidence.

Project: ${estimation.projectName}
Summary: ${estimation.summary}
${userNotes ? `\nUser notes for refinement: ${userNotes}` : ""}${practiceContext}

Line item to refine:
${JSON.stringify({
  phase: item.phase,
  category: item.category,
  description: item.description,
  roles: item.roles,
  totalHours: item.totalHours,
  totalMD: item.totalMD,
  totalCost: item.totalCost,
  confidence: item.confidence,
}, null, 2)}

Return ONLY a valid JSON object with the refined item. Keep the same phase. Provide more precise hours, improved confidence (should be higher than ${item.confidence}), and three-point estimates:
{
  "phase": "${item.phase}",
  "category": "string - same or improved category name",
  "description": "string - more detailed description",
  "roles": [{ "role": "CS"|"Dev"|"AR"|"PM"|"QA", "hours": number, "rate": number, "cost": number }],
  "totalHours": number,
  "totalMD": number,
  "totalCost": number,
  "confidence": number,
  "optimisticHours": number,
  "pessimisticHours": number
}`;
}

export function buildDecomposePrompt(
  estimation: Estimation,
  item: import("./types").CostItem,
  practices?: PracticeEstimation[]
): string {
  let practiceContext = "";
  if (practices && practices.length > 0) {
    practiceContext = `\n\nHistorical project data for calibration:\n${practices.map((p) => `- ${p.projectName}: ${p.description?.slice(0, 150)} (Total MDs: ${p.totalMD || "N/A"}, Cost: $${p.actualCost?.toLocaleString() || "N/A"})`).join("\n")}`;
  }

  return `You are a senior project estimation expert. Break down the following vague cost line item into 2-4 specific, well-defined sub-items.

Project: ${estimation.projectName}
Summary: ${estimation.summary}
${practiceContext}

Line item to decompose:
${JSON.stringify({
  phase: item.phase,
  category: item.category,
  description: item.description,
  roles: item.roles,
  totalHours: item.totalHours,
  totalMD: item.totalMD,
  totalCost: item.totalCost,
  confidence: item.confidence,
}, null, 2)}

IMPORTANT:
- Each sub-item must inherit the phase "${item.phase}"
- Sub-items must sum to approximately the original total (within 10%): ~${item.totalHours} hours, ~${item.totalCost} cost
- Each sub-item should be specific and well-defined with its own role breakdown
- Each sub-item should have higher confidence than the original (${item.confidence})

Return ONLY a valid JSON array of 2-4 sub-items:
[
  {
    "phase": "${item.phase}",
    "category": "string - specific sub-category",
    "description": "string - clear, specific description",
    "roles": [{ "role": "CS"|"Dev"|"AR"|"PM"|"QA", "hours": number, "rate": number, "cost": number }],
    "totalHours": number,
    "totalMD": number,
    "totalCost": number,
    "confidence": number,
    "optimisticHours": number,
    "pessimisticHours": number
  }
]`;
}
