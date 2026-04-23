import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { OptionSelector } from '@/components/forms/option-selector';
import { RecordInput } from '@/components/forms/record-input';
import { GlicoseRepository } from '@/features/glicose/glicose.repository';
import type { EntrySource, GlicoseContext } from '@/types/health';

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
  const [source, setSource] = useState<EntrySource>('manual');
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
      setSource(record.source);
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
        source,
        notes: notes.trim() || null,
      };
      if (editingId) {
        await glicoseRepository.update(editingId, payload);
      } else {
        await glicoseRepository.create(payload);
      }
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
      description={
        editingId
          ? 'Ajuste o valor salvo e o contexto da medicao.'
          : 'Mantenha o contexto da medicao para a leitura fazer sentido depois.'
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
      <Pressable
        onPress={() => router.push('/glicose-scan')}
        style={{
          borderRadius: 18,
          backgroundColor: '#ecf4f6',
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}>
        <ThemedText style={{ color: '#17303a', fontWeight: '700' }}>Preencher por foto</ThemedText>
        <ThemedText style={{ color: '#5f747c', fontSize: 14, lineHeight: 20 }}>
          Tire uma foto do visor e confirme a glicose detectada.
        </ThemedText>
      </Pressable>
      <RecordInput
        label="Observacoes"
        placeholder="Ex.: 2h apos o almoco"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={{ color: '#b14646' }}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar glicose' : 'Salvar glicose'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}
