import { RateConfig } from "./types";

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
  {
    id: "rates",
    title: "Rates & Configuration",
    fields: ["rateConfig"],
  },
];

/** URL for default practice library seed (used when localStorage is empty). */
export const PRACTICE_SEED_URL = "/data/practice-seed.json";

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

export const HOURS_PER_MD = 8;
export const DEFAULT_PM_PERCENT = 15;
export const DEFAULT_QA_PERCENT = 20;

export const DEFAULT_RATES: RateConfig = {
  currency: "USD",
  csRate: 150,
  devRate: 130,
  arRate: 175,
  pmPercent: 15,
  qaPercent: 20,
};

export const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CAD", "AUD", "CHF"];

export const ROLE_LABELS: Record<string, string> = {
  CS: "Consultant",
  Dev: "Developer",
  AR: "Architect",
  PM: "Project Manager",
  QA: "QA Engineer",
};

export const PRESENTATION_STYLES = [
  {
    id: "aggressive",
    name: "Aggressive / Hard Sell",
    description: "Very confident, high energy, direct. Focuses on urgency and strong claims. Common in sales pitches and startup demos.",
  },
  {
    id: "consultative",
    name: "Consultative",
    description: "Acts like an advisor rather than a seller. Asks questions and frames the product as a solution.",
  },
  {
    id: "educational",
    name: "Educational / Teaching",
    description: "Explains concepts clearly. Uses examples, frameworks, and step-by-step breakdowns. Common in technical talks and workshops.",
  },
  {
    id: "storytelling",
    name: "Storytelling",
    description: "Narrative structure: problem → struggle → solution → result. Builds emotional connection. Often used in startup pitches.",
  },
  {
    id: "data-driven",
    name: "Data-Driven",
    description: "Focuses on numbers, research, and benchmarks. Uses charts, comparisons, and metrics. Good for executives and investors.",
  },
  {
    id: "demonstration",
    name: "Demonstration / Live Demo",
    description: "Shows the product working in real time. “Watch this” style. Very effective for software or tools.",
  },
  {
    id: "visionary",
    name: "Visionary / Inspirational",
    description: "Big picture and future-focused. Emphasizes possibilities and impact. “Imagine a world where…”",
  },
  {
    id: "problem-agitation-solution",
    name: "Problem-Agitation-Solution",
    description: "Highlight the problem, make the pain feel real, present the solution. Common in marketing and sales decks.",
  },
  {
    id: "minimalist",
    name: "Minimalist / Apple-Style",
    description: "Few words on slides. Strong visuals. Speaker carries the narrative.",
  },
  {
    id: "interactive",
    name: "Interactive / Conversational",
    description: "Involves the audience with questions or quick exercises.",
  },
] as const;

export type PresentationStyleId = (typeof PRESENTATION_STYLES)[number]["id"];

export type PresentationDensity = "minimal" | "medium" | "full";

/** Theme applied to slides: accent color, subtitle, density, and section titles */
export interface PresentationStyleTheme {
  /** Hex color for PPTX (title bar, accents) */
  accentHex: string;
  /** Tailwind text accent class (e.g. text-amber-400) */
  accentText: string;
  /** Tailwind bg accent class (e.g. bg-amber-500/20) */
  accentBg: string;
  /** Tailwind border accent (e.g. border-amber-500/40) */
  accentBorder: string;
  /** Tagline on title slide */
  subtitle: string;
  density: PresentationDensity;
  /** Title for metrics slide */
  metricsTitle: string;
  /** Title for cost slide */
  costTitle: string;
  /** Optional gradient for slide background (Tailwind), e.g. "from-amber-950/30 to-transparent" */
  bgGradient?: string;
}

