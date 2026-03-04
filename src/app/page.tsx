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
      <section className="bg-gradient-to-br from-indigo-600 to-blue-700 px-6 py-20 text-center text-white">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Estimate Your Next Project in Minutes
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
          Upload an RFP document or answer a few questions. Our AI analyzes your
          requirements and delivers a detailed estimation with timeline, costs,
          team, and risk assessment.
        </p>
      </section>

      {/* Three Paths */}
      <section className="mx-auto -mt-10 max-w-5xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/upload"
            className="group rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-3">
              <FileUp className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Upload RFP
            </h2>
            <p className="mt-2 text-gray-600">
              Upload your RFP document (PDF, DOCX, or TXT) and get a detailed
              estimation breakdown automatically.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600">
              Get started &rarr;
            </span>
          </Link>

          <Link
            href="/questionnaire"
            className="group rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-3">
              <ClipboardList className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Answer Questions
            </h2>
            <p className="mt-2 text-gray-600">
              Walk through a guided questionnaire about your project and receive
              a tailored estimation.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600">
              Get started &rarr;
            </span>
          </Link>

          <Link
            href="/practice"
            className="group rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-3">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Practice Library
            </h2>
            <p className="mt-2 text-gray-600">
              Add historical project data to calibrate AI estimates closer to
              your real-world practice standards.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600">
              Manage data &rarr;
            </span>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h3 className="text-center text-lg font-semibold text-gray-900">
            What You Get
          </h3>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex rounded-lg bg-indigo-50 p-3">
                <Zap className="h-5 w-5 text-indigo-600" />
              </div>
              <h4 className="font-medium text-gray-900">
                AI-Powered Analysis
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                Advanced AI with confidence scoring reviews each estimate line
                for accuracy.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex rounded-lg bg-indigo-50 p-3">
                <LayoutList className="h-5 w-5 text-indigo-600" />
              </div>
              <h4 className="font-medium text-gray-900">Full Breakdown</h4>
              <p className="mt-1 text-sm text-gray-600">
                Phased costs, timeline with dates, team, risks, assumptions, and
                custom components.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex rounded-lg bg-indigo-50 p-3">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <h4 className="font-medium text-gray-900">
                Practice Calibration
              </h4>
              <p className="mt-1 text-sm text-gray-600">
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
