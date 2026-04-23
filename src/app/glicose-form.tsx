import { router } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { OptionSelector } from '@/components/forms/option-selector';
import { RecordInput } from '@/components/forms/record-input';
import { GlicoseRepository } from '@/features/glicose/glicose.repository';
import type { EntrySource, GlicoseContext } from '@/types/health';

const glicoseRepository = new GlicoseRepository();

export default function GlicoseFormScreen() {
  const [glicoseValue, setGlicoseValue] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<EntrySource>('manual');
  const [context, setContext] = useState<GlicoseContext>('fasting');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const numericValue = Number(glicoseValue);

    if (!numericValue) {
      setError('Informe a glicose.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await glicoseRepository.create({
        glicoseValue: numericValue,
        unit: 'mg/dL',
        context,
        measuredAt: new Date().toISOString(),
        source,
        notes: notes.trim() || null,
      });
      router.replace('/(tabs)');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar glicose.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Registrar glicose"
      description="Mantenha o contexto da medicao para a leitura fazer sentido depois.">
      <RecordInput
        label="Glicose"
        keyboardType="number-pad"
        placeholder="Ex.: 98"
        hint="Unidade: mg/dL"
        value={glicoseValue}
        onChangeText={setGlicoseValue}
      />
      <OptionSelector
        label="Contexto"
        value={context}
        onChange={setContext}
        options={[
          { label: 'Jejum', value: 'fasting' },
          { label: 'Pos-refeicao', value: 'post_meal' },
          { label: 'Aleatoria', value: 'random' },
        ]}
      />
      <OptionSelector
        label="Origem da leitura"
        value={source}
        onChange={setSource}
        options={[
          { label: 'Manual', value: 'manual' },
          { label: 'Foto', value: 'photo' },
          { label: 'Bluetooth', value: 'bluetooth' },
        ]}
      />
      <RecordInput
        label="Observacoes"
        placeholder="Ex.: 2h apos o almoco"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={{ color: '#b14646' }}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : 'Salvar glicose'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}
