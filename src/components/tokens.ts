export const accents = {
  blue: "#0066cc",
  purple: "#AF52DE",
  pink: "#FF2D55",
  orange: "#FF9500",
  green: "#34C759",
  mint: "#1ec4b3",
} as const;

export type AccentKey = keyof typeof accents;

export const highlights = [
  { key: "red", color: "rgba(255,59,48,0.38)" },
  { key: "orange", color: "rgba(255,149,0,0.42)" },
  { key: "yellow", color: "rgba(255,204,0,0.5)" },
  { key: "green", color: "rgba(52,199,89,0.38)" },
  { key: "blue", color: "rgba(0,122,255,0.32)" },
  { key: "purple", color: "rgba(175,82,222,0.38)" },
] as const;

export type HighlightKey = typeof highlights[number]["key"];
