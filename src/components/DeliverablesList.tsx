"use client";

import { Deliverable, Phase } from "@/lib/types";
import { Package, FileText, Palette, Server, Box } from "lucide-react";

interface DeliverablesListProps {
  deliverables: Deliverable[];
  phases: Phase[];
}

const typeIcons: Record<string, typeof Package> = {
  software: Package,
  document: FileText,
  design: Palette,
  infrastructure: Server,
  other: Box,
};

const typeColors: Record<string, string> = {
  software: "bg-violet-500/10 text-violet-400",
  document: "bg-purple-500/10 text-purple-400",
  design: "bg-pink-500/10 text-pink-400",
  infrastructure: "bg-emerald-500/10 text-emerald-400",
  other: "bg-white/10 text-slate-300",
};

export default function DeliverablesList({
  deliverables,
  phases,
}: DeliverablesListProps) {
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);
  const grouped = new Map<string, Deliverable[]>();

  for (const d of deliverables) {
    const list = grouped.get(d.phase) || [];
    list.push(d);
    grouped.set(d.phase, list);
  }

  return (
    <section>
      <h3 className="text-xl font-semibold text-white">Deliverables</h3>

      <div className="mt-6 space-y-6">
        {sortedPhases.map((phase) => {
          const items = grouped.get(phase.name);
          if (!items || items.length === 0) return null;

          return (
            <div key={phase.name}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {phase.name}
              </h4>
              <div className="mt-2 space-y-2">
                {items.map((d, i) => {
                  const Icon = typeIcons[d.type] || Box;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3"
                    >
                      <div className="mt-0.5 shrink-0 rounded-md bg-white/5 p-1.5">
                        <Icon className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {d.name}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[d.type] || ""}`}
                          >
                            {d.type}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-400">
                          {d.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
