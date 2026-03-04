import { QuestionnaireAnswers, PracticeEstimation, Estimation } from "./types";
import { getEstimatedEndDate } from "./constants";

const ESTIMATION_INSTRUCTIONS = `
Produce a comprehensive project estimation in JSON format. Be realistic and thorough.
For cost estimates, use USD and assume market-rate hourly rates for each role.
If information is vague, make reasonable assumptions and list them in the assumptions array.

IMPORTANT: Group ALL cost items into exactly three phases:
- "Blueprint" - Discovery, requirements gathering, architecture design, UX/UI design, project planning
- "Implementation" - Development, coding, integration, unit testing, code reviews
- "UAT & Go-Live" - User acceptance testing, bug fixing, deployment, training, documentation, post-launch support

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
      "estimatedHours": { "min": number, "max": number },
      "hourlyRate": number,
      "totalCost": { "min": number, "max": number },
      "confidence": 0
    }
  ],
  "totalCost": { "min": number, "max": number, "currency": "USD" },
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
Lessons Learned: ${p.lessonsLearned}
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
The project is planned to start on ${startDate}. Calculate actual calendar dates (YYYY-MM-DD format) for all timeline startDate and endDate fields based on this start date. Assume 5 working days per week.
`;
}

export function buildRfpPrompt(
  documentText: string,
  startDate?: string,
  practices?: PracticeEstimation[]
): string {
  return `You are an expert software project estimator and technical consultant with decades of experience.
You have been given the following RFP (Request for Proposal) document text.
Analyze it thoroughly and produce a detailed project estimation.
${buildPracticeContext(practices || [])}${buildStartDateContext(startDate)}
<rfp_document>
${documentText}
</rfp_document>

${ESTIMATION_INSTRUCTIONS}`;
}

export function buildQuestionnairePrompt(
  answers: QuestionnaireAnswers,
  practices?: PracticeEstimation[]
): string {
  const estimatedEnd = getEstimatedEndDate(answers.startDate, answers.timeline);
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

${ESTIMATION_INSTRUCTIONS}`;
}

export function buildConfidencePrompt(estimation: Estimation): string {
  const costLines = estimation.costBreakdown.map((item, i) => ({
    index: i,
    phase: item.phase,
    category: item.category,
    description: item.description,
    estimatedHours: item.estimatedHours,
    hourlyRate: item.hourlyRate,
    totalCost: item.totalCost,
  }));

  return `You are a senior project estimation reviewer. Your job is to critically evaluate each line item in a cost breakdown and assign a confidence score from 0-100 based on how reliable and accurate the estimate is.

Consider these factors for each line item:
- Is the scope well-defined? (higher confidence)
- Is the hourly rate realistic for the market? (higher confidence)
- Is the hour range reasonable for the described work? (higher confidence)
- Is there ambiguity or risk that could blow up the estimate? (lower confidence)
- Is this a common, well-understood type of work? (higher confidence)
- Is this novel or experimental work? (lower confidence)

Here is the project summary:
${estimation.summary}

Here are the cost line items to review:
${JSON.stringify(costLines, null, 2)}

Return ONLY a valid JSON array of objects with index and confidence score (0-100):
[
  { "index": 0, "confidence": 85 },
  { "index": 1, "confidence": 70 },
  ...
]

Be critical and realistic. Most items should be between 50-90. Only give 90+ for very well-defined, standard work. Give below 50 for highly uncertain items.`;
}
