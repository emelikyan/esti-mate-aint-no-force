import Link from "next/link";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="transition-opacity hover:opacity-90"
          aria-label="EstiMate home"
        >
          <Logo />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/upload"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Upload RFP
          </Link>
          <Link
            href="/questionnaire"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Questionnaire
          </Link>
          <Link
            href="/practice"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Practice Library
          </Link>
        </nav>
      </div>
    </header>
  );
}
