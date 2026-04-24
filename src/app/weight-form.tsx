import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { RecordInput } from '@/components/forms/record-input';
import { BrandPalette, Colors } from '@/constants/theme';
import { WeightRepository } from '@/features/weight/weight.repository';
import {
  calculateBodyMassIndex,
  normalizeHeightInput,
} from '@/features/weight/weight-utils';

const weightRepository = new WeightRepository();

function maskWeightInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 3);
}

function maskHeightInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 3);
}

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

      setWeight(String(Math.round(record.weight)));
      setHeight(record.height ? String(Math.round(record.height * 100)) : '');
      setNotes(record.notes ?? '');
    });
  }, [editingId]);

  const numericWeight = Number(weight);
  const rawHeight = Number(height);
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
          ? 'Atualize a pesagem salva e mantenha sua evolucao em ordem.'
          : 'Registre peso e altura para acompanhar sua evolucao corporal.'
      }>
      <View style={styles.row}>
        <View style={styles.field}>
          <RecordInput
            label="Peso"
            keyboardType="number-pad"
            placeholder="Ex.: 78"
            hint="Unidade: kg. Informe apenas numeros inteiros."
            value={weight}
            maxLength={3}
            onChangeText={(value) => setWeight(maskWeightInput(value))}
          />
        </View>
        <View style={styles.field}>
          <RecordInput
            label="Altura"
            keyboardType="number-pad"
            placeholder="Ex.: 172"
            hint="Informe somente centimetros inteiros."
            value={height}
            maxLength={3}
            onChangeText={(value) => setHeight(maskHeightInput(value))}
          />
        </View>
      </View>
      {bmi ? (
        <View style={styles.bmiCard}>
          <ThemedText style={styles.bmiLabel}>IMC calculado</ThemedText>
          <ThemedText style={styles.bmiValue}>{bmi.toFixed(1)}</ThemedText>
          <ThemedText style={styles.bmiHint}>Calculado automaticamente a partir do peso e da altura informados.</ThemedText>
        </View>
      ) : null}
      <RecordInput
        label="Observacoes"
        placeholder="Ex.: pesagem matinal"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
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
    gap: 6,
    backgroundColor: '#F4F8F3',
    borderWidth: 1,
    borderColor: '#D7E9DB',
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    lineHeight: 34,
    fontWeight: '800',
    color: '#243422',
  },
  bmiHint: {
    color: '#5A6C57',
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: Colors.light.danger,
    lineHeight: 20,
    fontWeight: '600',
  },
});
