import { create } from 'zustand';

interface OTPState {
  email: string | null;
  otp: string | null;
  expiresAt: number | null;
  lastResendAt: number | null;

  generateOTP: (email: string) => string;
  validateOTP: (code: string) => boolean;
  isExpired: () => boolean;
  canResend: () => boolean;
  clearOTP: () => void;
}

function gerarCodigoOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const useOTPStore = create<OTPState>((set, get) => ({
  email: null,
  otp: null,
  expiresAt: null,
  lastResendAt: null,

  generateOTP: (email: string) => {
    const codigo = gerarCodigoOTP();
    const agora = Date.now();
    set({
      email,
      otp: codigo,
      expiresAt: agora + 5 * 60 * 1000,
      lastResendAt: agora,
    });
    console.log(`[OTP MOCK] Código gerado para ${email}: ${codigo}`);
    return codigo;
  },

  validateOTP: (code: string) => {
    const state = get();
    if (!state.otp || !state.expiresAt) return false;
    if (Date.now() > state.expiresAt) return false;
    return state.otp === code;
  },

  isExpired: () => {
    const state = get();
    if (!state.expiresAt) return true;
    return Date.now() > state.expiresAt;
  },

  canResend: () => {
    const state = get();
    if (!state.lastResendAt) return true;
    return Date.now() - state.lastResendAt >= 60 * 1000;
  },

  clearOTP: () => set({ email: null, otp: null, expiresAt: null, lastResendAt: null }),
}));
