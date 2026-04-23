import type { CameraCapturedPicture } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { CameraCaptureScreen } from '@/components/ocr/camera-capture-screen';
import { ValueSuggestions } from '@/components/ocr/value-suggestions';
import { Colors } from '@/constants/theme';
import { detectPressureFromImage } from '@/features/ocr/services/ocr-reading-workflow.service';
import type { PressureOcrCandidate } from '@/features/ocr/types/ocr';

export default function PressureScanScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PressureOcrCandidate | null>(null);
  const [candidateCount, setCandidateCount] = useState(0);
  const [systolicSuggestions, setSystolicSuggestions] = useState<string[]>([]);
  const [diastolicSuggestions, setDiastolicSuggestions] = useState<string[]>([]);
  const [pulseSuggestions, setPulseSuggestions] = useState<string[]>([]);

  async function handleCapture(photo: CameraCapturedPicture) {
    try {
      setIsProcessing(true);
      setError(null);
      const detection = await detectPressureFromImage(photo.uri, photo.width, photo.height);
      setPhotoUri(detection.previewUri);
      setResult(detection.best);
      setCandidateCount(detection.candidates.length);
      setSystolicSuggestions(detection.systolicSuggestions);
      setDiastolicSuggestions(detection.diastolicSuggestions);
      setPulseSuggestions(detection.pulseSuggestions);

      if (!detection.best?.systolic || !detection.best?.diastolic) {
        setError('Nao conseguimos detectar sistolica e diastolica com confianca. Revise manualmente.');
      }
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : 'Falha ao ler a imagem.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <CameraCaptureScreen
      title="Ler pressao pela camera"
      description="Centralize o visor dentro da moldura, tire a foto e confirme os numeros antes de salvar."
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
            Valores detectados
          </ThemedText>
          <ThemedText style={{ color: Colors.light.textMuted }}>
            Sistolica: {result.systolic || 'nao detectada'}
          </ThemedText>
          <ThemedText style={{ color: Colors.light.textMuted }}>
            Diastolica: {result.diastolic || 'nao detectada'}
          </ThemedText>
          <ThemedText style={{ color: Colors.light.textMuted }}>
            Pulso: {result.pulse || 'nao detectado'}
          </ThemedText>
          <ValueSuggestions
            label="Trocar sistolica"
            values={systolicSuggestions}
            selected={result.systolic}
            onSelect={(value) => setResult((current) => (current ? { ...current, systolic: value } : current))}
          />
          <ValueSuggestions
            label="Trocar diastolica"
            values={diastolicSuggestions}
            selected={result.diastolic}
            onSelect={(value) => setResult((current) => (current ? { ...current, diastolic: value } : current))}
          />
          <ValueSuggestions
            label="Trocar pulso"
            values={pulseSuggestions}
            selected={result.pulse}
            onSelect={(value) => setResult((current) => (current ? { ...current, pulse: value } : current))}
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
                pathname: '/pressure-form',
                params: {
                  systolic: result.systolic,
                  diastolic: result.diastolic,
                  pulse: result.pulse,
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
