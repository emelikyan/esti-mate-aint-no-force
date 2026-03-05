"use client";

import { RefreshCw, Loader2, CheckCircle } from "lucide-react";
import { Phase, TimelineItem } from "@/lib/types";

interface PhaseTimelineProps {
  phases: Phase[];
  timeline: TimelineItem[];
  isOutdated?: boolean;
  justRecalculated?: boolean;
  onRecalculate?: () => void;
  isRecalculating?: boolean;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function PhaseTimeline({
  phases,
  timeline,
  isOutdated,
  justRecalculated,
  onRecalculate,
  isRecalculating,
}: PhaseTimelineProps) {
  const totalWeeks =
    timeline.length > 0
      ? Math.max(...timeline.map((t) => t.endWeek))
      : phases.reduce((sum, p) => sum + p.durationWeeks, 0);

  const hasDates = timeline.some((t) => t.startDate && t.startDate !== "");

  return (
    <section>
      <div className="flex items-center justify-between no-print">
        <h3 className="text-xl font-semibold text-white">Project Phases</h3>

        {/* Right action */}
        {isOutdated && (
          <button
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {isRecalculating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isRecalculating ? "Recalculating…" : "Recalculate Timeline"}
          </button>
        )}
        {justRecalculated && !isOutdated && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 shrink-0">
            <CheckCircle className="h-3.5 w-3.5" />
            Timeline updated
          </span>
        )}
      </div>
      {/* Print-visible heading (no controls) */}
      <h3 className="hidden print:block text-xl font-semibold text-white">Project Phases</h3>

      {/* Gantt-style bars */}
      <div className="mt-6 space-y-3">
        {timeline.map((item, i) => {
          const leftPercent = ((item.startWeek - 1) / totalWeeks) * 100;
          const widthPercent =
            ((item.endWeek - item.startWeek + 1) / totalWeeks) * 100;
          const colors = [
            "bg-violet-500",
            "bg-indigo-500",
            "bg-emerald-500",
            "bg-amber-500",
            "bg-fuchsia-500",
            "bg-rose-500",
          ];

          return (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-300">{item.phase}</span>
                <span className="text-slate-400">
                  {hasDates && item.startDate && item.endDate
                    ? `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`
                    : `Week ${item.startWeek} - ${item.endWeek}`}
                </span>
              </div>
              <div className="relative h-7 rounded-full bg-white/10">
                <div
                  className={`absolute top-0 h-7 rounded-full ${colors[i % colors.length]} opacity-80`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase details */}
      <div className="mt-8 space-y-4">
        {phases
          .sort((a, b) => a.order - b.order)
          .map((phase, i) => {
            const timelineItem = timeline.find((t) => t.phase === phase.name);
            return (
              <div
                key={i}
                className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-white">{phase.name}</h4>
                    <p className="mt-1 text-sm text-slate-400">
                      {phase.description}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                      {phase.durationWeeks}w
                    </span>
                    {hasDates &&
                      timelineItem?.startDate &&
                      timelineItem?.endDate && (
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(timelineItem.startDate)} -{" "}
                          {formatDate(timelineItem.endDate)}
                        </p>
                      )}
                  </div>
                </div>
                {timelineItem && timelineItem.milestones.length > 0 && (
                  <div className="mt-3 border-t border-white/[0.05] pt-3">
                    <p className="text-xs font-medium text-slate-400 uppercase">
                      Milestones
                    </p>
                    <ul className="mt-1 space-y-1">
                      {timelineItem.milestones.map((m, j) => (
                        <li
                          key={j}
                          className="text-sm text-slate-400 before:mr-2 before:content-['•'] before:text-violet-400"
                        >
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </section>
  );
}
