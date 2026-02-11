export const COLORS = {
  // Core Colors from index.html
  bg: '#1a1a1a',
  bgGradientEnd: '#151515', // 120% point in linear-gradient
  muted: '#9aa3a8',
  card: '#111214',
  accent: '#10b981', // Emerald 500
  danger: '#ef4444', // Red 500

  // Opacities & Glass
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.02)',

  // Text
  text: '#e6eef1',
  textMuted: '#9aa3a8',

  // Specific UI elements
  buttonGradientStart: '#10b981',
  buttonGradientEnd: '#08a76a',

  // Charts
  chartGreen: '#10b981',
  chartGold: '#d4af37',
};

export const GRADIENTS = {
  mainDetails: [COLORS.bg, COLORS.bgGradientEnd] as const, // For Screen Background
  button: [COLORS.buttonGradientStart, COLORS.buttonGradientEnd] as const,
  dangerButton: [COLORS.danger, '#dc2626'] as const,
  card: ['rgba(255,255,255,0.025)', 'rgba(255,255,255,0.01)'] as const,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  // We can add custom fonts later if needed
};
