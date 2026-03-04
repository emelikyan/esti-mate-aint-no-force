"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  BookOpen,
  Upload,
  FileSpreadsheet,
  Check,
  ExternalLink,
} from "lucide-react";
import { PracticeEstimation } from "@/lib/types";
import { PROJECT_TYPES } from "@/lib/constants";
import {
  parseCSVRows,
  aggregateCSVToProject,
  derivePracticeRates,
  CSVRow,
} from "@/lib/parse-csv";

const STORAGE_KEY = "practice-estimations";
const RATES_KEY = "practice-rates";

const emptyForm: Omit<PracticeEstimation, "id"> = {
  projectName: "",
  projectType: "",
  description: "",
  actualTimeline: "",
  actualCost: 0,
  teamSize: 0,
  techStack: "",
  lessonsLearned: "",
};

export default function PracticePage() {
  const router = useRouter();
  const [practices, setPractices] = useState<PracticeEstimation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // CSV upload state
  const [csvRows, setCsvRows] = useState<CSVRow[] | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvProjectName, setCsvProjectName] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPractices(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  const save = (updated: PracticeEstimation[]) => {
    setPractices(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    const derived = derivePracticeRates(updated);
    if (derived) {
      localStorage.setItem(RATES_KEY, JSON.stringify(derived));
    }
  };

  const handleSubmit = () => {
    if (!form.projectName || !form.description) return;

    if (editingId) {
      save(
        practices.map((p) =>
          p.id === editingId ? { ...p, ...form, id: editingId } : p
        )
      );
      setEditingId(null);
    } else {
      save([...practices, { ...form, id: crypto.randomUUID() }]);
    }
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (p: PracticeEstimation) => {
    setForm({
      projectName: p.projectName,
      projectType: p.projectType,
      description: p.description,
      actualTimeline: p.actualTimeline,
      actualCost: p.actualCost,
      teamSize: p.teamSize,
      techStack: p.techStack,
      lessonsLearned: p.lessonsLearned,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    save(practices.filter((p) => p.id !== id));
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  // CSV handlers
  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name;
    setCsvFileName(name);
    // Default project name = filename without extension
    setCsvProjectName(name.replace(/\.csv$/i, ""));

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSVRows(text);
      if (rows.length > 0) {
        setCsvRows(rows);
      } else {
        setCsvRows(null);
        alert(
          "No valid rows found in CSV. Make sure the file has a header row with recognizable column names."
        );
      }
    };
    reader.readAsText(file);

    e.target.value = "";
  };

  const handleCsvImport = () => {
    if (!csvRows || !csvProjectName.trim()) return;
    const project = aggregateCSVToProject(csvRows, csvProjectName.trim());
    save([...practices, project]);
    setCsvRows(null);
    setCsvFileName("");
    setCsvProjectName("");
  };

  const handleCsvCancel = () => {
    setCsvRows(null);
    setCsvFileName("");
    setCsvProjectName("");
  };

  const handleOpenEstimation = (p: PracticeEstimation) => {
    if (!p.fullEstimation) return;
    sessionStorage.setItem("estimation", p.fullEstimation);
    router.push("/results");
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  // Compute CSV totals for the footer
  const csvTotalRow = csvRows?.find((r) => r.isTotal);
  const csvTopLevel = csvRows?.filter(
    (r) => r.isSummary && !r.isTotal && r.row !== ""
  );
  const csvTotals = csvTotalRow
    ? csvTotalRow
    : csvTopLevel && csvTopLevel.length > 0
      ? {
          csMD: csvTopLevel.reduce((s, r) => s + r.csMD, 0),
          devMD: csvTopLevel.reduce((s, r) => s + r.devMD, 0),
          arMD: csvTopLevel.reduce((s, r) => s + r.arMD, 0),
          qaMD: csvTopLevel.reduce((s, r) => s + r.qaMD, 0),
          pmMD: csvTopLevel.reduce((s, r) => s + r.pmMD, 0),
          totalMD: csvTopLevel.reduce((s, r) => s + r.totalMD, 0),
          cost: csvTopLevel.reduce((s, r) => s + r.cost, 0),
        }
      : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Practice Library
          </h1>
          <p className="mt-2 text-gray-600">
            Add real project data from past estimations to calibrate AI
            estimates closer to your practice standards.
          </p>
        </div>
        {!showForm && !csvRows && (
          <div className="flex gap-2">
            <button
              onClick={() => csvInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvSelect}
              className="hidden"
            />
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Project
            </button>
          </div>
        )}
      </div>

      {/* CSV Preview */}
      {csvRows && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Import Project from CSV
              </h2>
            </div>
            <button
              onClick={handleCsvCancel}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Project name input */}
          <div className="mb-4">
            <label className={labelClass}>Project Name *</label>
            <input
              type="text"
              value={csvProjectName}
              onChange={(e) => setCsvProjectName(e.target.value)}
              placeholder="Enter a name for this project"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">
              {csvFileName} — {csvRows.filter((r) => !r.isTotal).length} line
              items will be saved as one project record.
            </p>
          </div>

          {/* Line items table */}
          <div className="max-h-96 overflow-auto rounded-lg border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Feature</th>
                  <th className="px-3 py-2 text-right">CS</th>
                  <th className="px-3 py-2 text-right">Dev</th>
                  <th className="px-3 py-2 text-right">AR</th>
                  <th className="px-3 py-2 text-right">QA</th>
                  <th className="px-3 py-2 text-right">PM</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {csvRows.map((row, i) => (
                  <tr
                    key={i}
                    className={
                      row.isTotal
                        ? "bg-gray-100 font-bold text-gray-900"
                        : row.isSummary
                          ? "bg-gray-50 font-semibold text-gray-800"
                          : "text-gray-700"
                    }
                  >
                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-500 text-xs">
                      {row.row}
                    </td>
                    <td
                      className={`px-3 py-1.5 max-w-[220px] truncate ${!row.isSummary && !row.isTotal ? "pl-6" : ""}`}
                    >
                      {row.feature}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {row.csMD > 0 ? row.csMD : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {row.devMD > 0 ? row.devMD : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {row.arMD > 0 ? row.arMD : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {row.qaMD > 0 ? row.qaMD : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {row.pmMD > 0 ? row.pmMD : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap font-medium">
                      {row.totalMD > 0 ? row.totalMD : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap">
                      {row.cost > 0
                        ? `$${row.cost.toLocaleString()}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Aggregated totals summary */}
          {csvTotals && (
            <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
              <span className="font-medium">Project totals: </span>
              {csvTotals.csMD > 0 && <span>CS {csvTotals.csMD} </span>}
              {csvTotals.devMD > 0 && <span>Dev {csvTotals.devMD} </span>}
              {csvTotals.arMD > 0 && <span>AR {csvTotals.arMD} </span>}
              {csvTotals.qaMD > 0 && <span>QA {csvTotals.qaMD} </span>}
              {csvTotals.pmMD > 0 && <span>PM {csvTotals.pmMD} </span>}
              <span className="font-semibold">
                = {csvTotals.totalMD} MDs
              </span>
              {csvTotals.cost > 0 && (
                <span className="ml-2">
                  ({`$${csvTotals.cost.toLocaleString()}`})
                </span>
              )}
            </div>
          )}

          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
            This CSV will be imported as a single project reference. PM% and
            QA% will be auto-calculated from role man-days (1 MD = 8 hours).
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={handleCsvCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCsvImport}
              disabled={!csvProjectName.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
              Import as 1 Project
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Project" : "Add Historical Project"}
            </h2>
            <button
              onClick={handleCancel}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Project Name *</label>
              <input
                type="text"
                value={form.projectName}
                onChange={(e) =>
                  setForm({ ...form, projectName: e.target.value })
                }
                placeholder="e.g., Customer Portal Redesign"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Project Type</label>
              <select
                value={form.projectType}
                onChange={(e) =>
                  setForm({ ...form, projectType: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Select type</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description *</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Brief description of the project scope and what was delivered..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Actual Timeline</label>
              <input
                type="text"
                value={form.actualTimeline}
                onChange={(e) =>
                  setForm({ ...form, actualTimeline: e.target.value })
                }
                placeholder="e.g., 6 months, 24 weeks"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Actual Cost (USD)</label>
              <input
                type="number"
                value={form.actualCost || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    actualCost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="150000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Team Size</label>
              <input
                type="number"
                value={form.teamSize || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    teamSize: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="8"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tech Stack</label>
              <input
                type="text"
                value={form.techStack}
                onChange={(e) =>
                  setForm({ ...form, techStack: e.target.value })
                }
                placeholder="e.g., React, Node.js, PostgreSQL"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Lessons Learned</label>
              <textarea
                rows={3}
                value={form.lessonsLearned}
                onChange={(e) =>
                  setForm({ ...form, lessonsLearned: e.target.value })
                }
                placeholder="Key takeaways, what was underestimated, what worked well..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.projectName || !form.description}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {practices.length === 0 && !showForm && !csvRows ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="rounded-full bg-gray-100 p-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 font-medium text-gray-900">
            No practice data yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add historical project data to help calibrate future estimations.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {practices.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {p.projectName}
                  </h3>
                  {p.projectType && (
                    <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {p.projectType}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEstimation(p)}
                    disabled={!p.fullEstimation}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      p.fullEstimation
                        ? "text-indigo-600 hover:bg-indigo-50"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                    title={p.fullEstimation ? "Open full estimation" : "No full estimation data (saved before this feature)"}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </button>
                  <button
                    onClick={() => handleEdit(p)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-line line-clamp-4">
                {p.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                {p.actualTimeline && <span>Timeline: {p.actualTimeline}</span>}
                {p.actualCost > 0 && (
                  <span>Cost: ${p.actualCost.toLocaleString()}</span>
                )}
                {p.teamSize > 0 && <span>Team: {p.teamSize} people</span>}
                {p.techStack && <span>Stack: {p.techStack}</span>}
                {p.totalMD != null && p.totalMD > 0 && (
                  <span>Total: {p.totalMD} MDs</span>
                )}
                {p.csMD != null && <span>CS: {p.csMD} MD</span>}
                {p.devMD != null && <span>Dev: {p.devMD} MD</span>}
                {p.arMD != null && <span>AR: {p.arMD} MD</span>}
                {p.qaMD != null && <span>QA: {p.qaMD} MD</span>}
                {p.pmMD != null && <span>PM: {p.pmMD} MD</span>}
              </div>
              {p.lessonsLearned && (
                <p className="mt-2 text-sm italic text-gray-500">
                  &ldquo;{p.lessonsLearned}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
