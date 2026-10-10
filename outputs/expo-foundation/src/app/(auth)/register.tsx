import { useMemo, useState } from 'react';
import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { useTheme } from '@/theme/theme-provider';
import { spacing, typography, type ColorPalette } from '@/theme/tokens';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';
import { TextField } from '@/ui/text-field';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (name.trim().length < 2 || !email.includes('@') || password.length < 8) {
      setError('Preencha nome, e-mail válido e uma senha de pelo menos 8 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      router.replace('/(app)/(tabs)');
    } catch {
      setError('Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={styles.kicker}>COMECE POR AQUI</Text>
      <Text style={styles.title}>Crie sua conta.</Text>
      <Text style={styles.subtitle}>Leva menos de um minuto.</Text>
      <View style={styles.form}>
        <TextField autoComplete="name" label="Nome completo" onChangeText={setName} value={name} />
        <TextField
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="E-mail"
          onChangeText={setEmail}
          value={email}
        />
        <TextField
          autoComplete="new-password"
          label="Senha"
          onChangeText={setPassword}
          secureTextEntry
          value={password}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Criar minha conta" loading={loading} onPress={submit} />
      </View>
      <Link href="/(auth)/sign-in" style={styles.link}>Já tenho uma conta</Link>
    </Screen>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  content: { paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  kicker: {
    color: colors.brand,
    fontFamily: typography.bodyBold,
    fontSize: 12,
    letterSpacing: 1.4,
  },
  title: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 48,
    letterSpacing: -1.5,
  },
  subtitle: { color: colors.muted, fontFamily: typography.body, fontSize: 17 },
  form: { marginTop: spacing.xxl, gap: spacing.md },
  error: { color: colors.danger, fontFamily: typography.body },
  link: {
    color: colors.brandStrong,
    fontFamily: typography.bodyBold,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  });
}
