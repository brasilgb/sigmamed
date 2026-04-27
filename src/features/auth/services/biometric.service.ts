import * as LocalAuthentication from 'expo-local-authentication';

const BIOMETRIC_TIMEOUT_MS = 30000;

export async function isBiometricSupported() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

function withBiometricTimeout(authentication: Promise<LocalAuthentication.LocalAuthenticationResult>) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<LocalAuthentication.LocalAuthenticationResult>((resolve) => {
    timeoutId = setTimeout(() => {
      void LocalAuthentication.cancelAuthenticate().catch(() => undefined);
      resolve({ success: false, error: 'timeout' });
    }, BIOMETRIC_TIMEOUT_MS);
  });

  return Promise.race([authentication, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

export async function authenticateWithBiometrics() {
  const supported = await isBiometricSupported();

  if (!supported) {
    return false;
  }

  await LocalAuthentication.cancelAuthenticate().catch(() => undefined);

  const result = await withBiometricTimeout(
    LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear SigmaMed',
      fallbackLabel: 'Usar PIN',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
    })
  );

  return result.success;
}
