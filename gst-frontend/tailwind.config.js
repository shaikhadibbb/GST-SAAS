/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          900: '#0f172a',
          950: '#020617',
        },
        void: {
          950: '#050505',
          900: '#0a0a0a',
          800: '#141414',
        },
        neon: {
          emerald: '#10b981',
          cyan: '#06b6d4',
          cobalt: '#3b82f6',
        },
        success: {
          light: 'rgba(16, 185, 129, 0.1)',
          main: '#10b981',
          dark: '#065f46',
        },
        error: {
          light: 'rgba(239, 68, 68, 0.1)',
          main: '#ef4444',
          dark: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 20px rgba(16, 185, 129, 0.2)',
        'neon-hover': '0 0 30px rgba(16, 185, 129, 0.4)',
        'void': '0 20px 50px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '18px',
        '3xl': '28px',
      }

    },
  },
  plugins: [],
}
