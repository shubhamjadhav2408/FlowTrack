import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2 } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import BudgetRing from '../components/BudgetRing'
import CategoryIcon from '../components/CategoryIcon'

export default function Budgets() {
  const { budgets, categories, getSpendingByCategory, setBudget, deleteBudget, profile } = useAppStore()
  const spending = getSpendingByCategory()
  
  const [showAdd, setShowAdd] = useState(false)
  const [catId, setCatId] = useState('')
  const [amount, setAmount] = useState('')

  const currencySymbol = profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : profile?.currency === 'INR' ? '₹' : '$'
  const fmt = (val) => `${currencySymbol}${Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const activeBudgets = budgets.map(b => {
    const spent = spending.find(s => s.id === b.category_id)?.value || 0
    return { ...b, spent }
  })

  const availableCats = categories.filter(c => c.type === 'expense' && !budgets.find(b => b.category_id === c.id))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!catId || !amount) return
    await setBudget(catId, Number(amount))
    setShowAdd(false)
    setCatId('')
    setAmount('')
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-10">
        <h1 className="font-display font-medium text-[52px] tracking-[-0.01em] leading-tight m-0">Budgets</h1>
        {!showAdd && availableCats.length > 0 && (
          <button onClick={() => setShowAdd(true)}
            className="luxury-btn luxury-btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Set</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }}
            onSubmit={handleSave} className="bg-surface-1 border border-border rounded-md p-8 mb-12 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display text-[24px] text-text">New Budget Limit</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-text-dim hover:text-text cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-[14px] tracking-[0.08em] text-text-dim uppercase mb-3">Category</label>
                <select value={catId} onChange={e => setCatId(e.target.value)} required
                  className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-text outline-none focus:border-accent transition-colors appearance-none cursor-pointer">
                  <option value="" disabled>Select category...</option>
                  {availableCats.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-mono text-[14px] tracking-[0.08em] text-text-dim uppercase mb-3">Monthly Limit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dimmer">{currencySymbol}</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" step="any"
                    className="w-full bg-surface-2 border border-border rounded-md pl-10 pr-4 py-3 text-text outline-none focus:border-accent transition-colors" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button type="submit" className="luxury-btn luxury-btn-primary w-full md:w-auto">
                Save Budget
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="section pt-0 border-t-0">
        {activeBudgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-mono text-[14px] tracking-[0.08em] text-text-dim uppercase mb-2">No budgets set</p>
            <p className="text-[16px] text-text-dimmer">Create a budget to track your spending limits.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBudgets.map(b => {
              const cat = b.categories
              return (
                <motion.div layout key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-surface-1 border border-border rounded-md p-6 relative group">
                  <button onClick={() => deleteBudget(b.id)}
                    className="absolute top-4 right-4 p-2 text-text-dim opacity-0 group-hover:opacity-100 hover:text-red transition-all cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-sm bg-surface-2 flex items-center justify-center text-accent mb-4">
                      <CategoryIcon emoji={cat?.emoji} className="w-6 h-6" />
                    </div>
                    <h3 className="font-mono text-[14px] tracking-[0.08em] text-text uppercase mb-6">{cat?.name}</h3>
                    <BudgetRing name={cat?.name} color="var(--accent)" spent={b.spent} budget={Number(b.amount)} />
                    <div className="mt-6 flex items-center justify-between w-full px-2 text-[14px] font-mono tracking-[0.08em] uppercase">
                      <span className="text-text-dim">Spent: {fmt(b.spent)}</span>
                      <span className="text-text">Limit: {fmt(b.amount)}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
