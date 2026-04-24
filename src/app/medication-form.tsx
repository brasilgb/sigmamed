import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { RecordInput } from '@/components/forms/record-input';
import { Colors } from '@/constants/theme';
import { MedicationRepository } from '@/features/medications/medication.repository';
import { MedicationService } from '@/features/medications/services/medication.service';

const medicationRepository = new MedicationRepository();
const medicationService = new MedicationService();

export default function MedicationFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [active, setActive] = useState(true);
  const [scheduledTime, setScheduledTime] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [repeatReminderEveryFiveMinutes, setRepeatReminderEveryFiveMinutes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingId) {
      return;
    }

    medicationRepository.getById(editingId).then((record) => {
      if (!record) {
        return;
      }

      setName(record.name);
      setDosage(record.dosage);
      setInstructions(record.instructions ?? '');
      setActive(record.active);
      setScheduledTime(record.scheduledTime ?? '');
      setReminderEnabled(record.reminderEnabled);
      setRepeatReminderEveryFiveMinutes(record.repeatReminderEveryFiveMinutes);
    });
  }, [editingId]);

  function normalizeTimeInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);

    if (digits.length <= 2) {
      return digits;
    }

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }

  function isValidTime(value: string) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }

  async function handleSubmit() {
    if (!name.trim() || !dosage.trim()) {
      setError('Informe nome e dosagem.');
      return;
    }

    if (reminderEnabled && !isValidTime(scheduledTime)) {
      setError('Informe o horario no formato 08:00 para agendar o lembrete.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        name: name.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim() || null,
        active,
        scheduledTime: isValidTime(scheduledTime) ? scheduledTime : null,
        reminderEnabled,
        repeatReminderEveryFiveMinutes,
        reminderMinutesBefore: 5,
      };
      if (editingId) {
        await medicationService.updateMedication(editingId, payload);
      } else {
        await medicationService.createMedication(payload);
      }
      router.replace('/(tabs)/medications');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar medicacao.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Cadastrar medicacao"
      description={
        editingId
          ? 'Atualize o tratamento salvo e ajuste seus dados de uso.'
          : 'Cadastre a medicacao para acompanhar uso diario, horario e adesao.'
      }>
      <RecordInput
        label="Nome"
        placeholder="Ex.: Losartana"
        value={name}
        onChangeText={setName}
      />
      <RecordInput
        label="Dosagem"
        placeholder="Ex.: 50 mg"
        value={dosage}
        onChangeText={setDosage}
      />
      <RecordInput
        label="Instrucoes"
        placeholder="Ex.: tomar apos o cafe da manha"
        value={instructions}
        onChangeText={setInstructions}
      />
      <RecordInput
        label="Horario da dose"
        placeholder="Ex.: 08:00"
        hint="Use HH:mm para o lembrete tocar 5 minutos antes."
        keyboardType="number-pad"
        value={scheduledTime}
        onChangeText={(value) => setScheduledTime(normalizeTimeInput(value))}
      />
      <View style={styles.preferenceCard}>
        <View style={styles.preferenceCopy}>
          <ThemedText style={styles.preferenceTitle}>Medicação ativa</ThemedText>
          <ThemedText style={styles.preferenceText}>
            Deixe ativa para aparecer no uso diario.
          </ThemedText>
        </View>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View style={styles.preferenceCard}>
        <View style={styles.preferenceCopy}>
          <ThemedText style={styles.preferenceTitle}>Alarme 5 min antes</ThemedText>
          <ThemedText style={styles.preferenceText}>
            Agenda uma notificacao local diaria antes do horario informado.
          </ThemedText>
        </View>
        <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
      </View>
      <View style={styles.preferenceCard}>
        <View style={styles.preferenceCopy}>
          <ThemedText style={styles.preferenceTitle}>Repetir a cada 5 min</ThemedText>
          <ThemedText style={styles.preferenceText}>
            Continua lembrando enquanto a medicacao nao estiver marcada como tomada no dia.
          </ThemedText>
        </View>
        <Switch
          value={repeatReminderEveryFiveMinutes}
          onValueChange={setRepeatReminderEveryFiveMinutes}
        />
      </View>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar medicacao' : 'Salvar medicacao'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}

const styles = StyleSheet.create({
  preferenceCard: {
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceMuted,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  preferenceCopy: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  preferenceText: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: Colors.light.danger,
    lineHeight: 20,
    fontWeight: '600',
  },
});
