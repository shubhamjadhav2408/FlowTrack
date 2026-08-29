import { motion } from 'framer-motion'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { useAppStore } from '../stores/useAppStore'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import CategoryIcon from './CategoryIcon'

function groupByDate(transactions) {
  const groups = {}
  transactions.forEach((t) => { if (!groups[t.date]) groups[t.date] = []; groups[t.date].push(t) })
  return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
}

function formatDateLabel(dateStr) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, d MMM')
}

export default function TransactionList({ transactions = [], onEdit }) {
  const { profile, deleteTransaction } = useAppStore()
  const groups = groupByDate(transactions)

  const currencySymbol = profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : profile?.currency === 'INR' ? '₹' : '$'
  const fmt = (val) => `${currencySymbol}${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (transactions.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="font-mono text-[13px] lg:text-[14px] tracking-[0.08em] text-text-dim uppercase mb-2">No transactions</p>
      <p className="text-[16px] lg:text-[18px] text-text-dimmer">Your ledger is currently empty.</p>
    </div>
  )

  return (
    <div className="space-y-10">
      {groups.map(([date, txns]) => {
        return (
          <div key={date}>
            <div className="font-mono text-[13px] lg:text-[14px] tracking-[0.08em] text-text-dimmer uppercase mb-3 px-4">
              {formatDateLabel(date)}
            </div>

            <div className="flex flex-col">
              {txns.map((t, idx) => {
                const cat = t.categories
                return (
                  <motion.div key={t.id} layout
                    onClick={() => onEdit?.(t)}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="txn-row group cursor-pointer relative">
                    
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-sm bg-surface-2 flex items-center justify-center text-accent flex-shrink-0">
                        <CategoryIcon emoji={cat?.emoji} className="w-5 h-5 lg:w-6 lg:h-6" />
                      </div>
                      
                      <div>
                        <div className="text-[16px] lg:text-[18px] text-text">
                          {cat?.name || 'Uncategorized'}
                        </div>
                        <div className="text-[14px] lg:text-[15px] text-text-dimmer">
                          {t.note || (t.is_recurring ? 'Recurring' : '')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`font-mono text-[16px] lg:text-[18px] text-right ${t.type === 'income' ? 'text-green' : 'text-text'}`}>
                        {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                      </div>
                      
                      <div className="flex items-center gap-1.5 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onEdit?.(t); }} 
                          className="p-1.5 lg:px-2.5 lg:py-1.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider border border-border text-text-dim hover:text-text hover:border-text-dim rounded-sm transition-colors cursor-pointer">
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Edit</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteTransaction(t.id); }} 
                          className="p-1.5 lg:px-2.5 lg:py-1.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider border border-red/30 text-red hover:bg-red hover:text-[#0B0C10] rounded-sm transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Del</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
