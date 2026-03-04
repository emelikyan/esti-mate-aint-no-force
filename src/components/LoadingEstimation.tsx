"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Analyzing your project requirements...",
  "Identifying key deliverables and milestones...",
  "Estimating timeline and costs...",
  "Assessing risks and dependencies...",
  "Building team composition recommendations...",
  "Listing custom components needed...",
  "Identifying assumptions and limitations...",
  "Reviewing confidence scores...",
  "Preparing your detailed breakdown...",
];

export default function LoadingEstimation() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-3 w-3 animate-bounce rounded-full bg-blue-600"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-lg font-medium text-slate-900">
        Generating Your Estimation
      </p>
      <p className="mt-2 text-sm text-slate-500 transition-opacity duration-300">
        {MESSAGES[messageIndex]}
      </p>
      <p className="mt-6 text-xs text-slate-400">
        This typically takes 30-60 seconds (includes confidence review)
      </p>
    </div>
  );
}
