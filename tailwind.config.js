/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#07080b',
          900: '#0a0b0e',
          850: '#0f1218',
          800: '#12151c',
          750: '#161b24',
          700: '#1a1f2b',
          600: '#262e3f',
          500: '#38435c',
        },
        cyan: {
          DEFAULT: '#00f0ff',
          glow: '#00f0ff40',
          dim: '#00b8c4',
        },
        amber: {
          DEFAULT: '#f59e0b',
          glow: '#f59e0b40',
          dim: '#d97706',
        },
        crimson: {
          DEFAULT: '#ff1e56',
          glow: '#ff1e5640',
          dim: '#dc2626',
        },
        cobalt: {
          DEFAULT: '#3b82f6',
          glow: '#3b82f640',
          dim: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Space Mono', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulseFast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'scanline': 'scanline 8s linear infinite',
        'ring-draw': 'ringDraw 1.5s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(255, 30, 86, 0.7))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 5px rgba(255, 30, 86, 0.2))' },
        },
        pulseFast: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(circle, rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
        'industrial-grid': 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        'hex-pattern': 'radial-gradient(rgba(0, 240, 255, 0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
