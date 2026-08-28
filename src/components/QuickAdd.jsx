import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../stores/useAppStore'
import CategoryIcon from './CategoryIcon'

export default function QuickAdd({ onClose, editData = null }) {
  const { addTransaction, updateTransaction, profile, categories } = useAppStore()
  const isEditing = !!editData

  const [amount, setAmount] = useState(isEditing ? editData.amount.toString() : '0')
  const [type, setType] = useState(isEditing ? editData.type : 'expense')
  const [categoryId, setCategoryId] = useState(isEditing ? editData.category_id : '')
  const [note, setNote] = useState(isEditing ? (editData.note || '') : '')
  const [date, setDate] = useState(isEditing ? editData.date : new Date().toISOString().split('T')[0])
  const [isRecurring, setIsRecurring] = useState(isEditing ? editData.is_recurring : false)

  const currencySymbol = profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : profile?.currency === 'INR' ? '₹' : '$'
  const filteredCats = categories.filter((c) => c.type === type).sort((a, b) => a.sort_order - b.sort_order)

  const handleSubmit = async () => {
    if (!amount || amount === '0' || !categoryId) return

    const payload = {
      amount: parseFloat(amount),
      type,
      category_id: categoryId,
      note: note.trim(),
      date,
      is_recurring: isRecurring
    }

    if (isEditing) await updateTransaction(editData.id, payload)
    else await addTransaction(payload)
    onClose()
  }

  useEffect(() => {
    if (!isEditing && filteredCats.length > 0 && !categoryId) {
      setCategoryId(filteredCats[0].id)
    }
  }, [type, filteredCats, categoryId, isEditing])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'Backspace') setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'))
      else if (e.key === 'Enter') handleSubmit()
      else if (/^[0-9]$/.test(e.key)) setAmount((prev) => (prev === '0' ? e.key : prev + e.key))
      else if (e.key === '.') setAmount((prev) => (prev.includes('.') ? prev : prev + '.'))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [amount, type, categoryId, note, date, isRecurring, handleSubmit, onClose])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/90 backdrop-blur-sm">
      
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-4xl bg-surface-1 border border-border rounded-md flex flex-col md:flex-row h-[85vh] md:h-[600px] shadow-2xl overflow-hidden">
        
        {/* Numpad Section */}
        <div className="flex-1 border-b md:border-b-0 md:border-r border-border p-8 flex flex-col justify-center bg-bg">
          
          <div className="flex gap-4 mb-12">
            <button onClick={() => setType('expense')}
              className={`flex-1 py-3 font-mono text-[11px] tracking-[0.06em] uppercase rounded-sm transition-all border cursor-pointer focus-visible:ring-2 focus-visible:ring-accent outline-none ${
                type === 'expense' ? 'bg-red border-red text-[#0B0C10]' : 'border-border text-text-dim hover:text-text'
              }`}>Expense</button>
            <button onClick={() => setType('income')}
              className={`flex-1 py-3 font-mono text-[11px] tracking-[0.06em] uppercase rounded-sm transition-all border cursor-pointer focus-visible:ring-2 focus-visible:ring-accent outline-none ${
                type === 'income' ? 'bg-green border-green text-[#0B0C10]' : 'border-border text-text-dim hover:text-text'
              }`}>Income</button>
          </div>

          <div className="text-center mb-12 flex justify-center items-center group">
            <span className="font-display text-[64px] text-text/50 leading-none mr-2">{currencySymbol}</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                let val = e.target.value.replace(/[^0-9.]/g, '')
                if (val.split('.').length > 2) val = val.replace(/\.+$/, '')
                if (val.startsWith('0') && val.length > 1 && val[1] !== '.') val = val.slice(1)
                setAmount(val || '0')
              }}
              onFocus={(e) => {
                if(e.target.value === '0') setAmount('')
              }}
              onBlur={(e) => {
                if(!e.target.value) setAmount('0')
              }}
              className="font-display text-[64px] text-text leading-none bg-transparent outline-none w-[200px] text-left cursor-text border-b-2 border-transparent focus:border-accent transition-colors"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map((k) => (
              <button key={k}
                onClick={() => {
                  if (k === '⌫') setAmount(p => p.length > 1 ? p.slice(0, -1) : '0')
                  else if (k === '.') setAmount(p => p.includes('.') ? p : p + '.')
                  else setAmount(p => p === '0' ? k : p + k)
                }}
                className="py-5 rounded-sm font-mono text-[18px] text-text border border-transparent hover:border-border hover:bg-surface-1 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-accent outline-none">
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Details Section */}
        <div className="flex-1 p-8 flex flex-col bg-surface-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-display text-[32px] text-text m-0 leading-none">{isEditing ? 'Edit Entry' : 'New Entry'}</h2>
            <button onClick={onClose} className="font-mono text-[11px] tracking-[0.06em] text-text-dim uppercase hover:text-text transition-colors">
              Close (Esc)
            </button>
          </div>

          <div className="space-y-8 flex-1">
            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] text-text-dim uppercase mb-3">Category</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredCats.map((c) => (
                  <button key={c.id} onClick={() => setCategoryId(c.id)}
                    className={`flex items-center gap-3 p-3 rounded-sm border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-accent outline-none ${
                      categoryId === c.id ? 'border-accent bg-accent text-[#0B0C10]' : 'border-border text-text hover:border-border-strong bg-surface-2'
                    }`}>
                    <div className={categoryId === c.id ? "text-[#0B0C10]" : "text-accent"}>
                      <CategoryIcon emoji={c.emoji} className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.06em] uppercase truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-[11px] tracking-[0.08em] text-text-dim uppercase mb-3">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-text outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label className="block font-mono text-[11px] tracking-[0.08em] text-text-dim uppercase mb-3">Note</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional detail"
                  className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-text outline-none focus:border-accent transition-colors placeholder-text-dimmer" />
              </div>
            </div>

            <label className="flex items-center gap-4 cursor-pointer p-4 border border-border rounded-md bg-surface-2 hover:border-border-strong transition-colors">
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-accent" />
              <div>
                <p className="font-mono text-[11px] tracking-[0.06em] uppercase text-text m-0">Recurring</p>
                <p className="text-[12px] text-text-dim mt-1 font-serif italic m-0">Repeats monthly</p>
              </div>
            </label>
          </div>

          <button onClick={handleSubmit}
            className="w-full mt-8 luxury-btn luxury-btn-primary py-4 cursor-pointer hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white outline-none active:scale-[0.98]">
            {isEditing ? 'Save Changes' : `Save ${type}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
