import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricSupported() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function authenticateWithBiometrics() {
  const supported = await isBiometricSupported();

  if (!supported) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear SigmaMed',
    fallbackLabel: 'Usar PIN',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: true,
  });

  return result.success;
}
