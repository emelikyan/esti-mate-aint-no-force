"use client";

import { Phase, TimelineItem } from "@/lib/types";

interface PhaseTimelineProps {
  phases: Phase[];
  timeline: TimelineItem[];
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

export default function PhaseTimeline({ phases, timeline }: PhaseTimelineProps) {
  const totalWeeks =
    timeline.length > 0
      ? Math.max(...timeline.map((t) => t.endWeek))
      : phases.reduce((sum, p) => sum + p.durationWeeks, 0);

  const hasDates = timeline.some((t) => t.startDate && t.startDate !== "");

  return (
    <section>
      <h3 className="text-xl font-semibold text-gray-900">Project Phases</h3>

      {/* Gantt-style bars */}
      <div className="mt-6 space-y-3">
        {timeline.map((item, i) => {
          const leftPercent = ((item.startWeek - 1) / totalWeeks) * 100;
          const widthPercent =
            ((item.endWeek - item.startWeek + 1) / totalWeeks) * 100;
          const colors = [
            "bg-indigo-500",
            "bg-blue-500",
            "bg-emerald-500",
            "bg-amber-500",
            "bg-purple-500",
            "bg-rose-500",
          ];

          return (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.phase}</span>
                <span className="text-gray-500">
                  {hasDates && item.startDate && item.endDate
                    ? `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`
                    : `Week ${item.startWeek} - ${item.endWeek}`}
                </span>
              </div>
              <div className="relative h-7 rounded-full bg-gray-100">
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
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{phase.name}</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {phase.description}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                      {phase.durationWeeks}w
                    </span>
                    {hasDates &&
                      timelineItem?.startDate &&
                      timelineItem?.endDate && (
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(timelineItem.startDate)} -{" "}
                          {formatDate(timelineItem.endDate)}
                        </p>
                      )}
                  </div>
                </div>
                {timelineItem && timelineItem.milestones.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      Milestones
                    </p>
                    <ul className="mt-1 space-y-1">
                      {timelineItem.milestones.map((m, j) => (
                        <li
                          key={j}
                          className="text-sm text-gray-600 before:mr-2 before:content-['•'] before:text-indigo-400"
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
