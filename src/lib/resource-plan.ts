import { Estimation } from "./types";
import { ROLE_LABELS } from "./constants";

type RoleKey = "CS" | "Dev" | "AR" | "PM" | "QA";
const ROLES: RoleKey[] = ["CS", "Dev", "AR", "PM", "QA"];

export interface ResourcePlanRow {
  role: RoleKey;
  roleLabel: string;
  weeks: number[]; // hours/day for each week (0 = no allocation)
}

export interface ResourceGap {
  startWeek: number; // 1-indexed week number
  endWeek: number;   // 1-indexed week number
  durationWeeks: number;
}

export interface ResourcePlan {
  totalWeeks: number;
  weekLabels: string[];
  rows: ResourcePlanRow[];
  totals: number[]; // total hours/day per week across all roles
  gaps: ResourceGap[];
  totalIdleWeeks: number;
}

/**
 * Build a week-by-week resource allocation plan from estimation data.
 *
 * Algorithm:
 * - For each timeline phase, get startWeek and endWeek
 * - For each cost item in that phase, get role hours
 * - Distribute each role's hours evenly across the weeks of the parent phase
 * - Convert to hours/day: weeklyHours / 5 (5 working days)
 * - Sum across all cost items per role per week
 */
export function buildResourcePlan(estimation: Estimation): ResourcePlan {
  const { timeline, costBreakdown } = estimation;

  if (timeline.length === 0 || costBreakdown.length === 0) {
    return { totalWeeks: 0, weekLabels: [], rows: [], totals: [], gaps: [], totalIdleWeeks: 0 };
  }

  const totalWeeks = Math.max(...timeline.map((t) => t.endWeek));

  // Build a phase -> week range lookup
  const phaseWeeks = new Map<string, { start: number; end: number }>();
  for (const t of timeline) {
    phaseWeeks.set(t.phase, { start: t.startWeek, end: t.endWeek });
  }

  // Resolve a cost item's phase to one or more timeline week ranges.
  // Handles exact match, prefix match (e.g. "Implementation" matches
  // "Implementation - Foundation" and "Implementation - Advanced"), and
  // case-insensitive match.
  function resolvePhaseRanges(phase: string): { start: number; end: number }[] {
    // Exact match
    const exact = phaseWeeks.get(phase);
    if (exact) return [exact];

    // Prefix match: cost phase "Implementation" matches timeline phases
    // like "Implementation - Foundation", "Implementation - Advanced"
    const matches: { start: number; end: number }[] = [];
    const phaseLower = phase.toLowerCase();
    for (const [tlPhase, range] of phaseWeeks) {
      if (tlPhase.toLowerCase().startsWith(phaseLower)) {
        matches.push(range);
      }
    }
    if (matches.length > 0) return matches;

    // Reverse prefix: timeline "Blueprint" matches cost "Blueprint - Discovery"
    for (const [tlPhase, range] of phaseWeeks) {
      if (phaseLower.startsWith(tlPhase.toLowerCase())) {
        matches.push(range);
      }
    }
    return matches;
  }

  // Accumulate hours per role per week (1-indexed weeks, stored 0-indexed)
  const roleWeeklyHours: Record<RoleKey, number[]> = {
    CS: new Array(totalWeeks).fill(0),
    Dev: new Array(totalWeeks).fill(0),
    AR: new Array(totalWeeks).fill(0),
    PM: new Array(totalWeeks).fill(0),
    QA: new Array(totalWeeks).fill(0),
  };

  for (const item of costBreakdown) {
    const ranges = resolvePhaseRanges(item.phase);
    if (ranges.length === 0) continue;

    // Total weeks across all matching ranges
    const totalMatchWeeks = ranges.reduce((s, r) => s + (r.end - r.start + 1), 0);
    if (totalMatchWeeks <= 0) continue;

    for (const rb of item.roles) {
      const role = rb.role as RoleKey;
      if (!roleWeeklyHours[role]) continue;

      const hoursPerWeek = rb.hours / totalMatchWeeks;
      const hoursPerDay = hoursPerWeek / 5;

      for (const range of ranges) {
        for (let w = range.start; w <= range.end; w++) {
          roleWeeklyHours[role][w - 1] += hoursPerDay;
        }
      }
    }
  }

  // Build week labels
  const weekLabels = buildWeekLabels(totalWeeks, timeline);

  // Build rows, filtering out roles with zero allocation
  const rows: ResourcePlanRow[] = [];
  for (const role of ROLES) {
    const hasAllocation = roleWeeklyHours[role].some((h) => h > 0);
    if (!hasAllocation) continue;

    rows.push({
      role,
      roleLabel: ROLE_LABELS[role] || role,
      weeks: roleWeeklyHours[role].map((h) => round1(h)),
    });
  }

  // Compute totals per week
  const totals = new Array(totalWeeks).fill(0);
  for (const row of rows) {
    for (let i = 0; i < totalWeeks; i++) {
      totals[i] += row.weeks[i];
    }
  }

  const roundedTotals = totals.map((t) => round1(t));

  // Detect gaps: consecutive weeks where all roles have 0 allocation
  const gaps: ResourceGap[] = [];
  let gapStart: number | null = null;
  for (let i = 0; i < totalWeeks; i++) {
    const isEmpty = roundedTotals[i] === 0;
    if (isEmpty && gapStart === null) {
      gapStart = i;
    } else if (!isEmpty && gapStart !== null) {
      gaps.push({
        startWeek: gapStart + 1,
        endWeek: i,
        durationWeeks: i - gapStart,
      });
      gapStart = null;
    }
  }
  if (gapStart !== null) {
    gaps.push({
      startWeek: gapStart + 1,
      endWeek: totalWeeks,
      durationWeeks: totalWeeks - gapStart,
    });
  }
  const totalIdleWeeks = gaps.reduce((s, g) => s + g.durationWeeks, 0);

  return {
    totalWeeks,
    weekLabels,
    rows,
    totals: roundedTotals,
    gaps,
    totalIdleWeeks,
  };
}

