import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useAppStore } from '../../stores/useAppStore'

const CustomTooltip = ({ active, payload, currencySymbol }) => {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="bg-surface-2 border border-border rounded-md p-4 shadow-xl min-w-[120px]">
      <p className="font-mono text-[10px] tracking-[0.06em] text-text-dim uppercase mb-1">{payload[0].payload.date}</p>
      <p className={`font-display text-[22px] ${v >= 0 ? 'text-text' : 'text-red'}`}>
        {v >= 0 ? '' : '-'}{currencySymbol}{Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  )
}

export default function BalanceLine({ data }) {
  const { profile } = useAppStore()
  const currencySymbol = profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : profile?.currency === 'INR' ? '₹' : '$'

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-text-dimmer">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em]">Start adding transactions</p>
      </div>
    )
  }

  const step = Math.max(1, Math.floor(data.length / 30))
  const displayData = data.filter((_, i) => i % step === 0 || i === data.length - 1)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={displayData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--text-dimmer)', fontSize: 14, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v < -999 ? `${(v/1000).toFixed(0)}k` : v}`} width={40} />
        <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="4 4" />
        <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} cursor={{ stroke: 'var(--border)' }} />
        <Line
          type="stepAfter"
          dataKey="balance"
          stroke="#C9A961" /* Gold accent for balance */
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4, fill: '#14161C', stroke: '#C9A961', strokeWidth: 1.5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
