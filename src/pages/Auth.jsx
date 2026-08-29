import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null); setSuccess(false)
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName, currency: 'USD' } }
        })
        if (error) throw error
        setSuccess(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-surface-1 border border-border rounded-md p-10 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-bg" />

        <div className="mb-12">
          <p className="font-display text-[42px] leading-none tracking-[-0.01em] mb-2">FlowTrack</p>
          <p className="font-mono text-[11px] tracking-[0.06em] text-text-dim uppercase">
            {isLogin ? 'Sign in to your portfolio' : 'Create your portfolio'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <label className="block font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase mb-2">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required={!isLogin}
                  className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-text outline-none focus:border-accent transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-text outline-none focus:border-accent transition-colors" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="block font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase">Password</label>
              {isLogin && <span className="font-mono text-[10px] tracking-[0.08em] text-accent uppercase cursor-pointer hover:underline">Forgot?</span>}
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-text outline-none focus:border-accent transition-colors" />
          </div>

          {success && !isLogin && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-green-500/10 border border-green-500/20 rounded-sm text-[13px] text-green-400 text-center">
              Account created! Please check your email to verify your account before signing in.
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red/10 border border-red/20 rounded-sm text-[13px] text-red">
              {error}
            </motion.div>
          )}

          <button type="submit" disabled={loading}
            className="w-full mt-4 luxury-btn luxury-btn-primary py-3.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed text-[12px]">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(false) }}
            className="font-mono text-[11px] tracking-[0.06em] text-text-dim uppercase cursor-pointer hover:text-text transition-colors">
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
