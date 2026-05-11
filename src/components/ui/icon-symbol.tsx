// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'heart.text.square.fill': 'monitor-heart',
  'document.text.fill': 'description',
  'list.bullet.rectangle.fill': 'view-list',
  'waveform.path.ecg': 'monitor-heart',
  'drop.fill': 'water-drop',
  'scalemass.fill': 'monitor-weight',
  'pills.fill': 'medication',
  'plus.circle.fill': 'add-circle',
  'lock.fill': 'lock',
  'rectangle.portrait.and.arrow.right.fill': 'logout',
  'gearshape.fill': 'settings',
  'cloud.fill': 'cloud',
  'qrcode': 'qr-code',
  'wifi.slash': 'wifi-off',
  'arrow.triangle.2.circlepath': 'sync',
  'person.2.fill': 'group',
  'person.crop.circle.fill.badge.plus': 'person-add',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  'chart.line.uptrend.xyaxis': 'show-chart',
  'star.fill': 'star',
  'star': 'star-border',
  'checkmark.circle.fill': 'check-circle',
  'questionmark.circle.fill': 'help',
} satisfies Record<string, MaterialIconName>;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
