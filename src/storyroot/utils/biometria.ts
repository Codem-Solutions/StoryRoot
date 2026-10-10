import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface CapacidadeBiometria {
  /** O aparelho tem leitor de digital ou reconhecimento facial. */
  temHardware: boolean;
  /** Há digital ou rosto cadastrado nas configurações do aparelho. */
  cadastrada: boolean;
  /** Nome amigável para usar em textos: "Face ID", "digital", "digital ou rosto"... */
  rotulo: string;
  facial: boolean;
}

const SEM_BIOMETRIA: CapacidadeBiometria = {
  temHardware: false,
  cadastrada: false,
  rotulo: 'biometria',
  facial: false,
};

function rotuloBiometria(tipos: LocalAuthentication.AuthenticationType[]) {
  const facial = tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const digital = tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
  if (Platform.OS === 'ios') return facial ? 'Face ID' : 'Touch ID';
  if (facial && digital) return 'digital ou rosto';
  if (facial) return 'reconhecimento facial';
  if (digital) return 'digital';
  return 'biometria';
}

export async function obterCapacidadeBiometria(): Promise<CapacidadeBiometria> {
  try {
    const [temHardware, cadastrada, tipos] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    return {
      temHardware,
      cadastrada,
      rotulo: rotuloBiometria(tipos),
      facial: tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
    };
  } catch {
    return SEM_BIOMETRIA;
  }
}

/**
 * Abre o pedido nativo de digital/rosto. Usa o nível "weak" para que o desbloqueio
 * facial do Android (que não é classe forte na maioria dos aparelhos) também funcione;
 * a biometria só protege a sessão local, não substitui a senha da conta.
 */
export async function autenticarComBiometria(
  mensagem: string,
  opcoes: { subtitulo?: string; cancelar?: string } = {},
): Promise<boolean> {
  try {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: mensagem,
      promptSubtitle: opcoes.subtitulo,
      cancelLabel: opcoes.cancelar ?? 'Cancelar',
      fallbackLabel: 'Usar senha do aparelho',
      biometricsSecurityLevel: 'weak',
    });
    return resultado.success;
  } catch {
    return false;
  }
}
