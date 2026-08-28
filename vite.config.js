import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      // Explicitly expose these exact variables to the browser build
      'import.meta.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || env.SUPABASE_URL),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY)
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) return 'charts'
            if (id.includes('node_modules/framer-motion')) return 'motion'
            if (id.includes('node_modules/@supabase')) return 'supabase'
            if (id.includes('node_modules/zustand')) return 'zustand'
            if (id.includes('node_modules/date-fns')) return 'date-fns'
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react-vendor'
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  }
})
