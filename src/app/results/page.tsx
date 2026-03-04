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
} from "lucide-react";
import EstimationResults from "@/components/EstimationResults";
import { CostBreakdownHandlers } from "@/components/CostBreakdown";
import { Estimation, PracticeEstimation, CostItem, RoleBreakdown } from "@/lib/types";
import { HOURS_PER_MD } from "@/lib/constants";
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

export default function ResultsPage() {
  const router = useRouter();
  const [estimation, setEstimation] = useState<Estimation | null>(null);
  const [saved, setSaved] = useState(false);

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
  }, [router]);

  if (!estimation) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  const handleNewEstimate = () => {
    sessionStorage.removeItem("estimation");
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

  const costHandlers: CostBreakdownHandlers = {
    onConfirm: handleConfirm,
    onOverrideConfidence: handleOverrideConfidence,
    onRefine: handleRefine,
    onDecompose: handleDecompose,
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 no-print">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="flex gap-3">
          <button
            onClick={handleSaveToPractice}
            disabled={saved}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Saved to Practice</span>
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Save to Practice
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleNewEstimate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <RotateCcw className="h-4 w-4" />
            New Estimate
          </button>
        </div>
      </div>

      <EstimationResults estimation={estimation} costHandlers={costHandlers} onUpdateEstimation={updateEstimation} />
    </div>
  );
}
