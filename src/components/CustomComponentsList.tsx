"use client";

import { CustomComponent } from "@/lib/types";
import { Puzzle } from "lucide-react";

interface CustomComponentsListProps {
  components: CustomComponent[];
}

const complexityColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-400",
  medium: "bg-amber-500/10 text-amber-400",
  high: "bg-red-500/10 text-red-400",
};

export default function CustomComponentsList({
  components,
}: CustomComponentsListProps) {
  if (!components || components.length === 0) return null;

  const totalHours = components.reduce((sum, c) => sum + c.estimatedHours, 0);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          Custom Components
        </h3>
        <span className="text-sm text-slate-400">
          {components.length} components &middot; ~{totalHours}h total
        </span>
      </div>

      <div className="mt-6 space-y-2">
        {components.map((comp, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4"
          >
            <div className="mt-0.5 shrink-0 rounded-md bg-violet-500/10 p-1.5">
              <Puzzle className="h-4 w-4 text-violet-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{comp.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${complexityColors[comp.complexity] || ""}`}
                >
                  {comp.complexity}
                </span>
                <span className="ml-auto text-sm text-slate-400">
                  ~{comp.estimatedHours}h
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-400">{comp.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
