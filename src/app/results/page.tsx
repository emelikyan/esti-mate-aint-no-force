"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, RotateCcw } from "lucide-react";
import EstimationResults from "@/components/EstimationResults";
import { Estimation } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const [estimation, setEstimation] = useState<Estimation | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("estimation");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setEstimation(JSON.parse(stored));
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!estimation) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  const handleNewEstimate = () => {
    sessionStorage.removeItem("estimation");
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 no-print">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleNewEstimate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4" />
            New Estimate
          </button>
        </div>
      </div>

      <EstimationResults estimation={estimation} />
    </div>
  );
}
