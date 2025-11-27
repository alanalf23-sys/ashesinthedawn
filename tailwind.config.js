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
      animation: {
        // Playhead and metering animations
        'playhead-pulse': 'playhead-pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'meter-glow': 'meter-glow 0.4s ease-out',
        'level-update': 'level-update 0.15s ease-out',
        
        // UI feedback animations
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        
        // Mixer and transport animations
        'fader-drag': 'fader-drag 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'control-highlight': 'control-highlight 0.3s ease-out',
        'transport-pulse': 'transport-pulse 0.6s ease-in-out infinite',
      },
      keyframes: {
        'playhead-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' },
          '50%': { boxShadow: '0 0 16px rgba(239, 68, 68, 0.9)' },
        },
        'meter-glow': {
          'from': { boxShadow: '0 0 4px rgba(59, 130, 246, 0.3)' },
          'to': { boxShadow: 'none' },
        },
        'level-update': {
          'from': { opacity: '0.8' },
          'to': { opacity: '1' },
        },
        'slide-in': {
          'from': { transform: 'translateX(-4px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'scale-in': {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
        'fader-drag': {
          'from': { filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))' },
          'to': { filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))' },
        },
        'control-highlight': {
          'from': { boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)' },
          'to': { boxShadow: '0 0 0px rgba(59, 130, 246, 0)' },
        },
        'transport-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      transitionDuration: {
        '75': '75ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
      },
    },
  },
  plugins: [],
};
