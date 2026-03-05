"use client";

import { useMemo, useState } from "react";
import { Estimation } from "@/lib/types";
import {
  buildResourcePlan,
  buildResourcePlanAOA,
  compressResourcePlan,
  optimizeTimeline,
  ResourcePlan as ResourcePlanData,
} from "@/lib/resource-plan";
import { Download, FileSpreadsheet, LayoutGrid, AlertTriangle, Shrink, Expand, Zap } from "lucide-react";
import * as XLSX from "xlsx";

interface ResourcePlanProps {
  estimation: Estimation;
  onUpdateEstimation?: (updated: Estimation) => void;
}

function cellColor(hoursPerDay: number): string {
  if (hoursPerDay === 0) return "";
  if (hoursPerDay < 1) return "bg-violet-500/10 text-violet-400";
  if (hoursPerDay < 2) return "bg-violet-500/20 text-violet-300";
  if (hoursPerDay < 4) return "bg-violet-500/30 text-violet-200";
  if (hoursPerDay < 6) return "bg-violet-500/45 text-white";
  return "bg-violet-500/60 text-white";
}

function exportResourcePlanCSV(plan: ResourcePlanData, projectName: string) {
  const aoa = buildResourcePlanAOA(plan);
  if (aoa.length === 0) return;

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Resource Plan");
  const prefix = projectName ? `${projectName} - Resource Plan` : "Resource Plan";
  XLSX.writeFile(wb, `${prefix}.csv`, { bookType: "csv" });
}

function exportResourcePlanXLSX(plan: ResourcePlanData, projectName: string) {
  const aoa = buildResourcePlanAOA(plan);
  if (aoa.length === 0) return;

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  const colWidths = [{ wch: 18 }];
  for (let i = 0; i < plan.totalWeeks; i++) {
    colWidths.push({ wch: Math.max(plan.weekLabels[i].length + 2, 10) });
  }
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Resource Plan");
  const prefix = projectName ? `${projectName} - Resource Plan` : "Resource Plan";
  XLSX.writeFile(wb, `${prefix}.xlsx`);
}

export default function ResourcePlan({ estimation, onUpdateEstimation }: ResourcePlanProps) {
  const [compressed, setCompressed] = useState(false);

  const fullPlan = useMemo(() => buildResourcePlan(estimation), [estimation]);
  const compressedPlan = useMemo(
    () => (fullPlan.gaps.length > 0 ? compressResourcePlan(fullPlan) : fullPlan),
    [fullPlan]
  );

  const plan = compressed ? compressedPlan : fullPlan;

  if (fullPlan.totalWeeks === 0 || fullPlan.rows.length === 0) {
    return null;
  }

  const btnClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200";

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-slate-500" />
          Resource Plan
          {compressed && (
            <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
              Compressed
            </span>
          )}
        </h3>
        <div className="flex gap-2 no-print">
          <button
            onClick={() => exportResourcePlanCSV(plan, estimation.projectName)}
            className={btnClass}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            onClick={() => exportResourcePlanXLSX(plan, estimation.projectName)}
            className={btnClass}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </button>
        </div>
      </div>

      <p className="mt-1 text-sm text-slate-400">
        Week-by-week resource allocation (hours/day per role)
      </p>

      {fullPlan.gaps.length > 0 && (
        <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 no-print">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm text-amber-300">
            <span className="font-medium">Idle periods detected: </span>
            {fullPlan.gaps.map((g, i) => (
              <span key={i}>
                {i > 0 && ", "}
                W{g.startWeek}–W{g.endWeek} ({g.durationWeeks}w)
              </span>
            ))}
            <span className="ml-1 text-amber-600">
              — {fullPlan.totalIdleWeeks} idle week{fullPlan.totalIdleWeeks !== 1 ? "s" : ""} total
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setCompressed((c) => !c)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-[#0a0a1a] px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/15"
            >
              {compressed ? (
                <>
                  <Expand className="h-3.5 w-3.5" />
                  Show Full
                </>
              ) : (
                <>
                  <Shrink className="h-3.5 w-3.5" />
                  Compress
                </>
              )}
            </button>
            {onUpdateEstimation && (
              <button
                onClick={() => onUpdateEstimation(optimizeTimeline(estimation))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/20"
              >
                <Zap className="h-3.5 w-3.5" />
                Optimize Timeline
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-white/[0.06]">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th className="sticky left-0 z-10 bg-white/5 py-2 px-3 text-left font-semibold text-slate-400 border-b border-r border-white/[0.06] min-w-[120px]">
                Role
              </th>
              {plan.weekLabels.map((label, i) => (
                <th
                  key={i}
                  className="py-2 px-2 text-center font-semibold text-slate-400 border-b border-white/[0.06] whitespace-nowrap min-w-[60px]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {plan.rows.map((row) => (
              <tr key={row.role} className="hover:bg-white/5">
                <td className="sticky left-0 z-10 bg-[#0a0a1a] py-2 px-3 font-medium text-slate-300 border-r border-white/[0.06] whitespace-nowrap">
                  {row.roleLabel}
                  <span className="ml-1 text-slate-500">({row.role})</span>
                </td>
                {row.weeks.map((h, i) => (
                  <td
                    key={i}
                    className={`py-2 px-2 text-center font-medium ${cellColor(h)}`}
                  >
                    {h === 0 ? "" : h.toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/[0.08] bg-white/5 font-bold">
              <td className="sticky left-0 z-10 bg-white/5 py-2 px-3 text-slate-200 border-r border-white/[0.06]">
                Total (hrs/day)
              </td>
              {plan.totals.map((t, i) => (
                <td
                  key={i}
                  className={`py-2 px-2 text-center ${cellColor(t)}`}
                >
                  {t === 0 ? "" : t.toFixed(1)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
        <span>Cell shading intensity = hours/day</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-violet-500/10 border border-violet-400/30" />
          &lt;1
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-violet-500/20 border border-violet-400/30" />
          1-2
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-violet-500/30 border border-violet-400/30" />
          2-4
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-violet-500/45 border border-violet-400/40" />
          4-6
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-violet-500/60" />
          6+
        </span>
      </div>
    </section>
  );
}
