/**
 * ChoiceChip
 *
 * Reusable tappable choice for quick selections.
 * This keeps complex ParentVault forms fast: parents tap common answers instead of typing everything.
 */

import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

interface ChoiceChipProps extends PropsWithChildren {
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function ChoiceChip({ selected = false, onPress, accessibilityLabel, children }: ChoiceChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primarySoft : pressed ? theme.elevated : theme.input,
          borderColor: selected ? theme.primary : theme.border
        }
      ]}
    >
      <Text style={[styles.text, { color: selected ? theme.primary : theme.text }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontSize: 14,
    fontWeight: '900'
  }
});
