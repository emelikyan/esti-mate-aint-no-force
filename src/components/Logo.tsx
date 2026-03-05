interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function Logo({ className = "", iconOnly = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20 ring-1 ring-white/10">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          {/* E: three horizontal bars */}
          <path d="M6 6h11v1.5H6V6zm0 5.25h8v1.5H6v-1.5zm0 5.25h11V18H6v-1.5z" />
          {/* Rising bar accent */}
          <path
            d="M19 6v11h2.5v-6.5L19 6z"
            fill="white"
            fillOpacity={0.95}
          />
        </svg>
      </span>
      {!iconOnly && (
        <span className="text-xl font-bold tracking-tight text-slate-100">
          Esti<span className="text-violet-400">Mate</span>
        </span>
      )}
    </span>
  );
}
