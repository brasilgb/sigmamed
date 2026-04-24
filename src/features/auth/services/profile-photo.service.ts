import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const PROFILE_PHOTO_DIR = `${FileSystem.documentDirectory ?? ''}profile-photos/`;

function getFileExtension(uri: string) {
  const cleanUri = uri.split('?')[0] ?? uri;
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
}

export function isManagedProfilePhotoUri(uri: string | null | undefined) {
  if (!uri || !PROFILE_PHOTO_DIR) {
    return false;
  }

  return uri.startsWith(PROFILE_PHOTO_DIR);
}

export async function persistProfilePhoto(sourceUri: string, userId: number) {
  if (Platform.OS === 'web' || !PROFILE_PHOTO_DIR) {
    return sourceUri;
  }

  await FileSystem.makeDirectoryAsync(PROFILE_PHOTO_DIR, { intermediates: true });

  const extension = getFileExtension(sourceUri);
  const destinationUri = `${PROFILE_PHOTO_DIR}user-${userId}-${Date.now()}.${extension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
}

export async function removeManagedProfilePhoto(uri: string | null | undefined) {
  if (!isManagedProfilePhotoUri(uri)) {
    return;
  }

  try {
    await FileSystem.deleteAsync(uri!, { idempotent: true });
  } catch {
    // Ignore cleanup failures because the DB state is more important than orphan cleanup.
  }
}
