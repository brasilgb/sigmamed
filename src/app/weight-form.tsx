import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { RecordInput } from '@/components/forms/record-input';
import { WeightRepository } from '@/features/weight/weight.repository';
import {
  calculateBodyMassIndex,
  formatHeight,
  normalizeHeightInput,
} from '@/features/weight/weight-utils';

const weightRepository = new WeightRepository();

export default function WeightFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingId) {
      return;
    }

    weightRepository.getById(editingId).then((record) => {
      if (!record) {
        return;
      }

      setWeight(String(record.weight));
      setHeight(record.height ? formatHeight(record.height) ?? '' : '');
      setNotes(record.notes ?? '');
    });
  }, [editingId]);

  const numericWeight = Number(weight.replace(',', '.'));
  const rawHeight = Number(height.replace(',', '.'));
  const numericHeight = normalizeHeightInput(rawHeight);
  const bmi = calculateBodyMassIndex(numericWeight, numericHeight);

  async function handleSubmit() {
    if (!numericWeight) {
      setError('Informe o peso.');
      return;
    }

    if (!numericHeight) {
      setError('Informe a altura.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        weight: numericWeight,
        height: numericHeight,
        unit: 'kg' as const,
        measuredAt: new Date().toISOString(),
        notes: notes.trim() || null,
      };
      if (editingId) {
        await weightRepository.update(editingId, payload);
      } else {
        await weightRepository.create(payload);
      }
      router.replace('/(tabs)/weight');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar peso.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Registrar peso"
      description={
        editingId
          ? 'Ajuste a pesagem salva e mantenha a serie correta.'
          : 'Registre pesagens frequentes para acompanhar variacao corporal.'
      }>
      <View style={styles.row}>
        <View style={styles.field}>
          <RecordInput
            label="Peso"
            keyboardType="decimal-pad"
            placeholder="Ex.: 78.4"
            hint="Unidade: kg"
            value={weight}
            onChangeText={setWeight}
          />
        </View>
        <View style={styles.field}>
          <RecordInput
            label="Altura"
            keyboardType="decimal-pad"
            placeholder="Ex.: 1,72"
            hint="Aceita m ou cm"
            value={height}
            onChangeText={setHeight}
          />
        </View>
      </View>
      {bmi ? (
        <View style={styles.bmiCard}>
          <ThemedText style={styles.bmiLabel}>IMC calculado</ThemedText>
          <ThemedText style={styles.bmiValue}>{bmi.toFixed(1)}</ThemedText>
        </View>
      ) : null}
      <RecordInput
        label="Observacoes"
        placeholder="Ex.: pesagem matinal"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={{ color: '#b14646' }}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar peso' : 'Salvar peso'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  bmiCard: {
    borderRadius: 20,
    padding: 16,
    gap: 4,
    backgroundColor: '#F4F8F3',
  },
  bmiLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#5A6C57',
  },
  bmiValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#243422',
  },
});
