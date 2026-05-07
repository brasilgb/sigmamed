import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { FormShell } from '@/components/forms/form-shell';
import { MeasurementDatePicker } from '@/components/forms/measurement-date-picker';
import { ProfileSelector } from '@/components/forms/profile-selector';
import { RecordInput } from '@/components/forms/record-input';
import { BrandPalette, Colors } from '@/constants/theme';
import { getActiveAccountProfile } from '@/features/auth/services/auth.service';
import { WeightRepository } from '@/features/weight/weight.repository';
import { calculateBodyMassIndex, formatHeight, normalizeHeightInput } from '@/features/weight/weight-utils';
import { useProfileSelection } from '@/hooks/use-profile-selection';

const weightRepository = new WeightRepository();

function maskWeightInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 3);
}

export default function WeightFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;
  const [weight, setWeight] = useState('');
  const [profileHeight, setProfileHeight] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [measuredAt, setMeasuredAt] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const profileSelection = useProfileSelection({ enabled: !editingId });

  useEffect(() => {
    if (profileSelection.shouldSelectProfile) {
      const selectedProfile = profileSelection.profiles.find(
        (profile) => profile.id === profileSelection.selectedProfileId
      );

      setProfileHeight(selectedProfile?.height ?? null);
      return;
    }

    getActiveAccountProfile()
      .then((profile) => {
        setProfileHeight(profile?.height ?? null);
      })
      .catch(() => {
        setProfileHeight(null);
      });
  }, [profileSelection.profiles, profileSelection.selectedProfileId, profileSelection.shouldSelectProfile]);

  useEffect(() => {
    if (!editingId) {
      return;
    }

    weightRepository.getById(editingId).then((record) => {
      if (!record) {
        return;
      }

      setWeight(String(Math.round(record.weight)));
      setProfileHeight((currentHeight) => currentHeight ?? record.height);
      setNotes(record.notes ?? '');
      setMeasuredAt(new Date(record.measuredAt));
    });
  }, [editingId]);

  const numericWeight = Number(weight);
  const normalizedProfileHeight = profileHeight ? normalizeHeightInput(profileHeight) : null;
  const bmi = calculateBodyMassIndex(numericWeight, normalizedProfileHeight);
  const formattedHeight = formatHeight(normalizedProfileHeight);

  async function handleSubmit() {
    if (!numericWeight) {
      setError('Informe o peso.');
      return;
    }

    if (!normalizedProfileHeight) {
      setError('Cadastre a altura do perfil ativo antes de registrar peso.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await profileSelection.applySelectedProfile();
      const payload = {
        weight: numericWeight,
        height: normalizedProfileHeight,
        unit: 'kg' as const,
        measuredAt: measuredAt.toISOString(),
        notes: notes.trim() || null,
      };
      if (editingId) {
        await weightRepository.update(editingId, payload);
      } else {
        await weightRepository.create(payload);
      }
      router.replace('/(tabs)/weight');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao salvar peso.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormShell
      title="Registrar peso"
      description={
        editingId
          ? 'Atualize a pesagem salva e mantenha sua evolução em ordem.'
          : 'Registre o peso para acompanhar sua evolução corporal.'
      }>
      {profileSelection.shouldSelectProfile && !editingId ? (
        <ProfileSelector
          profiles={profileSelection.profiles}
          selectedProfileId={profileSelection.selectedProfileId}
          onChange={profileSelection.setSelectedProfileId}
        />
      ) : null}
      <RecordInput
        label="Peso"
        keyboardType="number-pad"
        placeholder="Ex.: 78"
        hint="Unidade: kg. Informe apenas numeros inteiros."
        value={weight}
        maxLength={3}
        onChangeText={(value) => setWeight(maskWeightInput(value))}
      />
      {bmi ? (
        <View style={styles.bmiCard}>
          <ThemedText style={styles.bmiLabel}>IMC calculado</ThemedText>
          <ThemedText style={styles.bmiValue}>{bmi.toFixed(1)}</ThemedText>
          <ThemedText style={styles.bmiHint}>
            Calculado automaticamente com a altura do perfil ativo{formattedHeight ? `: ${formattedHeight} m.` : '.'}
          </ThemedText>
        </View>
      ) : null}
      <MeasurementDatePicker value={measuredAt} onChange={setMeasuredAt} />
      <RecordInput
        label="Observações"
        placeholder="Ex.: pesagem matinal"
        value={notes}
        onChangeText={setNotes}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando...' : editingId ? 'Atualizar peso' : 'Salvar peso'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </FormShell>
  );
}

const styles = StyleSheet.create({
  bmiCard: {
    borderRadius: 20,
    padding: 16,
    gap: 6,
    backgroundColor: '#F4F8F3',
    borderWidth: 1,
    borderColor: '#D7E9DB',
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  bmiLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#5A6C57',
  },
  bmiValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#243422',
  },
  bmiHint: {
    color: '#5A6C57',
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: Colors.light.danger,
    lineHeight: 20,
    fontWeight: '600',
  },
});
