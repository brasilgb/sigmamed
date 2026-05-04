import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { RecordInput } from '@/components/forms/record-input';
import { ThemedText } from '@/components/themed-text';
import { BrandPalette, Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  createAccountProfile,
  getAccountProfileById,
  setActiveAccountProfile,
  updateAccountProfile,
} from '@/features/auth/services/auth.service';

const sexOptions = [
  { label: 'Feminino', value: 'Feminino' },
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Outro', value: 'Outro' },
];

export default function ProfileFormScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;
  const ageRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingId) {
      return;
    }

    getAccountProfileById(editingId).then((profile) => {
      if (!profile) {
        setError('Acompanhado não encontrado.');
        return;
      }

      setFullName(profile.fullName ?? '');
      setAge(profile.age ? String(profile.age) : '');
      setSex(profile.sex ?? '');
      setHeight(profile.height ? String(profile.height) : '');
      setNotes(profile.notes ?? '');
    });
  }, [editingId]);

  async function handleSubmit() {
    if (!user) {
      setError('Conta não encontrada.');
      return;
    }

    const numericAge = Number(age);
    const numericHeight = Number(height);

    if (!fullName.trim()) {
      setError('Informe o nome do acompanhado.');
      return;
    }

    if (!Number.isFinite(numericAge) || numericAge < 1 || numericAge > 130) {
      setError('Informe uma idade válida.');
      return;
    }

    if (!sex) {
      setError('Informe o sexo.');
      return;
    }

    if (!Number.isFinite(numericHeight) || numericHeight < 30 || numericHeight > 250) {
      setError('Informe uma altura válida em centímetros.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const profile = editingId
        ? await updateAccountProfile(editingId, {
            fullName,
            age: numericAge,
            sex,
            height: numericHeight,
            notes,
          })
        : await createAccountProfile({
            userId: user.id,
            fullName,
            age: numericAge,
            sex,
            height: numericHeight,
            notes,
          });

      await setActiveAccountProfile(profile.id);
      router.replace('/profiles');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar acompanhado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title={editingId ? 'Editar acompanhado' : 'Adicionar acompanhado'}
      description={
        editingId
          ? 'Atualize os dados do acompanhado para manter avaliações e relatórios corretos.'
          : 'Cadastre a pessoa acompanhada antes de lançar medições no histórico.'
      }>
      <RecordInput
        label="Nome"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Nome completo"
        returnKeyType="next"
        textContentType="name"
        autoComplete="name"
        onSubmitEditing={() => ageRef.current?.focus()}
      />
      <RecordInput
        ref={ageRef}
        label="Idade em anos"
        value={age}
        onChangeText={(value) => setAge(value.replace(/\D/g, ''))}
        placeholder="Ex.: 68"
        keyboardType="number-pad"
        maxLength={3}
        returnKeyType="next"
        onSubmitEditing={() => heightRef.current?.focus()}
      />
      <View style={styles.optionGroup}>
        <ThemedText style={styles.optionLabel}>Sexo</ThemedText>
        <View style={styles.optionRow}>
          {sexOptions.map((option) => (
            <AuthButton
              key={option.value}
              label={option.label}
              variant="secondary"
              selected={sex === option.value}
              selectedBackgroundColor={BrandPalette.navy}
              selectedTextColor={BrandPalette.white}
              style={styles.optionButton}
              onPress={() => setSex((currentSex) => (currentSex === option.value ? '' : option.value))}
            />
          ))}
        </View>
      </View>
      <RecordInput
        ref={heightRef}
        label="Altura em cm"
        value={height}
        onChangeText={(value) => setHeight(value.replace(/\D/g, ''))}
        placeholder="Ex.: 170"
        keyboardType="number-pad"
        maxLength={3}
        returnKeyType="next"
        onSubmitEditing={() => notesRef.current?.focus()}
      />
      <RecordInput
        ref={notesRef}
        label="Observações"
        value={notes}
        onChangeText={setNotes}
        placeholder="Opcional"
        multiline
        returnKeyType="done"
        onSubmitEditing={() => void handleSubmit()}
      />
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar acompanhado'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}

const styles = StyleSheet.create({
  optionGroup: {
    gap: 8,
  },
  optionLabel: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    minHeight: 44,
    minWidth: '30%',
    flexGrow: 1,
  },
  errorText: {
    color: Colors.light.danger,
    lineHeight: 20,
    fontWeight: '600',
  },
});
