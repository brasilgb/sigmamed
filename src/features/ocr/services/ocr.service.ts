import type { OcrText } from '@/features/ocr/types/ocr';

export async function recognizeTextFromImage(imageUri: string): Promise<OcrText> {
  try {
    const module = await import('@infinitered/react-native-mlkit-text-recognition');
    return (await module.recognizeText(imageUri)) as OcrText;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `${error.message}. OCR precisa de development build com modulo nativo instalado.`
        : 'OCR indisponivel neste ambiente. Use um development build.'
    );
  }
}
