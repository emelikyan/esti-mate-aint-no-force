"use client";

import { CostItem } from "@/lib/types";
import { COST_PHASES } from "@/lib/constants";

interface CostBreakdownProps {
  costBreakdown: CostItem[];
  totalCost: { min: number; max: number; currency: string };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

function ConfidenceBadge({ score }: { score: number }) {
  if (score === 0) return null;
  const color =
    score >= 80
      ? "bg-green-50 text-green-700"
      : score >= 60
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {score}%
    </span>
  );
}

export default function CostBreakdown({
  costBreakdown,
  totalCost,
}: CostBreakdownProps) {
  const grouped = new Map<string, CostItem[]>();
  for (const phase of COST_PHASES) {
    grouped.set(phase, []);
  }
  for (const item of costBreakdown) {
    const list = grouped.get(item.phase) || [];
    list.push(item);
    grouped.set(item.phase, list);
  }

  const phaseColors: Record<string, string> = {
    Blueprint: "border-l-slate-600",
    Implementation: "border-l-blue-600",
    "UAT & Go-Live": "border-l-emerald-600",
  };

  return (
    <section>
      <h3 className="text-xl font-semibold text-slate-900">Cost Breakdown</h3>

      <div className="mt-6 space-y-8">
        {COST_PHASES.map((phase) => {
          const items = grouped.get(phase);
          if (!items || items.length === 0) return null;

          const subtotalMin = items.reduce(
            (sum, i) => sum + i.totalCost.min,
            0
          );
          const subtotalMax = items.reduce(
            (sum, i) => sum + i.totalCost.max,
            0
          );
          const avgConfidence = items.some((i) => i.confidence > 0)
            ? Math.round(
                items.reduce((sum, i) => sum + i.confidence, 0) / items.length
              )
            : 0;

          return (
            <div
              key={phase}
              className={`border-l-4 ${phaseColors[phase] || "border-l-slate-300"} pl-4`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-base font-semibold text-slate-800">
                  {phase}
                </h4>
                <div className="flex items-center gap-3 text-sm">
                  {avgConfidence > 0 && (
                    <span className="text-slate-500">
                      Avg confidence:{" "}
                      <ConfidenceBadge score={avgConfidence} />
                    </span>
                  )}
                  <span className="font-medium text-slate-700">
                    {fmt(subtotalMin)} - {fmt(subtotalMax)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-medium uppercase text-slate-500">
                      <th className="pb-2 pr-3">Category</th>
                      <th className="pb-2 pr-3">Description</th>
                      <th className="pb-2 pr-3 text-right">Hours</th>
                      <th className="pb-2 pr-3 text-right">Rate</th>
                      <th className="pb-2 pr-3 text-right">Cost Range</th>
                      <th className="pb-2 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, i) => (
                      <tr key={i} className="text-slate-700">
                        <td className="py-2.5 pr-3 font-medium text-slate-900">
                          {item.category}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-600">
                          {item.description}
                        </td>
                        <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                          {item.estimatedHours.min} - {item.estimatedHours.max}
                        </td>
                        <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                          {fmt(item.hourlyRate)}/hr
                        </td>
                        <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                          {fmt(item.totalCost.min)} - {fmt(item.totalCost.max)}
                        </td>
                        <td className="py-2.5 text-right">
                          <ConfidenceBadge score={item.confidence} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className="mt-6 border-t-2 border-slate-300 pt-4">
        <div className="flex items-center justify-between text-lg font-bold text-slate-900">
          <span>Total Estimated Cost</span>
          <span>
            {fmt(totalCost.min)} - {fmt(totalCost.max)}
          </span>
        </div>
      </div>
    </section>
  );
}
