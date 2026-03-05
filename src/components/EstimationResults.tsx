"use client";

import { Estimation } from "@/lib/types";
import { AlertTriangle, Calendar, DollarSign, Users } from "lucide-react";
import PhaseTimeline from "./PhaseTimeline";
import CostBreakdown, { CostBreakdownHandlers } from "./CostBreakdown";
import TeamComposition from "./TeamComposition";
import RiskAssessment from "./RiskAssessment";
import DeliverablesList from "./DeliverablesList";
import AssumptionsLimitations from "./AssumptionsLimitations";
import ResourcePlan from "./ResourcePlan";
import CustomComponentsList from "./CustomComponentsList";

interface EstimationResultsProps {
  estimation: Estimation;
  costHandlers?: CostBreakdownHandlers;
  onUpdateEstimation?: (updated: Estimation) => void;
  timelineOutdated?: boolean;
  timelineJustRecalculated?: boolean;
  onRecalculateTimeline?: () => void;
  isRecalculatingTimeline?: boolean;
}

export default function EstimationResults({
  estimation,
  costHandlers,
  onUpdateEstimation,
  timelineOutdated,
  timelineJustRecalculated,
  onRecalculateTimeline,
  isRecalculatingTimeline,
}: EstimationResultsProps) {
  const currency = estimation.totalCost.currency || "USD";

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  const totalWeeks =
    estimation.timeline.length > 0
      ? Math.max(...estimation.timeline.map((t) => t.endWeek))
      : estimation.phases.reduce((sum, p) => sum + p.durationWeeks, 0);

  const totalTeamSize = estimation.team.reduce((sum, t) => sum + t.count, 0);

  const hasDates = estimation.timeline.some(
    (t) => t.startDate && t.startDate !== ""
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          {estimation.projectName}
        </h1>
        <p className="mt-2 text-lg text-slate-400">{estimation.summary}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <DollarSign className="h-4 w-4" />
            Estimated Cost
          </div>
          <p className="mt-1 text-xl font-bold text-white">
            {fmt(estimation.totalCost.amount)}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{currency}</p>
        </div>
        <div className={`rounded-xl border p-5 backdrop-blur-sm transition-colors ${timelineOutdated ? "border-amber-500/30 bg-amber-500/5" : "border-white/[0.06] bg-white/[0.03]"}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="h-4 w-4" />
              Timeline
            </div>
            {timelineOutdated && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 no-print">
                <AlertTriangle className="h-3 w-3" />
                Outdated
              </span>
            )}
          </div>
          <p className="mt-1 text-xl font-bold text-white">
            {totalWeeks} weeks
          </p>
          {hasDates && estimation.timeline.length > 0 && (
            <p className="mt-0.5 text-sm text-slate-400">
              {estimation.timeline[0].startDate} &rarr;{" "}
              {estimation.timeline[estimation.timeline.length - 1].endDate}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="h-4 w-4" />
            Team Size
          </div>
          <p className="mt-1 text-xl font-bold text-white">
            {totalTeamSize} {totalTeamSize === 1 ? "person" : "people"}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm">
        <PhaseTimeline
          phases={estimation.phases}
          timeline={estimation.timeline}
          isOutdated={timelineOutdated}
          justRecalculated={timelineJustRecalculated}
          onRecalculate={onRecalculateTimeline}
          isRecalculating={isRecalculatingTimeline}
        />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm">
        <CostBreakdown estimation={estimation} handlers={costHandlers} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm">
        <ResourcePlan estimation={estimation} onUpdateEstimation={onUpdateEstimation} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm">
        <CustomComponentsList
          components={estimation.customComponents}
        />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm">
        <TeamComposition team={estimation.team} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm">
        <RiskAssessment risks={estimation.risks} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm">
        <AssumptionsLimitations
          assumptions={estimation.assumptions}
          limitations={estimation.limitations}
        />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm">
        <DeliverablesList
          deliverables={estimation.deliverables}
          phases={estimation.phases}
        />
      </div>
    </div>
  );
}
