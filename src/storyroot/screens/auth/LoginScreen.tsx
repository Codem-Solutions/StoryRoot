import { yupResolver } from '@hookform/resolvers/yup';
import { router } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Fingerprint, Lock, Mail, ScanFace } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as yup from 'yup';
import { StoryRootLogo } from '../../components/StoryRootLogo';
import { useAuthStore } from '../../store/authStore';
import { useSegurancaStore } from '../../store/segurancaStore';
import { colors, radius, spacing, typography } from '../../theme';
import {
  autenticarComBiometria,
  obterCapacidadeBiometria,
  type CapacidadeBiometria,
} from '../../utils/biometria';

interface FormValues {
  email: string;
  senha: string;
}

type FormData = yup.InferType<typeof schema>;

const schema: yup.ObjectSchema<FormValues> = yup
  .object({
  email: yup.string().trim().email('E-mail inválido').defined().required('Informe seu e-mail'),
  senha: yup.string().defined().required('Informe sua senha'),
  })
  .required();

export function LoginScreen() {
  const entrar = useAuthStore(state => state.entrar);
  const insets = useSafeAreaInsets();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { email: '', senha: '' },
  });

  const entrarComBiometria = useAuthStore(state => state.entrarComBiometria);
  const contaBiometriaId = useSegurancaStore(state =>
    state.contaBiometriaId && state.biometriaPorConta[state.contaBiometriaId]
      ? state.contaBiometriaId
      : null,
  );
  const contaBiometria = useAuthStore(state =>
    state.contas.find(c => c.id === contaBiometriaId),
  );
  const [capacidade, setCapacidade] = useState<CapacidadeBiometria | null>(null);

  useEffect(() => {
    if (contaBiometriaId) void obterCapacidadeBiometria().then(setCapacidade);
  }, [contaBiometriaId]);

  const podeEntrarComBiometria =
    !!contaBiometria && !!capacidade?.temHardware && !!capacidade.cadastrada;

  async function onEntrarComBiometria() {
    if (!contaBiometria) return;
    setErro(null);
    const confirmou = await autenticarComBiometria('Entrar no Story Root', {
      subtitulo: contaBiometria.email,
    });
    if (!confirmou) return;
    const resultado = entrarComBiometria(contaBiometria.id);
    if (!resultado.sucesso) {
      setErro(resultado.erro ?? 'Não foi possível entrar.');
    }
  }

  function onSubmit(values: FormData) {
    setErro(null);
    const resultado = entrar({
      email: values.email ?? '',
      senha: values.senha ?? '',
    });
    if (!resultado.sucesso) {
      setErro(resultado.erro ?? 'Não foi possível entrar.');
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
            <StoryRootLogo size={32} />
          </View>
          <Text style={styles.appName}>Story Root</Text>
        </View>

        <View style={styles.textGroup}>
          <Text style={typography.h1}>Bem-vindo de volta.</Text>
          <Text style={[typography.body, styles.subtext]}>
            Entre para continuar a história da sua família.
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
                    placeholder="Sua senha"
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

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push('/(app)/storyroot-auth/forgot-password')}>
            <Text style={styles.forgotButtonText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {!!erro && <Text style={styles.error}>{erro}</Text>}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={handleSubmit(onSubmit)}>
          <Text style={styles.ctaLabel}>Entrar</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>

        {podeEntrarComBiometria && (
          <TouchableOpacity
            style={styles.biometriaButton}
            activeOpacity={0.85}
            onPress={onEntrarComBiometria}
            accessibilityRole="button"
            accessibilityLabel={`Entrar com ${capacidade.rotulo}`}>
            {capacidade.facial ? (
              <ScanFace size={20} color={colors.primary} />
            ) : (
              <Fingerprint size={20} color={colors.primary} />
            )}
            <Text style={styles.biometriaLabel}>Entrar com {capacidade.rotulo}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/(app)/storyroot-auth/cadastro-conta')}>
          <Text style={styles.linkText}>
            Não tem conta? <Text style={styles.linkTextStrong}>Criar conta</Text>
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
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotButtonText: {
    ...typography.label,
    color: colors.primary,
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
  biometriaButton: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  biometriaLabel: {
    ...typography.button,
    color: colors.primary,
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
