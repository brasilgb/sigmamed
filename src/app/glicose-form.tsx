import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { OptionSelector } from '@/components/forms/option-selector';
import { RecordInput } from '@/components/forms/record-input';
import { Colors } from '@/constants/theme';
import { GlicoseRepository } from '@/features/glicose/glicose.repository';
import type { GlicoseContext } from '@/types/health';

const glicoseRepository = new GlicoseRepository();

export default function GlicoseFormScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    glicoseValue?: string;
    rawText?: string;
  }>();
  const editingId = params.id ? Number(params.id) : null;
  const [glicoseValue, setGlicoseValue] = useState(params.glicoseValue ?? '');
  const [notes, setNotes] = useState(params.rawText ?? '');
  const [context, setContext] = useState<GlicoseContext>('fasting');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingId) {
      return;
    }

    glicoseRepository.getById(editingId).then((record) => {
      if (!record) {
        return;
      }

      setGlicoseValue(String(record.glicoseValue));
      setNotes(record.notes ?? '');
      setContext(record.context);
    });
  }, [editingId]);

  async function handleSubmit() {
    const numericValue = Number(glicoseValue);

    if (!numericValue) {
      setError('Informe a glicose.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        glicoseValue: numericValue,
        unit: 'mg/dL' as const,
        context,
        measuredAt: new Date().toISOString(),
        source: 'manual' as const,
        notes: notes.trim() || null,
      };
      if (editingId) {
        await glicoseRepository.update(editingId, payload);
      } else {
        await glicoseRepository.create(payload);
      }
      router.replace('/(tabs)/glicose');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar glicose.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Registrar glicose"
      description={
        editingId
          ? 'Atualize o valor salvo e ajuste o contexto da medição.'
          : 'Registre a glicose com contexto para facilitar a leitura do histórico.'
      }>
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
          { label: 'Pós-refeição', value: 'post_meal' },
          { label: 'Aleatória', value: 'random' },
        ]}
      />
      <RecordInput
        label="Observações"
        placeholder="Ex.: medição realizada 2h após o almoço"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar glicose' : 'Salvar glicose'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}

const styles = StyleSheet.create({
  error: {
    color: Colors.light.danger,
    lineHeight: 20,
    fontWeight: '600',
  },
});
