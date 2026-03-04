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
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 px-6 py-20 text-center text-white">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Your project scope called. It wants a number.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          Drop in an RFP or answer a few questions—we’ll turn the chaos into a real estimate. Timeline, costs, risks, the whole shebang. No crystal ball required.
        </p>
      </section>

      {/* Three Paths */}
      <section className="mx-auto -mt-10 max-w-5xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/upload"
            className="group rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3">
              <FileUp className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              Upload RFP
            </h2>
            <p className="mt-2 text-slate-600">
              Got a PDF or doc? Throw it in. We’ll read the thing and spit back a proper estimate. Magic? Nah, just good AI.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
              Drop it here &rarr;
            </span>
          </Link>

          <Link
            href="/questionnaire"
            className="group rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              Answer Questions
            </h2>
            <p className="mt-2 text-slate-600">
              Prefer to chat it out? Answer a few questions and we’ll build an estimate that actually fits your project. No wrong answers (well, mostly).
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
              Let’s go &rarr;
            </span>
          </Link>

          <Link
            href="/practice"
            className="group rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              Practice Library
            </h2>
            <p className="mt-2 text-slate-600">
              Teach the AI how you really work. Add past projects so estimates get closer to reality. Your data, your secret sauce.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
              Add projects &rarr;
            </span>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h3 className="text-center text-lg font-semibold text-slate-900">
            What you actually get
          </h3>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex rounded-lg bg-slate-100 p-3">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-slate-900">
                AI that second-guesses itself (in a good way)
              </h4>
              <p className="mt-1 text-sm text-slate-600">
                Every line item gets a confidence score. So you know what’s solid and what’s basically a polite guess.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex rounded-lg bg-slate-100 p-3">
                <LayoutList className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-slate-900">The full picture</h4>
              <p className="mt-1 text-sm text-slate-600">
                Phases, costs, timeline, team, risks, assumptions, custom bits—all in one place. No hunting through spreadsheets.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex rounded-lg bg-slate-100 p-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-slate-900">
                Estimates that learn from you
              </h4>
              <p className="mt-1 text-sm text-slate-600">
                Add your real project history. The more you feed it, the less “generic” and more “actually how we work” the numbers get.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
