export interface Theme {
  background: string;
  foreground: string;
  muted: string;
  border: string;
  success: string;
  failure: string;
  pending: string;
  cardHeaderBg: string;
  rowEvenBg: string;
  rowOddBg: string;
}

export const lightTheme: Theme = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  muted: '#737373',
  border: '#e5e5e5',
  success: '#22c55e',
  failure: '#ef4444',
  pending: '#eab308',
  cardHeaderBg: '#f8f9fa',
  rowEvenBg: '#ffffff',
  rowOddBg: '#f8f9fa',
};

export const darkTheme: Theme = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  muted: '#a3a3a3',
  border: '#262626',
  success: '#4ade80',
  failure: '#f87171',
  pending: '#facc15',
  cardHeaderBg: '#171717',
  rowEvenBg: '#0a0a0a',
  rowOddBg: '#141414',
};

export function getTheme(themeName: string): Theme {
  return themeName === 'dark' ? darkTheme : lightTheme;
}
