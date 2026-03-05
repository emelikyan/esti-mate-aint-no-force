import Link from "next/link";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="border-b border-white/[0.06] bg-white/[0.03] shadow-sm backdrop-blur-xl">
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
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Upload RFP
          </Link>
          <Link
            href="/questionnaire"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Questionnaire
          </Link>
          <Link
            href="/practice"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Practice Library
          </Link>
        </nav>
      </div>
    </header>
  );
}
