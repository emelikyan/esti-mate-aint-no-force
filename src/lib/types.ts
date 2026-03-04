export interface RoleBreakdown {
  role: "CS" | "Dev" | "AR" | "PM" | "QA";
  hours: number;
  rate: number;
  cost: number;
}

export interface CostItem {
  phase: "Blueprint" | "Implementation" | "UAT & Go-Live";
  category: string;
  description: string;
  roles: RoleBreakdown[];
  totalHours: number;
  totalMD: number;
  totalCost: number;
  confidence: number;
  optimisticHours?: number;
  pessimisticHours?: number;
  confirmed?: boolean;
  userConfidence?: number;
  startDate?: string;
  endDate?: string;
}

export interface Estimation {
  projectName: string;
  summary: string;
  phases: Phase[];
  timeline: TimelineItem[];
  costBreakdown: CostItem[];
  totalCost: { amount: number; currency: string };
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

export interface RateConfig {
  currency: string;
  csRate: number;
  devRate: number;
  arRate: number;
  pmPercent: number;
  qaPercent: number;
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
  rateConfig: RateConfig;
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
  // Man-days (raw values from CSV)
  csMD?: number;
  devMD?: number;
  arMD?: number;
  pmMD?: number;
  qaMD?: number;
  totalMD?: number;
  // Hours (converted: MD * HOURS_PER_MD)
  csHours?: number;
  devHours?: number;
  arHours?: number;
  pmHours?: number;
  qaHours?: number;
  csRate?: number;
  devRate?: number;
  arRate?: number;
  pmRate?: number;
  qaRate?: number;
  currency?: string;
  fullEstimation?: string;
}
