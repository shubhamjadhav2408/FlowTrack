# 💸 FlowTrack — Luxury Finance App

> Apple HIG design · Champagne gold palette · Supabase backend · Vercel-ready

---

## 🚀 Deploy to Vercel (2 minutes)

### Option A: Vercel CLI
```bash
npx vercel
# Follow prompts — it auto-detects Vite
# Add env vars when asked, or set in Vercel dashboard
```

### Option B: GitHub → Vercel (recommended)
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Vercel auto-detects **Vite** — no config needed
4. Add environment variables in dashboard:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your **publishable (anon) key** |

> [!IMPORTANT]
> **Key clarification:**
> - **Publishable key** = `anon` key → use this in `VITE_SUPABASE_ANON_KEY` ✅
> - **Secret key** = `service_role` key → **NEVER put this in frontend code** ❌
>
> Both are in: Supabase Dashboard → Project → Settings → API

5. Click **Deploy** → done in ~30 seconds!

---

## ⚙️ Local Setup

```bash
# 1. Copy env file
cp .env.example .env
# Edit .env with your Supabase URL + anon key

# 2. Run Supabase SQL schema
# Open Supabase → SQL Editor → paste supabase/schema.sql → Run

# 3. Start dev server
npm run dev
# Opens at http://localhost:5173
```

---

## 🎨 Design System

### Apple HIG Principles Applied
- **SF Pro System Font** stack via `-apple-system, BlinkMacSystemFont`
- **44pt minimum tap targets** on all interactive elements (HIG requirement)
- **Generous whitespace** — 20-28px padding on cards
- **Frosted glass** — `backdrop-filter: blur(40px)` on overlays and sidebar
- **Segment controls** — Apple-style for type toggle
- **iOS-style toggle switches** — animated with CSS transitions
- **Inset grouped lists** — transaction items grouped by date (iOS table style)

### Luxury Color Palette
| Token | Hex | Usage |
|---|---|---|
| Obsidian | `#0d0b1a` | App background |
| Gold 500 | `#c9a96e` | Primary accent, FAB, active states |
| Gold 400 | `#e8c97e` | Highlights, gradients |
| Sage 400  | `#6fcfa0` | Income, positive values |
| Blush 400 | `#e07070` | Expenses, negative values |
| Pearl 200 | `#d4d2e8` | Primary text |
| Pearl 400 | `#8c88b0` | Secondary text |

---

## 📁 Project Structure

```
flowtrack/
├── public/
│   └── favicon.svg          # Custom luxury SVG favicon
├── supabase/
│   └── schema.sql           # ← Paste into Supabase SQL Editor
├── src/
│   ├── lib/supabase.js      # Supabase client
│   ├── stores/useAppStore.js # Zustand: auth + CRUD + chart data
│   ├── pages/
│   │   ├── Auth.jsx         # Glassmorphism login
│   │   ├── Dashboard.jsx    # 5 charts + savings rate + insight
│   │   ├── Transactions.jsx # Search + filter + totals
│   │   └── Budgets.jsx      # Rings + inline budget editor
│   └── components/
│       ├── QuickAdd.jsx     # Numpad sheet + iOS toggle
│       ├── TransactionList.jsx # Inset grouped list
│       ├── BudgetRing.jsx   # Animated SVG rings
│       └── charts/          # Donut, Bar, Line, Heatmap
├── .env.example             # Template for env vars
├── vercel.json              # SPA routing for Vercel
└── vite.config.js           # Code-split: charts/motion/supabase
```

---

## 🔐 Security

- ✅ Supabase RLS on **every** table — users only see their own data
- ✅ Only `anon` key in client — `service_role` never exposed
- ✅ DB-level `CHECK` constraints on amounts and enums
- ✅ Auto-trigger creates user profile on signup
- ✅ No `dangerouslySetInnerHTML` / `eval` anywhere
- ✅ Build: **0 errors · 0 warnings** (code-split into 6 chunks)

---

## 📦 Bundle (code-split)

| Chunk | Size (gzip) |
|---|---|
| `charts` (Recharts) | 119 kB |
| `supabase` | 54 kB |
| `react-vendor` | 56 kB |
| `motion` (Framer) | 41 kB |
| App code | 14 kB |
| `date-fns` | 7 kB |

**Total: ~291 kB gzipped** — lazy chunks load on demand.
