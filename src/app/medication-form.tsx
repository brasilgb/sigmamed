import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { ProfileSelector } from '@/components/forms/profile-selector';
import { RecordInput } from '@/components/forms/record-input';
import { Colors } from '@/constants/theme';
import { MedicationRepository } from '@/features/medications/medication.repository';
import { MedicationService } from '@/features/medications/services/medication.service';
import { useProfileSelection } from '@/hooks/use-profile-selection';

const medicationRepository = new MedicationRepository();
const medicationService = new MedicationService();

export default function MedicationFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;
  const dosageRef = useRef<TextInput>(null);
  const instructionsRef = useRef<TextInput>(null);
  const scheduledTimeRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [active, setActive] = useState(true);
  const [scheduledTime, setScheduledTime] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [repeatReminderEveryFiveMinutes, setRepeatReminderEveryFiveMinutes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const profileSelection = useProfileSelection({ enabled: !editingId });

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
      setError('Informe o horário no formato 08:00 para agendar o lembrete.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await profileSelection.applySelectedProfile();
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
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar medicação.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Cadastrar medicação"
      description={
        editingId
          ? 'Atualize o registro salvo e ajuste os dados informados por você.'
          : 'Registre uma medicação já orientada por profissional de saúde para acompanhar uso diário, horário e adesão.'
      }>
      {profileSelection.shouldSelectProfile && !editingId ? (
        <ProfileSelector
          profiles={profileSelection.profiles}
          selectedProfileId={profileSelection.selectedProfileId}
          onChange={profileSelection.setSelectedProfileId}
        />
      ) : null}
      <RecordInput
        label="Nome"
        placeholder="Ex.: Losartana"
        returnKeyType="next"
        value={name}
        onChangeText={setName}
        onSubmitEditing={() => dosageRef.current?.focus()}
      />
      <RecordInput
        ref={dosageRef}
        label="Dosagem"
        placeholder="Ex.: 50 mg"
        returnKeyType="next"
        value={dosage}
        onChangeText={setDosage}
        onSubmitEditing={() => instructionsRef.current?.focus()}
      />
      <RecordInput
        ref={instructionsRef}
        label="Instruções"
        placeholder="Ex.: tomar após o café da manhã"
        returnKeyType="next"
        value={instructions}
        onChangeText={setInstructions}
        onSubmitEditing={() => scheduledTimeRef.current?.focus()}
      />
      <RecordInput
        ref={scheduledTimeRef}
        label="Horário da dose"
        placeholder="Ex.: 08:00"
        hint="Use HH:mm para o lembrete tocar 5 minutos antes."
        keyboardType="number-pad"
        returnKeyType="done"
        value={scheduledTime}
        onChangeText={(value) => setScheduledTime(normalizeTimeInput(value))}
        onSubmitEditing={() => void handleSubmit()}
      />
      <View style={styles.preferenceCard}>
        <View style={styles.preferenceCopy}>
          <ThemedText style={styles.preferenceTitle}>Medicação ativa</ThemedText>
          <ThemedText style={styles.preferenceText}>
            Deixe ativa para aparecer no uso diário.
          </ThemedText>
        </View>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View style={styles.preferenceCard}>
        <View style={styles.preferenceCopy}>
          <ThemedText style={styles.preferenceTitle}>Alarme 5 min antes</ThemedText>
          <ThemedText style={styles.preferenceText}>
            Agenda uma notificação local diária antes do horário informado.
          </ThemedText>
        </View>
        <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
      </View>
      <View style={styles.preferenceCard}>
        <View style={styles.preferenceCopy}>
          <ThemedText style={styles.preferenceTitle}>Repetir a cada 5 min</ThemedText>
          <ThemedText style={styles.preferenceText}>
            Continua lembrando enquanto a medicação não estiver marcada como tomada no dia.
          </ThemedText>
        </View>
        <Switch
          value={repeatReminderEveryFiveMinutes}
          onValueChange={setRepeatReminderEveryFiveMinutes}
        />
      </View>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar medicação' : 'Salvar medicação'}
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
