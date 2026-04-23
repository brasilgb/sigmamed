import { CameraCapturedPicture, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { Screen } from '@/components/ui/screen';

type CameraCaptureScreenProps = {
  title: string;
  description: string;
  onCapture: (photo: CameraCapturedPicture) => Promise<void>;
  isProcessing: boolean;
  processingLabel?: string;
  photoUri?: string | null;
  error?: string | null;
  children?: React.ReactNode;
};

export function CameraCaptureScreen({
  title,
  description,
  onCapture,
  isProcessing,
  processingLabel = 'Lendo imagem...',
  photoUri,
  error,
  children,
}: CameraCaptureScreenProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  async function takePhoto() {
    if (!cameraRef.current || isProcessing) {
      return;
    }

    const result = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      shutterSound: false,
    });

    if (result?.uri) {
      await onCapture(result);
    }
  }

  async function pickFromGallery() {
    if (isProcessing) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    await onCapture({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    } as CameraCapturedPicture);
  }

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.infoCard}>
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText style={styles.description}>
            Precisamos da camera para fotografar o visor e tentar ler os valores.
          </ThemedText>
          <AuthButton label="Permitir camera" onPress={() => void requestPermission()} />
          <AuthButton label="Voltar" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.description}>{description}</ThemedText>
      </View>

      <View style={styles.cameraCard}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.overlay}>
          <View style={styles.guide} />
        </View>
      </View>

      <AuthButton
        label={isProcessing ? processingLabel : 'Tirar foto'}
        disabled={isProcessing}
        onPress={() => void takePhoto()}
      />
      <AuthButton
        label="Escolher da galeria"
        variant="secondary"
        disabled={isProcessing}
        onPress={() => void pickFromGallery()}
      />

      {isProcessing ? (
        <View style={styles.processingRow}>
          <ActivityIndicator color="#0f6c73" />
          <ThemedText style={styles.processingText}>{processingLabel}</ThemedText>
        </View>
      ) : null}

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}

      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#e6eef1',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: '#17303a',
    fontWeight: '700',
  },
  title: {
    color: '#17303a',
    lineHeight: 38,
  },
  description: {
    color: '#56707a',
  },
  cameraCard: {
    height: 420,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#d6e1e5',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  guide: {
    width: '82%',
    height: '46%',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.92)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  processingText: {
    color: '#35515a',
  },
  error: {
    color: '#b14646',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    backgroundColor: '#d6e1e5',
  },
  infoCard: {
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 14,
  },
});
