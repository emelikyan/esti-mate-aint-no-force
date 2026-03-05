"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  RotateCcw,
  BookOpen,
  Check,
  ClipboardList,
  Loader2,
  SlidersHorizontal,
  Presentation,
} from "lucide-react";
import EstimationResults from "@/components/EstimationResults";
import { CostBreakdownHandlers } from "@/components/CostBreakdown";
import WorkshopsModal from "@/components/WorkshopsModal";
import ReconfigureRatesModal from "@/components/ReconfigureRatesModal";
import PresentationModal from "@/components/PresentationModal";
import { Estimation, PracticeEstimation, CostItem, RoleBreakdown, Workshop, RateConfig } from "@/lib/types";
import { HOURS_PER_MD, DEFAULT_RATES, PRACTICE_SEED_URL } from "@/lib/constants";
import { derivePracticeRates } from "@/lib/parse-csv";

const STORAGE_KEY = "practice-estimations";
const RATES_KEY = "practice-rates";

function estimationToPractice(estimation: Estimation): PracticeEstimation {
  const allRoles = estimation.costBreakdown.flatMap((i) => i.roles || []);

  function sumRole(role: RoleBreakdown["role"]): number {
    return allRoles
      .filter((r) => r.role === role)
      .reduce((s, r) => s + r.hours, 0);
  }

  const csHours = sumRole("CS");
  const devHours = sumRole("Dev");
  const arHours = sumRole("AR");
  const pmHours = sumRole("PM");
  const qaHours = sumRole("QA");

  const totalWeeks =
    estimation.timeline.length > 0
      ? Math.max(...estimation.timeline.map((t) => t.endWeek))
      : estimation.phases.reduce((s, p) => s + p.durationWeeks, 0);

  const teamSize = estimation.team.reduce((s, t) => s + t.count, 0);

  // Build description from phases, cost summary, and key deliverables
  const descParts: string[] = [estimation.summary];

  descParts.push(
    `\nCost Breakdown (${estimation.costBreakdown.length} line items):`
  );
  for (const item of estimation.costBreakdown) {
    descParts.push(
      `  ${item.phase} / ${item.category}: ${item.totalHours}h / ${(item.totalMD || item.totalHours / HOURS_PER_MD).toFixed(1)} MD — ${item.description}`
    );
  }

  if (estimation.assumptions.length > 0) {
    descParts.push(`\nAssumptions: ${estimation.assumptions.join("; ")}`);
  }

  return {
    id: crypto.randomUUID(),
    projectName: estimation.projectName,
    projectType: "",
    description: descParts.join("\n"),
    actualTimeline: `${totalWeeks} weeks`,
    actualCost: estimation.totalCost.amount || 0,
    teamSize,
    techStack: "",
    lessonsLearned: "",
    csMD: csHours > 0 ? +(csHours / HOURS_PER_MD).toFixed(1) : undefined,
    devMD: devHours > 0 ? +(devHours / HOURS_PER_MD).toFixed(1) : undefined,
    arMD: arHours > 0 ? +(arHours / HOURS_PER_MD).toFixed(1) : undefined,
    pmMD: pmHours > 0 ? +(pmHours / HOURS_PER_MD).toFixed(1) : undefined,
    qaMD: qaHours > 0 ? +(qaHours / HOURS_PER_MD).toFixed(1) : undefined,
    totalMD:
      csHours + devHours + arHours + pmHours + qaHours > 0
        ? +(
            (csHours + devHours + arHours + pmHours + qaHours) /
            HOURS_PER_MD
          ).toFixed(1)
        : undefined,
    csHours: csHours > 0 ? csHours : undefined,
    devHours: devHours > 0 ? devHours : undefined,
    arHours: arHours > 0 ? arHours : undefined,
    pmHours: pmHours > 0 ? pmHours : undefined,
    qaHours: qaHours > 0 ? qaHours : undefined,
    currency: estimation.totalCost.currency || undefined,
  };
}

