"use client";

import { Risk } from "@/lib/types";

interface RiskAssessmentProps {
  risks: Risk[];
}

const severityColors: Record<string, string> = {
  low: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

const likelihoodColors: Record<string, string> = {
  low: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
};

const severityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function RiskAssessment({ risks }: RiskAssessmentProps) {
  const sorted = [...risks].sort(
    (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );

  return (
    <section>
      <h3 className="text-xl font-semibold text-slate-900">Risk Assessment</h3>

      <div className="mt-6 space-y-3">
        {sorted.map((risk, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-slate-900">{risk.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{risk.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${severityColors[risk.severity] || ""}`}
                >
                  {risk.severity}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${likelihoodColors[risk.likelihood] || ""}`}
                >
                  {risk.likelihood} likelihood
                </span>
              </div>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-medium uppercase text-slate-500">
                Mitigation
              </p>
              <p className="mt-0.5 text-sm text-slate-600">{risk.mitigation}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
