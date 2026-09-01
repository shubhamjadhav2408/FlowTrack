import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, eachMonthOfInterval, subDays, subYears, eachWeekOfInterval, startOfWeek, endOfWeek, differenceInDays } from 'date-fns'
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAppStore = create((set, get) => ({
  // Auth
  user: null,
  profile: null,
  session: null,

  // Data
  transactions: [],
  categories: [],
  budgets: [],
  recurringRules: [],

  // UI state
  loading: false,
  activeTab: 'dashboard',

  // ── Auth actions ──────────────────────────────────────────────
  setSession: (session) => {
    set({ session, user: session?.user ?? null })
    if (session?.user) get().fetchAll()
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null, transactions: [], categories: [], budgets: [], recurringRules: [] })
  },

  // ── Fetch all data ────────────────────────────────────────────
  fetchAll: async () => {
    set({ loading: true })
    await Promise.all([
      get().fetchProfile(),
      get().fetchCategories(),
      get().fetchTransactions(),
      get().fetchBudgets(),
      get().fetchRecurringRules(),
    ])
    set({ loading: false })
  },

  fetchProfile: async () => {
    const { data } = await supabase.from('profiles').select('*').single()
    if (data) set({ profile: data })
  },

  fetchCategories: async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
    if (data) set({ categories: data })
  },

  fetchTransactions: async (limit = 200) => {
    const { data } = await supabase
      .from('transactions')
      .select('*, categories(name, emoji, color)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    if (data) set({ transactions: data })
  },

  fetchBudgets: async () => {
    const month = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('budgets')
      .select('*, categories(name, emoji, color)')
      .eq('month', month)
    if (data) set({ budgets: data })
  },

  fetchRecurringRules: async () => {
    const { data } = await supabase
      .from('recurring_rules')
      .select('*, categories(name, emoji, color)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (data) set({ recurringRules: data })
  },

  updateProfile: async (updates) => {
    const { user } = get()
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    set({ profile: data })
  },

  // ── Transaction actions ───────────────────────────────────────
  addTransaction: async (payload) => {
    const { user } = get()
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...payload, user_id: user.id })
      .select('*, categories(name, emoji, color)')
      .single()
    if (error) throw error
    set((s) => ({ transactions: [data, ...s.transactions] }))
    return data
  },

  updateTransaction: async (id, payload) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .select('*, categories(name, emoji, color)')
      .single()
    if (error) throw error
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === id ? data : t)),
    }))
    return data
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
  },

  // ── Budget actions ────────────────────────────────────────────
  upsertBudget: async (categoryId, amount) => {
    const { user } = get()
    const month = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('budgets')
      .upsert({ user_id: user.id, category_id: categoryId, month, amount }, { onConflict: 'user_id,category_id,month' })
      .select('*, categories(name, emoji, color)')
      .single()
    if (error) throw error
    set((s) => {
      const without = s.budgets.filter((b) => b.category_id !== categoryId)
      return { budgets: [...without, data] }
    })
  },

  // ── Computed selectors ────────────────────────────────────────
  getMonthlyTotals: () => {
    const { transactions } = get()
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    const pastTransactions = transactions.filter(t => new Date(t.date) < start)
    const carryover = pastTransactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0)

    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.date)
      return d >= start && d <= end
    })
    const income = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const expense = thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    return { carryover, income, expense, net: income - expense, available: carryover + income - expense }
  },

  getSpendingByCategory: () => {
    const { transactions } = get()
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    const map = {}
    transactions
      .filter((t) => t.type === 'expense' && new Date(t.date) >= start && new Date(t.date) <= end)
      .forEach((t) => {
        const key = t.category_id || 'uncategorized'
        const cat = t.categories
        if (!map[key]) {
          map[key] = {
            id: key,
            name: cat?.name || 'Uncategorized',
            emoji: cat?.emoji || '📋',
            color: cat?.color || '#94a3b8',
            value: 0,
          }
        }
        map[key].value += Number(t.amount)
      })
    return Object.values(map).sort((a, b) => b.value - a.value)
  },


  getTrendData: (range, customStart, customEnd) => {
    const { transactions } = get()
    let start, end, intervals, grouping, fmtStr;
    const today = new Date();

    if (range === '1m') {
      start = subMonths(today, 1); end = today;
      intervals = eachDayOfInterval({ start, end });
      grouping = 'day'; fmtStr = 'MMM d';
    } else if (range === '3m') {
      start = subMonths(today, 3); end = today;
      intervals = eachWeekOfInterval({ start, end });
      grouping = 'week'; fmtStr = 'MMM d';
    } else if (range === '6m') {
      start = subMonths(startOfMonth(today), 5); end = endOfMonth(today);
      intervals = eachMonthOfInterval({ start, end });
      grouping = 'month'; fmtStr = 'MMM';
    } else if (range === '1y') {
      start = subMonths(startOfMonth(today), 11); end = endOfMonth(today);
      intervals = eachMonthOfInterval({ start, end });
      grouping = 'month'; fmtStr = 'MMM';
    } else if (range === 'custom') {
      start = customStart ? new Date(customStart) : subMonths(today, 1);
      end = customEnd ? new Date(customEnd) : today;
      if (start > end) { const t = start; start = end; end = t; }
      const diff = differenceInDays(end, start);
      if (diff <= 31) { intervals = eachDayOfInterval({ start, end }); grouping = 'day'; fmtStr = 'MMM d'; }
      else if (diff <= 120) { intervals = eachWeekOfInterval({ start, end }); grouping = 'week'; fmtStr = 'MMM d'; }
      else { intervals = eachMonthOfInterval({ start, end }); grouping = 'month'; fmtStr = 'MMM yyyy'; }
    }

    return intervals.map(intervalDate => {
      let iStart, iEnd;
      if (grouping === 'day') {
        iStart = new Date(intervalDate); iStart.setHours(0,0,0,0);
        iEnd = new Date(intervalDate); iEnd.setHours(23,59,59,999);
      } else if (grouping === 'week') {
        iStart = startOfWeek(intervalDate); iEnd = endOfWeek(intervalDate);
      } else {
        iStart = startOfMonth(intervalDate); iEnd = endOfMonth(intervalDate);
      }
      
      const slice = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= iStart && d <= iEnd;
      });
      const income = slice.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = slice.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      
      return { month: format(intervalDate, fmtStr), income, expense };
    })
  },

  getLast6MonthsData: () => {
    const { transactions } = get()
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(new Date()), 5),
      end: startOfMonth(new Date()),
    })
    return months.map((m) => {
      const start = startOfMonth(m)
      const end = endOfMonth(m)
      const slice = transactions.filter((t) => {
        const d = new Date(t.date)
        return d >= start && d <= end
      })
      const income = slice.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const expense = slice.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      return { month: format(m, 'MMM'), income, expense }
    })
  },

  getRunningBalance: () => {
    const { transactions } = get()
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
    let balance = 0
    return sorted.map((t) => {
      balance += t.type === 'income' ? Number(t.amount) : -Number(t.amount)
      return { date: t.date, balance: parseFloat(balance.toFixed(2)) }
    })
  },

  getDailyHeatmap: () => {
    const { transactions } = get()
    const end = new Date()
    const start = subDays(end, 89) // 90 days
    const map = {}
    transactions
      .filter((t) => t.type === 'expense' && new Date(t.date) >= start)
      .forEach((t) => {
        const key = t.date
        map[key] = (map[key] || 0) + Number(t.amount)
      })
    const days = eachDayOfInterval({ start, end })
    return days.map((d) => ({ date: format(d, 'yyyy-MM-dd'), amount: map[format(d, 'yyyy-MM-dd')] || 0 }))
  },
}))
