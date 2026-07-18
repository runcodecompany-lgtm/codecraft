import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--background)',
          light: '#F8FAFC',
          dark: '#0F172A',
        },
        card: {
          DEFAULT: 'var(--card)',
          light: '#FFFFFF',
          dark: '#1E293B',
        },
        primary: {
          DEFAULT: '#22D3EE',
          from: '#22D3EE',
          to: '#A855F7',
        },
        'text-main': {
          DEFAULT: 'var(--text-main)',
          light: '#0F172A',
          dark: '#F8FAFC',
        },
        'text-muted': {
          DEFAULT: 'var(--text-muted)',
          light: '#475569',
          dark: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['var(--font-alexandria)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
