"use client";

import { useRef, useState, useEffect } from "react";
import { CostItem, Estimation, RoleBreakdown } from "@/lib/types";
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
  Pencil,
  Info,
} from "lucide-react";

export interface CostBreakdownHandlers {
  onConfirm?: (index: number) => void;
  onOverrideConfidence?: (index: number, value: number) => void;
  onRefine?: (index: number, userNotes?: string) => Promise<void>;
  onDecompose?: (index: number) => Promise<void>;
  onEditHours?: (index: number, newRoles: RoleBreakdown[]) => void;
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
  // Build role × phase matrix from current roles (saved manual value if edited, AI value otherwise)
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
      <h4 className="mb-2 text-sm font-semibold text-slate-300">
        Man-Day Summary (Role x Phase)
      </h4>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/5">
            <th className="py-2 px-3 text-left font-semibold text-slate-400">
              Role
            </th>
            {phases.map((p) => (
              <th
                key={p}
                className="py-2 px-3 text-right font-semibold text-slate-400"
              >
                {p}
              </th>
            ))}
            <th className="py-2 px-3 text-right font-bold text-slate-200">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {roles.map((role) => (
            <tr key={role} className="hover:bg-white/5">
              <td className="py-1.5 px-3 font-medium text-slate-300">
                {ROLE_LABELS[role] || role}
              </td>
              {phases.map((p) => (
                <td key={p} className="py-1.5 px-3 text-right text-slate-400">
                  {(matrix[role]?.[p] || 0).toFixed(1)}
                </td>
              ))}
              <td className="py-1.5 px-3 text-right font-semibold text-slate-200">
                {roleTotal(role).toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-white/[0.08] bg-white/5 font-bold">
            <td className="py-2 px-3 text-slate-200">Total</td>
            {phases.map((p) => (
              <td key={p} className="py-2 px-3 text-right text-slate-200">
                {phaseTotal(p).toFixed(1)}
              </td>
            ))}
            <td className="py-2 px-3 text-right text-white">
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
    ? "bg-green-500/15 text-green-200 ring-1 ring-green-500/30"
    : displayConfidence >= 80
      ? "bg-green-500/10 text-green-400"
      : displayConfidence >= 60
        ? "bg-amber-500/10 text-amber-400"
        : "bg-red-500/10 text-red-400";

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => handlers && setOpen(!open)}
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${color} ${handlers ? "cursor-pointer hover:ring-2 hover:ring-violet-300/50" : ""} inline-flex items-center gap-1`}
        title={handlers ? "Click to adjust confidence" : undefined}
      >
        {item.confirmed && <CheckCircle className="h-3 w-3" />}
        {displayConfidence}%
      </button>

      {open && handlers && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-white/[0.06] bg-[#0e0e22] p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Confidence Controls
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-300"
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
                  ? "bg-green-500/10 text-green-400"
                  : "hover:bg-white/5 text-slate-300"
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
                className="flex-1 rounded border border-white/[0.06] px-2 py-1 text-xs focus:border-violet-400/40 focus:ring-1 focus:ring-violet-500/25 outline-none"
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
                className="rounded bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-300 hover:bg-violet-500/20"
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
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
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
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
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
    <div className="text-[11px] text-slate-500 mt-0.5">
      <span title="Optimistic – Pessimistic range">
        &#8597; {fmt(optimisticCost)} &ndash; {fmt(pessimisticCost)}{" "}
        <span className="text-slate-400">
          ({item.optimisticHours}h &ndash; {item.pessimisticHours}h)
        </span>
      </span>
    </div>
  );
}

function RoleTable({
  roles,
  originalRoles,
  currency,
}: {
  roles: CostItem["roles"];
  originalRoles?: CostItem["roles"];
  currency: string;
}) {
  const fmt = makeFmt(currency);
  if (!roles || roles.length === 0) return null;

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.05] text-slate-500 uppercase">
            <th className="pb-1 pr-2 text-left font-medium">Role</th>
            <th className="pb-1 pr-2 text-right font-medium">Hours</th>
            <th className="pb-1 pr-2 text-right font-medium">Rate</th>
            <th className="pb-1 text-right font-medium">Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {roles.map((r) => {
            const orig = originalRoles?.find((o) => o.role === r.role);
            const changed = orig != null && orig.hours !== r.hours;
            return (
              <tr key={r.role} className={changed ? "bg-violet-500/5" : "text-slate-400"}>
                <td className="py-1 pr-2 font-medium text-slate-300">
                  {ROLE_LABELS[r.role] || r.role}{" "}
                  <span className="text-slate-500">({r.role})</span>
                </td>
                <td className="py-1 pr-2 text-right whitespace-nowrap">
                  {changed ? (
                    <span className="font-semibold text-violet-300">{r.hours}h</span>
                  ) : (
                    <span>{r.hours}h</span>
                  )}
                  {changed && orig && (
                    <span className="ml-2 text-slate-600 line-through">{orig.hours}h</span>
                  )}
                </td>
                <td className="py-1 pr-2 text-right whitespace-nowrap">
                  {fmt(r.rate)}/hr
                </td>
                <td className="py-1 text-right whitespace-nowrap font-medium">
                  {changed ? (
                    <span className="text-violet-300">{fmt(r.cost)}</span>
                  ) : (
                    <span>{fmt(r.cost)}</span>
                  )}
                  {changed && orig && (
                    <span className="ml-2 text-[11px] text-slate-600 line-through">{fmt(orig.cost)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HoursEditor({
  item,
  globalIndex,
  currency,
  onSave,
  onCancel,
}: {
  item: CostItem;
  globalIndex: number;
  currency: string;
  onSave: (index: number, newRoles: RoleBreakdown[]) => void;
  onCancel: () => void;
}) {
  const fmt = makeFmt(currency);
  const aiRoles = item.originalRoles ?? item.roles;

  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    for (const r of item.roles) d[r.role] = String(r.hours);
    return d;
  });

  const newRoles: RoleBreakdown[] = item.roles.map((r) => {
    const h = Math.max(0, parseFloat(draft[r.role] ?? String(r.hours)) || 0);
    return { ...r, hours: h, cost: Math.round(h * r.rate) };
  });

  const newTotalHours = newRoles.reduce((s, r) => s + r.hours, 0);
  const newTotalCost = newRoles.reduce((s, r) => s + r.cost, 0);
  const aiTotalHours = aiRoles.reduce((s, r) => s + r.hours, 0);
  const hasChanges = newRoles.some((r) => {
    const orig = aiRoles.find((o) => o.role === r.role);
    return orig && orig.hours !== r.hours;
  });

  return (
    <div className="mt-3 rounded-lg border border-violet-500/25 bg-violet-500/5 p-4">
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300/90">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <span>Saving will recalculate project totals and the man-day summary. Use the <strong className="text-amber-200">Recalculate Timeline</strong> button in the Project Phases section to update the schedule.</span>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.08] text-slate-500 uppercase">
            <th className="pb-1.5 pr-3 text-left font-medium">Role</th>
            <th className="pb-1.5 pr-3 text-right font-medium">AI Estimate</th>
            <th className="pb-1.5 pr-3 text-right font-medium">Your Hours</th>
            <th className="pb-1.5 pr-3 text-right font-medium">Rate</th>
            <th className="pb-1.5 text-right font-medium">New Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {item.roles.map((r) => {
            const ai = aiRoles.find((o) => o.role === r.role);
            const newH = Math.max(0, parseFloat(draft[r.role] ?? String(r.hours)) || 0);
            const newCost = Math.round(newH * r.rate);
            const changed = ai != null && ai.hours !== newH;
            return (
              <tr key={r.role}>
                <td className="py-1.5 pr-3 font-medium text-slate-300">
                  {ROLE_LABELS[r.role] || r.role}{" "}
                  <span className="text-slate-500">({r.role})</span>
                </td>
                <td className="py-1.5 pr-3 text-right text-slate-500">
                  {ai?.hours ?? r.hours}h
                </td>
                <td className="py-1.5 pr-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <div className={`inline-flex items-center rounded-lg border ${changed ? "border-violet-400/50 bg-violet-500/10" : "border-white/[0.08] bg-white/[0.03]"}`}>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            [r.role]: String(Math.max(0, (parseFloat(prev[r.role] ?? String(r.hours)) || 0) - 1)),
                          }))
                        }
                        className="px-2 py-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-l-lg transition-colors text-sm leading-none select-none"
                      >
                        −
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={draft[r.role] ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, [r.role]: e.target.value }))
                        }
                        className={`w-10 bg-transparent text-center text-xs outline-none ${changed ? "text-violet-200" : "text-slate-200"}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            [r.role]: String((parseFloat(prev[r.role] ?? String(r.hours)) || 0) + 1),
                          }))
                        }
                        className="px-2 py-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-r-lg transition-colors text-sm leading-none select-none"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-slate-500">h</span>
                  </div>
                </td>
                <td className="py-1.5 pr-3 text-right text-slate-500">
                  {fmt(r.rate)}/hr
                </td>
                <td className={`py-1.5 text-right font-medium ${changed ? "text-violet-300" : "text-slate-400"}`}>
                  {fmt(newCost)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-white/[0.08] font-semibold">
            <td className="pt-2 text-slate-300">Total</td>
            <td className="pt-2 text-right text-slate-500">{aiTotalHours}h</td>
            <td className="pt-2 text-right text-slate-200">{newTotalHours}h</td>
            <td />
            <td className="pt-2 text-right text-white">{fmt(newTotalCost)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-3 flex items-center justify-between">
        {hasChanges ? (
          <span className="text-xs text-violet-400/80">
            Hours changed · totals will update on save
          </span>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(globalIndex, newRoles)}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500"
          >
            Save Changes
          </button>
        </div>
      </div>
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
    Blueprint: "border-l-violet-500",
    Implementation: "border-l-indigo-500",
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
    "inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200";

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Cost Breakdown</h3>
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
                <Check className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
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
                  <h4 className="text-base font-semibold text-slate-200">
                    {phase}
                  </h4>
                  <div className="flex items-center gap-3 text-sm">
                    {avgConfidence > 0 && (
                      <span className="text-slate-400">
                        Avg confidence:{" "}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            avgConfidence >= 80
                              ? "bg-green-500/10 text-green-400"
                              : avgConfidence >= 60
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {avgConfidence}%
                        </span>
                      </span>
                    )}
                    <span className="text-slate-400">
                      {subtotalMD.toFixed(1)} MDs
                    </span>
                    <span className="font-medium text-slate-300">
                      {fmt(subtotalCost)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {entries.map(({ item, globalIndex }) => {
                    const isEditing = editingIndex === globalIndex;
                    return (
                      <div
                        key={globalIndex}
                        className={`rounded-lg border p-4 transition-all ${
                          isEditing
                            ? "border-violet-500/30 bg-violet-500/5"
                            : "border-white/[0.05] bg-white/[0.02]"
                        } ${
                          refiningIndex === globalIndex
                            ? "opacity-60 animate-pulse"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {item.category}
                              </span>
                              <ConfidenceControl
                                item={item}
                                globalIndex={globalIndex}
                                handlers={wrappedHandlers}
                                isRefining={refiningIndex === globalIndex}
                              />
                              {item.originalRoles && (
                                <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                                  edited
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-slate-400">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex items-start gap-3 shrink-0">
                            <div className="text-right">
                              <div className="font-semibold text-white">
                                {fmt(item.totalCost)}
                              </div>
                              <div className="text-xs text-slate-400">
                                {item.totalHours}h /{" "}
                                {(
                                  item.totalMD ||
                                  item.totalHours / HOURS_PER_MD
                                ).toFixed(1)}{" "}
                                MDs
                              </div>
                              <ThreePointRange item={item} currency={currency} />
                            </div>
                            {handlers?.onEditHours && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingIndex(isEditing ? null : globalIndex)
                                }
                                title={isEditing ? "Cancel editing" : "Edit hours"}
                                className={`mt-0.5 rounded p-1.5 transition-colors no-print ${
                                  isEditing
                                    ? "bg-violet-500/20 text-violet-300"
                                    : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"
                                }`}
                              >
                                {isEditing ? (
                                  <X className="h-3.5 w-3.5" />
                                ) : (
                                  <Pencil className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {isEditing && handlers?.onEditHours ? (
                          <HoursEditor
                            item={item}
                            globalIndex={globalIndex}
                            currency={currency}
                            onSave={(index, newRoles) => {
                              handlers.onEditHours!(index, newRoles);
                              setEditingIndex(null);
                            }}
                            onCancel={() => setEditingIndex(null)}
                          />
                        ) : (
                          <RoleTable
                            roles={item.roles}
                            originalRoles={item.originalRoles}
                            currency={currency}
                          />
                        )}

                        {(item.startDate || item.endDate) && (
                          <div className="mt-2 text-xs text-slate-400">
                            {item.startDate} &rarr; {item.endDate}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grand Total */}
        <div className="mt-6 border-t-2 border-white/[0.08] pt-4">
          <div className="flex items-center justify-between text-lg font-bold text-white">
            <span>Total Estimated Cost</span>
            <div className="text-right">
              <div>{fmt(totalCost.amount || grandTotalCost)}</div>
              <div className="text-sm font-normal text-slate-400">
                {grandTotalMD.toFixed(1)} man-days
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
