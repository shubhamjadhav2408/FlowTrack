import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppStore } from '../../stores/useAppStore'

const CustomTooltip = ({ active, payload, label, currencySymbol }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border rounded-md p-3 shadow-xl min-w-[120px]">
      <p className="font-mono text-[10px] tracking-[0.06em] text-text-dim uppercase mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
          <span className="font-mono text-[10px] uppercase text-text-dim">{p.name}</span>
          <span className={`font-mono text-[13px] ${p.name === 'income' ? 'text-green' : 'text-red'}`}>
            {currencySymbol}{p.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MonthlyBar({ data }) {
  const { profile } = useAppStore()
  const currencySymbol = profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : profile?.currency === 'INR' ? '₹' : '$'

  if (!data || data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="40%">
        <CartesianGrid strokeDasharray="2 2" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: 'var(--text-dimmer)', fontSize: 14, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickMargin={8} />
        <YAxis tick={{ fill: 'var(--text-dimmer)', fontSize: 14, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} width={35} />
        <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} cursor={{ fill: 'var(--surface-1)' }} />
        <Bar dataKey="income" name="income" fill="var(--green)" radius={[2, 2, 0, 0]} maxBarSize={12} />
        <Bar dataKey="expense" name="expense" fill="var(--red)" radius={[2, 2, 0, 0]} maxBarSize={12} />
      </BarChart>
    </ResponsiveContainer>
  )
}
