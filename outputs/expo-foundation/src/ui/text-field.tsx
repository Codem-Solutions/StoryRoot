import type { ComponentProps } from 'react';
import { forwardRef, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/theme-provider';
import type { ColorPalette } from '@/theme/tokens';

type Props = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
};

export const TextField = forwardRef<TextInputType, Props>(
  ({ label, error, secureTextEntry, ...props }, ref) => {
    const [hidden, setHidden] = useState(Boolean(secureTextEntry));
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.field, error && styles.fieldError]}>
          <TextInput
            ref={ref}
            placeholderTextColor={colors.muted}
            secureTextEntry={hidden}
            style={styles.input}
            {...props}
          />
          {secureTextEntry ? (
            <Pressable
              accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
              hitSlop={12}
              onPress={() => setHidden((value) => !value)}>
              <Ionicons
                color={colors.ink}
                name={hidden ? 'eye-outline' : 'eye-off-outline'}
                size={21}
              />
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  wrapper: { gap: 8 },
  label: {
    color: colors.ink,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
  field: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },
  fieldError: { borderColor: colors.danger },
  input: {
    flex: 1,
    color: colors.ink,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    paddingVertical: 16,
  },
  error: {
    color: colors.danger,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },
  });
}