function extractRatesFromEstimation(estimation: Estimation): RateConfig {
  let csRate = DEFAULT_RATES.csRate;
  let devRate = DEFAULT_RATES.devRate;
  let arRate = DEFAULT_RATES.arRate;
  let pmPercent = DEFAULT_RATES.pmPercent;
  let qaPercent = DEFAULT_RATES.qaPercent;
  const currency = estimation.totalCost.currency || DEFAULT_RATES.currency;

  // Extract rates from first occurrence of each role
  for (const item of estimation.costBreakdown) {
    for (const r of item.roles) {
      if (r.role === "CS" && r.rate > 0) { csRate = r.rate; break; }
    }
    if (csRate !== DEFAULT_RATES.csRate) break;
  }
  for (const item of estimation.costBreakdown) {
    for (const r of item.roles) {
      if (r.role === "Dev" && r.rate > 0) { devRate = r.rate; break; }
    }
    if (devRate !== DEFAULT_RATES.devRate) break;
  }
  for (const item of estimation.costBreakdown) {
    for (const r of item.roles) {
      if (r.role === "AR" && r.rate > 0) { arRate = r.rate; break; }
    }
    if (arRate !== DEFAULT_RATES.arRate) break;
  }

  // Derive PM% and QA% from actual hours ratios
  let pmRatioSum = 0, pmRatioCount = 0;
  let qaRatioSum = 0, qaRatioCount = 0;
  for (const item of estimation.costBreakdown) {
    const baseHours = item.roles
      .filter((r) => r.role === "CS" || r.role === "Dev" || r.role === "AR")
      .reduce((s, r) => s + r.hours, 0);
    if (baseHours <= 0) continue;
    const pmRole = item.roles.find((r) => r.role === "PM");
    if (pmRole) { pmRatioSum += (pmRole.hours / baseHours) * 100; pmRatioCount++; }
    const qaRole = item.roles.find((r) => r.role === "QA");
    if (qaRole) { qaRatioSum += (qaRole.hours / baseHours) * 100; qaRatioCount++; }
  }
  if (pmRatioCount > 0) pmPercent = Math.round(pmRatioSum / pmRatioCount);
  if (qaRatioCount > 0) qaPercent = Math.round(qaRatioSum / qaRatioCount);

  // Extract PM/QA hourly rates from first occurrence
  let pmRate = 0;
  let qaRate = 0;
  for (const item of estimation.costBreakdown) {
    for (const r of item.roles) {
      if (r.role === "PM" && r.rate > 0 && !pmRate) pmRate = r.rate;
      if (r.role === "QA" && r.rate > 0 && !qaRate) qaRate = r.rate;
    }
    if (pmRate && qaRate) break;
  }

  return { currency, csRate, devRate, arRate, pmPercent, qaPercent, pmRate: pmRate || undefined, qaRate: qaRate || undefined };
}

