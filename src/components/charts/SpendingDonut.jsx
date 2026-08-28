import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useAppStore } from '../../stores/useAppStore'
import CategoryIcon from '../CategoryIcon'

const CustomTooltip = ({ active, payload, currencySymbol }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface-2 border border-border rounded-md p-3 shadow-xl flex items-center gap-3 min-w-[140px]">
      <div className="text-accent"><CategoryIcon emoji={d.emoji} className="w-4 h-4" /></div>
      <div>
        <p className="font-mono text-[18px] tracking-[0.06em] text-text-dim uppercase mb-0.5">{d.name}</p>
        <p className="font-display text-[20px] text-text leading-none">{currencySymbol}{d.value.toLocaleString()}</p>
      </div>
    </div>
  )
}

export default function SpendingDonut({ data }) {
  const { profile } = useAppStore()
  const currencySymbol = profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : profile?.currency === 'INR' ? '₹' : '$'

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-dimmer py-12">
        <p className="font-mono text-[16px] uppercase tracking-[0.08em]">No expenses yet</p>
      </div>
    )
  }

  const COLORS = ['var(--accent)', 'var(--surface-2)', 'var(--border)', 'var(--text-dimmer)']

  return (
    <div className="flex flex-col xl:flex-row xl:items-center gap-8 xl:gap-8 h-full">
      <div className="w-[160px] h-[160px] md:w-[200px] md:h-[200px] flex-shrink-0 mx-auto xl:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius="75%"
              outerRadius="100%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex flex-col gap-4 flex-1 w-full mt-4 xl:mt-0">
        {data.slice(0, 4).map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-[18px] text-text-dim">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="truncate max-w-[120px] md:max-w-[200px]">{d.name}</span>
            </div>
            <span className="font-mono">{currencySymbol}{d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
