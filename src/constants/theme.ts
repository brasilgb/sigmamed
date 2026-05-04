/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const BrandPalette = {
  primary: '#2563EB',
  wellness: '#10B981',
  cyan: '#06B6D4',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  pressure: '#EF4444',
  navy: '#1E293B',
  deepNavy: '#061B3A',
  navySoft: '#334155',
  neutral: '#64748B',
  pressureSoft: '#FEE2E2',
  weightSoft: '#D1FAE5',
  medicationSoft: '#FFF4E0',
  mist: '#F8FAFC',
  white: '#FFFFFF',
} as const;

export const ModulePalette = {
  pressure: {
    base: BrandPalette.pressure,
    soft: BrandPalette.pressureSoft,
  },
  glicose: {
    base: '#2563EB',
    soft: '#DCE8FF',
  },
  weight: {
    base: BrandPalette.purple,
    soft: '#F0E9FF',
  },
  medication: {
    base: BrandPalette.orange,
    soft: BrandPalette.medicationSoft,
  },
} as const;

const semanticLight = {
  text: BrandPalette.deepNavy,
  textMuted: BrandPalette.neutral,
  textSoft: '#94A3B8',
  background: '#F5F7FB',
  surface: BrandPalette.white,
  surfaceMuted: '#F1F6FD',
  border: '#E2E8F0',
  tint: BrandPalette.primary,
  icon: BrandPalette.neutral,
  tabIconDefault: BrandPalette.neutral,
  tabIconSelected: BrandPalette.primary,
  success: BrandPalette.wellness,
  warning: '#B67915',
  danger: '#B14646',
};

const semanticDark = {
  text: '#F8FAFC',
  textMuted: '#CBD5E1',
  textSoft: '#94A3B8',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceMuted: '#334155',
  border: '#475569',
  tint: BrandPalette.primary,
  icon: '#CBD5E1',
  tabIconDefault: '#CBD5E1',
  tabIconSelected: BrandPalette.primary,
  success: BrandPalette.wellness,
  warning: '#F0BE5A',
  danger: '#F08A84',
};

export const Colors = {
  light: semanticLight,
  dark: semanticDark,
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const Space = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 22,
} as const;

export const Surface = {
  cardBorder: '#E2E8F0',
  cardSubtle: '#F8FAFC',
  shadow: 'rgba(6, 27, 58, 0.08)',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'Poppins_400Regular',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'Poppins_600SemiBold',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Poppins_400Regular',
    serif: 'serif',
    rounded: 'Poppins_600SemiBold',
    mono: 'monospace',
  },
  web: {
    sans: "Poppins_400Regular, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
