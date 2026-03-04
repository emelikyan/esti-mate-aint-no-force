import { PracticeEstimation } from "./types";
import { HOURS_PER_MD } from "./constants";

/** A single parsed row from a CSV file, used for preview */
export interface CSVRow {
  row: string;        // hierarchical label like "1", "1.1", "2.4"
  feature: string;
  description: string;
  assumption: string;
  csMD: number;
  devMD: number;
  arMD: number;
  pmMD: number;
  qaMD: number;
  totalMD: number;
  cost: number;
  isSummary: boolean; // true for parent rows (1, 2, 3) and total rows
  isTotal: boolean;   // true for the grand total row
}

/** Column aliases for flexible header detection (case-insensitive) */
const COLUMN_ALIASES: Record<string, string[]> = {
  feature: [
    "feature", "item", "module", "component",
    "project name", "project", "name", "project_name",
  ],
  row: ["row", "row #", "row number", "#", "id", "no", "no."],
  description: [
    "description", "desc", "summary", "scope",
    "functionality", "detail", "details", "requirement",
  ],
  assumption: ["assumption", "assumptions", "comment", "comments"],
  cost: [
    "w/o vat", "without vat", "cost", "actual cost", "total cost",
    "actual_cost", "total_cost", "budget", "amount", "price", "total price",
  ],
  csMD: [
    "consultant", "cs", "consulting",
    "cs md", "cs mds", "cs man-days", "cs days",
    "cs hours", "cs_hours", "consultant hours", "consulting hours",
  ],
  devMD: [
    "developer", "dev", "development",
    "dev md", "dev mds", "dev man-days", "dev days",
    "dev hours", "dev_hours", "developer hours", "development hours",
  ],
  arMD: [
    "architect", "ar", "architecture",
    "ar md", "ar mds", "ar man-days", "ar days",
    "ar hours", "ar_hours", "architect hours", "architecture hours",
  ],
  pmMD: [
    "pm", "project manager", "management",
    "pm md", "pm mds", "pm man-days", "pm days",
    "pm hours", "pm_hours", "project manager hours", "management hours",
  ],
  qaMD: [
    "qa", "qa engineer", "tester", "testing", "test",
    "qa md", "qa mds", "qa man-days", "qa days",
    "qa hours", "qa_hours", "qa engineer hours", "testing hours", "test hours",
  ],
  totalMD: [
    "total", "total md", "total mds", "total man-days", "total days",
    "total hours", "total_hours", "hours total", "total hrs",
  ],
};

/**
 * Split CSV text into logical rows, respecting quoted fields that may
 * contain embedded newlines and commas.
 */
function splitCSVRows(text: string): string[] {
  const rows: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '""';
          i++;
        } else {
          inQuotes = false;
          current += char;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        current += char;
      } else if (char === "\r") {
        if (i + 1 < text.length && text[i + 1] === "\n") {
          i++;
        }
        rows.push(current);
        current = "";
      } else if (char === "\n") {
        rows.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  if (current.length > 0) {
    rows.push(current);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function detectColumnMapping(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
  const usedFields = new Set<string>();

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      if (mapping[i]) continue;
      if (usedFields.has(field)) break;
      const header = normalizedHeaders[i];
      if (aliases.includes(header)) {
        mapping[i] = field;
        usedFields.add(field);
        break;
      }
    }
  }

  return mapping;
}

/** Parse a currency/number string like "139,764.80" or "15.0" into a float */
function parseNumericValue(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.,\-]/g, "");
  const normalized = cleaned.replace(/,/g, "");
  return parseFloat(normalized) || 0;
}

/**
 * Determine if a row label is a summary/parent row.
 * Summary rows: "1", "2", "3" (no period) or "1.", "2." etc.
 * Detail rows: "1.1", "1.2", "2.4" (have sub-numbers after period)
 */
