export const QUESTIONNAIRE_STEPS = [
  {
    id: "basics",
    title: "Project Basics",
    fields: ["projectType", "techStack", "projectDescription"],
  },
  {
    id: "audience",
    title: "Target & Features",
    fields: ["targetAudience", "keyFeatures"],
  },
  {
    id: "technical",
    title: "Technical Requirements",
    fields: ["platformRequirements", "integrations"],
  },
  {
    id: "design",
    title: "Design & Timeline",
    fields: ["designRequirements", "startDate", "timeline"],
  },
  {
    id: "budget",
    title: "Budget & Team",
    fields: ["budgetRange", "teamPreferences", "additionalNotes"],
  },
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];

export const PROJECT_TYPES = [
  "Web Application",
  "Mobile App",
  "SaaS Platform",
  "E-commerce",
  "API / Backend Service",
  "Desktop Application",
  "Other",
];

export const TIMELINE_OPTIONS = [
  "1-2 months",
  "3-4 months",
  "5-6 months",
  "6-12 months",
  "12+ months",
  "Flexible / Not sure",
];

export const COST_PHASES = [
  "Blueprint",
  "Implementation",
  "UAT & Go-Live",
] as const;

export const BUDGET_OPTIONS = [
  "Under $25,000",
  "$25,000 - $50,000",
  "$50,000 - $100,000",
  "$100,000 - $250,000",
  "$250,000+",
  "Not sure yet",
];

export const TECH_STACK_OPTIONS = [
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Node.js",
  "Python (Django/FastAPI)",
  "Ruby on Rails",
  "PHP (Laravel)",
  "Java / Spring",
  ".NET / C#",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "AWS",
  "Google Cloud",
  "Salesforce",
  "Databricks",
  "Docker / Kubernetes",
  "GraphQL",
  "REST API",
  "TypeScript",
  "Tailwind CSS",
  "Other",
];

/** Approximate duration in months for timeline option; null if flexible/unsure */
export function getTimelineDurationMonths(timeline: string): number | null {
  const map: Record<string, number> = {
    "1-2 months": 1.5,
    "3-4 months": 3.5,
    "5-6 months": 5.5,
    "6-12 months": 9,
    "12+ months": 14,
  };
  return timeline ? map[timeline] ?? null : null;
}

/** Estimated end date string (YYYY-MM-DD) from start date + timeline; null if either missing */
export function getEstimatedEndDate(
  startDateStr: string,
  timeline: string
): string | null {
  const months = getTimelineDurationMonths(timeline);
  if (!startDateStr || months == null) return null;
  const start = new Date(startDateStr + "T12:00:00");
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setMonth(end.getMonth() + Math.round(months));
  return end.toISOString().slice(0, 10);
}
