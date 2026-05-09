import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, ModulePalette } from '@/constants/theme';
import { useProfilePhotoSource } from '@/features/auth/hooks/use-profile-photo-source';

type ProfileAvatarProps = {
  name: string;
  photoUri?: string | null;
  size?: number;
};

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'MC'
  );
}

export function ProfileAvatar({ name, photoUri, size = 56 }: ProfileAvatarProps) {
  const photoSource = useProfilePhotoSource(photoUri);
  const initials = getInitials(name);

  if (photoSource.uri) {
    return (
      <Image
        source={{ uri: photoSource.uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        onError={photoSource.onError}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <ThemedText style={[styles.initials, { fontSize: Math.max(18, size * 0.32), lineHeight: Math.max(20, size * 0.36) }]}>
        {initials}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: ModulePalette.medication.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.light.surface,
    fontWeight: '800',
  },
});