function isSummaryRow(rowLabel: string): boolean {
  const trimmed = rowLabel.replace(/\.$/, "").trim();
  if (!trimmed) return false;
  // If it doesn't contain a period with digits after it, it's a summary
  return !/\d+\.\d+/.test(trimmed);
}

/** Parse CSV text into individual rows for preview */
export function parseCSVRows(csvText: string): CSVRow[] {
  const rawRows = splitCSVRows(csvText).filter((r) => r.trim().length > 0);

  if (rawRows.length < 2) return [];

  const headers = parseCSVLine(rawRows[0]);
  const columnMap = detectColumnMapping(headers);

  const hasFeature = Object.values(columnMap).includes("feature");
  if (!hasFeature) return [];

  const results: CSVRow[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const values = parseCSVLine(rawRows[i]);
    const mapped: Record<string, string> = {};

    for (const [colIndex, fieldName] of Object.entries(columnMap)) {
      const idx = parseInt(colIndex);
      if (idx < values.length) {
        mapped[fieldName] = values[idx];
      }
    }

    const feature = mapped.feature || "";
    const rowLabel = mapped.row || "";

    // Skip completely empty rows
    if (!feature && !rowLabel) continue;

    const csMD = parseNumericValue(mapped.csMD);
    const devMD = parseNumericValue(mapped.devMD);
    const arMD = parseNumericValue(mapped.arMD);
    const pmMD = parseNumericValue(mapped.pmMD);
    const qaMD = parseNumericValue(mapped.qaMD);
    const totalMD = parseNumericValue(mapped.totalMD) ||
      (csMD + devMD + arMD + pmMD + qaMD);

    // Detect total row: empty row label with "total" in feature name
    const isTotal = !rowLabel && /total/i.test(feature);
    const summary = isTotal || (rowLabel !== "" && isSummaryRow(rowLabel));

    results.push({
      row: rowLabel,
      feature,
      description: mapped.description || "",
      assumption: mapped.assumption || "",
      csMD,
      devMD,
      arMD,
      pmMD,
      qaMD,
      totalMD,
      cost: parseNumericValue(mapped.cost),
      isSummary: summary,
      isTotal,
    });
  }

  return results;
}

/**
 * Aggregate parsed CSV rows into a single PracticeEstimation.
 * Uses top-level summary rows (1, 2, 3) for totals to avoid double-counting.
 * Falls back to a total row or summing leaf rows.
 */
