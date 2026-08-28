export default function BudgetRing({ spent, budget, color }) {
  const radius = 40
  const circ = 2 * Math.PI * radius
  const pct = Math.min(spent / budget, 1)
  const offset = circ - pct * circ
  const isOver = spent > budget

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border-strong)" strokeWidth="4" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke={isOver ? "var(--red)" : color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="square"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className={`font-display text-[24px] ${isOver ? 'text-red' : 'text-text'}`}>
          {Math.round(pct * 100)}%
        </p>
      </div>
    </div>
  )
}
