"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Presentation,
  Check,
  Zap,
  Handshake,
  GraduationCap,
  BookOpen,
  BarChart3,
  MonitorPlay,
  Lightbulb,
  Target,
  Minus,
  MessageCircle,
  FileSpreadsheet,
  ImagePlus,
  Save,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Estimation } from "@/lib/types";
import {
  PRESENTATION_STYLES,
  PRESENTATION_STYLE_THEMES,
  PresentationStyleId,
  getDensityLimits,
} from "@/lib/constants";

const BRANDING_STORAGE_KEY = "presentation-branding";
const BRANDING_PRESETS_KEY = "presentation-branding-presets";

export interface PresentationBranding {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontId: string;
  fontColor: string;
  logoDataUrl: string | null;
}

export interface BrandingPreset extends PresentationBranding {
  id: string;
  name: string;
}

/** Built-in presets users can select */
const BUILTIN_PRESETS: BrandingPreset[] = [
  { id: "default", name: "Default", primaryColor: "", secondaryColor: "", backgroundColor: "", fontId: "", fontColor: "", logoDataUrl: null },
  { id: "violet", name: "Violet Professional", primaryColor: "#8B5CF6", secondaryColor: "#6366F1", backgroundColor: "#1E293B", fontId: "sans", fontColor: "#E2E8F0", logoDataUrl: null },
  { id: "corporate", name: "Corporate Blue", primaryColor: "#2563EB", secondaryColor: "#3B82F6", backgroundColor: "#0F172A", fontId: "modern", fontColor: "#F1F5F9", logoDataUrl: null },
  { id: "slate", name: "Dark Slate", primaryColor: "#64748B", secondaryColor: "#94A3B8", backgroundColor: "#0F172A", fontId: "sans", fontColor: "#CBD5E1", logoDataUrl: null },
  { id: "emerald", name: "Emerald", primaryColor: "#10B981", secondaryColor: "#34D399", backgroundColor: "#064E3B", fontId: "sans", fontColor: "#D1FAE5", logoDataUrl: null },
];

function loadBrandingFromStorage(): Partial<PresentationBranding> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as Partial<PresentationBranding>;
    return parsed;
  } catch {
    return {};
  }
}

function saveBrandingToStorage(branding: PresentationBranding) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
  } catch {
    // Ignore quota or other storage errors
  }
}

