/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        foreground: '#F8FAFC',
        card: '#1B2336',
        'card-foreground': '#F8FAFC',
        muted: '#272F42',
        'muted-foreground': '#94A3B8',
        border: '#475569',
        accent: '#38BDF8',
        'accent-foreground': '#0F172A',
        success: '#22C55E',
        'success-foreground': '#0F172A',
        destructive: '#EF4444',
        'destructive-foreground': '#FFFFFF',
        ring: '#38BDF8',
        'blue-accent': '#38BDF8',
        'cyan-accent': '#22D3EE',
        charcoal: {
          400: '#94A3B8',
          500: '#64748B',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Fira Sans', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
    },
  },
  plugins: [],
}