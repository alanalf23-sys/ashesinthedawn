/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Logic Pro inspired dark theme
        'daw-dark': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0e1a',
        },
        'daw-blue': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
        },
        'daw-accent': {
          50: '#fef3c7',
          100: '#fde68a',
          200: '#fcd34d',
          300: '#fbbf24',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
        },
      },
      fontSize: {
        'daw-xs': ['11px', { lineHeight: '14px' }],
        'daw-sm': ['12px', { lineHeight: '16px' }],
        'daw-base': ['13px', { lineHeight: '18px' }],
      },
      spacing: {
        'daw-1': '2px',
        'daw-2': '4px',
        'daw-3': '6px',
        'daw-4': '8px',
      },
    },
  },
  plugins: [],
};
