import { useController, type FieldPath, type FieldValues } from 'react-hook-form';
import type { ComponentProps } from 'react';

import { TextField } from '@/ui/text-field';

type Props<TValues extends FieldValues> = Omit<
  ComponentProps<typeof TextField>,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> & {
  name: FieldPath<TValues>;
};

export function FormField<TValues extends FieldValues>({ name, ...props }: Props<TValues>) {
  const { field, fieldState } = useController<TValues>({ name });

  return (
    <TextField
      {...props}
      error={fieldState.error?.message}
      onBlur={field.onBlur}
      onChangeText={field.onChange}
      value={field.value == null ? '' : String(field.value)}
    />
  );
}

