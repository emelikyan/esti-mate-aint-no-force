"use client";

import { useRef, useState, useEffect } from "react";
import { CostItem, Estimation } from "@/lib/types";
import { COST_PHASES, HOURS_PER_MD, ROLE_LABELS } from "@/lib/constants";
import {
  exportCostCSV,
  exportCostXLSX,
  copyCostAsImage,
} from "@/lib/export-cost";
import {
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  CheckCircle,
  RefreshCw,
  Scissors,
  X,
  Loader2,
} from "lucide-react";

export interface CostBreakdownHandlers {
  onConfirm?: (index: number) => void;
  onOverrideConfidence?: (index: number, value: number) => void;
  onRefine?: (index: number, userNotes?: string) => Promise<void>;
  onDecompose?: (index: number) => Promise<void>;
}

interface CostBreakdownProps {
  estimation: Estimation;
  handlers?: CostBreakdownHandlers;
}

function makeFmt(currency: string) {
  return (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
}

type RoleKey = "CS" | "Dev" | "AR" | "PM" | "QA";
const ROLES: RoleKey[] = ["CS", "Dev", "AR", "PM", "QA"];

function MDSummaryTable({
  costBreakdown,
}: {
  costBreakdown: CostItem[];
}) {
  // Build role × phase matrix
  const matrix: Record<string, Record<string, number>> = {};
  const allRoles = new Set<string>();

  for (const item of costBreakdown) {
    for (const r of item.roles || []) {
      allRoles.add(r.role);
      if (!matrix[r.role]) matrix[r.role] = {};
      matrix[r.role][item.phase] =
        (matrix[r.role][item.phase] || 0) + r.hours / HOURS_PER_MD;
    }
  }

  const roles = ROLES.filter((r) => allRoles.has(r));
  const phases = COST_PHASES.filter((p) =>
    costBreakdown.some((i) => i.phase === p)
  );

  if (roles.length === 0) return null;

  const roleTotal = (role: string) =>
    phases.reduce((s, p) => s + (matrix[role]?.[p] || 0), 0);
  const phaseTotal = (phase: string) =>
    roles.reduce((s, r) => s + (matrix[r]?.[phase] || 0), 0);
  const grandTotal = roles.reduce((s, r) => s + roleTotal(r), 0);

  return (
    <div className="mb-6 overflow-x-auto">
      <h4 className="mb-2 text-sm font-semibold text-gray-700">
        Man-Day Summary (Role x Phase)
      </h4>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="py-2 px-3 text-left font-semibold text-gray-600">
              Role
            </th>
            {phases.map((p) => (
              <th
                key={p}
                className="py-2 px-3 text-right font-semibold text-gray-600"
              >
                {p}
              </th>
            ))}
            <th className="py-2 px-3 text-right font-bold text-gray-800">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {roles.map((role) => (
            <tr key={role} className="hover:bg-gray-50/50">
              <td className="py-1.5 px-3 font-medium text-gray-700">
                {ROLE_LABELS[role] || role}
              </td>
              {phases.map((p) => (
                <td key={p} className="py-1.5 px-3 text-right text-gray-600">
                  {(matrix[role]?.[p] || 0).toFixed(1)}
                </td>
              ))}
              <td className="py-1.5 px-3 text-right font-semibold text-gray-800">
                {roleTotal(role).toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
            <td className="py-2 px-3 text-gray-800">Total</td>
            {phases.map((p) => (
              <td key={p} className="py-2 px-3 text-right text-gray-800">
                {phaseTotal(p).toFixed(1)}
              </td>
            ))}
            <td className="py-2 px-3 text-right text-gray-900">
              {grandTotal.toFixed(1)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ConfidenceControl({
  item,
  globalIndex,
  handlers,
  isRefining,
}: {
  item: CostItem;
  globalIndex: number;
  handlers?: CostBreakdownHandlers;
  isRefining: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [overrideValue, setOverrideValue] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const displayConfidence = item.userConfidence ?? item.confidence;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (displayConfidence === 0 && !handlers) return null;

  const color = item.confirmed
    ? "bg-green-100 text-green-800 ring-1 ring-green-300"
    : displayConfidence >= 80
      ? "bg-green-50 text-green-700"
      : displayConfidence >= 60
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => handlers && setOpen(!open)}
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${color} ${handlers ? "cursor-pointer hover:ring-2 hover:ring-indigo-200" : ""} inline-flex items-center gap-1`}
        title={handlers ? "Click to adjust confidence" : undefined}
      >
        {item.confirmed && <CheckCircle className="h-3 w-3" />}
        {displayConfidence}%
      </button>

      {open && handlers && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">
              Confidence Controls
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Confirm */}
            <button
              onClick={() => {
                handlers.onConfirm?.(globalIndex);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                item.confirmed
                  ? "bg-green-50 text-green-700"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {item.confirmed ? "Confirmed" : "Confirm estimate"}
            </button>

            {/* Override */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Override %"
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none"
              />
              <button
                onClick={() => {
                  const v = parseInt(overrideValue);
                  if (!isNaN(v) && v >= 0 && v <= 100) {
                    handlers.onOverrideConfidence?.(globalIndex, v);
                    setOverrideValue("");
                    setOpen(false);
                  }
                }}
                className="rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Set
              </button>
            </div>

            {/* Refine — visible when confidence < 70 */}
            {displayConfidence < 70 && (
              <button
                onClick={async () => {
                  setOpen(false);
                  await handlers.onRefine?.(globalIndex);
                }}
                disabled={isRefining}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {isRefining ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Refine estimate
              </button>
            )}

            {/* Decompose — visible when confidence < 60 */}
            {displayConfidence < 60 && (
              <button
                onClick={async () => {
                  setOpen(false);
                  await handlers.onDecompose?.(globalIndex);
                }}
                disabled={isRefining}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isRefining ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Scissors className="h-3.5 w-3.5" />
                )}
                Decompose into sub-items
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ThreePointRange({
  item,
  currency,
}: {
  item: CostItem;
  currency: string;
}) {
  if (!item.optimisticHours || !item.pessimisticHours) return null;

  const fmt = makeFmt(currency);
  // Calculate blended rate from total
  const blendedRate =
    item.totalHours > 0 ? item.totalCost / item.totalHours : 0;
  const optimisticCost = Math.round(item.optimisticHours * blendedRate);
  const pessimisticCost = Math.round(item.pessimisticHours * blendedRate);

  return (
    <div className="text-[11px] text-gray-400 mt-0.5">
      <span title="Optimistic – Pessimistic range">
        &#8597; {fmt(optimisticCost)} &ndash; {fmt(pessimisticCost)}{" "}
        <span className="text-gray-300">
          ({item.optimisticHours}h &ndash; {item.pessimisticHours}h)
        </span>
      </span>
    </div>
  );
}

function RoleTable({
  roles,
  currency,
}: {
  roles: CostItem["roles"];
  currency: string;
}) {
  const fmt = makeFmt(currency);
  if (!roles || roles.length === 0) return null;

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 text-gray-400 uppercase">
            <th className="pb-1 pr-2 text-left font-medium">Role</th>
            <th className="pb-1 pr-2 text-right font-medium">Hours</th>
            <th className="pb-1 pr-2 text-right font-medium">Rate</th>
            <th className="pb-1 text-right font-medium">Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {roles.map((r) => (
            <tr key={r.role} className="text-gray-600">
              <td className="py-1 pr-2 font-medium text-gray-700">
                {ROLE_LABELS[r.role] || r.role}{" "}
                <span className="text-gray-400">({r.role})</span>
              </td>
              <td className="py-1 pr-2 text-right whitespace-nowrap">
                {r.hours}h
              </td>
              <td className="py-1 pr-2 text-right whitespace-nowrap">
                {fmt(r.rate)}/hr
              </td>
              <td className="py-1 text-right whitespace-nowrap font-medium">
                {fmt(r.cost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CostBreakdown({
  estimation,
  handlers,
}: CostBreakdownProps) {
  const costRef = useRef<HTMLDivElement>(null);
  const [imageCopied, setImageCopied] = useState(false);
  const [refiningIndex, setRefiningIndex] = useState<number | null>(null);

  const { costBreakdown, totalCost } = estimation;
  const currency = totalCost.currency || "USD";
  const fmt = makeFmt(currency);

  const grouped = new Map<string, { item: CostItem; globalIndex: number }[]>();
  for (const phase of COST_PHASES) {
    grouped.set(phase, []);
  }
  for (let gi = 0; gi < costBreakdown.length; gi++) {
    const item = costBreakdown[gi];
    const list = grouped.get(item.phase) || [];
    list.push({ item, globalIndex: gi });
    grouped.set(item.phase, list);
  }

  const phaseColors: Record<string, string> = {
    Blueprint: "border-l-indigo-500",
    Implementation: "border-l-blue-500",
    "UAT & Go-Live": "border-l-emerald-500",
  };

  const grandTotalCost = costBreakdown.reduce(
    (sum, i) => sum + (i.totalCost || 0),
    0
  );
  const grandTotalMD = costBreakdown.reduce(
    (sum, i) => sum + (i.totalMD || i.totalHours / HOURS_PER_MD || 0),
    0
  );

  const handleCopyImage = async () => {
    if (!costRef.current) return;
    try {
      await copyCostAsImage(costRef.current);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2000);
    } catch {
      alert(
        "Failed to copy image. Your browser may not support clipboard image writing."
      );
    }
  };

  // Wrap handlers to manage loading state
  const wrappedHandlers: CostBreakdownHandlers | undefined = handlers
    ? {
        ...handlers,
        onRefine: handlers.onRefine
          ? async (index: number, userNotes?: string) => {
              setRefiningIndex(index);
              try {
                await handlers.onRefine!(index, userNotes);
              } finally {
                setRefiningIndex(null);
              }
            }
          : undefined,
        onDecompose: handlers.onDecompose
          ? async (index: number) => {
              setRefiningIndex(index);
              try {
                await handlers.onDecompose!(index);
              } finally {
                setRefiningIndex(null);
              }
            }
          : undefined,
      }
    : undefined;

  const btnClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800";

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Cost Breakdown</h3>
        <div className="flex gap-2 no-print">
          <button
            onClick={() => exportCostCSV(estimation)}
            className={btnClass}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            onClick={() => exportCostXLSX(estimation)}
            className={btnClass}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </button>
          <button onClick={handleCopyImage} className={btnClass}>
            {imageCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Image
              </>
            )}
          </button>
        </div>
      </div>

      <div ref={costRef}>
        {/* MD Summary Table */}
        <div className="mt-4">
          <MDSummaryTable costBreakdown={costBreakdown} />
        </div>

        <div className="mt-6 space-y-8">
          {COST_PHASES.map((phase) => {
            const entries = grouped.get(phase);
            if (!entries || entries.length === 0) return null;

            const items = entries.map((e) => e.item);
            const subtotalCost = items.reduce(
              (sum, i) => sum + (i.totalCost || 0),
              0
            );
            const subtotalMD = items.reduce(
              (sum, i) =>
                sum + (i.totalMD || i.totalHours / HOURS_PER_MD || 0),
              0
            );
            const avgConfidence = items.some((i) => i.confidence > 0)
              ? Math.round(
                  items.reduce((sum, i) => sum + i.confidence, 0) /
                    items.length
                )
              : 0;

            return (
              <div
                key={phase}
                className={`border-l-4 ${phaseColors[phase] || "border-l-gray-300"} pl-4`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-base font-semibold text-gray-800">
                    {phase}
                  </h4>
                  <div className="flex items-center gap-3 text-sm">
                    {avgConfidence > 0 && (
                      <span className="text-gray-500">
                        Avg confidence:{" "}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            avgConfidence >= 80
                              ? "bg-green-50 text-green-700"
                              : avgConfidence >= 60
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {avgConfidence}%
                        </span>
                      </span>
                    )}
                    <span className="text-gray-500">
                      {subtotalMD.toFixed(1)} MDs
                    </span>
                    <span className="font-medium text-gray-700">
                      {fmt(subtotalCost)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {entries.map(({ item, globalIndex }) => (
                    <div
                      key={globalIndex}
                      className={`rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-all ${
                        refiningIndex === globalIndex
                          ? "opacity-60 animate-pulse"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {item.category}
                            </span>
                            <ConfidenceControl
                              item={item}
                              globalIndex={globalIndex}
                              handlers={wrappedHandlers}
                              isRefining={refiningIndex === globalIndex}
                            />
                          </div>
                          <p className="mt-0.5 text-sm text-gray-600">
                            {item.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-gray-900">
                            {fmt(item.totalCost)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.totalHours}h /{" "}
                            {(
                              item.totalMD ||
                              item.totalHours / HOURS_PER_MD
                            ).toFixed(1)}{" "}
                            MDs
                          </div>
                          <ThreePointRange item={item} currency={currency} />
                        </div>
                      </div>

                      <RoleTable roles={item.roles} currency={currency} />

                      {(item.startDate || item.endDate) && (
                        <div className="mt-2 text-xs text-gray-500">
                          {item.startDate} &rarr; {item.endDate}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grand Total */}
        <div className="mt-6 border-t-2 border-gray-300 pt-4">
          <div className="flex items-center justify-between text-lg font-bold text-gray-900">
            <span>Total Estimated Cost</span>
            <div className="text-right">
              <div>{fmt(totalCost.amount || grandTotalCost)}</div>
              <div className="text-sm font-normal text-gray-500">
                {grandTotalMD.toFixed(1)} man-days
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
