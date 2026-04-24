import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { OptionSelector } from '@/components/forms/option-selector';
import { RecordInput } from '@/components/forms/record-input';
import { Colors } from '@/constants/theme';
import { PressureRepository } from '@/features/pressure/pressure.repository';
import type { EntrySource } from '@/types/health';

const pressureRepository = new PressureRepository();

export default function PressureFormScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    systolic?: string;
    diastolic?: string;
    pulse?: string;
    rawText?: string;
  }>();
  const editingId = params.id ? Number(params.id) : null;
  const [systolic, setSystolic] = useState(params.systolic ?? '');
  const [diastolic, setDiastolic] = useState(params.diastolic ?? '');
  const [pulse, setPulse] = useState(params.pulse ?? '');
  const [notes, setNotes] = useState(params.rawText ?? '');
  const [source, setSource] = useState<EntrySource>('manual');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingId) {
      return;
    }

    pressureRepository.getById(editingId).then((record) => {
      if (!record) {
        return;
      }

      setSystolic(String(record.systolic));
      setDiastolic(String(record.diastolic));
      setPulse(record.pulse ? String(record.pulse) : '');
      setNotes(record.notes ?? '');
      setSource(record.source);
    });
  }, [editingId]);

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
      const payload = {
        systolic: systolicValue,
        diastolic: diastolicValue,
        pulse: pulseValue,
        measuredAt: new Date().toISOString(),
        source,
        notes: notes.trim() || null,
      };
      if (editingId) {
        await pressureRepository.update(editingId, payload);
      } else {
        await pressureRepository.create(payload);
      }
      router.replace('/(tabs)/pressure');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar pressao.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Registrar pressao"
      description={
        editingId
          ? 'Ajuste a leitura salva e mantenha o historico correto.'
          : 'Salve a leitura do marcador e mantenha o historico local atualizado.'
      }>
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
      <Pressable
        onPress={() => router.push('/pressure-scan')}
        style={styles.captureCard}>
        <ThemedText style={styles.captureTitle}>Preencher por foto</ThemedText>
        <ThemedText style={styles.captureText}>
          Tire uma foto do visor e confirme os valores detectados.
        </ThemedText>
      </Pressable>
      <RecordInput
        label="Observacoes"
        placeholder="Ex.: apos cafe da manha"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={{ color: '#b14646' }}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar pressao' : 'Salvar pressao'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}

const styles = StyleSheet.create({
  captureCard: {
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 6,
  },
  captureTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  captureText: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