export function aggregateCSVToProject(
  rows: CSVRow[],
  projectName: string
): PracticeEstimation {
  // Find the total row
  const totalRow = rows.find((r) => r.isTotal);

  // Find top-level summary rows (e.g., "1", "2", "3" — not sub-items)
  const topLevelSummaries = rows.filter(
    (r) => r.isSummary && !r.isTotal && r.row !== ""
  );

  // Leaf rows are detail rows (e.g., "1.1", "1.2")
  const leafRows = rows.filter((r) => !r.isSummary);

  // Use totals from: total row > sum of top-level summaries > sum of leaf rows
  let csMD: number, devMD: number, arMD: number, pmMD: number, qaMD: number;
  let totalMD: number, totalCost: number;

  if (totalRow) {
    csMD = totalRow.csMD;
    devMD = totalRow.devMD;
    arMD = totalRow.arMD;
    pmMD = totalRow.pmMD;
    qaMD = totalRow.qaMD;
    totalMD = totalRow.totalMD;
    totalCost = totalRow.cost;
  } else if (topLevelSummaries.length > 0) {
    csMD = topLevelSummaries.reduce((s, r) => s + r.csMD, 0);
    devMD = topLevelSummaries.reduce((s, r) => s + r.devMD, 0);
    arMD = topLevelSummaries.reduce((s, r) => s + r.arMD, 0);
    pmMD = topLevelSummaries.reduce((s, r) => s + r.pmMD, 0);
    qaMD = topLevelSummaries.reduce((s, r) => s + r.qaMD, 0);
    totalMD = topLevelSummaries.reduce((s, r) => s + r.totalMD, 0);
    totalCost = topLevelSummaries.reduce((s, r) => s + r.cost, 0);
  } else {
    csMD = leafRows.reduce((s, r) => s + r.csMD, 0);
    devMD = leafRows.reduce((s, r) => s + r.devMD, 0);
    arMD = leafRows.reduce((s, r) => s + r.arMD, 0);
    pmMD = leafRows.reduce((s, r) => s + r.pmMD, 0);
    qaMD = leafRows.reduce((s, r) => s + r.qaMD, 0);
    totalMD = leafRows.reduce((s, r) => s + r.totalMD, 0);
    totalCost = leafRows.reduce((s, r) => s + r.cost, 0);
  }

  // Build a rich description from all rows
  const descLines: string[] = [];
  for (const r of rows) {
    if (r.isTotal) continue;
    const indent = r.isSummary ? "" : "  ";
    const label = r.row ? `${r.row} ` : "";
    let line = `${indent}${label}${r.feature}`;
    if (r.totalMD > 0) line += ` (${r.totalMD} MD)`;
    descLines.push(line);
    if (r.description) {
      descLines.push(`${indent}  ${r.description}`);
    }
    if (r.assumption) {
      descLines.push(`${indent}  Assumption: ${r.assumption}`);
    }
  }

  return {
    id: crypto.randomUUID(),
    projectName,
    projectType: "",
    description: descLines.join("\n"),
    actualTimeline: "",
    actualCost: totalCost,
    teamSize: 0,
    techStack: "",
    lessonsLearned: "",
    csMD: csMD > 0 ? csMD : undefined,
    devMD: devMD > 0 ? devMD : undefined,
    arMD: arMD > 0 ? arMD : undefined,
    pmMD: pmMD > 0 ? pmMD : undefined,
    qaMD: qaMD > 0 ? qaMD : undefined,
    totalMD: totalMD > 0 ? totalMD : undefined,
    csHours: csMD > 0 ? csMD * HOURS_PER_MD : undefined,
    devHours: devMD > 0 ? devMD * HOURS_PER_MD : undefined,
    arHours: arMD > 0 ? arMD * HOURS_PER_MD : undefined,
    pmHours: pmMD > 0 ? pmMD * HOURS_PER_MD : undefined,
    qaHours: qaMD > 0 ? qaMD * HOURS_PER_MD : undefined,
  };
}

/** Calculate PM% and QA% averages from practice data */
export function derivePracticeRates(
  practices: PracticeEstimation[]
): { pmPercent: number; qaPercent: number } | null {
  const pmRatios: number[] = [];
  const qaRatios: number[] = [];

  for (const p of practices) {
    const csVal = p.csMD ?? (p.csHours ? p.csHours / HOURS_PER_MD : 0);
    const devVal = p.devMD ?? (p.devHours ? p.devHours / HOURS_PER_MD : 0);
    const arVal = p.arMD ?? (p.arHours ? p.arHours / HOURS_PER_MD : 0);
    const pmVal = p.pmMD ?? (p.pmHours ? p.pmHours / HOURS_PER_MD : 0);
    const qaVal = p.qaMD ?? (p.qaHours ? p.qaHours / HOURS_PER_MD : 0);

    const base = csVal + devVal + arVal;
    if (base > 0) {
      if (pmVal > 0) {
        pmRatios.push((pmVal / base) * 100);
      }
      if (qaVal > 0) {
        qaRatios.push((qaVal / base) * 100);
      }
    }
  }

  if (pmRatios.length === 0 && qaRatios.length === 0) return null;

  return {
    pmPercent:
      pmRatios.length > 0
        ? Math.round(pmRatios.reduce((a, b) => a + b, 0) / pmRatios.length)
        : 15,
    qaPercent:
      qaRatios.length > 0
        ? Math.round(qaRatios.reduce((a, b) => a + b, 0) / qaRatios.length)
        : 20,
  };
}
