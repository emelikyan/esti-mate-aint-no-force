export interface Estimation {
  projectName: string;
  summary: string;
  phases: Phase[];
  timeline: TimelineItem[];
  costBreakdown: CostItem[];
  totalCost: { min: number; max: number; currency: string };
  team: TeamRole[];
  risks: Risk[];
  deliverables: Deliverable[];
  assumptions: string[];
  limitations: string[];
  customComponents: CustomComponent[];
}

export interface Phase {
  name: string;
  description: string;
  durationWeeks: number;
  order: number;
}

export interface TimelineItem {
  phase: string;
  startWeek: number;
  endWeek: number;
  startDate?: string;
  endDate?: string;
  milestones: string[];
}

export interface CostItem {
  phase: "Blueprint" | "Implementation" | "UAT & Go-Live";
  category: string;
  description: string;
  estimatedHours: { min: number; max: number };
  hourlyRate: number;
  totalCost: { min: number; max: number };
  confidence: number;
}

export interface TeamRole {
  role: string;
  count: number;
  responsibilities: string[];
  requiredSkills: string[];
}

export interface Risk {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  likelihood: "low" | "medium" | "high";
  mitigation: string;
}

export interface Deliverable {
  name: string;
  description: string;
  phase: string;
  type: "document" | "software" | "design" | "infrastructure" | "other";
}

export interface CustomComponent {
  name: string;
  description: string;
  complexity: "low" | "medium" | "high";
  estimatedHours: number;
}

export interface QuestionnaireAnswers {
  projectType: string;
  techStack: string[];
  projectDescription: string;
  targetAudience: string;
  keyFeatures: string;
  platformRequirements: string;
  integrations: string;
  designRequirements: string;
  timeline: string;
  startDate: string;
  budgetRange: string;
  teamPreferences: string;
  additionalNotes: string;
}

export interface PracticeEstimation {
  id: string;
  projectName: string;
  projectType: string;
  description: string;
  actualTimeline: string;
  actualCost: number;
  teamSize: number;
  techStack: string;
  lessonsLearned: string;
}
