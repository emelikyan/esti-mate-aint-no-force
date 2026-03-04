"use client";

import { useState, useRef, useEffect } from "react";
import { QuestionnaireAnswers } from "@/lib/types";
import {
  PROJECT_TYPES,
  TECH_STACK_OPTIONS,
  TIMELINE_OPTIONS,
  BUDGET_OPTIONS,
  getEstimatedEndDate,
} from "@/lib/constants";
import { ChevronDown } from "lucide-react";

interface QuestionnaireFormProps {
  step: number;
  answers: QuestionnaireAnswers;
  onChange: (field: keyof QuestionnaireAnswers, value: string | string[]) => void;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

function TechStackMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${inputClass} flex min-h-[46px] cursor-pointer items-center justify-between gap-2 text-left`}
      >
        <span className={value.length ? "text-slate-900" : "text-slate-400"}>
          {value.length
            ? value.join(", ")
            : "Select technologies (optional)"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {TECH_STACK_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={() => toggle(option)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuestionnaireForm({
  step,
  answers,
  onChange,
}: QuestionnaireFormProps) {
  switch (step) {
    case 0:
      return (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Project Type</label>
            <select
              value={answers.projectType}
              onChange={(e) => onChange("projectType", e.target.value)}
              className={inputClass}
            >
              <option value="">Select a project type</option>
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Technological Stack</label>
            <TechStackMultiSelect
              value={answers.techStack}
              onChange={(v) => onChange("techStack", v)}
            />
          </div>
          <div>
            <label className={labelClass}>Project Description</label>
            <textarea
              rows={5}
              value={answers.projectDescription}
              onChange={(e) => onChange("projectDescription", e.target.value)}
              placeholder="Describe your project, its goals, and what problem it solves..."
              className={inputClass}
            />
          </div>
        </div>
      );

    case 1:
      return (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Target Audience</label>
            <textarea
              rows={3}
              value={answers.targetAudience}
              onChange={(e) => onChange("targetAudience", e.target.value)}
              placeholder="Who will use this product? Describe your target users..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Key Features</label>
            <textarea
              rows={5}
              value={answers.keyFeatures}
              onChange={(e) => onChange("keyFeatures", e.target.value)}
              placeholder="List the main features and functionality you need..."
              className={inputClass}
            />
          </div>
        </div>
      );

    case 2:
      return (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Platform Requirements</label>
            <textarea
              rows={3}
              value={answers.platformRequirements}
              onChange={(e) => onChange("platformRequirements", e.target.value)}
              placeholder="Web, iOS, Android, desktop, etc.? Any specific browsers or devices?"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Integrations</label>
            <textarea
              rows={3}
              value={answers.integrations}
              onChange={(e) => onChange("integrations", e.target.value)}
              placeholder="Any third-party services, APIs, or systems to integrate with?"
              className={inputClass}
            />
          </div>
        </div>
      );

    case 3:
      const estimatedEnd = getEstimatedEndDate(answers.startDate, answers.timeline);
      return (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Design Requirements</label>
            <textarea
              rows={3}
              value={answers.designRequirements}
              onChange={(e) => onChange("designRequirements", e.target.value)}
              placeholder="Any specific design requirements, branding, or style preferences?"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Potential Start Date</label>
            <input
              type="date"
              value={answers.startDate}
              onChange={(e) => onChange("startDate", e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              Used to calculate actual calendar dates in the project plan
            </p>
          </div>
          <div>
            <label className={labelClass}>Desired Timeline</label>
            <select
              value={answers.timeline}
              onChange={(e) => onChange("timeline", e.target.value)}
              className={inputClass}
            >
              <option value="">Select a timeline</option>
              {TIMELINE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          {estimatedEnd && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-medium">Estimated end date: </span>
              {new Date(estimatedEnd + "T12:00:00").toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>
      );

    case 4:
      return (
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Budget Range</label>
            <select
              value={answers.budgetRange}
              onChange={(e) => onChange("budgetRange", e.target.value)}
              className={inputClass}
            >
              <option value="">Select a budget range</option>
              {BUDGET_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Team Preferences</label>
            <textarea
              rows={3}
              value={answers.teamPreferences}
              onChange={(e) => onChange("teamPreferences", e.target.value)}
              placeholder="Any preferences for team size, location, or expertise?"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Additional Notes</label>
            <textarea
              rows={3}
              value={answers.additionalNotes}
              onChange={(e) => onChange("additionalNotes", e.target.value)}
              placeholder="Anything else we should know about the project?"
              className={inputClass}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}
