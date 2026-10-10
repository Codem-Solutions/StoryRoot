import { yupResolver } from '@hookform/resolvers/yup';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react-native';
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

type FormData = yup.InferType<typeof schema>;

const schema = yup.object({
  novaSenha: yup.string().min(6, 'Mínimo de 6 caracteres').required('Crie uma nova senha'),
  confirmarSenha: yup
    .string()
    .oneOf([yup.ref('novaSenha')], 'As senhas não coincidem')
    .required('Confirme a nova senha'),
});

export function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const emailParam = params.email;
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam ?? '';
  const redefinirSenha = useAuthStore(state => state.redefinirSenha);
  const clearOTP = useOTPStore(state => state.clearOTP);
  const insets = useSafeAreaInsets();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { novaSenha: '', confirmarSenha: '' },
  });

  function onSubmit(values: FormData) {
    setErro(null);
    const resultado = redefinirSenha({ email, novaSenha: values.novaSenha ?? '' });
    if (!resultado.sucesso) {
      setErro(resultado.erro ?? 'Não foi possível redefinir sua senha.');
      return;
    }
    clearOTP();
    setSucesso(true);
  }

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      enableOnAndroid
      extraScrollHeight={spacing.xxl}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        {!sucesso && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <StoryRootLogo size={32} />
          </View>
          <Text style={styles.appName}>Story Root</Text>
        </View>

        <View style={styles.textGroup}>
          <Text style={typography.h1}>
            {sucesso ? 'Senha redefinida!' : 'Crie uma nova senha.'}
          </Text>
          <Text style={[typography.body, styles.subtext]}>
            {sucesso
              ? 'Sua senha foi alterada com sucesso. Agora você pode entrar com a nova senha.'
              : 'Escolha uma senha forte com no mínimo 6 caracteres.'}
          </Text>
        </View>

        {sucesso ? (
          <View style={styles.successBox}>
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.85}
              onPress={() => router.replace('/(app)/storyroot-auth/login')}>
              <Text style={styles.ctaLabel}>Ir para o login</Text>
              <ArrowRight size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formSection}>
            <View style={styles.field}>
              <Text style={typography.label}>Nova senha</Text>
              <Controller
                control={control}
                name="novaSenha"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color={colors.placeholder} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mínimo de 6 caracteres"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!mostrarSenha}
                      value={value}
                      onChangeText={onChange}
                    />
                    <TouchableOpacity onPress={() => setMostrarSenha(v => !v)} hitSlop={8}>
                      {mostrarSenha ? (
                        <EyeOff size={20} color={colors.placeholder} />
                      ) : (
                        <Eye size={20} color={colors.placeholder} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {!!errors.novaSenha && <Text style={styles.error}>{errors.novaSenha.message}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>Confirmar nova senha</Text>
              <Controller
                control={control}
                name="confirmarSenha"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color={colors.placeholder} />
                    <TextInput
                      style={styles.input}
                      placeholder="Repita a nova senha"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!mostrarSenha}
                      value={value}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
              {!!errors.confirmarSenha && (
                <Text style={styles.error}>{errors.confirmarSenha.message}</Text>
              )}
            </View>

            {!!erro && <Text style={styles.error}>{erro}</Text>}
          </View>
        )}
      </View>

      {!sucesso && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.85}
            onPress={handleSubmit(onSubmit)}>
            <Text style={styles.ctaLabel}>Redefinir senha</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
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
  successBox: {
    gap: spacing.xl,
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
