/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-mute': 'var(--ink-mute)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'bg-elev': 'var(--bg-elev)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
      },
      borderRadius: {
        pill: '980px',
      },
      letterSpacing: {
        'apple': '-0.374px',
      },
    },
  },
  plugins: [],
};
