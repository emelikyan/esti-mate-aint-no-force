"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import LoadingEstimation from "@/components/LoadingEstimation";
import { PracticeEstimation } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState("");
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
        className="mb-8 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <h1 className="text-3xl font-bold text-slate-900">Upload Your RFP</h1>
      <p className="mt-2 text-slate-600">
        Upload your Request for Proposal document and our AI will analyze it to
        generate a detailed project estimation.
      </p>

      {practices.length > 0 && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
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
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Planned Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
        />
        <p className="mt-1 text-xs text-slate-500">
          Used to calculate actual calendar dates in the project plan
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file}
        className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Generate Estimation
      </button>
    </div>
  );
}
