

export function CircuitLabLogo({ className }: { className?: string }) {
  return (
    <svg
      className={`w-8 h-8 ${className ?? ''}`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
      <path
        d="M8 8h6v6H8zM18 8h6v6h-6zM8 18h6v6H8zM18 18h6v6h-6z"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 16L16 12M16 16L12 12"
        stroke="#22d3ee"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
