import { router } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { RecordInput } from '@/components/forms/record-input';
import { WeightRepository } from '@/features/weight/weight.repository';

const weightRepository = new WeightRepository();

export default function WeightFormScreen() {
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const numericValue = Number(weight.replace(',', '.'));

    if (!numericValue) {
      setError('Informe o peso.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await weightRepository.create({
        weight: numericValue,
        unit: 'kg',
        measuredAt: new Date().toISOString(),
        notes: notes.trim() || null,
      });
      router.replace('/(tabs)');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar peso.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Registrar peso"
      description="Registre pesagens frequentes para acompanhar variacao corporal.">
      <RecordInput
        label="Peso"
        keyboardType="decimal-pad"
        placeholder="Ex.: 78.4"
        hint="Unidade: kg"
        value={weight}
        onChangeText={setWeight}
      />
      <RecordInput
        label="Observacoes"
        placeholder="Ex.: pesagem matinal"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={{ color: '#b14646' }}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : 'Salvar peso'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}
