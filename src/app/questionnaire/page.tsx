"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import StepIndicator from "@/components/StepIndicator";
import { nextWeekYMD } from "@/components/DatePicker";
import QuestionnaireForm from "@/components/QuestionnaireForm";
import LoadingEstimation from "@/components/LoadingEstimation";
import { QUESTIONNAIRE_STEPS, DEFAULT_RATES, PRACTICE_SEED_URL } from "@/lib/constants";
import { derivePracticeRates } from "@/lib/parse-csv";
import { QuestionnaireAnswers, PracticeEstimation, RateConfig } from "@/lib/types";

const INITIAL_ANSWERS: QuestionnaireAnswers = {
  projectType: "",
  techStack: [],
  projectDescription: "",
  targetAudience: "",
  keyFeatures: "",
  platformRequirements: "",
  integrations: "",
  designRequirements: "",
  timeline: "",
  startDate: nextWeekYMD(),
  budgetRange: "",
  teamPreferences: "",
  additionalNotes: "",
  rateConfig: { ...DEFAULT_RATES },
};

export default function QuestionnairePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(INITIAL_ANSWERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [practices, setPractices] = useState<PracticeEstimation[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("practice-estimations");
    if (stored) {
      try {
        setPractices(JSON.parse(stored));
      } catch {
        // ignore
      }
    } else {
      // No local data — load default practice library from seed
      fetch(PRACTICE_SEED_URL)
        .then((res) => (res.ok ? res.json() : []))
        .then((seed: PracticeEstimation[]) => {
          if (seed.length > 0) {
            setPractices(seed);
            localStorage.setItem("practice-estimations", JSON.stringify(seed));
            const derived = derivePracticeRates(seed);
            if (derived) {
              localStorage.setItem("practice-rates", JSON.stringify(derived));
              setAnswers((prev) => ({
                ...prev,
                rateConfig: {
                  ...prev.rateConfig,
                  pmPercent: derived.pmPercent,
                  qaPercent: derived.qaPercent,
                },
              }));
            }
          }
        })
        .catch(() => {});
    }

    // Load practice-derived rates if available
    const practiceRates = localStorage.getItem("practice-rates");
    if (practiceRates) {
      try {
        const derived = JSON.parse(practiceRates) as { pmPercent: number; qaPercent: number };
        setAnswers((prev) => ({
          ...prev,
          rateConfig: {
            ...prev.rateConfig,
            pmPercent: derived.pmPercent,
            qaPercent: derived.qaPercent,
          },
        }));
      } catch {
        // ignore
      }
    }
  }, []);

  const isLastStep = currentStep === QUESTIONNAIRE_STEPS.length - 1;

  const handleChange = (
    field: keyof QuestionnaireAnswers,
    value: string | string[] | RateConfig
  ) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 0 && !answers.projectDescription.trim()) {
      setError("Please provide a project description to continue.");
      return;
    }
    setError(null);
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!answers.projectDescription.trim()) {
      setError("Project description is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/estimate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          practices: practices.length > 0 ? practices : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate estimation");
      }

      sessionStorage.setItem("estimation", JSON.stringify(data.estimation));
      router.push("/results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <LoadingEstimation />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <h1 className="text-3xl font-bold text-slate-100">
        Tell Us About Your Project
      </h1>
      <p className="mt-2 text-slate-400">
        Answer a few questions and we&apos;ll generate a detailed estimation for
        your project.
      </p>

      {practices.length > 0 && (
        <div className="mt-4 rounded-lg border border-violet-500/15 bg-violet-500/10 px-4 py-2.5 text-sm text-violet-300">
          Using {practices.length} practice project(s) for calibration
        </div>
      )}

      <div className="mt-8">
        <StepIndicator
          currentStep={currentStep}
          totalSteps={QUESTIONNAIRE_STEPS.length}
          stepLabels={QUESTIONNAIRE_STEPS.map((s) => s.title)}
        />
      </div>

      <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm backdrop-blur-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-100">
          {QUESTIONNAIRE_STEPS[currentStep].title}
        </h2>
        <QuestionnaireForm
          step={currentStep}
          answers={answers}
          onChange={handleChange}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {isLastStep ? (
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.25)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110"
          >
            Generate Estimation
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.25)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
