/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const BrandPalette = {
  primary: '#00BFA5',
  navy: '#0D1B2A',
  pressureSoft: '#E6F7FF',
  weightSoft: '#E8F9F1',
  medicationSoft: '#F1E6FF',
  white: '#FFFFFF',
} as const;

export const ModulePalette = {
  pressure: {
    base: BrandPalette.navy,
    soft: BrandPalette.pressureSoft,
  },
  glicose: {
    base: '#21438F',
    soft: '#DCEBFF',
  },
  weight: {
    base: '#0F8A6A',
    soft: BrandPalette.weightSoft,
  },
  medication: {
    base: '#5B3FA8',
    soft: BrandPalette.medicationSoft,
  },
} as const;

const semanticLight = {
  text: BrandPalette.navy,
  textMuted: '#58717A',
  textSoft: '#6F858D',
  background: '#F7FBFC',
  surface: BrandPalette.white,
  surfaceMuted: '#EEF6F8',
  border: '#D7E4E8',
  tint: BrandPalette.primary,
  icon: '#688089',
  tabIconDefault: '#688089',
  tabIconSelected: BrandPalette.primary,
  success: '#0F8A6A',
  warning: '#C58A1A',
  danger: '#B14646',
};

const semanticDark = {
  text: '#ECEDEE',
  textMuted: '#B8C4CA',
  textSoft: '#90A0A8',
  background: '#08131D',
  surface: '#10202D',
  surfaceMuted: '#132635',
  border: '#223748',
  tint: BrandPalette.primary,
  icon: '#8CA0AA',
  tabIconDefault: '#8CA0AA',
  tabIconSelected: BrandPalette.primary,
  success: '#33C48A',
  warning: '#F0BE5A',
  danger: '#F08A84',
};

export const Colors = {
  light: semanticLight,
  dark: semanticDark,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