function loadBrandingPresets(): BrandingPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(BRANDING_PRESETS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as BrandingPreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBrandingPresets(presets: BrandingPreset[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRANDING_PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // Ignore quota or other storage errors
  }
}

/** Font options for presentation: CSS for preview, standard name for PPTX */
const FONT_OPTIONS = [
  { id: "", name: "Default", fontFamily: "", pptxFont: "" },
  { id: "sans", name: "Sans", fontFamily: "Inter, system-ui, sans-serif", pptxFont: "Arial" },
  { id: "serif", name: "Serif", fontFamily: "Georgia, 'Times New Roman', serif", pptxFont: "Georgia" },
  { id: "modern", name: "Modern", fontFamily: "'Segoe UI', system-ui, sans-serif", pptxFont: "Calibri" },
  { id: "classic", name: "Classic", fontFamily: "'Times New Roman', Times, serif", pptxFont: "Times New Roman" },
  { id: "verdana", name: "Verdana", fontFamily: "Verdana, Geneva, sans-serif", pptxFont: "Verdana" },
] as const;

/** Hex to rgba string for inline styles */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace(/^#/, "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Data URL to format pptxgenjs expects: "image/png;base64,XXX" (no "data:" prefix) */
function dataUrlForPptx(dataUrl: string): string {
  return dataUrl.replace(/^data:/, "");
}

/** Convert any image data URL to a clean PNG data URL so PPTX embeds reliably */
function logoDataUrlToPng(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const pngDataUrl = canvas.toDataURL("image/png");
        resolve(pngDataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const STYLE_ICONS: Record<PresentationStyleId, LucideIcon> = {
  aggressive: Zap,
  consultative: Handshake,
  educational: GraduationCap,
  storytelling: BookOpen,
  "data-driven": BarChart3,
  demonstration: MonitorPlay,
  visionary: Lightbulb,
  "problem-agitation-solution": Target,
  minimalist: Minus,
  interactive: MessageCircle,
};

const STYLE_ACCENTS: Record<PresentationStyleId, string> = {
  aggressive: "from-amber-500/20 to-orange-600/20 border-amber-500/40",
  consultative: "from-emerald-500/20 to-teal-600/20 border-emerald-500/40",
  educational: "from-blue-500/20 to-indigo-600/20 border-blue-500/40",
  storytelling: "from-violet-500/20 to-purple-600/20 border-violet-500/40",
  "data-driven": "from-cyan-500/20 to-sky-600/20 border-cyan-500/40",
  demonstration: "from-fuchsia-500/20 to-pink-600/20 border-fuchsia-500/40",
  visionary: "from-yellow-500/20 to-amber-600/20 border-yellow-500/40",
  "problem-agitation-solution": "from-rose-500/20 to-red-600/20 border-rose-500/40",
  minimalist: "from-slate-400/20 to-slate-600/20 border-slate-400/40",
  interactive: "from-green-500/20 to-emerald-600/20 border-green-500/40",
};

const STYLE_ICON_COLORS: Record<PresentationStyleId, string> = {
  aggressive: "text-amber-400",
  consultative: "text-emerald-400",
  educational: "text-blue-400",
  storytelling: "text-violet-400",
  "data-driven": "text-cyan-400",
  demonstration: "text-fuchsia-400",
  visionary: "text-yellow-400",
  "problem-agitation-solution": "text-rose-400",
  minimalist: "text-slate-300",
  interactive: "text-green-400",
};

interface PresentationModalProps {
  estimation: Estimation;
  onClose: () => void;
}

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

async function buildAndDownloadPptx(
  estimation: Estimation,
  styleId: PresentationStyleId,
  branding: PresentationBranding
): Promise<void> {
  const pptxgen = (await import("pptxgenjs")).default;
  const pptx = new pptxgen();
  const theme = PRESENTATION_STYLE_THEMES[styleId];
  const limits = getDensityLimits(theme.density);
  const toHex = (s: string) => s.replace(/^#/, "");
  const primaryHex = toHex(branding.primaryColor || theme.accentHex);
  const secondaryHex = toHex(branding.secondaryColor || branding.primaryColor || theme.accentHex);
  const bgHex = toHex(branding.backgroundColor || "1E293B");
  const bodyHex = branding.fontColor ? toHex(branding.fontColor) : "E2E8F0";
  const fontFace = branding.fontId ? (FONT_OPTIONS.find((f) => f.id === branding.fontId)?.pptxFont || "") : "";
  const fontOpts = fontFace ? { fontFace } : {};
  const logoPptxData = branding.logoDataUrl
    ? dataUrlForPptx(await logoDataUrlToPng(branding.logoDataUrl))
    : null;
  const totalWeeks =
    estimation.timeline.length > 0
      ? Math.max(...estimation.timeline.map((t) => t.endWeek))
      : estimation.phases.reduce((s, p) => s + p.durationWeeks, 0);
  const totalTeam = estimation.team.reduce((s, t) => s + t.count, 0);
  const cur = estimation.totalCost.currency;
  const isMinimal = theme.density === "minimal";

  pptx.title = estimation.projectName;
  pptx.author = "EstiMate";

  const titleColorHex = branding.fontColor ? bodyHex : "FFFFFF";
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: bgHex };
  titleSlide.addText(estimation.projectName, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1.2,
    fontSize: isMinimal ? 48 : 44,
    bold: true,
    align: "center",
    color: titleColorHex,
    ...fontOpts,
  });
  titleSlide.addText(theme.subtitle, {
    x: 0.5,
    y: 2.8,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: branding.fontColor ? bodyHex : primaryHex,
    align: "center",
    ...fontOpts,
  });
  if (logoPptxData) {
    titleSlide.addImage({
      data: logoPptxData,
      x: 8.2,
      y: 0.3,
      w: 1.2,
      h: 0.6,
    });
  }

  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: bgHex };
  summarySlide.addText("Summary", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: primaryHex,
    ...fontOpts,
  });
  summarySlide.addText(estimation.summary, {
    x: 0.5,
    y: 1,
    w: 9,
    h: 4,
    fontSize: isMinimal ? 18 : 14,
    valign: "top",
    color: bodyHex,
    ...fontOpts,
  });
  if (logoPptxData) {
    summarySlide.addImage({ data: logoPptxData, x: 8.2, y: 0.3, w: 1.2, h: 0.6 });
  }

  const metricsSlide = pptx.addSlide();
  metricsSlide.background = { color: bgHex };
  metricsSlide.addText(theme.metricsTitle, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: primaryHex,
    ...fontOpts,
  });
  const metrics = [
    { label: "Total cost", value: fmt(estimation.totalCost.amount, cur) },
    { label: "Timeline", value: `${totalWeeks} weeks` },
    { label: "Team size", value: String(totalTeam) },
  ];
  metrics.forEach((m, i) => {
    metricsSlide.addText(m.value, {
      x: 0.5 + i * 3.2,
      y: 1.5,
      w: 2.8,
      h: 0.8,
      fontSize: 24,
      bold: true,
      align: "center",
      color: "FFFFFF",
      ...fontOpts,
    });
    metricsSlide.addText(m.label, {
      x: 0.5 + i * 3.2,
      y: 2.3,
      w: 2.8,
      h: 0.4,
      fontSize: 12,
      color: bodyHex,
      align: "center",
      ...fontOpts,
    });
  });
  if (logoPptxData) {
    metricsSlide.addImage({ data: logoPptxData, x: 8.2, y: 0.3, w: 1.2, h: 0.6 });
  }

  const phasesSlide = pptx.addSlide();
  phasesSlide.background = { color: bgHex };
  phasesSlide.addText("Phases", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: primaryHex,
    ...fontOpts,
  });
  const timelineItems =
    estimation.timeline.length > 0
      ? estimation.timeline.slice(0, limits.phases)
      : estimation.phases
          .slice(0, limits.phases)
          .sort((a, b) => a.order - b.order)
          .reduce<{ phase: string; startWeek: number; endWeek: number }[]>(
            (acc, p) => {
              const start = acc.length === 0 ? 1 : acc[acc.length - 1].endWeek + 1;
              acc.push({ phase: p.name, startWeek: start, endWeek: start + p.durationWeeks - 1 });
              return acc;
            },
            []
          );
  const phaseTotalWeeks =
    timelineItems.length > 0 ? Math.max(...timelineItems.map((t) => t.endWeek)) : totalWeeks;
  const barW = 8;
  const barX0 = 0.5;
  timelineItems.forEach((item, i) => {
    const y = 0.95 + i * 0.65;
    phasesSlide.addText(item.phase, {
      x: barX0,
      y,
      w: 2.2,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: primaryHex,
      ...fontOpts,
    });
    phasesSlide.addText(`W${item.startWeek}–W${item.endWeek}`, {
      x: barX0 + barW - 1,
      y,
      w: 1,
      h: 0.3,
      fontSize: 10,
      color: bodyHex,
      align: "right",
      ...fontOpts,
    });
    const left = (item.startWeek - 1) / phaseTotalWeeks;
    const width = (item.endWeek - item.startWeek + 1) / phaseTotalWeeks;
    phasesSlide.addShape(pptx.ShapeType.rect, {
      x: barX0 + left * barW,
      y: y + 0.28,
      w: width * barW,
      h: 0.28,
      fill: { color: primaryHex },
    });
  });
  const detailsY = 0.95 + timelineItems.length * 0.65 + 0.2;
  const phaseItems = estimation.phases.slice(0, limits.phases);
  phaseItems.forEach((p, i) => {
    const y = detailsY + i * 0.5;
    phasesSlide.addText(p.name, {
      x: 0.5,
      y,
      w: 2.2,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: primaryHex,
      ...fontOpts,
    });
    phasesSlide.addText(`${p.description} (${p.durationWeeks}w)`, {
      x: 2.8,
      y,
      w: 6.2,
      h: 0.25,
      fontSize: 9,
      color: bodyHex,
      ...fontOpts,
    });
  });
  if (logoPptxData) {
    phasesSlide.addImage({ data: logoPptxData, x: 8.2, y: 0.3, w: 1.2, h: 0.6 });
  }

  const costSlide = pptx.addSlide();
  costSlide.background = { color: bgHex };
  costSlide.addText(theme.costTitle, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: primaryHex,
    ...fontOpts,
  });
  const costRows = estimation.costBreakdown.slice(0, limits.costRows).map((item) => [
    item.phase,
    item.category,
    fmt(item.totalCost, cur),
  ]);
  costSlide.addTable(
    [
      ["Phase", "Category", "Cost"],
      ...costRows,
    ],
    {
      x: 0.5,
      y: 1,
      w: 9,
      colW: [2.2, 4, 2.2],
      fontSize: 11,
      border: { pt: 0.5, color: primaryHex },
    }
  );
  costSlide.addText(`Total: ${fmt(estimation.totalCost.amount, cur)}`, {
    x: 7,
    y: 5.2,
    w: 2,
    h: 0.4,
    fontSize: 12,
    bold: true,
    color: primaryHex,
    ...fontOpts,
  });
  if (logoPptxData) {
    costSlide.addImage({ data: logoPptxData, x: 8.2, y: 0.3, w: 1.2, h: 0.6 });
  }

  const teamSlide = pptx.addSlide();
  teamSlide.background = { color: bgHex };
  teamSlide.addText("Team", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: primaryHex,
    ...fontOpts,
  });
  const teamItems = estimation.team.slice(0, limits.team).map((t) => `${t.role} × ${t.count}`);
  teamSlide.addText(teamItems.join("  •  "), {
    x: 0.5,
    y: 1.2,
    w: 9,
    h: 1.5,
    fontSize: 14,
    color: bodyHex,
    ...fontOpts,
  });
  if (logoPptxData) {
    teamSlide.addImage({ data: logoPptxData, x: 8.2, y: 0.3, w: 1.2, h: 0.6 });
  }

  const risksSlide = pptx.addSlide();
  risksSlide.background = { color: bgHex };
  risksSlide.addText("Risks", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: primaryHex,
    ...fontOpts,
  });
  const riskItems = estimation.risks.slice(0, limits.risks).map(
    (r) => `• ${r.title} (${r.severity}): ${r.description}`
  );
  risksSlide.addText(riskItems.join("\n"), {
    x: 0.5,
    y: 1,
    w: 9,
    h: 4.5,
    fontSize: 12,
    valign: "top",
    color: bodyHex,
    ...fontOpts,
  });
  if (logoPptxData) {
    risksSlide.addImage({ data: logoPptxData, x: 8.2, y: 0.3, w: 1.2, h: 0.6 });
  }

  const deliverablesSlide = pptx.addSlide();
  deliverablesSlide.background = { color: bgHex };
  deliverablesSlide.addText("Deliverables", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: primaryHex,
    ...fontOpts,
  });
  const delivItems = estimation.deliverables.slice(0, limits.deliverables).map((d) => `• ${d.name} — ${d.phase}`);
  deliverablesSlide.addText(delivItems.join("\n"), {
    x: 0.5,
    y: 1,
    w: 9,
    h: 4.5,
    fontSize: 12,
    valign: "top",
    color: bodyHex,
    ...fontOpts,
  });
  if (logoPptxData) {
    deliverablesSlide.addImage({ data: logoPptxData, x: 8.2, y: 0.3, w: 1.2, h: 0.6 });
  }

  const thankSlide = pptx.addSlide();
  thankSlide.background = { color: bgHex };
  thankSlide.addText("Thank you", {
    x: 0.5,
    y: 2,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    align: "center",
    color: titleColorHex,
    ...fontOpts,
  });
  thankSlide.addText(`${estimation.projectName} — prepared with EstiMate`, {
    x: 0.5,
    y: 2.9,
    w: 9,
    h: 0.5,
    fontSize: 14,
    color: secondaryHex,
    align: "center",
    ...fontOpts,
  });
  if (logoPptxData) {
    thankSlide.addImage({ data: logoPptxData, x: 8.2, y: 0.3, w: 1.2, h: 0.6 });
  }
  const safeName = estimation.projectName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_") || "Estimation";
  await pptx.writeFile({ fileName: `${safeName}.pptx` });
}

