"use client";

import { useState, useEffect, useRef } from "react";
import { RateConfig } from "@/lib/types";
import { CURRENCY_OPTIONS, ROLE_LABELS } from "@/lib/constants";

interface ReconfigureRatesModalProps {
  currentRates: RateConfig;
  onApply: (rates: RateConfig) => void;
  onClose: () => void;
}

const smallInputClass =
  "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors text-sm";

const inputClass =
  "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors";

export default function ReconfigureRatesModal({
  currentRates,
  onApply,
  onClose,
}: ReconfigureRatesModalProps) {
  const [rates, setRates] = useState<RateConfig>({ ...currentRates });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const update = (field: keyof RateConfig, value: string | number) => {
    setRates((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#0f0f1a] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-100 mb-5">
          Reconfigure Rates
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Currency
            </label>
            <select
              value={rates.currency}
              onChange={(e) => update("currency", e.target.value)}
              className={inputClass}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-300 mb-3">
              Hourly Rates ({rates.currency})
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                [
                  { role: "CS", field: "csRate" as const },
                  { role: "Dev", field: "devRate" as const },
                  { role: "AR", field: "arRate" as const },
                  { role: "PM", field: "pmRate" as const },
                  { role: "QA", field: "qaRate" as const },
                ] as const
              ).map(({ role, field }) => (
                <div key={role}>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {ROLE_LABELS[role]} ({role})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={rates[field] || ""}
                      onChange={(e) =>
                        update(field, parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                      className={smallInputClass}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      /hr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-300 mb-3">
              PM & QA Percentages
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Calculated as a percentage of combined CS + Dev + AR hours per line
              item.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {ROLE_LABELS.PM} (PM %)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rates.pmPercent || ""}
                    onChange={(e) =>
                      update("pmPercent", parseFloat(e.target.value) || 0)
                    }
                    placeholder="15"
                    className={smallInputClass}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {ROLE_LABELS.QA} (QA %)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rates.qaPercent || ""}
                    onChange={(e) =>
                      update("qaPercent", parseFloat(e.target.value) || 0)
                    }
                    placeholder="20"
                    className={smallInputClass}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(rates)}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.25)] px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-110"
          >
            Apply & Recalculate
          </button>
        </div>
      </div>
    </div>
  );
}
