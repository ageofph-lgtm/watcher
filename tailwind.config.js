/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Rajdhani', 'Inter', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
        body: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // ── Cyber tokens ──
        cyber: {
          pink:   '#FF2D78',
          'pink-dim': '#cc1f5e',
          blue:   '#4D9FFF',
          'blue-dim': '#2d7fe0',
          purple: '#9B5CF6',
          bg:     '#0D0D14',
          surface: '#111118',
          'surface-2': '#161620',
          border: '#1E1E2E',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background, var(--background)))',
          foreground: 'hsl(var(--sidebar-foreground, var(--foreground)))',
          primary: 'hsl(var(--primary))',
          'primary-foreground': 'hsl(var(--primary-foreground))',
          accent: 'hsl(var(--muted))',
          'accent-foreground': 'hsl(var(--muted-foreground))',
          border: 'hsl(var(--border))',
          ring: 'hsl(var(--ring))',
        },
        slate: { 100:'rgb(var(--tx) / <alpha-value>)', 200:'rgb(var(--tx) / <alpha-value>)', 300:'rgb(var(--tx2) / <alpha-value>)', 400:'rgb(var(--mu) / <alpha-value>)', 500:'rgb(var(--mu2) / <alpha-value>)', 600:'rgb(var(--bd-solid) / <alpha-value>)', 700:'rgb(var(--surface2) / <alpha-value>)', 800:'rgb(var(--surface) / <alpha-value>)', 900:'rgb(var(--bg) / <alpha-value>)' },
        amber: { 300:'rgb(var(--acc) / <alpha-value>)', 400:'rgb(var(--acc) / <alpha-value>)', 500:'rgb(var(--pribg) / <alpha-value>)', 600:'rgb(var(--pribg) / <alpha-value>)' },
        ka:'rgb(var(--ka) / <alpha-value>)', kv:'rgb(var(--kv) / <alpha-value>)', kz:'rgb(var(--kz) / <alpha-value>)', kn:'rgb(var(--kn) / <alpha-value>)',
        caut:'rgb(var(--c-aut) / <alpha-value>)', cexe:'rgb(var(--c-exe) / <alpha-value>)', ccla:'rgb(var(--c-cla) / <alpha-value>)', cpro:'rgb(var(--c-pro) / <alpha-value>)', calu:'rgb(var(--c-alu) / <alpha-value>)'
      },
      boxShadow: {
        'cyber-pink': '0 0 20px rgba(255, 45, 120, 0.4)',
        'cyber-blue': '0 0 20px rgba(77, 159, 255, 0.4)',
        'cyber-sm': '0 0 10px rgba(255, 45, 120, 0.25)',
        'card': '0 2px 8px rgba(0,0,0,0.08)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.4)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'cyber-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255,45,120,0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(255,45,120,0.7)' }
        },
        'fadeInUp': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'cyber-pulse': 'cyber-pulse 2s ease-in-out infinite',
        'fadeInUp': 'fadeInUp 0.3s ease-out forwards',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
