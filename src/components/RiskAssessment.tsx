"use client";

import { Risk } from "@/lib/types";

interface RiskAssessmentProps {
  risks: Risk[];
}

const severityColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-400",
  medium: "bg-amber-500/10 text-amber-400",
  high: "bg-orange-500/10 text-orange-400",
  critical: "bg-red-500/10 text-red-400",
};

const likelihoodColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-400",
  medium: "bg-amber-500/10 text-amber-400",
  high: "bg-red-500/10 text-red-400",
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
      <h3 className="text-xl font-semibold text-white">Risk Assessment</h3>

      <div className="mt-6 space-y-3">
        {sorted.map((risk, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-white">{risk.title}</h4>
                <p className="mt-1 text-sm text-slate-400">{risk.description}</p>
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
            <div className="mt-3 border-t border-white/[0.05] pt-3">
              <p className="text-xs font-medium uppercase text-slate-400">
                Mitigation
              </p>
              <p className="mt-0.5 text-sm text-slate-400">{risk.mitigation}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
