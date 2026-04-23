export type OcrText = {
  text: string;
  blocks: {
    text: string;
    frame: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    };
    lines: {
      text: string;
      frame: {
        left: number;
        top: number;
        right: number;
        bottom: number;
      };
    }[];
  }[];
};

export type PressureOcrResult = {
  systolic: string;
  diastolic: string;
  pulse: string;
  rawText: string;
};

export type GlicoseOcrResult = {
  glicoseValue: string;
  rawText: string;
};

export type PressureOcrCandidate = PressureOcrResult & {
  score: number;
  variant: string;
};

export type GlicoseOcrCandidate = GlicoseOcrResult & {
  score: number;
  variant: string;
};

export type PressureOcrDetection = {
  best: PressureOcrCandidate | null;
  previewUri: string | null;
  candidates: PressureOcrCandidate[];
  systolicSuggestions: string[];
  diastolicSuggestions: string[];
  pulseSuggestions: string[];
};

export type GlicoseOcrDetection = {
  best: GlicoseOcrCandidate | null;
  previewUri: string | null;
  candidates: GlicoseOcrCandidate[];
  glicoseSuggestions: string[];
};
