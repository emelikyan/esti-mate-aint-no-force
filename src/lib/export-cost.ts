import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { CostItem, Estimation, RoleBreakdown } from "./types";
import { COST_PHASES, HOURS_PER_MD, ROLE_LABELS } from "./constants";
import { buildResourcePlan, buildResourcePlanAOA } from "./resource-plan";

type RoleKey = "CS" | "Dev" | "AR" | "PM" | "QA";
const ROLES: RoleKey[] = ["CS", "Dev", "AR", "PM", "QA"];

function getRoleValue(
  roles: RoleBreakdown[],
  role: RoleKey,
  field: "hours" | "cost"
): number {
  const r = roles.find((r) => r.role === role);
  return r ? r[field] : 0;
}

function buildHeaders(): string[] {
  const headers = ["Phase", "Category", "Description"];
  for (const role of ROLES) {
    headers.push(`${ROLE_LABELS[role]} Hrs`, `${ROLE_LABELS[role]} Cost`);
  }
  headers.push(
    "Total Hrs",
    "Total MD",
    "Total Cost",
    "Confidence %",
    "Optimistic Hrs",
    "Pessimistic Hrs",
    "Confirmed",
    "Start Date",
    "End Date"
  );
  return headers;
}

function buildDataRows(estimation: Estimation): (string | number)[][] {
  const rows: (string | number)[][] = [];

  for (const phase of COST_PHASES) {
    const items = estimation.costBreakdown.filter((i) => i.phase === phase);
    if (items.length === 0) continue;

    for (const item of items) {
      const row: (string | number)[] = [phase, item.category, item.description];
      for (const role of ROLES) {
        row.push(
          getRoleValue(item.roles, role, "hours"),
          getRoleValue(item.roles, role, "cost")
        );
      }
      row.push(
        item.totalHours,
        item.totalMD || +(item.totalHours / HOURS_PER_MD).toFixed(1),
        item.totalCost,
        item.userConfidence ?? item.confidence,
        item.optimisticHours || "",
        item.pessimisticHours || "",
        item.confirmed ? "Yes" : "No",
        item.startDate || "",
        item.endDate || ""
      );
      rows.push(row);
    }

    // Phase subtotal
    const subtotal: (string | number)[] = [
      `Subtotal: ${phase}`,
      "",
      "",
    ];
    for (const role of ROLES) {
      subtotal.push(
        items.reduce((s, i) => s + getRoleValue(i.roles, role, "hours"), 0),
        items.reduce((s, i) => s + getRoleValue(i.roles, role, "cost"), 0)
      );
    }
    subtotal.push(
      items.reduce((s, i) => s + i.totalHours, 0),
      +items
        .reduce(
          (s, i) => s + (i.totalMD || i.totalHours / HOURS_PER_MD),
          0
        )
        .toFixed(1),
      items.reduce((s, i) => s + i.totalCost, 0),
      "",
      "",
      "",
      "",
      "",
      ""
    );
    rows.push(subtotal);
  }

  // Grand total
  const all = estimation.costBreakdown;
  const grand: (string | number)[] = ["GRAND TOTAL", "", ""];
  for (const role of ROLES) {
    grand.push(
      all.reduce((s, i) => s + getRoleValue(i.roles, role, "hours"), 0),
      all.reduce((s, i) => s + getRoleValue(i.roles, role, "cost"), 0)
    );
  }
  grand.push(
    all.reduce((s, i) => s + i.totalHours, 0),
    +all
      .reduce((s, i) => s + (i.totalMD || i.totalHours / HOURS_PER_MD), 0)
      .toFixed(1),
    estimation.totalCost.amount ||
      all.reduce((s, i) => s + i.totalCost, 0),
    "",
    "",
    "",
    "",
    "",
    ""
  );
  rows.push(grand);

  return rows;
}

