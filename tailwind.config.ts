import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          bg: '#0c0c0c',
          surface: '#141414',
          raised: '#1a1a1a',
          border: '#242424',
          text: '#d4d4d4',
          muted: '#525252',
          dim: '#333333',
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
