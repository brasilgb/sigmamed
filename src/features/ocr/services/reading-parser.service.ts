import type { GlicoseOcrResult, OcrText, PressureOcrResult } from '@/features/ocr/types/ocr';

type PositionedNumber = {
  text: string;
  value: number;
  top: number;
  left: number;
  area: number;
};

type OcrLine = {
  text: string;
  normalizedText: string;
  top: number;
  left: number;
  area: number;
  numbers: PositionedNumber[];
};

function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function extractNumbers(ocr: OcrText) {
  const positioned: PositionedNumber[] = [];
  const lines: OcrLine[] = [];
  const text = ocr.text ?? '';

  for (const block of ocr.blocks ?? []) {
    for (const line of block.lines ?? []) {
      const matches = line.text.match(/\d{2,3}(?:[.,]\d)?/g) ?? [];
      const currentNumbers: PositionedNumber[] = [];

      for (const match of matches) {
        const normalized = match.replace(',', '.');
        const numeric = Number(normalized);

        if (!Number.isFinite(numeric)) {
          continue;
        }

        const candidate = {
          text: match,
          value: numeric,
          top: line.frame.top,
          left: line.frame.left,
          area: Math.max((line.frame.right - line.frame.left) * (line.frame.bottom - line.frame.top), 1),
        };

        positioned.push(candidate);
        currentNumbers.push(candidate);
      }

      lines.push({
        text: line.text,
        normalizedText: normalizeText(line.text),
        top: line.frame.top,
        left: line.frame.left,
        area: Math.max((line.frame.right - line.frame.left) * (line.frame.bottom - line.frame.top), 1),
        numbers: currentNumbers,
      });
    }
  }

  return { positioned, lines, text };
}

function getKeywordMatch(lines: OcrLine[], keywords: string[], min: number, max: number) {
  const lineMatch = lines.find(
    (line) =>
      keywords.some((keyword) => line.normalizedText.includes(keyword)) &&
      line.numbers.some((item) => item.value >= min && item.value <= max)
  );

  return lineMatch?.numbers.find((item) => item.value >= min && item.value <= max) ?? null;
}

export function parsePressureFromOcr(ocr: OcrText): PressureOcrResult {
  const { positioned, lines, text } = extractNumbers(ocr);
  const candidates = positioned
    .filter((item) => item.value >= 30 && item.value <= 260)
    .sort((a, b) => a.top - b.top || b.area - a.area || a.left - b.left);

  const unique = Array.from(
    new Map(candidates.map((item) => [`${item.value}-${Math.round(item.top)}-${Math.round(item.left)}`, item])).values()
  );

  const groupedTop = [...unique].sort((a, b) => a.top - b.top || b.area - a.area);
  const largeNumbers = [...unique]
    .filter((item) => item.value >= 40 && item.value <= 260)
    .sort((a, b) => b.area - a.area || a.top - b.top);

  const systolicByLabel = getKeywordMatch(lines, ['SYS', 'SIS', 'MAX'], 90, 260);
  const diastolicByLabel = getKeywordMatch(lines, ['DIA', 'MIN'], 40, 160);
  const pulseByLabel = getKeywordMatch(lines, ['PUL', 'PULSE', 'PR', 'BPM'], 35, 220);

  const systolic =
    systolicByLabel ??
    groupedTop.find((item) => item.value >= 90 && item.value <= 260) ??
    largeNumbers.find((item) => item.value >= 90 && item.value <= 260);

  const diastolic =
    diastolicByLabel ??
    groupedTop.find((item) => item !== systolic && item.value >= 40 && item.value <= 160) ??
    largeNumbers.find((item) => item !== systolic && item.value >= 40 && item.value <= 160);

  const pulse =
    pulseByLabel ??
    unique
      .filter((item) => item !== systolic && item !== diastolic && item.value >= 35 && item.value <= 220)
      .sort((a, b) => a.top - b.top || a.left - b.left)[0] ?? null;

  return {
    systolic: systolic ? String(Math.round(systolic.value)) : '',
    diastolic: diastolic ? String(Math.round(diastolic.value)) : '',
    pulse: pulse ? String(Math.round(pulse.value)) : '',
    rawText: text,
  };
}

export function parseGlicoseFromOcr(ocr: OcrText): GlicoseOcrResult {
  const { positioned, lines, text } = extractNumbers(ocr);
  const candidates = positioned.filter((item) => item.value >= 40 && item.value <= 600);

  const linePreferred =
    lines
      .filter(
        (line) =>
          ['MG', 'GLU', 'GLIC', 'GLYC'].some((keyword) => line.normalizedText.includes(keyword)) &&
          line.numbers.some((item) => item.value >= 40 && item.value <= 600)
      )
      .sort((a, b) => b.area - a.area || a.top - b.top)[0]
      ?.numbers.sort((a, b) => b.area - a.area || a.left - b.left)[0] ?? null;

  const preferred =
    linePreferred ??
    candidates
      .filter((item) => item.value >= 60 && item.value <= 300)
      .sort((a, b) => b.area - a.area || a.top - b.top || a.left - b.left)[0] ??
    candidates.sort((a, b) => b.area - a.area || a.top - b.top)[0];

  return {
    glicoseValue: preferred ? String(Math.round(preferred.value)) : '',
    rawText: text,
  };
}
