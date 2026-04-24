/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const BrandPalette = {
  primary: '#0E9F8C',
  navy: '#102532',
  navySoft: '#1D4456',
  pressureSoft: '#DCEEFF',
  weightSoft: '#DCF4E8',
  medicationSoft: '#ECE5FF',
  mist: '#F1F6F8',
  white: '#FFFFFF',
} as const;

export const ModulePalette = {
  pressure: {
    base: BrandPalette.navy,
    soft: BrandPalette.pressureSoft,
  },
  glicose: {
    base: '#284E99',
    soft: '#DCE8FF',
  },
  weight: {
    base: '#137B62',
    soft: BrandPalette.weightSoft,
  },
  medication: {
    base: '#6146A8',
    soft: BrandPalette.medicationSoft,
  },
} as const;

const semanticLight = {
  text: BrandPalette.navy,
  textMuted: '#2F4753',
  textSoft: '#4E6671',
  background: '#F3F8F9',
  surface: BrandPalette.white,
  surfaceMuted: '#EAF2F4',
  border: '#CBDADF',
  tint: BrandPalette.primary,
  icon: '#5B717B',
  tabIconDefault: '#5B717B',
  tabIconSelected: BrandPalette.primary,
  success: '#137B62',
  warning: '#B67915',
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

export const Radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
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
  cardBorder: '#D6E2E6',
  cardSubtle: '#F7FAFB',
  shadow: 'rgba(13, 27, 42, 0.08)',
} as const;

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
