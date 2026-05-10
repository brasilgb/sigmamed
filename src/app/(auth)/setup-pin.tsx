import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreen } from '@/components/auth/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function SetupPinScreen() {
  const { biometricAvailable, biometricHardwareAvailable, setLocalPin, user } = useAuth();
  const confirmPinRef = useRef<TextInput>(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [useBiometric, setUseBiometric] = useState(false);
  const [shouldHighlightBiometric, setShouldHighlightBiometric] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validatePinFields() {
    if (pin !== confirmPin) {
      setError('Os PINs precisam ser iguais.');
      return false;
    }

    setError(null);
    return true;
  }

  function handleConfirmPinSubmit() {
    if (!validatePinFields()) {
      return;
    }

    if (biometricAvailable) {
      Keyboard.dismiss();
      setShouldHighlightBiometric(true);
      return;
    }

    void handleSubmit();
  }

  async function handleSubmit() {
    if (!validatePinFields()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await setLocalPin(pin, {
        useBiometric: biometricAvailable && useBiometric,
      });
      router.replace('/(tabs)');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao criar PIN.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Crie o PIN deste aparelho"
      subtitle={`Olá${user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Este PIN fica salvo somente neste celular para desbloquear o app.`}>
      <AuthInput
        label="PIN de desbloqueio"
        keyboardType="number-pad"
        maxLength={6}
        returnKeyType="next"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        placeholder="4 ou 6 dígitos"
        secureTextEntry
        value={pin}
        onChangeText={setPin}
        onSubmitEditing={() => confirmPinRef.current?.focus()}
      />
      <AuthInput
        ref={confirmPinRef}
        label="Confirmar PIN"
        keyboardType="number-pad"
        maxLength={6}
        returnKeyType="done"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        placeholder="Repita o PIN"
        secureTextEntry
        value={confirmPin}
        onChangeText={setConfirmPin}
        onSubmitEditing={handleConfirmPinSubmit}
      />
      {biometricHardwareAvailable ? (
        <View
          style={[
            styles.preferenceRow,
            !biometricAvailable ? styles.preferenceRowDisabled : null,
            shouldHighlightBiometric && biometricAvailable ? styles.preferenceRowHighlighted : null,
          ]}>
          <View style={styles.preferenceText}>
            <ThemedText style={styles.preferenceTitle}>Ativar biometria</ThemedText>
            <ThemedText style={styles.preferenceDescription}>
              {biometricAvailable
                ? 'Use impressão digital ou reconhecimento facial para desbloquear o app neste aparelho.'
                : 'Biometria indisponível ou não cadastrada neste aparelho.'}
            </ThemedText>
          </View>
          <Switch
            value={biometricAvailable && useBiometric}
            disabled={!biometricAvailable}
            onValueChange={(value) => {
              setShouldHighlightBiometric(false);
              setUseBiometric(value);
            }}
            trackColor={{ false: '#D7E2E6', true: '#A7E5D8' }}
            thumbColor={biometricAvailable && useBiometric ? Colors.light.tint : Colors.light.surface}
            ios_backgroundColor="#D7E2E6"
          />
        </View>
      ) : null}
      {error ? <ThemedText style={{ color: Colors.light.danger }}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Salvando PIN...' : 'Salvar PIN e entrar'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  preferenceRow: {
    borderRadius: 18,
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  preferenceRowDisabled: {
    opacity: 0.7,
  },
  preferenceRowHighlighted: {
    borderColor: Colors.light.tint,
    borderWidth: 2,
  },
  preferenceText: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  preferenceDescription: {
    color: Colors.light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
