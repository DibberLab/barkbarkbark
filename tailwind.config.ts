import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          bg: '#0a0c10',
          surface: '#111318',
          raised: '#181c22',
          border: '#232830',
          text: '#d8dde8',
          muted: '#8890a0',
          dim: '#565e6e',
          accent: '#c8ff40',
          'accent-dim': '#8fb82d',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', '"Courier New"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
}

export default config
