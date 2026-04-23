import type { CameraCapturedPicture } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { CameraCaptureScreen } from '@/components/ocr/camera-capture-screen';
import { ValueSuggestions } from '@/components/ocr/value-suggestions';
import { Colors } from '@/constants/theme';
import { detectGlicoseFromImage } from '@/features/ocr/services/ocr-reading-workflow.service';
import type { GlicoseOcrCandidate } from '@/features/ocr/types/ocr';

export default function GlicoseScanScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<GlicoseOcrCandidate | null>(null);
  const [candidateCount, setCandidateCount] = useState(0);
  const [glicoseSuggestions, setGlicoseSuggestions] = useState<string[]>([]);

  async function handleCapture(photo: CameraCapturedPicture) {
    try {
      setIsProcessing(true);
      setError(null);
      const detection = await detectGlicoseFromImage(photo.uri, photo.width, photo.height);
      setPhotoUri(detection.previewUri);
      setResult(detection.best);
      setCandidateCount(detection.candidates.length);
      setGlicoseSuggestions(detection.glicoseSuggestions);

      if (!detection.best?.glicoseValue) {
        setError('Nao conseguimos detectar a glicose com confianca. Revise manualmente.');
      }
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : 'Falha ao ler a imagem.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <CameraCaptureScreen
      title="Ler glicose pela camera"
      description="Fotografe o visor e revise o valor sugerido antes de salvar no historico."
      onCapture={handleCapture}
      isProcessing={isProcessing}
      photoUri={photoUri}
      error={error}>
      {result ? (
        <View
          style={{
            borderRadius: 24,
            backgroundColor: Colors.light.surface,
            padding: 18,
            gap: 10,
          }}>
          <ThemedText type="subtitle" style={{ color: Colors.light.text }}>
            Valor detectado
          </ThemedText>
          <ThemedText style={{ color: Colors.light.textMuted }}>
            Glicose: {result.glicoseValue ? `${result.glicoseValue} mg/dL` : 'nao detectada'}
          </ThemedText>
          <ValueSuggestions
            label="Trocar valor"
            values={glicoseSuggestions}
            selected={result.glicoseValue}
            onSelect={(value) =>
              setResult((current) => (current ? { ...current, glicoseValue: value } : current))
            }
          />
          <ThemedText style={{ color: Colors.light.textMuted, fontSize: 13, lineHeight: 18 }}>
            Melhor leitura: {result.variant} · score {result.score} · {candidateCount} tentativas
          </ThemedText>
          <ThemedText style={{ color: Colors.light.textSoft, fontSize: 13, lineHeight: 18 }}>
            OCR bruto: {result.rawText || 'sem texto reconhecido'}
          </ThemedText>
          <AuthButton
            label="Usar no formulario"
            onPress={() =>
              router.replace({
                pathname: '/glicose-form',
                params: {
                  glicoseValue: result.glicoseValue,
                  rawText: result.rawText,
                },
              })
            }
          />
        </View>
      ) : null}
    </CameraCaptureScreen>
  );
}
