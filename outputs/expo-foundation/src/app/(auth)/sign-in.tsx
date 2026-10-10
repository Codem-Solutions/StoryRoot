import { useMemo } from 'react';
import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/features/auth/auth-provider';
import { useTheme } from '@/theme/theme-provider';
import { spacing, typography, type ColorPalette } from '@/theme/tokens';
import { BrandMark } from '@/ui/brand-mark';
import { Button } from '@/ui/button';
import { FormField } from '@/ui/form-field';
import { Screen } from '@/ui/screen';

const signInSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(8, 'Use pelo menos 8 caracteres.'),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { signIn } = useAuth();
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: 'alex@example.com', password: '12345678' },
  });

  const submit = async ({ email, password }: SignInForm) => {
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/(app)/(tabs)');
    } catch {
      form.setError('root', { message: 'Não foi possível entrar. Tente novamente.' });
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <BrandMark />
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>SUA BASE, PRONTA PARA CRESCER</Text>
        <Text style={styles.title}>Bem-vindo de volta.</Text>
        <Text style={styles.subtitle}>
          Entre para continuar exatamente de onde você parou.
        </Text>
      </View>

      <FormProvider {...form}>
        <View style={styles.form}>
          <FormField<SignInForm>
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="E-mail"
            name="email"
            returnKeyType="next"
          />
          <FormField<SignInForm>
            autoComplete="password"
            label="Senha"
            name="password"
            onSubmitEditing={form.handleSubmit(submit)}
            returnKeyType="done"
            secureTextEntry
          />
          {form.formState.errors.root?.message ? (
            <Text style={styles.error}>{form.formState.errors.root.message}</Text>
          ) : null}
          <Link href="/(auth)/forgot-password" style={styles.link}>
            Esqueci minha senha
          </Link>
        </View>

        <View style={styles.actions}>
          <Button
            label="Entrar"
            loading={form.formState.isSubmitting}
            onPress={form.handleSubmit(submit)}
          />
          <View style={styles.accountRow}>
            <Text style={styles.muted}>Ainda não tem conta?</Text>
            <Link href="/(auth)/register" style={styles.inlineLink}>
              Criar conta
            </Link>
          </View>
        </View>
      </FormProvider>
    </Screen>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  content: { paddingTop: spacing.xl, paddingBottom: spacing.xl },
  heading: { marginTop: spacing.xxl, gap: spacing.sm },
  eyebrow: {
    color: colors.brand,
    fontFamily: typography.bodyBold,
    fontSize: 12,
    letterSpacing: 1.4,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 48,
    lineHeight: 50,
    letterSpacing: -1.5,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 330,
  },
  form: { marginTop: spacing.xxl, gap: spacing.md },
  error: { color: colors.danger, fontFamily: typography.body, lineHeight: 20 },
  link: {
    alignSelf: 'flex-end',
    color: colors.brandStrong,
    fontFamily: typography.bodyBold,
    fontSize: 14,
  },
  actions: { marginTop: 'auto', paddingTop: spacing.xxl, gap: spacing.lg },
  accountRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  muted: { color: colors.muted, fontFamily: typography.body },
  inlineLink: { color: colors.brandStrong, fontFamily: typography.bodyBold },
  });
}
