"use client";

import { AlertTriangle, Lightbulb } from "lucide-react";

interface AssumptionsLimitationsProps {
  assumptions: string[];
  limitations: string[];
}

export default function AssumptionsLimitations({
  assumptions,
  limitations,
}: AssumptionsLimitationsProps) {
  if (assumptions.length === 0 && limitations.length === 0) return null;

  return (
    <section>
      <h3 className="text-xl font-semibold text-white">
        Assumptions & Limitations
      </h3>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {assumptions.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Assumptions
            </div>
            <ul className="space-y-2">
              {assumptions.map((a, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-amber-500/15 bg-amber-500/10 px-3 py-2 text-sm text-slate-300"
                >
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {limitations.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Potential Limitations
            </div>
            <ul className="space-y-2">
              {limitations.map((l, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-orange-500/15 bg-orange-500/10 px-3 py-2 text-sm text-slate-300"
                >
                  {l}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
