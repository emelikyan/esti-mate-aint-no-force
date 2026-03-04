"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  BookOpen,
} from "lucide-react";
import { PracticeEstimation } from "@/lib/types";
import { PROJECT_TYPES } from "@/lib/constants";

const STORAGE_KEY = "practice-estimations";

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
  const [practices, setPractices] = useState<PracticeEstimation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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
  };

  const handleSubmit = () => {
    if (!form.projectName || !form.description) return;

    if (editingId) {
      save(
        practices.map((p) =>
          p.id === editingId ? { ...form, id: editingId } : p
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

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors text-sm";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Practice Library
          </h1>
          <p className="mt-2 text-slate-600">
            Add real project data from past estimations to calibrate AI
            estimates closer to your practice standards.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Edit Project" : "Add Historical Project"}
            </h2>
            <button
              onClick={handleCancel}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.projectName || !form.description}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {practices.length === 0 && !showForm ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <BookOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 font-medium text-slate-900">
            No practice data yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Add historical project data to help calibrate future estimations.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {practices.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {p.projectName}
                  </h3>
                  {p.projectType && (
                    <span className="mt-1 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {p.projectType}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(p)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                {p.actualTimeline && <span>Timeline: {p.actualTimeline}</span>}
                {p.actualCost > 0 && (
                  <span>Cost: ${p.actualCost.toLocaleString()}</span>
                )}
                {p.teamSize > 0 && <span>Team: {p.teamSize} people</span>}
                {p.techStack && <span>Stack: {p.techStack}</span>}
              </div>
              {p.lessonsLearned && (
                <p className="mt-2 text-sm italic text-slate-500">
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