export const PRESENTATION_STYLE_THEMES: Record<PresentationStyleId, PresentationStyleTheme> = {
  aggressive: {
    accentHex: "D97706",
    accentText: "text-amber-400",
    accentBg: "bg-amber-500/20",
    accentBorder: "border-amber-500/40",
    subtitle: "Let's get to the point.",
    density: "full",
    metricsTitle: "The numbers",
    costTitle: "Investment",
    bgGradient: "from-amber-950/20 to-transparent",
  },
  consultative: {
    accentHex: "10B981",
    accentText: "text-emerald-400",
    accentBg: "bg-emerald-500/20",
    accentBorder: "border-emerald-500/40",
    subtitle: "Your project, clearly outlined.",
    density: "medium",
    metricsTitle: "At a glance",
    costTitle: "Investment",
    bgGradient: "from-emerald-950/20 to-transparent",
  },
  educational: {
    accentHex: "3B82F6",
    accentText: "text-blue-400",
    accentBg: "bg-blue-500/20",
    accentBorder: "border-blue-500/40",
    subtitle: "Understanding your estimate.",
    density: "full",
    metricsTitle: "Key figures",
    costTitle: "Cost breakdown",
    bgGradient: "from-blue-950/20 to-transparent",
  },
  storytelling: {
    accentHex: "8B5CF6",
    accentText: "text-violet-400",
    accentBg: "bg-violet-500/20",
    accentBorder: "border-violet-500/40",
    subtitle: "The story of your project.",
    density: "medium",
    metricsTitle: "By the numbers",
    costTitle: "The investment",
    bgGradient: "from-violet-950/20 to-transparent",
  },
  "data-driven": {
    accentHex: "06B6D4",
    accentText: "text-cyan-400",
    accentBg: "bg-cyan-500/20",
    accentBorder: "border-cyan-500/40",
    subtitle: "Data and metrics.",
    density: "full",
    metricsTitle: "Key metrics",
    costTitle: "Cost breakdown",
    bgGradient: "from-cyan-950/20 to-transparent",
  },
  demonstration: {
    accentHex: "C026D3",
    accentText: "text-fuchsia-400",
    accentBg: "bg-fuchsia-500/20",
    accentBorder: "border-fuchsia-500/40",
    subtitle: "Here's what we're building.",
    density: "medium",
    metricsTitle: "Overview",
    costTitle: "Budget",
    bgGradient: "from-fuchsia-950/20 to-transparent",
  },
  visionary: {
    accentHex: "EAB308",
    accentText: "text-yellow-400",
    accentBg: "bg-yellow-500/20",
    accentBorder: "border-yellow-500/40",
    subtitle: "Imagine what's possible.",
    density: "medium",
    metricsTitle: "The vision in numbers",
    costTitle: "Investment",
    bgGradient: "from-yellow-950/20 to-transparent",
  },
  "problem-agitation-solution": {
    accentHex: "E11D48",
    accentText: "text-rose-400",
    accentBg: "bg-rose-500/20",
    accentBorder: "border-rose-500/40",
    subtitle: "The challenge and the solution.",
    density: "medium",
    metricsTitle: "Impact at a glance",
    costTitle: "The solution: investment",
    bgGradient: "from-rose-950/20 to-transparent",
  },
  minimalist: {
    accentHex: "64748B",
    accentText: "text-slate-300",
    accentBg: "bg-slate-500/10",
    accentBorder: "border-slate-400/30",
    subtitle: "Less is more.",
    density: "minimal",
    metricsTitle: "At a glance",
    costTitle: "Investment",
    bgGradient: "from-slate-800/30 to-transparent",
  },
  interactive: {
    accentHex: "22C55E",
    accentText: "text-green-400",
    accentBg: "bg-green-500/20",
    accentBorder: "border-green-500/40",
    subtitle: "Let's walk through it.",
    density: "medium",
    metricsTitle: "Quick numbers",
    costTitle: "Budget",
    bgGradient: "from-green-950/20 to-transparent",
  },
};

/** Max items per slide by density */
export function getDensityLimits(density: PresentationDensity): {
  phases: number;
  costRows: number;
  team: number;
  risks: number;
  deliverables: number;
  assumptions: number;
} {
  switch (density) {
    case "minimal":
      return { phases: 3, costRows: 5, team: 4, risks: 3, deliverables: 5, assumptions: 2 };
    case "medium":
      return { phases: 4, costRows: 8, team: 6, risks: 4, deliverables: 7, assumptions: 3 };
    case "full":
      return { phases: 6, costRows: 12, team: 8, risks: 6, deliverables: 10, assumptions: 5 };
  }
}

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
