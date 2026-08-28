import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import TransactionList from '../components/TransactionList'

export default function Transactions({ onEdit }) {
  const { transactions } = useAppStore()
  const [filter, setFilter] = useState('all') // 'all', 'income', 'expense'
  const [dateRange, setDateRange] = useState('all') // 'all', 'last_month', 'last_6_months', 'last_year'
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let res = transactions
    if (filter !== 'all') res = res.filter(t => t.type === filter)
    
    if (dateRange !== 'all') {
      const now = new Date()
      let cutoff = new Date()
      if (dateRange === 'last_month') cutoff.setMonth(now.getMonth() - 1)
      else if (dateRange === 'last_6_months') cutoff.setMonth(now.getMonth() - 6)
      else if (dateRange === 'last_year') cutoff.setFullYear(now.getFullYear() - 1)
      
      res = res.filter(t => new Date(t.date) >= cutoff)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      res = res.filter(t => 
        t.note?.toLowerCase().includes(q) || 
        t.categories?.name.toLowerCase().includes(q)
      )
    }
    
    return res
  }, [transactions, filter, dateRange, search])

  return (
    <div>
      <h1 className="font-display font-medium text-[52px] tracking-[-0.01em] mb-10 leading-tight">Ledger</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-dim absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-1 border border-border pl-11 pr-4 py-3 rounded-md text-text outline-none focus:border-accent transition-colors" />
        </div>

        <div className="flex gap-4">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="bg-surface-1 border border-border px-4 py-3 rounded-md text-text outline-none focus:border-accent transition-colors appearance-none cursor-pointer">
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="bg-surface-1 border border-border px-4 py-3 rounded-md text-text outline-none focus:border-accent transition-colors appearance-none cursor-pointer">
            <option value="all">All Time</option>
            <option value="last_month">Last Month</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="last_year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="section pt-0 border-t-0">
        <TransactionList transactions={filtered} onEdit={onEdit} />
      </div>
    </div>
  )
}
