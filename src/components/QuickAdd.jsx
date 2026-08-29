import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../stores/useAppStore'
import CategoryIcon from './CategoryIcon'
import { supabase } from '../lib/supabase'

export default function QuickAdd({ onClose, editData = null }) {
  const { categories, addTransaction, updateTransaction, deleteTransaction, profile } = useAppStore()
  const isEditing = !!editData

  const [type, setType] = useState(editData?.type || 'expense')
  const [amount, setAmount] = useState(editData ? String(editData.amount) : '0')
  const [categoryId, setCategoryId] = useState(editData?.category_id || null)
  const [note, setNote] = useState(editData?.note || '')
  const [date, setDate] = useState(editData?.date || new Date().toISOString().split('T')[0])
  const [isRecurring, setIsRecurring] = useState(editData?.is_recurring || false)

  const filteredCats = categories.filter((c) => c.type === type)
  const currencySymbol = profile?.currency === 'GBP' ? '£' : profile?.currency === 'EUR' ? '€' : '$'

  const handleDelete = async () => {
    if (!editData) return
    await deleteTransaction(editData.id)
    onClose()
  }

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
    // Lock body scroll when modal mounts
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      // Restore body scroll when modal unmounts
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (!isEditing && filteredCats.length > 0 && !categoryId) {
      setCategoryId(filteredCats[0].id)
    }
  }, [type, filteredCats, categoryId, isEditing])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        if (e.key === 'Escape') onClose()
        if (e.key === 'Enter') handleSubmit()
        return
      }

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-sm p-4">
      
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-4xl bg-surface-1 border border-border rounded-xl flex flex-col md:flex-row h-auto max-h-[90dvh] shadow-2xl overflow-hidden">
        
        {/* Desktop Numpad Section (Hidden on Mobile) */}
        <div className="hidden md:flex flex-1 border-r border-border p-8 flex-col justify-center bg-bg">
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

        {/* Details Section (Scrollable on Mobile) */}
        <div className="w-full min-h-0 p-6 md:p-8 flex flex-col bg-surface-1 overflow-y-auto overscroll-contain">
          
          {/* Mobile Drag Handle */}
          

          <div className="flex justify-between items-center mb-5 md:mb-8">
            <h2 className="font-display text-[24px] md:text-[32px] text-text m-0 leading-none">{isEditing ? 'Edit Entry' : 'New Entry'}</h2>
            <button onClick={onClose} className="font-mono text-[11px] tracking-[0.06em] text-text-dim uppercase hover:text-text transition-colors">
              X
            </button>
          </div>

          {/* Mobile-Only Type Toggle & Amount Input */}
          <div className="md:hidden flex flex-col gap-6 mb-6 pb-6 border-b border-border">
            <div className="flex bg-surface-2 p-1 rounded-md">
              <button onClick={() => setType('expense')}
                className={`flex-1 py-2.5 font-mono text-[11px] tracking-[0.06em] uppercase rounded-sm transition-all cursor-pointer outline-none ${
                  type === 'expense' ? 'bg-surface-1 text-text shadow-sm' : 'text-text-dim hover:text-text'
                }`}>Expense</button>
              <button onClick={() => setType('income')}
                className={`flex-1 py-2.5 font-mono text-[11px] tracking-[0.06em] uppercase rounded-sm transition-all cursor-pointer outline-none ${
                  type === 'income' ? 'bg-surface-1 text-text shadow-sm' : 'text-text-dim hover:text-text'
                }`}>Income</button>
            </div>
            
            <div className="text-center flex justify-center items-center">
              <span className="font-display text-[32px] text-text/50 leading-none mr-2">{currencySymbol}</span>
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
                className="font-display text-[32px] text-text leading-none bg-transparent outline-none w-[180px] text-left cursor-text border-b-2 border-transparent focus:border-accent transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-4 md:space-y-8">
            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] text-text-dim uppercase mb-1.5">Category</label>
              <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-3 pb-2 hide-scrollbar">
                {filteredCats.map((c) => (
                  <button key={c.id} onClick={() => setCategoryId(c.id)}
                    className={`flex-shrink-0 flex items-center gap-2 p-2.5 rounded-sm border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-accent outline-none ${
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="min-w-0">
                <label className="block font-mono text-[11px] tracking-[0.08em] text-text-dim uppercase mb-1.5">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-text outline-none focus:border-accent transition-colors cursor-pointer" />
              </div>
              <div className="min-w-0">
                <label className="block font-mono text-[11px] tracking-[0.08em] text-text-dim uppercase mb-1.5">Note</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional detail"
                  className="w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-text outline-none focus:border-accent transition-colors placeholder-text-dimmer" />
              </div>
            </div>

            <label className="flex items-center gap-4 cursor-pointer p-4 border border-border rounded-md bg-surface-2 hover:border-border-strong transition-colors">
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-accent cursor-pointer" />
              <div>
                <p className="font-mono text-[11px] tracking-[0.06em] uppercase text-text m-0">Recurring</p>
                <p className="text-[12px] text-text-dim mt-1 font-serif italic m-0">Repeats monthly</p>
              </div>
            </label>
          </div>

          {isEditing ? (
            <div className="mt-4 md:mt-8 flex gap-4">
              <button onClick={handleDelete}
                className="flex-[0.5] md:flex-1 border border-red text-red font-mono text-[11px] tracking-[0.06em] uppercase py-3 md:py-4 rounded-sm hover:bg-red/10 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red">
                Delete
              </button>
              <button onClick={handleSubmit}
                className="flex-1 md:flex-[2] luxury-btn luxury-btn-primary py-2.5 md:py-4 cursor-pointer hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white outline-none active:scale-[0.98]">
                Save Changes
              </button>
            </div>
          ) : (
            <button onClick={handleSubmit}
              className="w-full mt-4 md:mt-8 luxury-btn luxury-btn-primary py-2.5 md:py-4 cursor-pointer hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white outline-none active:scale-[0.98]">
              Save {type}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
