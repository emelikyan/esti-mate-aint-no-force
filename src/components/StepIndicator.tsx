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
    <div className="flex items-center justify-between">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                i < currentStep
                  ? "bg-blue-600 text-white"
                  : i === currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {i < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`mt-1 hidden text-xs sm:block ${
                i <= currentStep ? "text-blue-600 font-medium" : "text-slate-400"
              }`}
            >
              {stepLabels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`mx-2 h-0.5 w-8 sm:w-16 ${
                i < currentStep ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
