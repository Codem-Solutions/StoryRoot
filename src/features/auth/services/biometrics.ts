import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricCapability = {
  available: boolean;
  label: 'Face ID' | 'biometria';
};

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const [hasHardware, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  return {
    available: hasHardware && enrolled,
    label: types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ? 'Face ID'
      : 'biometria',
  };
}

export async function authenticateWithBiometrics() {
  return LocalAuthentication.authenticateAsync({
    promptMessage: 'Confirme sua identidade',
    promptSubtitle: 'Acesse sua conta com segurança',
    fallbackLabel: 'Usar código do aparelho',
    cancelLabel: 'Cancelar',
    biometricsSecurityLevel: 'strong',
  });
}
