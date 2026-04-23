import { router } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { OptionSelector } from '@/components/forms/option-selector';
import { RecordInput } from '@/components/forms/record-input';
import { PressureRepository } from '@/features/pressure/pressure.repository';
import type { EntrySource } from '@/types/health';

const pressureRepository = new PressureRepository();

export default function PressureFormScreen() {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<EntrySource>('manual');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const systolicValue = Number(systolic);
    const diastolicValue = Number(diastolic);
    const pulseValue = pulse ? Number(pulse) : null;

    if (!systolicValue || !diastolicValue) {
      setError('Informe sistolica e diastolica.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await pressureRepository.create({
        systolic: systolicValue,
        diastolic: diastolicValue,
        pulse: pulseValue,
        measuredAt: new Date().toISOString(),
        source,
        notes: notes.trim() || null,
      });
      router.replace('/(tabs)');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar pressao.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Registrar pressao"
      description="Salve a leitura do marcador e mantenha o historico local atualizado.">
      <RecordInput
        label="Sistolica"
        keyboardType="number-pad"
        placeholder="Ex.: 120"
        value={systolic}
        onChangeText={setSystolic}
      />
      <RecordInput
        label="Diastolica"
        keyboardType="number-pad"
        placeholder="Ex.: 80"
        value={diastolic}
        onChangeText={setDiastolic}
      />
      <RecordInput
        label="Pulso"
        keyboardType="number-pad"
        placeholder="Ex.: 72"
        hint="Opcional"
        value={pulse}
        onChangeText={setPulse}
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
        placeholder="Ex.: apos cafe da manha"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={{ color: '#b14646' }}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : 'Salvar pressao'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}
