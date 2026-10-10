import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { useTheme } from '@/theme/theme-provider';
import { spacing, typography, type ColorPalette } from '@/theme/tokens';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';
import { TextField } from '@/ui/text-field';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.includes('@')) return;
    setLoading(true);
    await requestPasswordReset(email);
    setLoading(false);
    setSent(true);
  };

  return (
    <Screen contentStyle={styles.content}>
      <Text style={styles.title}>{sent ? 'Confira seu e-mail.' : 'Recupere seu acesso.'}</Text>
      <Text style={styles.subtitle}>
        {sent
          ? 'Se essa conta existir, enviamos um link seguro para redefinir sua senha.'
          : 'Digite o e-mail da conta e enviaremos as próximas instruções.'}
      </Text>
      {!sent ? (
        <View style={styles.form}>
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="E-mail"
            onChangeText={setEmail}
            value={email}
          />
          <Button label="Enviar link de recuperação" loading={loading} onPress={submit} />
        </View>
      ) : null}
      <Link href="/(auth)/sign-in" style={styles.link}>Voltar para o login</Link>
    </Screen>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  content: { justifyContent: 'center', paddingBottom: spacing.xxl },
  title: {
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 46,
    lineHeight: 48,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 17,
    lineHeight: 25,
    marginTop: spacing.md,
  },
  form: { marginTop: spacing.xxl, gap: spacing.md },
  link: {
    color: colors.brandStrong,
    fontFamily: typography.bodyBold,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  });
}
