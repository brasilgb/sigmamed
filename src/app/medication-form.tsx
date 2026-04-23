import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { RecordInput } from '@/components/forms/record-input';
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
        reminderMinutesBefore: 5,
      };
      if (editingId) {
        await medicationService.updateMedication(editingId, payload);
      } else {
        await medicationService.createMedication(payload);
      }
      router.replace('/(tabs)/explore');
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
          ? 'Atualize o tratamento salvo e ajuste se ele continua ativo.'
          : 'Crie a medicação ativa e depois registre as tomadas na tela principal.'
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
        placeholder="Ex.: tomar apos o cafe"
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
      <View
        style={{
          borderRadius: 18,
          backgroundColor: '#f4f8f9',
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText style={{ color: '#17303a', fontWeight: '700' }}>Medicação ativa</ThemedText>
          <ThemedText style={{ color: '#57717a', fontSize: 14, lineHeight: 20 }}>
            Deixe ativa para aparecer no uso diario.
          </ThemedText>
        </View>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View
        style={{
          borderRadius: 18,
          backgroundColor: '#f4f8f9',
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText style={{ color: '#17303a', fontWeight: '700' }}>Alarme 5 min antes</ThemedText>
          <ThemedText style={{ color: '#57717a', fontSize: 14, lineHeight: 20 }}>
            Agenda uma notificacao local diaria antes do horario informado.
          </ThemedText>
        </View>
        <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
      </View>
      {error ? <ThemedText style={{ color: '#b14646' }}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar medicacao' : 'Salvar medicacao'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}
