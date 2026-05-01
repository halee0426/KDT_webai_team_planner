// 디자인 토큰 — 색·폰트·간격
// 담당: A (정의) + B (적용)

export const TOKENS = {
  font: {
    display: '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
    text:    '"Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 980 },
  shadow: {
    card: '0 1px 3px rgba(0,0,0,0.04)',
    soft: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
  },
};

export const ACCENT = {
  blue:   '#0066cc',
  purple: '#AF52DE',
  pink:   '#FF2D55',
  orange: '#FF9500',
  green:  '#34C759',
  mint:   '#1ec4b3',
} as const;

export type AccentKey = keyof typeof ACCENT;