function buildWeekLabels(
  totalWeeks: number,
  timeline: Estimation["timeline"]
): string[] {
  const hasDates = timeline.some((t) => t.startDate && t.startDate !== "");

  if (!hasDates) {
    return Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);
  }

  // Try to generate date-based labels
  const firstPhase = timeline.find((t) => t.startDate);
  if (!firstPhase?.startDate) {
    return Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);
  }

  const startDate = new Date(firstPhase.startDate + "T12:00:00");
  if (isNaN(startDate.getTime())) {
    return Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);
  }

  // Adjust start to the beginning: week 1 starts at startDate
  const weekOffset = firstPhase.startWeek - 1;
  const projectStart = new Date(startDate);
  projectStart.setDate(projectStart.getDate() - weekOffset * 7);

  return Array.from({ length: totalWeeks }, (_, i) => {
    const weekStart = new Date(projectStart);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const month = weekStart.toLocaleString("en-US", { month: "short" });
    const day = weekStart.getDate();
    return `W${i + 1} (${month} ${day})`;
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Strip gap weeks from a resource plan, returning a compressed copy.
 */
export function compressResourcePlan(plan: ResourcePlan): ResourcePlan {
  if (plan.gaps.length === 0) return plan;

  // Build set of 0-indexed week indices to remove
  const removeIndices = new Set<number>();
  for (const gap of plan.gaps) {
    for (let w = gap.startWeek - 1; w < gap.startWeek - 1 + gap.durationWeeks; w++) {
      removeIndices.add(w);
    }
  }

  const filter = <T,>(arr: T[]): T[] => arr.filter((_, i) => !removeIndices.has(i));

  return {
    totalWeeks: plan.totalWeeks - removeIndices.size,
    weekLabels: filter(plan.weekLabels),
    rows: plan.rows.map((row) => ({ ...row, weeks: filter(row.weeks) })),
    totals: filter(plan.totals),
    gaps: [],
    totalIdleWeeks: 0,
  };
}

/**
 * Optimize an estimation's timeline by removing idle gap weeks.
 * Uses the same gap detection as buildResourcePlan so behavior is consistent.
 * Returns a new Estimation with shifted timeline weeks and dates.
 */
export function optimizeTimeline(estimation: Estimation): Estimation {
  // First, detect gaps using the resource plan
  const plan = buildResourcePlan(estimation);
  if (plan.gaps.length === 0) return estimation;

  // Build a mapping: for each original 1-indexed week, what's the new week number
  // after removing gap weeks?
  const gapWeeks = new Set<number>();
  for (const gap of plan.gaps) {
    for (let w = gap.startWeek; w < gap.startWeek + gap.durationWeeks; w++) {
      gapWeeks.add(w);
    }
  }

  // weekMap[oldWeek] = newWeek (1-indexed)
  const weekMap = new Map<number, number>();
  let newWeek = 1;
  for (let w = 1; w <= plan.totalWeeks; w++) {
    if (!gapWeeks.has(w)) {
      weekMap.set(w, newWeek);
      newWeek++;
    }
  }

  // Shift timeline phases
  const timeline = estimation.timeline
    .map((t) => ({ ...t }))
    .sort((a, b) => a.startWeek - b.startWeek);

  for (const phase of timeline) {
    const newStart = weekMap.get(phase.startWeek);
    const newEnd = weekMap.get(phase.endWeek);
    if (newStart == null || newEnd == null) continue;

    const weekShift = phase.startWeek - newStart;
    phase.startWeek = newStart;
    phase.endWeek = newEnd;

    if (weekShift > 0) {
      if (phase.startDate) {
        const sd = new Date(phase.startDate + "T12:00:00");
        if (!isNaN(sd.getTime())) {
          sd.setDate(sd.getDate() - weekShift * 7);
          phase.startDate = sd.toISOString().slice(0, 10);
        }
      }
      if (phase.endDate) {
        const ed = new Date(phase.endDate + "T12:00:00");
        if (!isNaN(ed.getTime())) {
          ed.setDate(ed.getDate() - weekShift * 7);
          phase.endDate = ed.toISOString().slice(0, 10);
        }
      }
    }
  }

  return {
    ...estimation,
    timeline,
  };
}

/**
 * Build resource plan data as array-of-arrays for XLSX export.
 */
export function buildResourcePlanAOA(plan: ResourcePlan): (string | number)[][] {
  if (plan.totalWeeks === 0) return [];

  const rows: (string | number)[][] = [];

  // Header row
  rows.push(["Role", ...plan.weekLabels]);

  // Data rows
  for (const row of plan.rows) {
    rows.push([
      row.roleLabel,
      ...row.weeks.map((h) => (h === 0 ? "" : h)),
    ]);
  }

  // Totals row
  rows.push([
    "Total (hrs/day)",
    ...plan.totals.map((t) => (t === 0 ? "" : t)),
  ]);

  return rows;
}
