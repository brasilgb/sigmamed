import type { GlicoseContext } from '@/types/health';

const glicoseContextLabels: Record<GlicoseContext, string> = {
  fasting: 'Jejum',
  post_meal: 'Pós-refeição',
  random: 'Aleatória',
};

export function formatGlicoseContext(context: GlicoseContext) {
  return glicoseContextLabels[context] ?? context;
}
