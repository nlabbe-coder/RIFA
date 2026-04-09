import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#ff6b6b',
          500: '#f83b3b',
          600: '#e51c1c',
          700: '#c11414',
          800: '#9f1515',
          900: '#841818',
          950: '#480707',
        },
        gold: {
          400: '#f4d03f',
          500: '#e9b800',
          600: '#c79a00',
        },
        verde: {
          500: '#27ae60',
          600: '#219a52',
          700: '#1a7a41',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
