"use client";

import { Estimation } from "@/lib/types";
import { Calendar, DollarSign, Users } from "lucide-react";
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
}

export default function EstimationResults({
  estimation,
  costHandlers,
  onUpdateEstimation,
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
        <h1 className="text-3xl font-bold text-gray-900">
          {estimation.projectName}
        </h1>
        <p className="mt-2 text-lg text-gray-600">{estimation.summary}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <DollarSign className="h-4 w-4" />
            Estimated Cost
          </div>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {fmt(estimation.totalCost.amount)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{currency}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            Timeline
          </div>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {totalWeeks} weeks
          </p>
          {hasDates && estimation.timeline.length > 0 && (
            <p className="mt-0.5 text-sm text-gray-500">
              {estimation.timeline[0].startDate} &rarr;{" "}
              {estimation.timeline[estimation.timeline.length - 1].endDate}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            Team Size
          </div>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {totalTeamSize} {totalTeamSize === 1 ? "person" : "people"}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <PhaseTimeline
          phases={estimation.phases}
          timeline={estimation.timeline}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <CostBreakdown estimation={estimation} handlers={costHandlers} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ResourcePlan estimation={estimation} onUpdateEstimation={onUpdateEstimation} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <CustomComponentsList
          components={estimation.customComponents}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <TeamComposition team={estimation.team} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <RiskAssessment risks={estimation.risks} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <AssumptionsLimitations
          assumptions={estimation.assumptions}
          limitations={estimation.limitations}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <DeliverablesList
          deliverables={estimation.deliverables}
          phases={estimation.phases}
        />
      </div>
    </div>
  );
}
