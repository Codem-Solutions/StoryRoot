import { yupResolver } from '@hookform/resolvers/yup';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as yup from 'yup';
import { StoryRootLogo } from '../../components/StoryRootLogo';
import { useAuthStore } from '../../store/authStore';
import { useOTPStore } from '../../store/otpStore';
import { colors, radius, spacing, typography } from '../../theme';

interface FormValues {
  email: string;
}

type FormData = yup.InferType<typeof schema>;

const schema: yup.ObjectSchema<FormValues> = yup
  .object({
  email: yup.string().trim().email('E-mail inválido').required('Informe seu e-mail'),
  })
  .required();

export function ForgotPasswordScreen() {
  const contas = useAuthStore(state => state.contas);
  const generateOTP = useOTPStore(state => state.generateOTP);
  const insets = useSafeAreaInsets();
  const [erro, setErro] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: FormData) {
    setErro(null);
    const emailNormalizado = (values.email ?? '').trim().toLowerCase();
    const contaExiste = contas.some(c => c.email === emailNormalizado);

    if (!contaExiste) {
      setErro('Não encontramos uma conta com esse e-mail.');
      return;
    }

    generateOTP(emailNormalizado);
    router.push({ pathname: '/(app)/storyroot-auth/verify-otp', params: { email: emailNormalizado } });
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
          <Text style={typography.h1}>Esqueceu sua senha?</Text>
          <Text style={[typography.body, styles.subtext]}>
            Informe o e-mail da sua conta para receber um código de verificação.
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.field}>
            <Text style={typography.label}>E-mail</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputWrapper}>
                  <Mail size={20} color={colors.placeholder} />
                  <TextInput
                    style={styles.input}
                    placeholder="seuemail@exemplo.com"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
            {!!errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </View>

          {!!erro && <Text style={styles.error}>{erro}</Text>}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={handleSubmit(onSubmit)}>
          <Text style={styles.ctaLabel}>Continuar</Text>
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
  },
  error: {
    color: colors.red,
    fontSize: 12,
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
