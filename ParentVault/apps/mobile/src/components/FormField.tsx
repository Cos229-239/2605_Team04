/**
 * FormField
 *
 * Parent-friendly input wrapper with label, helper text, and consistent touch sizing.
 * Heavy ParentVault forms should use this instead of naked TextInput fields so parents
 * always know what belongs in a field and whether it is optional.
 */

import { ComponentProps } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type TextInputProps = ComponentProps<typeof TextInput>;

interface FormFieldProps extends TextInputProps {
  label: string;
  helper?: string;
  optional?: boolean;
  multiline?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function FormField({ label, helper, optional = false, multiline = false, containerStyle, style, placeholderTextColor, ...inputProps }: FormFieldProps) {
  const theme = useTheme();

  return (
    <View style={[styles.field, containerStyle]}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {optional ? <Text style={[styles.optional, { color: theme.subtle }]}>Optional</Text> : null}
      </View>
      {helper ? <Text style={[styles.helper, { color: theme.muted }]}>{helper}</Text> : null}
      <TextInput
        placeholderTextColor={placeholderTextColor ?? theme.subtle}
        style={[
          styles.input,
          multiline && styles.textArea,
          { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text },
          style
        ]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: { fontSize: 16, fontWeight: '900' },
  optional: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
  helper: { marginTop: 4, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700'
  },
  textArea: {
    minHeight: 108,
    paddingTop: 12
  }
});
