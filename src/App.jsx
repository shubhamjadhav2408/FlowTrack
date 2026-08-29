import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from './lib/supabase'
import { useAppStore } from './stores/useAppStore'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import QuickAdd from './components/QuickAdd'
import { LayoutDashboard, Receipt, PieChart, LogOut } from 'lucide-react'

const NAV = [
  { id: 'dashboard',    label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Ledger', icon: Receipt },
  { id: 'budgets',      label: 'Budgets', icon: PieChart },
]

export default function App() {
  const { session, setSession, signOut, profile, loading, updateProfile } = useAppStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [editData, setEditData] = useState(null)

  const handleEdit = (transaction) => {
    setEditData(transaction)
    setShowQuickAdd(true)
  }

  const closeQuickAdd = () => {
    setShowQuickAdd(false)
    setEditData(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <Auth />

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text">
      <div className="text-center space-y-6">
        <p className="font-display text-[48px] text-text italic">FT.</p>
        <p className="font-mono text-[14px] tracking-[0.06em] text-text-dimmer uppercase">Synchronizing</p>
      </div>
    </div>
  )

  const Page = { dashboard: Dashboard, transactions: Transactions, budgets: Budgets }[activeTab]

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col lg:flex-row">
      
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-6 border-b border-border bg-bg sticky top-0 z-30">
        <p className="font-display text-[24px] font-medium tracking-[-0.01em] m-0 leading-none">FlowTrack</p>
        <div className="flex items-center gap-3">
          <select
            value={profile?.currency || 'USD'}
            onChange={(e) => updateProfile({ currency: e.target.value })}
            className="font-mono text-[12px] tracking-[0.06em] bg-surface-1 border border-border rounded-md px-2 py-1.5 outline-none text-text cursor-pointer focus:border-accent"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="INR">INR</option>
          </select>
          <button onClick={signOut} className="text-text-dim hover:text-red transition-colors p-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0 w-[260px] px-8 py-10 border-r border-border fixed top-0 bottom-0 left-0 bg-bg z-30">
        <p className="font-display text-[28px] font-medium tracking-[-0.01em] m-0 leading-none">FlowTrack</p>
        <p className="font-mono text-[14px] tracking-[0.06em] text-text-dimmer uppercase mt-2 mb-10">
          {profile?.full_name || 'Private Portfolio'}
        </p>

        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`text-left font-mono text-[20px] tracking-[0.06em] uppercase px-3 py-2.5 rounded-sm cursor-pointer border-l-2 transition-all ${
                activeTab === id 
                  ? 'text-text bg-surface-1 border-accent' 
                  : 'text-text-dim border-transparent hover:text-text'
              }`}>
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <div className="font-mono text-[13px] tracking-[0.08em] text-text-dimmer uppercase mb-1.5">Base Currency</div>
          <select
            value={profile?.currency || 'USD'}
            onChange={(e) => updateProfile({ currency: e.target.value })}
            className="font-display italic text-[20px] text-text pb-1.5 border-b border-border-strong mb-5 bg-transparent outline-none cursor-pointer w-full transition-all focus:border-accent"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="INR">INR (₹)</option>
          </select>
          <div onClick={signOut} className="font-mono text-[14px] tracking-[0.06em] text-text-dimmer uppercase cursor-pointer hover:text-red transition-colors">
            Sign Out
          </div>
        </div>
      </aside>

      {/* Main content container */}
      <main className="flex-1 min-w-0 lg:ml-[260px] pb-32 lg:pb-16 min-h-screen">
        <div className="max-w-[1600px] mx-auto w-full px-5 lg:px-12 xl:px-16 pt-8 lg:pt-14">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}>
              <Page onEdit={handleEdit} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-1 border-t border-border z-30 pb-safe">
        <div className="flex items-center justify-around p-2">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center justify-center p-3 gap-1 min-w-[70px] ${
                activeTab === id ? 'text-accent' : 'text-text-dim'
              }`}>
              <Icon className="w-5 h-5" />
              <span className="font-mono text-[11px] uppercase tracking-wider">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* FAB */}
      <AnimatePresence>
        {!showQuickAdd && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setShowQuickAdd(true)}
            className="fixed z-40 w-[52px] h-[52px] rounded-md bg-accent text-[#0B0C10] flex items-center justify-center shadow-[0_12px_32px_rgba(139,124,246,0.35)] cursor-pointer hover:scale-105 transition-transform lg:bottom-[40px] lg:right-[48px] bottom-[100px] right-[24px]">
            <span className="text-[24px] font-sans leading-none pb-0.5">+</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuickAdd && <QuickAdd onClose={closeQuickAdd} editData={editData} />}
      </AnimatePresence>
    </div>
  )
}
