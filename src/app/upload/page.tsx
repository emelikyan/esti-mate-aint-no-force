"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import LoadingEstimation from "@/components/LoadingEstimation";
import { PracticeEstimation, RateConfig } from "@/lib/types";
import {
  DEFAULT_RATES,
  CURRENCY_OPTIONS,
  ROLE_LABELS,
} from "@/lib/constants";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [practices, setPractices] = useState<PracticeEstimation[]>([]);
  const [rateConfig, setRateConfig] = useState<RateConfig>({ ...DEFAULT_RATES });

  useEffect(() => {
    const stored = localStorage.getItem("practice-estimations");
    if (stored) {
      try {
        setPractices(JSON.parse(stored));
      } catch {
        // ignore
      }
    }

    // Load practice-derived rates if available
    const practiceRates = localStorage.getItem("practice-rates");
    if (practiceRates) {
      try {
        const derived = JSON.parse(practiceRates) as {
          pmPercent: number;
          qaPercent: number;
        };
        setRateConfig((prev) => ({
          ...prev,
          pmPercent: derived.pmPercent,
          qaPercent: derived.qaPercent,
        }));
      } catch {
        // ignore
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (startDate) {
        formData.append("startDate", startDate);
      }
      if (practices.length > 0) {
        formData.append("practices", JSON.stringify(practices));
      }
      formData.append("rateConfig", JSON.stringify(rateConfig));

      const res = await fetch("/api/estimate-rfp", {
        method: "POST",
        body: formData,
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

  const updateRate = (field: keyof RateConfig, value: string | number) => {
    setRateConfig((prev) => ({ ...prev, [field]: value }));
  };

  const smallInputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors text-sm";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <LoadingEstimation />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <h1 className="text-3xl font-bold text-gray-900">Upload Your RFP</h1>
      <p className="mt-2 text-gray-600">
        Upload your Request for Proposal document and our AI will analyze it to
        generate a detailed project estimation.
      </p>

      {practices.length > 0 && (
        <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700">
          Using {practices.length} practice project(s) for calibration
        </div>
      )}

      <div className="mt-8">
        <FileUploader
          selectedFile={file}
          onFileSelect={setFile}
          onRemove={() => setFile(null)}
        />
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Planned Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
        />
        <p className="mt-1 text-xs text-gray-500">
          Used to calculate actual calendar dates in the project plan
        </p>
      </div>

      {/* Rate Configuration */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Rates & Configuration
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Currency
            </label>
            <select
              value={rateConfig.currency}
              onChange={(e) => updateRate("currency", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              Hourly Rates ({rateConfig.currency})
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["CS", "Dev", "AR"] as const).map((role) => {
                const rateField =
                  role === "CS"
                    ? "csRate"
                    : role === "Dev"
                      ? "devRate"
                      : "arRate";
                return (
                  <div key={role}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {ROLE_LABELS[role]} ({role})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={rateConfig[rateField] || ""}
                        onChange={(e) =>
                          updateRate(
                            rateField,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className={smallInputClass}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        /hr
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              PM & QA Percentages
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Calculated as a percentage of combined CS + Dev + AR hours per line
              item.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {ROLE_LABELS.PM} (PM %)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rateConfig.pmPercent || ""}
                    onChange={(e) =>
                      updateRate(
                        "pmPercent",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="15"
                    className={smallInputClass}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {ROLE_LABELS.QA} (QA %)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rateConfig.qaPercent || ""}
                    onChange={(e) =>
                      updateRate(
                        "qaPercent",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="20"
                    className={smallInputClass}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file}
        className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Generate Estimation
      </button>
    </div>
  );
}