function sanitizeSheetName(name: string): string {
  // Excel sheet names: max 31 chars, no special chars
  return name.replace(/[\\/*?[\]:]/g, "").slice(0, 31) || "Cost Breakdown";
}

function filePrefix(estimation: Estimation): string {
  return estimation.projectName
    ? `${estimation.projectName} - Cost Breakdown`
    : "Cost Breakdown";
}

export function exportCostCSV(estimation: Estimation): void {
  const headers = buildHeaders();
  const dataRows = buildDataRows(estimation);
  const aoa = [headers, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cost Breakdown");
  XLSX.writeFile(wb, `${filePrefix(estimation)}.csv`, { bookType: "csv" });
}

function buildMDSummaryRows(costBreakdown: CostItem[]): (string | number)[][] {
  const matrix: Record<string, Record<string, number>> = {};
  const allRoles = new Set<string>();

  for (const item of costBreakdown) {
    for (const r of item.roles || []) {
      allRoles.add(r.role);
      if (!matrix[r.role]) matrix[r.role] = {};
      matrix[r.role][item.phase] =
        (matrix[r.role][item.phase] || 0) + r.hours / HOURS_PER_MD;
    }
  }

  const roles = ROLES.filter((r) => allRoles.has(r));
  const phases = COST_PHASES.filter((p) =>
    costBreakdown.some((i) => i.phase === p)
  );

  const rows: (string | number)[][] = [];
  rows.push(["Man-Day Summary (Role x Phase)"]);
  rows.push(["Role", ...phases, "Total"]);

  for (const role of roles) {
    const roleTotal = phases.reduce(
      (s, p) => s + (matrix[role]?.[p] || 0),
      0
    );
    rows.push([
      ROLE_LABELS[role] || role,
      ...phases.map((p) => +(matrix[role]?.[p] || 0).toFixed(1)),
      +roleTotal.toFixed(1),
    ]);
  }

  // Total row
  const grandTotal = roles.reduce(
    (s, r) =>
      s + phases.reduce((ps, p) => ps + (matrix[r]?.[p] || 0), 0),
    0
  );
  rows.push([
    "Total",
    ...phases.map((p) =>
      +roles.reduce((s, r) => s + (matrix[r]?.[p] || 0), 0).toFixed(1)
    ),
    +grandTotal.toFixed(1),
  ]);

  rows.push([]); // blank separator
  return rows;
}

export function exportCostXLSX(estimation: Estimation): void {
  const mdRows = buildMDSummaryRows(estimation.costBreakdown);
  const headers = buildHeaders();
  const dataRows = buildDataRows(estimation);
  const aoa = [...mdRows, headers, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  const colWidths = headers.map((h) => ({
    wch: Math.max(h.length + 2, 12),
  }));
  // Make Phase, Category, Description wider
  colWidths[0] = { wch: 22 };
  colWidths[1] = { wch: 28 };
  colWidths[2] = { wch: 40 };
  ws["!cols"] = colWidths;

  // Apply number formats to currency & hours columns
  const currencyFormat = '#,##0.00';
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  const headerRow = mdRows.length; // 0-indexed row where headers start

  for (let R = headerRow + 1; R <= range.e.r; R++) {
    // Cost columns (indices 4,6,8,10,12 — every other starting from 4)
    // Hours columns (indices 3,5,7,9,11)
    // Total Hrs=13, Total MD=14, Total Cost=15, Confidence=16
    for (let C = 3; C <= 16; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (ws[addr] && typeof ws[addr].v === "number") {
        // Currency columns: role costs (4,6,8,10,12), total cost (15)
        if ([4, 6, 8, 10, 12, 15].includes(C)) {
          ws[addr].z = currencyFormat;
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    ws,
    sanitizeSheetName(estimation.projectName)
  );

  // Add Resource Plan sheet
  const plan = buildResourcePlan(estimation);
  const rpAOA = buildResourcePlanAOA(plan);
  if (rpAOA.length > 0) {
    const rpWs = XLSX.utils.aoa_to_sheet(rpAOA);
    const rpColWidths = [{ wch: 18 }];
    for (let i = 0; i < plan.totalWeeks; i++) {
      rpColWidths.push({ wch: Math.max(plan.weekLabels[i].length + 2, 10) });
    }
    rpWs["!cols"] = rpColWidths;
    XLSX.utils.book_append_sheet(wb, rpWs, "Resource Plan");
  }

  XLSX.writeFile(wb, `${filePrefix(estimation)}.xlsx`);
}

export async function copyCostAsImage(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  return new Promise<void>((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("Failed to create image"));
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        resolve();
      } catch (err) {
        reject(err);
      }
    }, "image/png");
  });
}
