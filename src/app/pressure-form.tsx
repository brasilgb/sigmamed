import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { MeasurementDatePicker } from '@/components/forms/measurement-date-picker';
import { ProfileSelector } from '@/components/forms/profile-selector';
import { RecordInput } from '@/components/forms/record-input';
import { Colors } from '@/constants/theme';
import { PressureRepository } from '@/features/pressure/pressure.repository';
import { useProfileSelection } from '@/hooks/use-profile-selection';

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
  const [measuredAt, setMeasuredAt] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const profileSelection = useProfileSelection({ enabled: !editingId });

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
      setMeasuredAt(new Date(record.measuredAt));
    });
  }, [editingId]);

  async function handleSubmit() {
    const systolicValue = Number(systolic);
    const diastolicValue = Number(diastolic);
    const pulseValue = pulse ? Number(pulse) : null;

    if (!systolicValue || !diastolicValue) {
      setError('Informe sistólica e diastólica.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await profileSelection.applySelectedProfile();
      const payload = {
        systolic: systolicValue,
        diastolic: diastolicValue,
        pulse: pulseValue,
        measuredAt: measuredAt.toISOString(),
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
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar pressão.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Registrar pressão"
      description={
        editingId
          ? 'Atualize os dados da leitura e mantenha seu histórico organizado.'
          : 'Registre a medição para acompanhar sua pressão com mais clareza.'
      }>
      {profileSelection.shouldSelectProfile && !editingId ? (
        <ProfileSelector
          profiles={profileSelection.profiles}
          selectedProfileId={profileSelection.selectedProfileId}
          onChange={profileSelection.setSelectedProfileId}
        />
      ) : null}
      <View style={styles.row}>
        <View style={styles.field}>
          <RecordInput
            label="Sistólica"
            keyboardType="number-pad"
            placeholder="Ex.: 120"
            value={systolic}
            onChangeText={setSystolic}
          />
        </View>
        <View style={styles.field}>
          <RecordInput
            label="Diastólica"
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
      <MeasurementDatePicker value={measuredAt} onChange={setMeasuredAt} />
      <RecordInput
        label="Observações"
        placeholder="Ex.: medição realizada pela manhã"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar pressão' : 'Salvar pressão'}
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
