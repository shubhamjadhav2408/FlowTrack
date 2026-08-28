import { format, parseISO, getDay } from 'date-fns'
import { useMemo } from 'react'
import { useAppStore } from '../../stores/useAppStore'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getIntensity(amount, max) {
  if (amount === 0) return 0
  return Math.max(1, Math.ceil((amount / max) * 4))
}

const COLORS = [
  'bg-surface-2',          // 0 – empty
  'bg-[#8B7CF6] opacity-30',  // 1 – very light
  'bg-[#8B7CF6] opacity-60',  // 2 – light
  'bg-[#8B7CF6] opacity-80',  // 3 – medium
  'bg-[#8B7CF6]',             // 4 – heavy
]

export default function HeatmapCal({ data }) {
  const { profile } = useAppStore()
  const currencySymbol = profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : profile?.currency === 'INR' ? '₹' : '$'

  const max = useMemo(() => Math.max(...data.map((d) => d.amount), 1), [data])

  const firstDay = data[0] ? getDay(parseISO(data[0].date)) : 0
  const padded = [...Array(firstDay).fill(null), ...data]
  const weeks = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-[6px] min-w-max">
        {/* Day labels */}
        <div className="flex flex-col gap-[6px] mr-2">
          <div className="h-[18px]" /> {/* spacer for month row */}
          {DAYS.map((d) => (
            <div key={d} className="h-[18px] flex items-center">
              <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-text-dim w-6">{d}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[6px]">
            {/* Month label */}
            <div className="h-[18px] flex items-center">
              {week[0] && new Date(week[0].date).getDate() <= 7 ? (
                <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-text-dim whitespace-nowrap">
                  {format(parseISO(week[0].date), 'MMM')}
                </span>
              ) : <span />}
            </div>
            {week.map((day, di) => (
              <div
                key={di}
                title={day ? `${day.date}: ${currencySymbol}${day.amount.toFixed(2)}` : ''}
                className={`w-[18px] h-[18px] rounded-sm transition-all cursor-default ${
                  day ? COLORS[getIntensity(day.amount, max)] : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
