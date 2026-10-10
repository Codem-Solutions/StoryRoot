import { yupResolver } from '@hookform/resolvers/yup';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as yup from 'yup';
import { StoryRootLogo } from '../../components/StoryRootLogo';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, spacing, typography } from '../../theme';

interface FormValues {
  email: string;
  novaSenha: string;
  confirmarSenha: string;
}

type FormData = yup.InferType<typeof schema>;

const schema: yup.ObjectSchema<FormValues> = yup
  .object({
  email: yup.string().trim().email('E-mail inválido').required('Informe seu e-mail'),
  novaSenha: yup.string().min(6, 'Mínimo de 6 caracteres').required('Crie uma nova senha'),
  confirmarSenha: yup
    .string()
    .oneOf([yup.ref('novaSenha')], 'As senhas não coincidem')
    .required('Confirme a nova senha'),
  })
  .required();

export function RecuperarSenhaScreen() {
  const redefinirSenha = useAuthStore(state => state.redefinirSenha);
  const insets = useSafeAreaInsets();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { email: '', novaSenha: '', confirmarSenha: '' },
  });

  function onSubmit(values: FormData) {
    setErro(null);
    const resultado = redefinirSenha({
      email: values.email ?? '',
      novaSenha: values.novaSenha ?? '',
    });
    if (!resultado.sucesso) {
      setErro(resultado.erro ?? 'Não foi possível redefinir sua senha.');
      return;
    }
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <StoryRootLogo size={24} variant="markOnPrimary" />
          </View>
          <Text style={styles.appName}>Story Root</Text>
        </View>

        <View style={styles.textGroup}>
          <Text style={typography.h1}>Recuperar senha.</Text>
          <Text style={[typography.body, styles.subtext]}>
            Informe o e-mail da sua conta e escolha uma nova senha.
          </Text>
        </View>

        {sucesso ? (
          <View style={styles.successBox}>
            <Text style={typography.h4}>Senha redefinida!</Text>
            <Text style={[typography.body, styles.subtext]}>
              Já pode entrar com a sua nova senha.
            </Text>
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
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                    />
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
                      secureTextEntry
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
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
    backgroundColor: colors.primary,
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
  successBox: {
    gap: spacing.md,
    alignItems: 'flex-start',
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
