import Link from "next/link";
import {
  FileUp,
  ClipboardList,
  Zap,
  LayoutList,
  FileText,
  BookOpen,
} from "lucide-react";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        {/* Glow orbs — matches presentation aesthetic */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-indigo-600/15 blur-[120px]" />
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-[100px]" />
        </div>

        <div className="relative">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            AI-Powered Estimation
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Stop guessing.<br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-300 bg-clip-text text-transparent">
              Start estimating.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            Drop an RFP or answer a few questions. Get a{" "}
            <strong className="text-slate-200">full project estimation</strong>{" "}
            with phased costs, resource plans, and confidence scores — in under
            two minutes.
          </p>
        </div>
      </section>

      {/* Three Paths */}
      <section className="mx-auto -mt-4 max-w-5xl px-6 pb-16">
        <div className="grid gap-5 md:grid-cols-3">
          <Link
            href="/upload"
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm transition-all hover:border-violet-500/20 hover:bg-violet-500/[0.04] hover:shadow-[0_0_40px_rgba(139,92,246,0.08)]"
          >
            <div className="mb-4 inline-flex rounded-xl bg-violet-500/10 p-3">
              <FileUp className="h-6 w-6 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-violet-300 transition-colors">
              Upload RFP
            </h2>
            <p className="mt-2 text-slate-400">
              Upload your RFP document (PDF, DOCX, or TXT) and get a detailed
              estimation breakdown automatically.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-violet-400">
              Get started &rarr;
            </span>
          </Link>

          <Link
            href="/questionnaire"
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm transition-all hover:border-violet-500/20 hover:bg-violet-500/[0.04] hover:shadow-[0_0_40px_rgba(139,92,246,0.08)]"
          >
            <div className="mb-4 inline-flex rounded-xl bg-violet-500/10 p-3">
              <ClipboardList className="h-6 w-6 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-violet-300 transition-colors">
              Answer Questions
            </h2>
            <p className="mt-2 text-slate-400">
              Walk through a guided questionnaire about your project and receive
              a tailored estimation.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-violet-400">
              Get started &rarr;
            </span>
          </Link>

          <Link
            href="/practice"
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm transition-all hover:border-violet-500/20 hover:bg-violet-500/[0.04] hover:shadow-[0_0_40px_rgba(139,92,246,0.08)]"
          >
            <div className="mb-4 inline-flex rounded-xl bg-violet-500/10 p-3">
              <BookOpen className="h-6 w-6 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-violet-300 transition-colors">
              Practice Library
            </h2>
            <p className="mt-2 text-slate-400">
              Add historical project data to calibrate AI estimates closer to
              your real-world practice standards.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-violet-400">
              Manage data &rarr;
            </span>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/[0.06] bg-white/[0.02] px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h3 className="text-center text-lg font-semibold text-white">
            What You Get
          </h3>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex rounded-xl bg-violet-500/10 p-3">
                <Zap className="h-5 w-5 text-violet-400" />
              </div>
              <h4 className="font-medium text-white">
                AI-Powered Analysis
              </h4>
              <p className="mt-1 text-sm text-slate-400">
                Advanced AI with confidence scoring reviews each estimate line
                for accuracy.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex rounded-xl bg-violet-500/10 p-3">
                <LayoutList className="h-5 w-5 text-violet-400" />
              </div>
              <h4 className="font-medium text-white">Full Breakdown</h4>
              <p className="mt-1 text-sm text-slate-400">
                Phased costs, timeline with dates, team, risks, assumptions, and
                custom components.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex rounded-xl bg-violet-500/10 p-3">
                <FileText className="h-5 w-5 text-violet-400" />
              </div>
              <h4 className="font-medium text-white">
                Practice Calibration
              </h4>
              <p className="mt-1 text-sm text-slate-400">
                Feed real project data to train the AI closer to your practice
                standards.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
