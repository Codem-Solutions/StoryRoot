import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoryRootLogo } from '../../components/StoryRootLogo';
import { useOTPStore } from '../../store/otpStore';
import { colors, radius, spacing, typography } from '../../theme';

export function VerifyOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const emailParam = params.email;
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam ?? '';
  const validateOTP = useOTPStore(state => state.validateOTP);
  const isExpired = useOTPStore(state => state.isExpired);
  const canResend = useOTPStore(state => state.canResend);
  const generateOTP = useOTPStore(state => state.generateOTP);
  const insets = useSafeAreaInsets();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  function handleVerify() {
    setErro(null);

    if (codigo.length !== 6) {
      setErro('Digite o código de 6 dígitos.');
      return;
    }

    if (isExpired()) {
      setErro('Código expirado. Solicite um novo código.');
      return;
    }

    if (!validateOTP(codigo)) {
      setErro('Código incorreto. Tente novamente.');
      return;
    }

    router.push({ pathname: '/(app)/storyroot-auth/reset-password', params: { email } });
  }

  function handleResend() {
    if (!canResend()) {
      setErro('Aguarde antes de solicitar um novo código.');
      return;
    }

    setErro(null);
    setCodigo('');
    const novoCodigo = generateOTP(email);
    setResendCooldown(60);
    Alert.alert(
      'Código reenviado',
      `Um novo código foi gerado: ${novoCodigo}`,
      [{ text: 'OK' }],
    );
  }

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      enableOnAndroid
      extraScrollHeight={spacing.xxl}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <StoryRootLogo size={32} />
          </View>
          <Text style={styles.appName}>Story Root</Text>
        </View>

        <View style={styles.textGroup}>
          <Text style={typography.h1}>Verifique seu e-mail.</Text>
          <Text style={[typography.body, styles.subtext]}>
            Enviamos um código de 6 dígitos para {email}. Digite o código abaixo.
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.field}>
            <Text style={typography.label}>Código de verificação</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colors.placeholder}
                keyboardType="number-pad"
                maxLength={6}
                value={codigo}
                onChangeText={text => {
                  setCodigo(text.replace(/\D/g, ''));
                  setErro(null);
                }}
                autoFocus
              />
            </View>
          </View>

          {!!erro && <Text style={styles.error}>{erro}</Text>}

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResend}
            disabled={resendCooldown > 0}>
            <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
              {resendCooldown > 0
                ? `Reenviar código em ${resendCooldown}s`
                : 'Reenviar código'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={handleVerify}>
          <Text style={styles.ctaLabel}>Verificar código</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 20,
    color: colors.text,
  },
  textGroup: {
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  subtext: {
    color: colors.textMuted,
  },
  formSection: {
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  input: {
    ...typography.body,
    flex: 1,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  error: {
    color: colors.red,
    fontSize: 12,
  },
  resendButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  resendText: {
    ...typography.label,
    color: colors.primary,
  },
  resendTextDisabled: {
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  ctaLabel: {
    ...typography.button,
  },
});
