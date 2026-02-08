/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { COLORS } from '@/constants/theme';

// Simplified hook since app uses dark theme exclusively
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof COLORS
) {
  const colorFromProps = props.dark; // Always use dark mode

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return COLORS[colorName] as string;
  }
}
