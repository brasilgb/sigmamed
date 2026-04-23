import { cropImageVariants, type ScanCropMode } from '@/features/ocr/services/image-crop.service';
import { recognizeTextFromImage } from '@/features/ocr/services/ocr.service';
import {
  parseGlicoseFromOcr,
  parsePressureFromOcr,
} from '@/features/ocr/services/reading-parser.service';
import type {
  GlicoseOcrCandidate,
  GlicoseOcrDetection,
  GlicoseOcrResult,
  PressureOcrCandidate,
  PressureOcrDetection,
  PressureOcrResult,
} from '@/features/ocr/types/ocr';

function scorePressure(result: PressureOcrResult) {
  let score = 0;
  const systolic = Number(result.systolic);
  const diastolic = Number(result.diastolic);
  const pulse = Number(result.pulse);
  const raw = result.rawText.toUpperCase();

  if (systolic >= 90 && systolic <= 260) score += 40;
  if (diastolic >= 40 && diastolic <= 160) score += 35;
  if (pulse >= 35 && pulse <= 220) score += 10;
  if (systolic > diastolic) score += 20;
  if (['SYS', 'SIS', 'DIA', 'PUL', 'BPM'].some((keyword) => raw.includes(keyword))) score += 10;

  return score;
}

function scoreGlicose(result: GlicoseOcrResult) {
  let score = 0;
  const glicose = Number(result.glicoseValue);
  const raw = result.rawText.toUpperCase();

  if (glicose >= 60 && glicose <= 300) score += 50;
  else if (glicose >= 40 && glicose <= 600) score += 30;
  if (['MG', 'GLU', 'GLIC', 'GLYC'].some((keyword) => raw.includes(keyword))) score += 20;

  return score;
}

export async function detectPressureFromImage(
  imageUri: string,
  width: number,
  height: number
): Promise<PressureOcrDetection> {
  const variants = await cropImageVariants(imageUri, width, height, 'pressure');
  const candidates: PressureOcrCandidate[] = [];

  for (const variant of variants) {
    const ocr = await recognizeTextFromImage(variant.uri);
    const parsed = parsePressureFromOcr(ocr);
    candidates.push({
      ...parsed,
      score: scorePressure(parsed),
      variant: variant.name,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0] ?? null;
  const preview = variants.find((variant) => variant.name === best?.variant) ?? variants[0] ?? null;
  const systolicSuggestions = Array.from(
    new Set(candidates.map((item) => item.systolic).filter(Boolean))
  ).slice(0, 6);
  const diastolicSuggestions = Array.from(
    new Set(candidates.map((item) => item.diastolic).filter(Boolean))
  ).slice(0, 6);
  const pulseSuggestions = Array.from(
    new Set(candidates.map((item) => item.pulse).filter(Boolean))
  ).slice(0, 6);

  return {
    best,
    previewUri: preview?.uri ?? null,
    candidates,
    systolicSuggestions,
    diastolicSuggestions,
    pulseSuggestions,
  };
}

export async function detectGlicoseFromImage(
  imageUri: string,
  width: number,
  height: number
): Promise<GlicoseOcrDetection> {
  const variants = await cropImageVariants(imageUri, width, height, 'glicose');
  const candidates: GlicoseOcrCandidate[] = [];

  for (const variant of variants) {
    const ocr = await recognizeTextFromImage(variant.uri);
    const parsed = parseGlicoseFromOcr(ocr);
    candidates.push({
      ...parsed,
      score: scoreGlicose(parsed),
      variant: variant.name,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0] ?? null;
  const preview = variants.find((variant) => variant.name === best?.variant) ?? variants[0] ?? null;
  const glicoseSuggestions = Array.from(
    new Set(candidates.map((item) => item.glicoseValue).filter(Boolean))
  ).slice(0, 6);

  return {
    best,
    previewUri: preview?.uri ?? null,
    candidates,
    glicoseSuggestions,
  };
}

export function getScanModeTitle(mode: ScanCropMode) {
  return mode === 'pressure' ? 'pressao' : 'glicose';
}
