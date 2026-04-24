import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { RecordInput } from '@/components/forms/record-input';
import { Colors } from '@/constants/theme';
import { PressureRepository } from '@/features/pressure/pressure.repository';

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
        source: 'manual' as const,
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
          ? 'Atualize os dados da leitura e mantenha seu historico organizado.'
          : 'Registre a medicao para acompanhar sua pressao com mais clareza.'
      }>
      <View style={styles.row}>
        <View style={styles.field}>
          <RecordInput
            label="Sistolica"
            keyboardType="number-pad"
            placeholder="Ex.: 120"
            value={systolic}
            onChangeText={setSystolic}
          />
        </View>
        <View style={styles.field}>
          <RecordInput
            label="Diastolica"
            keyboardType="number-pad"
            placeholder="Ex.: 80"
            value={diastolic}
            onChangeText={setDiastolic}
          />
        </View>
      </View>
      <RecordInput
        label="Pulso"
        keyboardType="number-pad"
        placeholder="Ex.: 72"
        hint="Opcional. Informe em batimentos por minuto."
        value={pulse}
        onChangeText={setPulse}
      />
      <RecordInput
        label="Observacoes"
        placeholder="Ex.: medicao realizada pela manha"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar pressao' : 'Salvar pressao'}
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
  error: {
    color: Colors.light.danger,
    lineHeight: 20,
    fontWeight: '600',
  },
});
