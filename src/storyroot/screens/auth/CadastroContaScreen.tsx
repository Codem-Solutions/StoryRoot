import { yupResolver } from '@hookform/resolvers/yup';
import { router } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
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
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

type FormData = yup.InferType<typeof schema>;

const schema: yup.ObjectSchema<FormValues> = yup
  .object({
  nome: yup.string().trim().required('Informe seu nome'),
  email: yup.string().trim().email('E-mail inválido').required('Informe seu e-mail'),
  senha: yup.string().min(6, 'Mínimo de 6 caracteres').required('Crie uma senha'),
  confirmarSenha: yup
    .string()
    .oneOf([yup.ref('senha')], 'As senhas não coincidem')
    .required('Confirme sua senha'),
  })
  .required();

export function CadastroContaScreen() {
  const cadastrar = useAuthStore(state => state.cadastrar);
  const insets = useSafeAreaInsets();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { nome: '', email: '', senha: '', confirmarSenha: '' },
  });

  function onSubmit(values: FormData) {
    setErro(null);
    const resultado = cadastrar({
      nome: values.nome ?? '',
      email: values.email ?? '',
      senha: values.senha ?? '',
    });
    if (!resultado.sucesso) {
      setErro(resultado.erro ?? 'Não foi possível criar sua conta.');
    }
  }

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      enableOnAndroid
      extraScrollHeight={spacing.xxl}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <StoryRootLogo size={24} variant="markOnPrimary" />
          </View>
          <Text style={styles.appName}>Story Root</Text>
        </View>

        <View style={styles.textGroup}>
          <Text style={typography.h1}>Crie sua conta.</Text>
          <Text style={[typography.body, styles.subtext]}>
            Comece a guardar cada momento da sua família.
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.field}>
            <Text style={typography.label}>Nome</Text>
            <Controller
              control={control}
              name="nome"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputWrapper}>
                  <User size={20} color={colors.placeholder} />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome"
                    placeholderTextColor={colors.placeholder}
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
            {!!errors.nome && <Text style={styles.error}>{errors.nome.message}</Text>}
          </View>

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
            <Text style={typography.label}>Senha</Text>
            <Controller
              control={control}
              name="senha"
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
            {!!errors.senha && <Text style={styles.error}>{errors.senha.message}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={typography.label}>Confirmar senha</Text>
            <Controller
              control={control}
              name="confirmarSenha"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputWrapper}>
                  <Lock size={20} color={colors.placeholder} />
                  <TextInput
                    style={styles.input}
                    placeholder="Repita a senha"
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
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={handleSubmit(onSubmit)}>
          <Text style={styles.ctaLabel}>Criar conta</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(app)/storyroot-auth/login')}>
          <Text style={styles.linkText}>
            Já tem conta? <Text style={styles.linkTextStrong}>Entrar</Text>
          </Text>
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
  linkRow: {
    paddingVertical: spacing.sm,
  },
  linkText: {
    ...typography.body,
    color: colors.textMuted,
  },
  linkTextStrong: {
    color: colors.primary,
    fontFamily: typography.label.fontFamily,
  },
});
