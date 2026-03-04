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
  if (hoursPerDay < 1) return "bg-blue-50 text-blue-700";
  if (hoursPerDay < 2) return "bg-blue-100 text-blue-800";
  if (hoursPerDay < 4) return "bg-blue-200 text-blue-900";
  if (hoursPerDay < 6) return "bg-blue-300 text-blue-900";
  return "bg-blue-400 text-white";
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
    "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800";

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-gray-400" />
          Resource Plan
          {compressed && (
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
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

      <p className="mt-1 text-sm text-gray-500">
        Week-by-week resource allocation (hours/day per role)
      </p>

      {fullPlan.gaps.length > 0 && (
        <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 no-print">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm text-amber-800">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                <Zap className="h-3.5 w-3.5" />
                Optimize Timeline
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 py-2 px-3 text-left font-semibold text-gray-600 border-b border-r border-gray-200 min-w-[120px]">
                Role
              </th>
              {plan.weekLabels.map((label, i) => (
                <th
                  key={i}
                  className="py-2 px-2 text-center font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap min-w-[60px]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plan.rows.map((row) => (
              <tr key={row.role} className="hover:bg-gray-50/50">
                <td className="sticky left-0 z-10 bg-white py-2 px-3 font-medium text-gray-700 border-r border-gray-200 whitespace-nowrap">
                  {row.roleLabel}
                  <span className="ml-1 text-gray-400">({row.role})</span>
                </td>
                {row.weeks.map((h, i) => (
                  <td
                    key={i}
                    className={`py-2 px-2 text-center font-medium ${cellColor(h)}`}
                  >
                    {h.toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
              <td className="sticky left-0 z-10 bg-gray-50 py-2 px-3 text-gray-800 border-r border-gray-200">
                Total (hrs/day)
              </td>
              {plan.totals.map((t, i) => (
                <td
                  key={i}
                  className={`py-2 px-2 text-center ${cellColor(t)}`}
                >
                  {t.toFixed(1)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-400">
        <span>Cell shading intensity = hours/day</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-50 border border-blue-200" />
          &lt;1
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-100 border border-blue-200" />
          1-2
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-200 border border-blue-300" />
          2-4
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-300 border border-blue-400" />
          4-6
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-400" />
          6+
        </span>
      </div>
    </section>
  );
}
