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
  software: "bg-blue-50 text-blue-700",
  document: "bg-purple-50 text-purple-700",
  design: "bg-pink-50 text-pink-700",
  infrastructure: "bg-emerald-50 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
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
      <h3 className="text-xl font-semibold text-gray-900">Deliverables</h3>

      <div className="mt-6 space-y-6">
        {sortedPhases.map((phase) => {
          const items = grouped.get(phase.name);
          if (!items || items.length === 0) return null;

          return (
            <div key={phase.name}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {phase.name}
              </h4>
              <div className="mt-2 space-y-2">
                {items.map((d, i) => {
                  const Icon = typeIcons[d.type] || Box;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <div className="mt-0.5 shrink-0 rounded-md bg-gray-50 p-1.5">
                        <Icon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {d.name}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[d.type] || ""}`}
                          >
                            {d.type}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-600">
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
