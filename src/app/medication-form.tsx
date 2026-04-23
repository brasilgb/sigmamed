import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { RecordInput } from '@/components/forms/record-input';
import { MedicationRepository } from '@/features/medications/medication.repository';

const medicationRepository = new MedicationRepository();

export default function MedicationFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [active, setActive] = useState(true);
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
    });
  }, [editingId]);

  async function handleSubmit() {
    if (!name.trim() || !dosage.trim()) {
      setError('Informe nome e dosagem.');
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
      };
      if (editingId) {
        await medicationRepository.updateMedication(editingId, payload);
      } else {
        await medicationRepository.createMedication(payload);
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
      {error ? <ThemedText style={{ color: '#b14646' }}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar medicacao' : 'Salvar medicacao'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}
