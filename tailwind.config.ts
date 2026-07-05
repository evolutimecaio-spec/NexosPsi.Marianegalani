import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#1E3654',
        teal:    '#2080A0',
        'teal-mid': '#50A0C0',
        cyan:    '#90D0D0',
        'teal-light': '#E8F4F8',
        danger:  '#C62828',
        success: '#2E7D32',
        warn:    '#E65100',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
