"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const PAST_DATE_QUIPS = [
  "That date is already history — quite literally. Proceed if intentional.",
  "Bold scheduling choice. This date has already clocked out. Sure about this?",
  "Our time machine is in maintenance. Just checking — is a past date intentional here?",
  "This date preceded today's standup. Planning a retrospective kickoff, perhaps?",
  "Flux capacitor not detected. This date is in the past — proceed with confidence?",
  "The calendar called. It said this date has already happened. Intentional?",
  "Past date detected. We won't stop you — just making sure it wasn't a typo.",
];

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayYMD(): string {
  return toYMD(new Date());
}

export function nextWeekYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toYMD(d);
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplay(ymd: string): string {
  const d = parseDate(ymd);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/** Accept DD.MM.YYYY, YYYY-MM-DD, or natural language. Returns YYYY-MM-DD, "" (cleared), or null (unparseable). */
function parseUserInput(text: string): string | null {
  const t = text.trim();
  if (!t) return "";

  // DD.MM.YYYY
  const dotMatch = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    const d = new Date(+dotMatch[3], +dotMatch[2] - 1, +dotMatch[1]);
    if (!isNaN(d.getTime())) return toYMD(d);
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(t)) {
    const d = new Date(t + "T00:00:00");
    if (!isNaN(d.getTime())) return toYMD(d);
  }

  // Natural language fallback
  const parsed = Date.parse(t);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    if (d.getFullYear() >= 2020 && d.getFullYear() <= 2060) return toYMD(d);
  }

  return null;
}

function randomQuip(): string {
  return PAST_DATE_QUIPS[Math.floor(Math.random() * PAST_DATE_QUIPS.length)];
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "DD.MM.YYYY",
  className = "",
}: DatePickerProps) {
  const today = new Date();
  const selected = parseDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selected || today);
  const [inputText, setInputText] = useState(formatDisplay(value));
  const [pastQuip, setPastQuip] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync display text and past-date warning whenever value changes
  useEffect(() => {
    setInputText(formatDisplay(value));
    if (value && value < todayYMD()) {
      setPastQuip(randomQuip());
    } else {
      setPastQuip("");
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = todayYMD();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectDay = (day: number) => {
    onChange(toYMD(new Date(year, month, day)));
    setIsOpen(false);
  };

  const dayYMD = (day: number) => toYMD(new Date(year, month, day));

  const isSelected = (day: number) =>
    !!selected &&
    selected.getFullYear() === year &&
    selected.getMonth() === month &&
    selected.getDate() === day;

  const isToday = (day: number) => dayYMD(day) === todayStr;
  const isPastDay = (day: number) => dayYMD(day) < todayStr;

  const handleBlur = () => {
    const parsed = parseUserInput(inputText);
    if (parsed !== null) {
      onChange(parsed);
      if (parsed) {
        const d = parseDate(parsed);
        if (d) setViewDate(d);
      }
    } else {
      setInputText(formatDisplay(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "Escape") { setInputText(formatDisplay(value)); setIsOpen(false); }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 pr-8 text-sm text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors"
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()} // prevent input blur on icon click
          onClick={() => setIsOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-400 transition-colors"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>
      </div>

      {pastQuip && (
        <p className="mt-1 text-xs text-amber-400/80">⚠ {pastQuip}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#13132a] shadow-2xl p-3">
          <div className="flex items-center justify-between mb-2.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-semibold text-white">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-0.5">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-slate-500 py-0.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const past = isPastDay(day);
              return (
                <div key={i} className="flex justify-center">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectDay(day)}
                    className={`w-7 h-7 rounded text-xs transition-colors ${
                      isSelected(day)
                        ? "bg-violet-600 text-white font-semibold"
                        : isToday(day)
                          ? "border border-violet-500/40 text-violet-300 hover:bg-white/[0.06]"
                          : past
                            ? "text-slate-600"
                            : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
