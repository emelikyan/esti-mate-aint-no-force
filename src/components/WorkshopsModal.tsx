"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, Users, Clock, Target, ListChecks, FileOutput } from "lucide-react";
import { Workshop } from "@/lib/types";

const LOADING_MESSAGES = [
  "Reviewing project phases and deliverables…",
  "Identifying key decision points…",
  "Mapping stakeholder touchpoints…",
  "Designing agenda for each workshop…",
  "Assigning recommended participants…",
  "Estimating workshop durations…",
  "Defining expected outputs…",
  "Aligning workshops with project risks…",
];

interface WorkshopsModalProps {
  workshops: Workshop[];
  projectName: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onClose: () => void;
}

const PHASE_COLORS: Record<string, string> = {
  Blueprint: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  Implementation: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
  "UAT & Go-Live": "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

function exportWorkshopsCSV(workshops: Workshop[], projectName: string) {
  const rows: string[][] = [
    ["#", "Workshop Name", "Phase", "Duration", "Objective", "Agenda", "Participants", "Outputs"],
  ];

  workshops.forEach((w, i) => {
    rows.push([
      String(i + 1),
      w.name,
      w.phase,
      w.duration,
      w.objective,
      w.agenda.join(" | "),
      w.participants.join(" | "),
      w.outputs.join(" | "),
    ]);
  });

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, "_")}_workshops.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportWorkshopsTXT(workshops: Workshop[], projectName: string) {
  const lines: string[] = [
    `WORKSHOP LIST — ${projectName}`,
    "=".repeat(60),
    "",
  ];

  workshops.forEach((w, i) => {
    lines.push(`${i + 1}. ${w.name}`);
    lines.push(`   Phase: ${w.phase}  |  Duration: ${w.duration}`);
    lines.push(`   Objective: ${w.objective}`);
    lines.push("");
    lines.push("   Agenda:");
    w.agenda.forEach((item) => lines.push(`     • ${item}`));
    lines.push("");
    lines.push("   Participants:");
    w.participants.forEach((p) => lines.push(`     • ${p}`));
    lines.push("");
    lines.push("   Expected Outputs:");
    w.outputs.forEach((o) => lines.push(`     • ${o}`));
    lines.push("");
    lines.push("-".repeat(60));
    lines.push("");
  });

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, "_")}_workshops.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function WorkshopsModal({ workshops, projectName, isLoading, error, onRetry, onClose }: WorkshopsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!isLoading) return;
    setMsgIndex(0);
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#070713]"
    >
      {/* Top bar */}
      <div className="shrink-0 border-b border-white/[0.06] bg-[#0b0b1a]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Proposed Workshops</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              {isLoading ? "Generating…" : `${workshops.length} workshops · ${projectName}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && workshops.length > 0 && (
              <div className="relative group">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5">
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <div className="absolute right-0 top-full z-10 mt-1 hidden w-40 rounded-lg border border-white/[0.08] bg-[#0e0e22] shadow-lg group-hover:block">
                  <button
                    onClick={() => exportWorkshopsCSV(workshops, projectName)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <FileOutput className="h-3.5 w-3.5" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => exportWorkshopsTXT(workshops, projectName)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <FileOutput className="h-3.5 w-3.5" />
                    Export as TXT
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-8 py-8">

          {/* Error state */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-base font-medium text-red-400">Failed to generate workshops</p>
              <p className="mt-2 max-w-md text-sm text-slate-400">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-6 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-3 w-3 animate-bounce rounded-full bg-violet-500"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-lg font-medium text-white">Preparing Workshop Plan</p>
              <p className="mt-2 text-sm text-slate-400 transition-opacity duration-300">
                {LOADING_MESSAGES[msgIndex]}
              </p>
            </div>
          )}

          {/* Workshop grid */}
          {!isLoading && (
            <div className="grid gap-6 lg:grid-cols-2">
              {workshops.map((w, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-bold text-violet-300">
                        {i + 1}
                      </span>
                      <h3 className="text-base font-semibold text-white leading-snug">{w.name}</h3>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${PHASE_COLORS[w.phase] ?? "border-white/20 bg-white/5 text-slate-300"}`}>
                        {w.phase}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        {w.duration}
                      </span>
                    </div>
                  </div>

                  {/* Objective */}
                  <p className="mt-3 ml-10 text-sm text-slate-400 leading-relaxed">{w.objective}</p>

                  <div className="mt-5 ml-10 grid gap-5 sm:grid-cols-3">
                    {/* Agenda */}
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <ListChecks className="h-3.5 w-3.5" />
                        Agenda
                      </p>
                      <ul className="space-y-1.5">
                        {w.agenda.map((item, j) => (
                          <li key={j} className="text-sm text-slate-400 before:mr-1.5 before:content-['•'] before:text-violet-400">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Participants */}
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <Users className="h-3.5 w-3.5" />
                        Participants
                      </p>
                      <ul className="space-y-1.5">
                        {w.participants.map((p, j) => (
                          <li key={j} className="text-sm text-slate-400 before:mr-1.5 before:content-['•'] before:text-indigo-400">
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Outputs */}
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <Target className="h-3.5 w-3.5" />
                        Outputs
                      </p>
                      <ul className="space-y-1.5">
                        {w.outputs.map((o, j) => (
                          <li key={j} className="text-sm text-slate-400 before:mr-1.5 before:content-['•'] before:text-emerald-400">
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
