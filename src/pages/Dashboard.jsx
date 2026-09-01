import { useState } from 'react'
import { useAppStore } from '../stores/useAppStore'
import SpendingDonut from '../components/charts/SpendingDonut'
import MonthlyBar from '../components/charts/MonthlyBar'
import BalanceLine from '../components/charts/BalanceLine'
import HeatmapCal from '../components/charts/HeatmapCal'
import TransactionList from '../components/TransactionList'
import { format } from 'date-fns'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function Dashboard({ onEdit }) {
  const { transactions, getMonthlyTotals, getSpendingByCategory, getTrendData, getRunningBalance, getDailyHeatmap, profile } = useAppStore()
  
  const [trendRange, setTrendRange] = useState('6m')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const currencySymbol = profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : profile?.currency === 'INR' ? '₹' : '$'
  const fmt = (val) => `${currencySymbol}${Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const totals = getMonthlyTotals()
  const spendingByCat = getSpendingByCategory()
  const trendData = getTrendData ? getTrendData(trendRange, customStart, customEnd) : []
  const balanceData = getRunningBalance()
  const heatmapData = getDailyHeatmap()

  const insight = spendingByCat.length > 0
    ? `Top spend this month is <b>${spendingByCat[0].name}</b> at ${fmt(spendingByCat[0].value)}.`
    : null

  const savingsRate = totals.income > 0 ? Math.max(0, ((totals.income - totals.expense) / totals.income) * 100) : 0

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="eyebrow !mb-2">{format(new Date(), 'MMMM yyyy')}</p>
          <h1 className="font-display font-medium text-[42px] lg:text-[64px] tracking-[-0.01em] leading-none m-0">Overview</h1>
        </div>
      </div>

      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border border border-border rounded-md overflow-hidden">
          <div className="bg-surface-1 p-5 md:p-6">
            <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-text-dim uppercase mb-2">Rollover</div>
            <div className="font-display text-[32px] lg:text-[42px] tracking-[-0.01em] text-text-dimmer">{fmt(totals.carryover)}</div>
          </div>
          <div className="bg-surface-1 p-5 md:p-6">
            <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-text-dim uppercase mb-2">Income</div>
            <div className="font-display text-[32px] lg:text-[42px] tracking-[-0.01em]">{fmt(totals.income)}</div>
          </div>
          <div className="bg-surface-1 p-5 md:p-6">
            <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-text-dim uppercase mb-2">Expenses</div>
            <div className="font-display text-[32px] lg:text-[42px] tracking-[-0.01em]">{fmt(totals.expense)}</div>
          </div>
          <div className="bg-surface-1 p-5 md:p-6">
            <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-text-dim uppercase mb-2">Total Balance</div>
            <div className={`font-display text-[32px] lg:text-[42px] tracking-[-0.01em] ${totals.available >= 0 ? 'text-green' : 'text-red'}`}>
              {fmt(Math.abs(totals.available))}
            </div>
          </div>
        </div>
        
        <div className="bg-surface-1 border border-border rounded-md p-5 md:p-6 flex flex-col justify-center">
          <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-text-dim uppercase mb-2">Savings Rate</div>
          <div className="font-display text-[32px] lg:text-[48px] text-accent mb-4">{savingsRate.toFixed(1)}%</div>
          <div className="h-1.5 lg:h-2 bg-surface-2 rounded-full overflow-hidden w-full">
            <div className="h-full bg-accent" style={{ width: `${Math.min(savingsRate, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Trend & Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-1 border border-border rounded-md p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-text-dim uppercase">Spending Trend</div>
            <div className="flex flex-wrap items-center gap-2">
              {trendRange === 'custom' && (
                <div className="flex items-center gap-2 mr-2">
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                    className="bg-surface-2 border border-border rounded-sm px-2 py-1 text-text outline-none focus:border-accent font-mono text-[12px] lg:text-[14px]" />
                  <span className="text-text-dim text-[12px] lg:text-[14px]">-</span>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                    className="bg-surface-2 border border-border rounded-sm px-2 py-1 text-text outline-none focus:border-accent font-mono text-[12px] lg:text-[14px]" />
                </div>
              )}
              <select value={trendRange} onChange={e => setTrendRange(e.target.value)}
                className="bg-surface-2 border border-border rounded-sm px-2 py-1 text-text outline-none focus:border-accent font-mono text-[12px] lg:text-[14px] uppercase tracking-[0.04em] cursor-pointer">
                <option value="1m">Last Month</option>
                <option value="3m">3 Months</option>
                <option value="6m">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="h-[200px] lg:h-[280px]">
            <MonthlyBar data={trendData} />
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-md p-5 md:p-6">
          <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-text-dim uppercase mb-6">Breakdown</div>
          <SpendingDonut data={spendingByCat} />
        </div>
      </div>

      {/* Row 3: Balance & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-1 border border-border rounded-md p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-text-dim uppercase">Running Balance</div>
            {balanceData.length > 0 && (
              <div className="font-display text-[32px] lg:text-[42px] text-text">{fmt(balanceData.at(-1)?.balance ?? 0)}</div>
            )}
          </div>
          <div className="h-[200px] lg:h-[280px]">
            <BalanceLine data={balanceData} />
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-md p-5 md:p-6 flex flex-col">
          <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-text-dim uppercase mb-6">Activity Heatmap</div>
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <HeatmapCal data={heatmapData} />
          </div>
        </div>
      </div>

      {/* Row 4: Transactions & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-1 border border-border rounded-md p-5 md:p-6">
          <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-text-dim uppercase mb-4">Recent Ledger</div>
          <TransactionList transactions={transactions.slice(0, 5)} onEdit={onEdit} />
        </div>
        
        {insight && (
          <div className="bg-accent-soft border border-accent/20 rounded-md p-6 flex flex-col justify-center min-h-[160px]">
            <div className="font-mono text-[14px] lg:text-[16px] tracking-[0.08em] text-accent uppercase mb-4">AI Insight</div>
            <p className="font-display italic text-[24px] lg:text-[32px] text-text leading-[1.3]" dangerouslySetInnerHTML={{ __html: insight }} />
          </div>
        )}
      </div>

    </div>
  )
}
