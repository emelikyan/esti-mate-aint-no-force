"use client";

import { CustomComponent } from "@/lib/types";
import { Puzzle } from "lucide-react";

interface CustomComponentsListProps {
  components: CustomComponent[];
}

const complexityColors: Record<string, string> = {
  low: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
};

export default function CustomComponentsList({
  components,
}: CustomComponentsListProps) {
  if (!components || components.length === 0) return null;

  const totalHours = components.reduce((sum, c) => sum + c.estimatedHours, 0);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          Custom Components
        </h3>
        <span className="text-sm text-gray-500">
          {components.length} components &middot; ~{totalHours}h total
        </span>
      </div>

      <div className="mt-6 space-y-2">
        {components.map((comp, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="mt-0.5 shrink-0 rounded-md bg-indigo-50 p-1.5">
              <Puzzle className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{comp.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${complexityColors[comp.complexity] || ""}`}
                >
                  {comp.complexity}
                </span>
                <span className="ml-auto text-sm text-gray-500">
                  ~{comp.estimatedHours}h
                </span>
              </div>
              <p className="mt-0.5 text-sm text-gray-600">{comp.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
