import { X } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

import { colors, radius, spacing, typography } from './theme';

function closeIcon() {
  return (
    <TouchableOpacity
      onPress={() => Toast.hide()}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Fechar aviso"
      style={{ paddingHorizontal: spacing.md }}>
      <X size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.primary, borderRadius: radius.md }}
      text1Style={{ ...typography.label, fontSize: 14 }}
      text2Style={{ ...typography.caption, color: colors.textMuted }}
      renderTrailingIcon={closeIcon}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: colors.red, borderRadius: radius.md }}
      text1Style={{ ...typography.label, fontSize: 14 }}
      text2Style={{ ...typography.caption, color: colors.textMuted }}
      renderTrailingIcon={closeIcon}
    />
  ),
};

export function StoryRootToast() {
  return <Toast config={toastConfig} />;
}