function SlideContent({
  estimation,
  styleId,
  slideIndex,
  branding,
}: {
  estimation: Estimation;
  styleId: PresentationStyleId;
  slideIndex: number;
  branding: PresentationBranding;
}) {
  const theme = PRESENTATION_STYLE_THEMES[styleId];
  const limits = getDensityLimits(theme.density);
  const totalWeeks =
    estimation.timeline.length > 0
      ? Math.max(...estimation.timeline.map((t) => t.endWeek))
      : estimation.phases.reduce((s, p) => s + p.durationWeeks, 0);
  const totalTeam = estimation.team.reduce((s, t) => s + t.count, 0);
  const isMinimal = theme.density === "minimal";
  const primary = branding.primaryColor;
  const secondary = branding.secondaryColor;
  const hasCustomColors = !!primary;
  const accentTextStyle = hasCustomColors ? { color: primary } : undefined;
  const accentTextClass = hasCustomColors ? "" : theme.accentText;
  const accentBgStyle = hasCustomColors ? { backgroundColor: hexToRgba(primary, 0.15) } : undefined;
  const accentBgClass = hasCustomColors ? "" : theme.accentBg;
  const accentBorderStyle = hasCustomColors ? { borderColor: hexToRgba(primary, 0.4) } : undefined;
  const accentBorderClass = hasCustomColors ? "" : theme.accentBorder;
  const secondaryStyle = hasCustomColors && secondary ? { color: secondary } : undefined;
  const bodyClass = branding.fontColor ? "" : "text-slate-300";
  const useFontColor = !!branding.fontColor;

  const slides: { title: string; content: React.ReactNode }[] = [
    {
      title: estimation.projectName,
      content: (
        <>
          <p
            className={`mt-4 text-lg max-w-xl mx-auto ${useFontColor ? "" : accentTextClass}`}
            style={useFontColor ? { color: branding.fontColor } : (secondaryStyle || accentTextStyle)}
          >
            {theme.subtitle}
          </p>
        </>
      ),
    },
    {
      title: "Summary",
      content: (
        <p className={`mt-4 ${bodyClass} ${isMinimal ? "text-xl" : "text-base"} max-w-2xl mx-auto leading-relaxed`}>
          {estimation.summary}
        </p>
      ),
    },
    {
      title: theme.metricsTitle,
      content: (
        <div className="mt-8 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`rounded-xl border p-5 text-center ${accentBgClass} ${accentBorderClass}`}
              style={{ ...accentBgStyle, ...accentBorderStyle }}
            >
              <p className={`text-2xl font-bold ${useFontColor ? "" : "text-white"}`} style={useFontColor ? { color: branding.fontColor } : undefined}>
                {i === 1 ? fmt(estimation.totalCost.amount, estimation.totalCost.currency) : i === 2 ? `${totalWeeks} weeks` : totalTeam}
              </p>
              <p className={`text-sm mt-1 ${branding.fontColor ? "" : "text-slate-400"}`}>
                {i === 1 ? "Total cost" : i === 2 ? "Timeline" : "Team size"}
              </p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Phases",
      content: (() => {
        const timelineItems =
          estimation.timeline.length > 0
            ? estimation.timeline.slice(0, limits.phases)
            : estimation.phases
                .slice(0, limits.phases)
                .sort((a, b) => a.order - b.order)
                .reduce<{ phase: string; startWeek: number; endWeek: number }[]>(
                  (acc, p) => {
                    const start = acc.length === 0 ? 1 : acc[acc.length - 1].endWeek + 1;
                    acc.push({ phase: p.name, startWeek: start, endWeek: start + p.durationWeeks - 1 });
                    return acc;
                  },
                  []
                );
        const tw =
          timelineItems.length > 0
            ? Math.max(...timelineItems.map((t) => t.endWeek))
            : totalWeeks;
        return (
          <div className="mt-4 max-w-2xl mx-auto text-left space-y-4">
            <div className="space-y-2">
              <p className={`text-xs font-medium uppercase ${branding.fontColor ? "" : "text-slate-400"}`}>Timeline</p>
              {timelineItems.map((item, i) => {
                const leftPercent = ((item.startWeek - 1) / tw) * 100;
                const widthPercent = ((item.endWeek - item.startWeek + 1) / tw) * 100;
                return (
                  <div key={i}>
                    <div className="mb-0.5 flex items-center justify-between text-xs">
                      <span className={`font-medium ${accentTextClass}`} style={accentTextStyle}>{item.phase}</span>
                      <span className={branding.fontColor ? "" : "text-slate-500"}>W{item.startWeek}–W{item.endWeek}</span>
                    </div>
                    <div className="relative h-5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`absolute top-0 h-5 rounded-full opacity-80 ${!primary ? "bg-violet-500" : ""}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          ...(primary ? { backgroundColor: primary } : {}),
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className={`text-xs font-medium uppercase ${branding.fontColor ? "" : "text-slate-400"}`}>Details</p>
              {estimation.phases.slice(0, limits.phases).map((p, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${accentBgClass} ${accentBorderClass}`}
                  style={{ ...accentBgStyle, ...accentBorderStyle }}
                >
                  <span className={`${accentTextClass} font-semibold shrink-0 text-sm`} style={accentTextStyle}>{p.name}</span>
                  <div className="min-w-0">
                    <p className={`${bodyClass} text-xs`}>{p.description}</p>
                    <p className={`text-xs mt-0.5 ${branding.fontColor ? "" : "text-slate-500"}`}>{p.durationWeeks} weeks</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })(),
    },
    {
      title: theme.costTitle,
      content: (
        <div className="mt-6 max-w-2xl mx-auto">
          <div className={`rounded-lg overflow-hidden border ${accentBorderClass}`} style={accentBorderStyle}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left ${branding.fontColor ? "" : "text-slate-400"} ${accentBgClass}`} style={accentBgStyle}>
                  <th className="px-4 py-3 font-medium">Phase</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className={`px-4 py-3 text-right font-medium ${accentTextClass}`} style={accentTextStyle}>Cost</th>
                </tr>
              </thead>
              <tbody className={`${bodyClass} divide-y divide-white/5`}>
                {estimation.costBreakdown.slice(0, limits.costRows).map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{item.phase}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className={`px-4 py-2 text-right font-medium ${accentTextClass}`} style={accentTextStyle}>
                      {fmt(item.totalCost, estimation.totalCost.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`text-xs mt-3 text-center ${accentTextClass}`} style={secondaryStyle || accentTextStyle}>
            Total: {fmt(estimation.totalCost.amount, estimation.totalCost.currency)}
          </p>
        </div>
      ),
    },
    {
      title: "Team",
      content: (
        <div className="mt-6 flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {estimation.team.slice(0, limits.team).map((t, i) => (
            <div
              key={i}
              className={`rounded-lg border px-4 py-2 text-sm ${accentBgClass} ${accentBorderClass}`}
              style={{ ...accentBgStyle, ...accentBorderStyle }}
            >
              <span className={`font-medium ${useFontColor ? "" : "text-white"}`} style={useFontColor ? { color: branding.fontColor } : undefined}>{t.role}</span>
              <span className={`ml-2 ${branding.fontColor ? "" : "text-slate-400"}`}>×{t.count}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Risks",
      content: (
        <ul className={`mt-6 space-y-3 max-w-2xl mx-auto text-left text-sm ${bodyClass}`}>
          {estimation.risks.slice(0, limits.risks).map((r, i) => (
            <li
              key={i}
              className={`flex gap-3 rounded-lg border p-3 ${accentBgClass} ${accentBorderClass}`}
              style={{ ...accentBgStyle, ...accentBorderStyle }}
            >
              <span className={`shrink-0 text-xs font-medium uppercase px-2 py-0.5 rounded ${
                r.severity === "critical" ? "bg-red-500/20 text-red-300" :
                r.severity === "high" ? "bg-amber-500/20 text-amber-300" :
                "bg-slate-500/20 text-slate-400"
              }`}>
                {r.severity}
              </span>
              <div>
                <p className={`font-medium ${useFontColor ? "" : "text-white"}`} style={useFontColor ? { color: branding.fontColor } : undefined}>{r.title}</p>
                <p className={`text-xs mt-0.5 ${branding.fontColor ? "" : "text-slate-400"}`}>{r.description}</p>
              </div>
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: "Deliverables",
      content: (
        <ul className="mt-6 space-y-2 max-w-2xl mx-auto text-left text-sm">
          {estimation.deliverables.slice(0, limits.deliverables).map((d, i) => (
            <li
              key={i}
              className={`flex justify-between items-center rounded-lg border px-4 py-2 ${bodyClass} ${accentBgClass} ${accentBorderClass}`}
              style={{ ...accentBgStyle, ...accentBorderStyle }}
            >
              <span>{d.name}</span>
              <span className={`text-xs ${accentTextClass}`} style={accentTextStyle}>{d.phase}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: "Thank you",
      content: (
        <>
          <p className={`mt-6 text-lg ${useFontColor ? "" : accentTextClass}`} style={useFontColor ? { color: branding.fontColor } : (secondaryStyle || accentTextStyle)}>
            {estimation.projectName} — prepared with EstiMate
          </p>
        </>
      ),
    },
  ];

  const slide = slides[slideIndex];
  if (!slide) return null;
  const hasBg = !!branding.backgroundColor;
  const bgClass = !hasBg && theme.bgGradient ? `bg-gradient-to-b ${theme.bgGradient}` : "";
  const bgStyle = hasBg ? { backgroundColor: branding.backgroundColor } : undefined;
  const fontOpt = branding.fontId ? FONT_OPTIONS.find((f) => f.id === branding.fontId) : null;
  const fontStyle = fontOpt?.fontFamily ? { fontFamily: fontOpt.fontFamily } : undefined;
  const fontColorStyle = branding.fontColor ? { color: branding.fontColor } : undefined;
  const isTitleSlide = slideIndex === 0;
  const titleClass = useFontColor ? "" : isTitleSlide ? "text-white" : accentTextClass;
  const titleStyle = useFontColor ? { color: branding.fontColor } : (isTitleSlide ? undefined : accentTextStyle);
  return (
    <div className={`h-full flex flex-col items-center justify-center px-8 py-12 relative ${bgClass}`} style={{ ...bgStyle, ...fontStyle, ...fontColorStyle }}>
      {branding.logoDataUrl && (
        <div className="absolute top-6 right-8 flex justify-end">
          <img src={branding.logoDataUrl} alt="Logo" className="h-10 max-w-[120px] object-contain" />
        </div>
      )}
      <h2 className={`text-2xl font-bold text-center ${titleClass}`} style={titleStyle}>{slide.title}</h2>
      {slide.content}
    </div>
  );
}

export default function PresentationModal({ estimation, onClose }: PresentationModalProps) {
  const [savedBranding] = useState(() => loadBrandingFromStorage());
  const [step, setStep] = useState<"style" | "preview">("style");
  const [selectedStyle, setSelectedStyle] = useState<PresentationStyleId>("consultative");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(savedBranding.primaryColor ?? "");
  const [secondaryColor, setSecondaryColor] = useState(savedBranding.secondaryColor ?? "");
  const [backgroundColor, setBackgroundColor] = useState(savedBranding.backgroundColor ?? "");
  const [fontId, setFontId] = useState(savedBranding.fontId ?? "");
  const [fontColor, setFontColor] = useState(savedBranding.fontColor ?? "");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(savedBranding.logoDataUrl ?? null);
  const [savedPresets, setSavedPresets] = useState<BrandingPreset[]>(() => loadBrandingPresets());
  const [savePresetName, setSavePresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const totalSlides = 9; // title, summary, metrics, phases, cost, team, risks, deliverables, thank you

  const allPresets: BrandingPreset[] = [...BUILTIN_PRESETS, ...savedPresets];

  const applyPreset = (preset: BrandingPreset) => {
    setPrimaryColor(preset.primaryColor ?? "");
    setSecondaryColor(preset.secondaryColor ?? "");
    setBackgroundColor(preset.backgroundColor ?? "");
    setFontId(preset.fontId ?? "");
    setFontColor(preset.fontColor ?? "");
    setLogoDataUrl(preset.logoDataUrl ?? null);
  };

  const handleSaveAsPreset = () => {
    const name = savePresetName.trim() || "My branding";
    const preset: BrandingPreset = {
      id: crypto.randomUUID(),
      name,
      primaryColor,
      secondaryColor,
      backgroundColor,
      fontId,
      fontColor,
      logoDataUrl,
    };
    const next = [...savedPresets, preset];
    setSavedPresets(next);
    saveBrandingPresets(next);
    setSavePresetName("");
    setShowSavePreset(false);
  };

  const handleDeletePreset = (id: string) => {
    const next = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(next);
    saveBrandingPresets(next);
  };

  const branding: PresentationBranding = {
    primaryColor,
    secondaryColor,
    backgroundColor,
    fontId,
    fontColor,
    logoDataUrl,
  };

  useEffect(() => {
    saveBrandingToStorage(branding);
  }, [primaryColor, secondaryColor, backgroundColor, fontId, fontColor, logoDataUrl]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDownloadPptx = async () => {
    setIsExportingPptx(true);
    try {
      await buildAndDownloadPptx(estimation, selectedStyle, branding);
    } catch (err) {
      console.error("PPTX export failed:", err);
    } finally {
      setIsExportingPptx(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step !== "preview") return;
      if (e.key === "ArrowLeft") setCurrentSlide((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentSlide((i) => Math.min(totalSlides - 1, i + 1));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, totalSlides, onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden no-print">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-slate-300">
              <Presentation className="h-5 w-5 text-violet-400" />
              <span className="font-medium">
                {step === "style" ? "Choose presentation style" : "Presentation preview"}
              </span>
              {step === "preview" && (
                <span className="text-slate-500 text-sm ml-2">
                  {PRESENTATION_STYLES.find((s) => s.id === selectedStyle)?.name}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {step === "style" && (
              <>
                <div className="flex-1 overflow-auto min-h-0 p-6 pb-4">
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Branding (optional)
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Select a preset or configure colors and logo. They will appear in the presentation and downloaded file.
                    </p>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Select preset</p>
                      <div className="flex flex-wrap gap-2">
                        {allPresets.map((preset) => (
                          <div
                            key={preset.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => applyPreset(preset)}
                            onKeyDown={(e) => e.key === "Enter" && applyPreset(preset)}
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:border-white/20 transition-colors group cursor-pointer"
                          >
                            <span
                              className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                              style={{ backgroundColor: preset.primaryColor || "#8B5CF6" }}
                            />
                            <span>{preset.name}</span>
                            {savedPresets.some((p) => p.id === preset.id) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePreset(preset.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-400 transition-opacity"
                                aria-label="Delete preset"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-4 mb-4">
                      {showSavePreset ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={savePresetName}
                            onChange={(e) => setSavePresetName(e.target.value)}
                            placeholder="Preset name"
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none w-40"
                            onKeyDown={(e) => e.key === "Enter" && handleSaveAsPreset()}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveAsPreset}
                            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm text-white hover:bg-violet-500 transition-colors"
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowSavePreset(false); setSavePresetName(""); }}
                            className="text-sm text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowSavePreset(true)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          Save current as preset
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-3">Or configure manually:</p>
                    <div className="flex flex-wrap items-end gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Primary color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={primaryColor || "#8B5CF6"}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            placeholder="#8B5CF6"
                            className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Secondary color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={secondaryColor || primaryColor || "#6366F1"}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            placeholder="#6366F1"
                            className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Background color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={backgroundColor || "#1E293B"}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            placeholder="#1E293B"
                            className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Font style</label>
                        <select
                          value={fontId}
                          onChange={(e) => setFontId(e.target.value)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none min-w-[140px]"
                        >
                          {FONT_OPTIONS.map((f) => (
                            <option key={f.id || "default"} value={f.id} className="bg-slate-800 text-white">
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Font color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={fontColor || "#E2E8F0"}
                            onChange={(e) => setFontColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={fontColor}
                            onChange={(e) => setFontColor(e.target.value)}
                            placeholder="#E2E8F0"
                            className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Company logo</label>
                        <div className="flex items-center gap-3">
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 hover:border-white/20 transition-colors"
                          >
                            <ImagePlus className="h-4 w-4" />
                            {logoDataUrl ? "Change logo" : "Upload logo"}
                          </button>
                          {logoDataUrl && (
                            <div className="flex items-center gap-2">
                              <img src={logoDataUrl} alt="Logo" className="h-8 max-w-[80px] object-contain" />
                              <button
                                type="button"
                                onClick={() => setLogoDataUrl(null)}
                                className="text-xs text-slate-400 hover:text-white"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white">
                      Choose your presentation style
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      Pick a tone and layout that fits your audience. Each style shapes how your slides are framed.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 items-stretch">
                    {PRESENTATION_STYLES.map((style) => {
                      const Icon = STYLE_ICONS[style.id];
                      const isSelected = selectedStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`group relative text-left rounded-2xl border p-5 transition-all duration-200 overflow-hidden ${
                            isSelected
                              ? `bg-gradient-to-br ${STYLE_ACCENTS[style.id]} border-2 shadow-lg shadow-violet-500/10 scale-[1.02]`
                              : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] hover:shadow-xl"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                              <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                            </div>
                          )}
                          <div className="flex items-start gap-4">
                            <div
                              className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors ${
                                isSelected ? "bg-white/10 border-white/20" : ""
                              }`}
                            >
                              <Icon className={`h-5 w-5 ${STYLE_ICON_COLORS[style.id]}`} />
                            </div>
                            <div className="min-w-0 flex-1 pr-6">
                              <span className="font-semibold text-white block">
                                {style.name}
                              </span>
                              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                                {style.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-white/10 bg-slate-900/50">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep("preview")}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 flex items-center gap-2 transition-all hover:shadow-violet-500/30"
                  >
                    Continue to preview
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {step === "preview" && (
              <div className="flex flex-col h-full">
                <div
                  className={`flex-1 min-h-[400px] presentation-slide rounded-xl mx-6 mt-4 border overflow-hidden ${
                    primaryColor ? "" : PRESENTATION_STYLE_THEMES[selectedStyle].accentBorder
                  } ${!backgroundColor ? "bg-slate-900/50" : ""}`}
                  style={{
                    ...(primaryColor ? { borderColor: primaryColor + "60" } : {}),
                    ...(backgroundColor ? { backgroundColor } : {}),
                  }}
                >
                  <SlideContent
                    estimation={estimation}
                    styleId={selectedStyle}
                    slideIndex={currentSlide}
                    branding={branding}
                  />
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 shrink-0">
                  <button
                    onClick={() => setStep("style")}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    Change style
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentSlide((i) => Math.max(0, i - 1))}
                        disabled={currentSlide === 0}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="text-sm text-slate-400 min-w-[4rem] text-center">
                        {currentSlide + 1} / {totalSlides}
                      </span>
                      <button
                        onClick={() => setCurrentSlide((i) => Math.min(totalSlides - 1, i + 1))}
                        disabled={currentSlide === totalSlides - 1}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                    <button
                      onClick={handleDownloadPptx}
                      disabled={isExportingPptx}
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isExportingPptx ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4" />
                      )}
                      {isExportingPptx ? "Generating…" : "Download PPTX"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
