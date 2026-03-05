"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
}: StepIndicatorProps) {
  return (
    <div className="flex items-start justify-between">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                i < currentStep
                  ? "bg-violet-600 text-white"
                  : i === currentStep
                    ? "bg-violet-600 text-white"
                    : "bg-white/[0.06] text-slate-500"
              }`}
            >
              {i < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`mt-1.5 hidden w-16 text-center text-[11px] leading-tight sm:block ${
                i <= currentStep ? "text-violet-400 font-medium" : "text-slate-500"
              }`}
            >
              {stepLabels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`mx-1 h-0.5 flex-1 ${
                i < currentStep ? "bg-violet-600" : "bg-white/[0.06]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