function applyRatesToEstimation(estimation: Estimation, rates: RateConfig): Estimation {
  const newBreakdown: CostItem[] = estimation.costBreakdown.map((item) => {
    const rateMap: Record<string, number> = {
      CS: rates.csRate,
      Dev: rates.devRate,
      AR: rates.arRate,
    };

    // Update CS/Dev/AR roles with new rates
    const baseRoles: RoleBreakdown[] = item.roles
      .filter((r) => r.role === "CS" || r.role === "Dev" || r.role === "AR")
      .map((r) => ({
        ...r,
        rate: rateMap[r.role],
        cost: r.hours * rateMap[r.role],
      }));

    const baseHours = baseRoles.reduce((s, r) => s + r.hours, 0);

    // Fallback to weighted average rate if no explicit PM/QA rate provided
    const weightedRate =
      baseHours > 0
        ? baseRoles.reduce((s, r) => s + r.hours * r.rate, 0) / baseHours
        : 0;

    const pmRate = rates.pmRate || weightedRate;
    const qaRate = rates.qaRate || weightedRate;

    const newRoles: RoleBreakdown[] = [...baseRoles];

    // PM
    const pmHours = baseHours * rates.pmPercent / 100;
    if (pmHours > 0) {
      newRoles.push({
        role: "PM",
        hours: Math.round(pmHours * 10) / 10,
        rate: Math.round(pmRate * 100) / 100,
        cost: Math.round(pmHours * pmRate * 100) / 100,
      });
    }

    // QA
    const qaHours = baseHours * rates.qaPercent / 100;
    if (qaHours > 0) {
      newRoles.push({
        role: "QA",
        hours: Math.round(qaHours * 10) / 10,
        rate: Math.round(qaRate * 100) / 100,
        cost: Math.round(qaHours * qaRate * 100) / 100,
      });
    }

    const totalHours = newRoles.reduce((s, r) => s + r.hours, 0);
    const totalCost = newRoles.reduce((s, r) => s + r.cost, 0);

    return {
      ...item,
      roles: newRoles,
      totalHours,
      totalMD: totalHours / HOURS_PER_MD,
      totalCost,
    };
  });

  const totalAmount = newBreakdown.reduce((s, i) => s + i.totalCost, 0);

  return {
    ...estimation,
    costBreakdown: newBreakdown,
    totalCost: { amount: totalAmount, currency: rates.currency },
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const [estimation, setEstimation] = useState<Estimation | null>(null);
  const [saved, setSaved] = useState(false);
  const [isRecalculatingTimeline, setIsRecalculatingTimeline] = useState(false);
  const [timelineRecalculated, setTimelineRecalculated] = useState(false);
  // Tracks only edits made in THIS page session — prevents false "outdated" on load
  const [sessionEdited, setSessionEdited] = useState(false);
  const [workshops, setWorkshops] = useState<Workshop[] | null>(null);
  const [workshopsOpen, setWorkshopsOpen] = useState(false);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [isGeneratingWorkshops, setIsGeneratingWorkshops] = useState(false);
  const [workshopsError, setWorkshopsError] = useState<string | null>(null);
  const [presentationOpen, setPresentationOpen] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("estimation");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setEstimation(JSON.parse(stored));
    } catch {
      router.push("/");
    }

    // Seed default practice library when empty (for Save to practice / Refine)
    if (!localStorage.getItem(STORAGE_KEY)) {
      fetch(PRACTICE_SEED_URL)
        .then((res) => (res.ok ? res.json() : []))
        .then((seed: PracticeEstimation[]) => {
          if (seed.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
            const derived = derivePracticeRates(seed);
            if (derived) localStorage.setItem(RATES_KEY, JSON.stringify(derived));
          }
        })
        .catch(() => {});
    }

    const cachedWorkshops = sessionStorage.getItem("workshops");
    if (cachedWorkshops) {
      try {
        setWorkshops(JSON.parse(cachedWorkshops));
      } catch {
        // ignore malformed cache
      }
    }
  }, [router]);

  if (!estimation) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/25 border-t-violet-600" />
      </div>
    );
  }

  const handleNewEstimate = () => {
    sessionStorage.removeItem("estimation");
    sessionStorage.removeItem("workshops");
    router.push("/");
  };

  const handleSaveToPractice = () => {
    const practice = estimationToPractice(estimation);
    practice.fullEstimation = JSON.stringify(estimation);

    // Load existing practices
    let practices: PracticeEstimation[] = [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        practices = JSON.parse(stored);
      } catch {
        // ignore
      }
    }

    // Add and save
    practices.push(practice);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(practices));

    // Update derived rates
    const derived = derivePracticeRates(practices);
    if (derived) {
      localStorage.setItem(RATES_KEY, JSON.stringify(derived));
    }

    setSaved(true);
  };

  const updateEstimation = (updated: Estimation) => {
    // Recalculate totalCost from costBreakdown
    const newTotal = updated.costBreakdown.reduce(
      (s, i) => s + (i.totalCost || 0),
      0
    );
    updated.totalCost = { ...updated.totalCost, amount: newTotal };
    setEstimation({ ...updated });
    sessionStorage.setItem("estimation", JSON.stringify(updated));
  };

  const handleConfirm = (index: number) => {
    const updated = { ...estimation };
    updated.costBreakdown = [...updated.costBreakdown];
    updated.costBreakdown[index] = {
      ...updated.costBreakdown[index],
      confirmed: !updated.costBreakdown[index].confirmed,
    };
    updateEstimation(updated);
  };

  const handleOverrideConfidence = (index: number, value: number) => {
    const updated = { ...estimation };
    updated.costBreakdown = [...updated.costBreakdown];
    updated.costBreakdown[index] = {
      ...updated.costBreakdown[index],
      userConfidence: value,
    };
    updateEstimation(updated);
  };

  const handleRefine = async (index: number, userNotes?: string) => {
    // Load practices from localStorage for calibration
    let practices: PracticeEstimation[] = [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        practices = JSON.parse(stored);
      } catch {
        // ignore
      }
    }

    const res = await fetch("/api/refine-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estimation: {
          summary: estimation.summary,
          projectName: estimation.projectName,
          costBreakdown: estimation.costBreakdown,
        },
        itemIndex: index,
        action: "refine",
        userNotes,
        practices: practices.length > 0 ? practices : undefined,
      }),
    });

    if (!res.ok) throw new Error("Refine failed");
    const { items } = await res.json();
    if (!items || items.length === 0) return;

    const updated = { ...estimation };
    updated.costBreakdown = [...updated.costBreakdown];
    updated.costBreakdown[index] = items[0];
    updateEstimation(updated);
  };

  const handleDecompose = async (index: number) => {
    let practices: PracticeEstimation[] = [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        practices = JSON.parse(stored);
      } catch {
        // ignore
      }
    }

    const res = await fetch("/api/refine-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estimation: {
          summary: estimation.summary,
          projectName: estimation.projectName,
          costBreakdown: estimation.costBreakdown,
        },
        itemIndex: index,
        action: "decompose",
        practices: practices.length > 0 ? practices : undefined,
      }),
    });

    if (!res.ok) throw new Error("Decompose failed");
    const { items } = await res.json();
    if (!items || items.length === 0) return;

    const updated = { ...estimation };
    updated.costBreakdown = [...updated.costBreakdown];
    // Replace the single item with the decomposed sub-items
    updated.costBreakdown.splice(index, 1, ...items);
    updateEstimation(updated);
  };

  const handleEditHours = (index: number, newRoles: RoleBreakdown[]) => {
    const updated = { ...estimation };
    updated.costBreakdown = [...updated.costBreakdown];
    const item = updated.costBreakdown[index];

    const newTotalHours = newRoles.reduce((s, r) => s + r.hours, 0);
    const newTotalCost = newRoles.reduce((s, r) => s + r.cost, 0);

    updated.costBreakdown[index] = {
      ...item,
      roles: newRoles,
      totalHours: newTotalHours,
      totalMD: newTotalHours / HOURS_PER_MD,
      totalCost: newTotalCost,
      // Preserve original AI roles on first edit
      originalRoles: item.originalRoles ?? item.roles,
    };
    updateEstimation(updated);
    setSessionEdited(true);
    setTimelineRecalculated(false); // new edit invalidates the timeline again
  };

  const handleRecalculateTimeline = async () => {
    if (!estimation) return;
    setIsRecalculatingTimeline(true);
    try {
      const res = await fetch("/api/recalculate-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimation }),
      });
      if (!res.ok) throw new Error("Recalculate failed");
      const { phases, timeline } = await res.json();
      updateEstimation({ ...estimation, phases, timeline });
      setTimelineRecalculated(true);
    } catch (err) {
      console.error("Failed to recalculate timeline:", err);
    } finally {
      setIsRecalculatingTimeline(false);
    }
  };

  const handleOpenWorkshops = async () => {
    setWorkshopsOpen(true);
    if (workshops !== null) return; // already generated (even if empty)
    generateWorkshopsList();
  };

  const generateWorkshopsList = async () => {
    setWorkshopsError(null);
    setWorkshops(null);
    setIsGeneratingWorkshops(true);
    try {
      const res = await fetch("/api/generate-workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimation }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const { workshops: generated } = await res.json();
      if (!Array.isArray(generated) || generated.length === 0) {
        throw new Error("No workshops were returned. Please try again.");
      }
      setWorkshops(generated);
      sessionStorage.setItem("workshops", JSON.stringify(generated));
    } catch (err) {
      console.error("Failed to generate workshops:", err);
      setWorkshopsError(err instanceof Error ? err.message : "Something went wrong.");
      setWorkshops(null); // allow retry
    } finally {
      setIsGeneratingWorkshops(false);
    }
  };

  const hasEdits = estimation.costBreakdown.some((i) => i.originalRoles);
  const timelineOutdated = sessionEdited && !timelineRecalculated;
  const timelineJustRecalculated = sessionEdited && timelineRecalculated;

  const costHandlers: CostBreakdownHandlers = {
    onConfirm: handleConfirm,
    onOverrideConfidence: handleOverrideConfidence,
    onRefine: handleRefine,
    onDecompose: handleDecompose,
    onEditHours: handleEditHours,
  };

  const btnBase =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer select-none " +
    "bg-slate-800/60 border-slate-600/50 text-slate-200 " +
    "hover:bg-slate-700/80 hover:border-violet-500/40 hover:text-white hover:shadow-lg hover:shadow-violet-500/10 " +
    "active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900";

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 no-print flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <button
          onClick={handleNewEstimate}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.25)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110"
        >
          <RotateCcw className="h-4 w-4" />
          New Estimate
        </button>
      </div>

      <div className="mb-8 no-print">
        <div className="rounded-2xl border border-slate-600/50 bg-slate-800/40 shadow-xl shadow-black/20 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => setRatesOpen(true)}
              className={btnBase}
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
              Reconfigure Rates
            </button>
            <button
              onClick={handleOpenWorkshops}
              disabled={isGeneratingWorkshops}
              className={`${btnBase} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-slate-800/60 disabled:hover:border-slate-600/50 disabled:hover:shadow-none`}
            >
              {isGeneratingWorkshops ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <ClipboardList className="h-4 w-4 shrink-0" />
              )}
              Workshops
            </button>
            {estimation.source !== "csv" && (
              <button
                onClick={handleSaveToPractice}
                disabled={saved}
                className={`${btnBase} disabled:cursor-default ${saved ? "text-green-400 border-green-500/40 bg-green-500/10 hover:bg-green-500/15 hover:border-green-500/50" : ""}`}
              >
                {saved ? (
                  <Check className="h-4 w-4 shrink-0 text-green-400" />
                ) : (
                  <BookOpen className="h-4 w-4 shrink-0" />
                )}
                {saved ? "Saved to Practice" : "Save to Practice"}
              </button>
            )}
            <button
              onClick={() => setPresentationOpen(true)}
              className={btnBase}
            >
              <Presentation className="h-4 w-4 shrink-0" />
              Convert to Presentation
            </button>
            <button
              onClick={() => window.print()}
              className={btnBase}
            >
              <Printer className="h-4 w-4 shrink-0" />
              Print
            </button>
          </div>
        </div>
      </div>

      {estimation.source === "csv" && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          <strong>Loaded from CSV</strong> — Cost data was imported from a CSV file.
          Phases, timeline, team, risks, and confidence scores were AI-generated based on the imported data.
        </div>
      )}

      <EstimationResults
        estimation={estimation}
        costHandlers={costHandlers}
        onUpdateEstimation={updateEstimation}
        timelineOutdated={timelineOutdated}
        timelineJustRecalculated={timelineJustRecalculated}
        onRecalculateTimeline={handleRecalculateTimeline}
        isRecalculatingTimeline={isRecalculatingTimeline}
      />

      {ratesOpen && estimation && (
        <ReconfigureRatesModal
          currentRates={extractRatesFromEstimation(estimation)}
          onApply={(newRates) => {
            const updated = applyRatesToEstimation(estimation, newRates);
            updateEstimation(updated);
            setSessionEdited(true);
            setTimelineRecalculated(false);
            setRatesOpen(false);
          }}
          onClose={() => setRatesOpen(false)}
        />
      )}

      {workshopsOpen && (
        <WorkshopsModal
          workshops={workshops ?? []}
          projectName={estimation.projectName}
          isLoading={isGeneratingWorkshops}
          error={workshopsError}
          onRetry={generateWorkshopsList}
          onClose={() => setWorkshopsOpen(false)}
        />
      )}

      {presentationOpen && (
        <PresentationModal
          estimation={estimation}
          onClose={() => setPresentationOpen(false)}
        />
      )}
    </div>
  );
}
